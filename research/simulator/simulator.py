"""
Multi-Period Discrete-Event Simulation Engine for BloodBridge AI.
Orchestrates multi-day network dynamics, mass conservation validation,
telemetry logging, and performance metric evaluation.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Any
import numpy as np

from .network import (
    COMPONENTS,
    BLOOD_GROUPS,
    SHELF_LIFE,
    BloodSupplyNetwork,
)
from .scenarios import SimulationScenario
from .policies import BasePolicy
from .solvers import SolverResult


@dataclass
class DailyTelemetry:
    day: int
    demanded_units: int
    demanded_stat_units: int
    fulfilled_units: int
    fulfilled_stat_units: int
    shortage_units: int
    shortage_stat_units: int
    expired_units: int
    transferred_units: int
    transfer_cost: float
    dispatch_cost: float
    reserve_deficits: float
    solve_time_seconds: float
    mass_conservation_error: int


@dataclass
class SimulationRunResult:
    policy_name: str
    scenario_name: str
    scenario_type: str
    seed: int
    horizon_days: int
    total_demanded: int
    total_fulfilled: int
    total_shortage: int
    fulfillment_rate_pct: float
    shortage_rate_pct: float
    stat_demanded: int
    stat_fulfilled: int
    stat_shortage: int
    stat_fulfillment_rate_pct: float
    total_expired: int
    expiry_rate_pct: float
    total_transferred_units: int
    total_transfer_cost: float
    total_dispatch_cost: float
    total_reserve_deficit_units: float
    average_solve_time_ms: float
    max_solve_time_ms: float
    conservation_errors: int
    daily_records: List[DailyTelemetry] = field(default_factory=list)


class BloodSupplySimulator:
    """
    Simulates multi-period supply chain coordination under real-world dynamics.
    """
    def __init__(self, network: BloodSupplyNetwork):
        self.network = network

    def run(
        self,
        scenario: SimulationScenario,
        policy: BasePolicy,
        policy_label: str = "Policy",
    ) -> SimulationRunResult:
        """
        Executes a multi-day simulation run.
        """
        current_inv = dict(scenario.initial_inventory)
        in_transit_pipeline: Dict[int, Dict[Tuple[str, str, str, int], int]] = {}

        # Historical demand tracking per bank and component for rolling quantiles
        # Initialized with stationary historical calibration (14 days)
        history_window: Dict[Tuple[str, str], List[float]] = {}
        for bid in self.network.bank_ids:
            for c in COMPONENTS:
                history_window[(bid, c)] = [12.0] * 14

        daily_records: List[DailyTelemetry] = []

        total_demanded = 0
        total_fulfilled = 0
        total_shortage = 0
        stat_demanded = 0
        stat_fulfilled = 0
        stat_shortage = 0
        total_expired = 0
        total_transferred = 0
        total_trans_cost = 0.0
        total_disp_cost = 0.0
        total_res_deficit = 0.0
        solve_times: List[float] = []
        total_conservation_errors = 0

        for t in range(1, scenario.horizon_days + 1):
            # 1. Receive In-Transit Shipments arriving on day t
            arriving_transfers = in_transit_pipeline.get(t, {})

            # 2. Extract today's fresh inflows W_{b,g,c,t}
            fresh_inflows_today: Dict[Tuple[str, str, str], int] = {}
            for bid in self.network.bank_ids:
                for g in BLOOD_GROUPS:
                    for c in COMPONENTS:
                        val = scenario.fresh_inflows.get((bid, g, c, t), 0)
                        if val > 0:
                            fresh_inflows_today[(bid, g, c)] = val

            # 3. Extract today's hospital requisitions R_{h,gr,c,u,t}
            requisitions_today: Dict[Tuple[str, str, str, str], int] = {}
            day_demanded = 0
            day_stat_demanded = 0
            for hid in self.network.hospital_ids:
                for gr in BLOOD_GROUPS:
                    for c in COMPONENTS:
                        for u in ["STAT", "URGENT", "ROUTINE"]:
                            req = scenario.requisitions.get((hid, gr, c, u, t), 0)
                            if req > 0:
                                requisitions_today[(hid, gr, c, u)] = req
                                day_demanded += req
                                if u == "STAT":
                                    day_stat_demanded += req

            # 4. Total Beginning Available Stock for independent mass conservation check
            total_beginning_units = sum(current_inv.values()) + sum(arriving_transfers.values()) + sum(fresh_inflows_today.values())

            # 5. Invoke Policy
            sol_result = policy.decide(
                current_inventory=current_inv,
                fresh_inflows=fresh_inflows_today,
                requisitions=requisitions_today,
                historical_demands=history_window,
                in_transit_arrivals=arriving_transfers,
                day=t,
            )
            solve_times.append(sol_result.solve_time_seconds)

            # 6. Process Solver Outcomes
            day_dispatched = sum(sol_result.dispatches.values())
            day_transferred = sum(sol_result.transfers.values())
            day_expired = sum(sol_result.expirations.values())
            day_shortage = sum(sol_result.shortages.values())
            day_stat_shortage = sum(
                units for (h, gr, c, u), units in sol_result.shortages.items() if u == "STAT"
            )
            day_fulfilled = day_demanded - day_shortage
            day_stat_fulfilled = day_stat_demanded - day_stat_shortage

            # Compute Logistics Costs
            day_trans_cost = 0.0
            for (b_src, b_dst, g, c, a), units in sol_result.transfers.items():
                day_trans_cost += self.network.get_transfer_cost(b_src, b_dst) * units

            day_disp_cost = 0.0
            for (b, h, gd, gr, c, a, u), units in sol_result.dispatches.items():
                day_disp_cost += self.network.get_dispatch_cost(b, h) * units

            day_res_deficit = sum(sol_result.reserve_deficits.values())

            # 7. Independent Mass Conservation Audit
            # Total units accounted for in output = end inventory + dispatches + transfers + expirations
            total_ending_units = sum(sol_result.end_inventory.values())
            total_accounted = total_ending_units + day_dispatched + day_transferred + day_expired
            conservation_diff = abs(total_beginning_units - total_accounted)
            if conservation_diff > 0:
                total_conservation_errors += 1

            # 8. Schedule Inter-Bank In-Transit Arrivals for tomorrow / delay
            for (b_src, b_dst, g, c, a), units in sol_result.transfers.items():
                delay_days = scenario.transit_delays.get((b_src, b_dst, t), 0)
                arrival_day = t + 1 + delay_days # Standard overnight (1 day) + delay
                if arrival_day not in in_transit_pipeline:
                    in_transit_pipeline[arrival_day] = {}
                # Units age by transit time
                arrival_age = max(1, a - (1 + delay_days))
                in_transit_pipeline[arrival_day][(b_dst, g, c, arrival_age)] = (
                    in_transit_pipeline[arrival_day].get((b_dst, g, c, arrival_age), 0) + units
                )

            # 9. Update state for next day
            current_inv = sol_result.end_inventory

            # Update historical demand rolling records
            for bid, bank in self.network.banks.items():
                for c in COMPONENTS:
                    # Daily demand across assigned hospitals
                    h_dem = sum(
                        requisitions_today.get((hid, gr, c, u), 0)
                        for hid in bank.assigned_hospitals
                        for gr in BLOOD_GROUPS
                        for u in ["STAT", "URGENT", "ROUTINE"]
                    )
                    history_window[(bid, c)].append(float(h_dem))
                    if len(history_window[(bid, c)]) > 30:
                        history_window[(bid, c)].pop(0)

            # Record telemetry
            record = DailyTelemetry(
                day=t,
                demanded_units=day_demanded,
                demanded_stat_units=day_stat_demanded,
                fulfilled_units=day_fulfilled,
                fulfilled_stat_units=day_stat_fulfilled,
                shortage_units=day_shortage,
                shortage_stat_units=day_stat_shortage,
                expired_units=day_expired,
                transferred_units=day_transferred,
                transfer_cost=round(day_trans_cost, 2),
                dispatch_cost=round(day_disp_cost, 2),
                reserve_deficits=round(day_res_deficit, 2),
                solve_time_seconds=round(sol_result.solve_time_seconds, 4),
                mass_conservation_error=conservation_diff,
            )
            daily_records.append(record)

            total_demanded += day_demanded
            total_fulfilled += day_fulfilled
            total_shortage += day_shortage
            stat_demanded += day_stat_demanded
            stat_fulfilled += day_stat_fulfilled
            stat_shortage += day_stat_shortage
            total_expired += day_expired
            total_transferred += day_transferred
            total_trans_cost += day_trans_cost
            total_disp_cost += day_disp_cost
            total_res_deficit += day_res_deficit

        fulfillment_rate = (total_fulfilled / total_demanded * 100.0) if total_demanded > 0 else 100.0
        shortage_rate = (total_shortage / total_demanded * 100.0) if total_demanded > 0 else 0.0
        stat_fulfillment_rate = (stat_fulfilled / stat_demanded * 100.0) if stat_demanded > 0 else 100.0
        expiry_rate = (total_expired / total_demanded * 100.0) if total_demanded > 0 else 0.0

        return SimulationRunResult(
            policy_name=policy_label,
            scenario_name=scenario.name,
            scenario_type=scenario.scenario_type,
            seed=scenario.seed,
            horizon_days=scenario.horizon_days,
            total_demanded=total_demanded,
            total_fulfilled=total_fulfilled,
            total_shortage=total_shortage,
            fulfillment_rate_pct=round(fulfillment_rate, 2),
            shortage_rate_pct=round(shortage_rate, 2),
            stat_demanded=stat_demanded,
            stat_fulfilled=stat_fulfilled,
            stat_shortage=stat_shortage,
            stat_fulfillment_rate_pct=round(stat_fulfillment_rate, 2),
            total_expired=total_expired,
            expiry_rate_pct=round(expiry_rate, 2),
            total_transferred_units=total_transferred,
            total_transfer_cost=round(total_trans_cost, 2),
            total_dispatch_cost=round(total_disp_cost, 2),
            total_reserve_deficit_units=round(total_res_deficit, 2),
            average_solve_time_ms=round(float(np.mean(solve_times) * 1000.0), 2),
            max_solve_time_ms=round(float(np.max(solve_times) * 1000.0), 2),
            conservation_errors=total_conservation_errors,
            daily_records=daily_records,
        )
