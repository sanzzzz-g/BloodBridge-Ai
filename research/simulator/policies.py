"""
Coordination Policies for BloodBridge AI Simulator.
Implements:
1. Baseline 1: Isolated Local Banks with Fixed Safety Stock (No Transfers, Greedy FIFO)
2. Baseline 2: Centralized Hub-and-Spoke with Fixed Safety Stock (Hub Transfers Only)
3. Baseline 3: Isolated Banks with Dynamic Quantile Reserve (No Transfers Ablation)
4. Proposed Method: Joint Transfer-Allocation MILP with Dynamic Lead-Time Quantiles
"""

from typing import Dict, Tuple, List, Optional
import numpy as np

from .network import (
    COMPONENTS,
    BLOOD_GROUPS,
    SHELF_LIFE,
    COMPATIBILITY_MATRIX,
    BloodSupplyNetwork,
)
from .uncertainty import DemandUncertaintyEngine
from .solvers import BloodSupplyMILPSolver, SolverResult


class BasePolicy:
    """Abstract base coordination policy."""
    def __init__(self, network: BloodSupplyNetwork, uncertainty_engine: DemandUncertaintyEngine):
        self.network = network
        self.uncertainty_engine = uncertainty_engine
        self.solver = BloodSupplyMILPSolver(network)

    def decide(
        self,
        current_inventory: Dict[Tuple[str, str, str, int], int],
        fresh_inflows: Dict[Tuple[str, str, str], int],
        requisitions: Dict[Tuple[str, str, str, str], int],
        historical_demands: Dict[Tuple[str, str], List[float]],
        in_transit_arrivals: Optional[Dict[Tuple[str, str, str, int], int]] = None,
        day: int = 1,
    ) -> SolverResult:
        raise NotImplementedError


class BaselineIsolatedFixedStock(BasePolicy):
    """
    Baseline 1: Decentralized isolated blood banks.
    - No inter-bank transfers permitted (y = 0).
    - Fixed classical safety stock: SS_fixed = Z_alpha * sigma_daily * sqrt(lead_time).
    - Banks only fulfill demands from their assigned primary hospitals.
    """
    def __init__(self, network: BloodSupplyNetwork, alpha: float = 0.95):
        super().__init__(network, DemandUncertaintyEngine(alpha))
        self.alpha = alpha

    def decide(
        self,
        current_inventory: Dict[Tuple[str, str, str, int], int],
        fresh_inflows: Dict[Tuple[str, str, str], int],
        requisitions: Dict[Tuple[str, str, str, str], int],
        historical_demands: Dict[Tuple[str, str], List[float]],
        in_transit_arrivals: Optional[Dict[Tuple[str, str, str, int], int]] = None,
        day: int = 1,
    ) -> SolverResult:
        # Calculate classical fixed safety stock for each bank and component
        safety_reserves: Dict[Tuple[str, str], float] = {}
        for bid in self.network.bank_ids:
            for c in COMPONENTS:
                lead_time = 2 if c == "PLT" else 1
                history = historical_demands.get((bid, c), [10.0] * 14)
                ss_info = self.uncertainty_engine.compute_fixed_safety_stock_baseline(
                    history, lead_time=lead_time, alpha=self.alpha
                )
                safety_reserves[(bid, c)] = ss_info["fixed_safety_stock"]

        # Run solver with transfers disallowed (allow_transfers=False)
        return self.solver.solve_epoch(
            current_inventory=current_inventory,
            fresh_inflows=fresh_inflows,
            requisitions=requisitions,
            safety_reserves=safety_reserves,
            in_transit_arrivals=in_transit_arrivals,
            allow_transfers=False,
        )


class BaselineHubSpokeFixedStock(BasePolicy):
    """
    Baseline 2: Centralized Hub-and-Spoke.
    - Transfers only permitted between Hub (BANK-01) and satellites (no satellite-to-satellite peer transfers).
    - Fixed classical safety stock.
    """
    def __init__(self, network: BloodSupplyNetwork, alpha: float = 0.95):
        super().__init__(network, DemandUncertaintyEngine(alpha))
        self.alpha = alpha

    def decide(
        self,
        current_inventory: Dict[Tuple[str, str, str, int], int],
        fresh_inflows: Dict[Tuple[str, str, str], int],
        requisitions: Dict[Tuple[str, str, str, str], int],
        historical_demands: Dict[Tuple[str, str], List[float]],
        in_transit_arrivals: Optional[Dict[Tuple[str, str, str, int], int]] = None,
        day: int = 1,
    ) -> SolverResult:
        safety_reserves: Dict[Tuple[str, str], float] = {}
        for bid in self.network.bank_ids:
            for c in COMPONENTS:
                lead_time = 2 if c == "PLT" else 1
                history = historical_demands.get((bid, c), [10.0] * 14)
                ss_info = self.uncertainty_engine.compute_fixed_safety_stock_baseline(
                    history, lead_time=lead_time, alpha=self.alpha
                )
                safety_reserves[(bid, c)] = ss_info["fixed_safety_stock"]

        # Solve standard MILP, but filter out peer-to-peer transfers (only hub routes permitted)
                
        
        # Restrict transfers to the designated hub -> satellite routes.
        hub_ids = [
            bid
            for bid in self.network.bank_ids
            if self.network.banks[bid].is_hub
        ]
        satellite_ids = [
            bid
            for bid in self.network.bank_ids
            if not self.network.banks[bid].is_hub
        ]

        if len(hub_ids) != 1:
            raise ValueError(
                f"Hub-and-spoke policy requires exactly one hub; "
                f"found {len(hub_ids)}."
            )

        allowed_transfer_pairs = {
            (hub_id, satellite_id)
            for hub_id in hub_ids
            for satellite_id in satellite_ids
        }

        return self.solver.solve_epoch(
            current_inventory=current_inventory,
            fresh_inflows=fresh_inflows,
            requisitions=requisitions,
            safety_reserves=safety_reserves,
            in_transit_arrivals=in_transit_arrivals,
            allow_transfers=True,
            allowed_transfer_pairs=allowed_transfer_pairs,
        )



class BaselineIsolatedDynamicReserve(BasePolicy):
    """
    Baseline 3 (Ablation): Dynamic Quantile Reserve WITHOUT lateral transfers.
    - Demonstrates impact of dynamic safety stock alone in absence of multi-bank network pooling.
    """
    def __init__(self, network: BloodSupplyNetwork, alpha: float = 0.95):
        super().__init__(network, DemandUncertaintyEngine(alpha))
        self.alpha = alpha

    def decide(
        self,
        current_inventory: Dict[Tuple[str, str, str, int], int],
        fresh_inflows: Dict[Tuple[str, str, str], int],
        requisitions: Dict[Tuple[str, str, str, str], int],
        historical_demands: Dict[Tuple[str, str], List[float]],
        in_transit_arrivals: Optional[Dict[Tuple[str, str, str, int], int]] = None,
        day: int = 1,
    ) -> SolverResult:
        safety_reserves: Dict[Tuple[str, str], float] = {}
        for bid in self.network.bank_ids:
            for c in COMPONENTS:
                lead_time = 2 if c == "PLT" else 1
                history = historical_demands.get((bid, c), [10.0] * 14)
                q_info = self.uncertainty_engine.compute_empirical_quantile(
                    history, lead_time=lead_time, alpha=self.alpha
                )
                safety_reserves[(bid, c)] = q_info["quantile_reserve"]

        return self.solver.solve_epoch(
            current_inventory=current_inventory,
            fresh_inflows=fresh_inflows,
            requisitions=requisitions,
            safety_reserves=safety_reserves,
            in_transit_arrivals=in_transit_arrivals,
            allow_transfers=False,
        )


class ProposedRiskAwareJointCoordination(BasePolicy):
    """
    Proposed Method: Risk-Aware Multi-Bank Coordination.
    - Dynamic lead-time demand quantiles Q_alpha over lead time L, strictly avoiding double-counting.
    - Full peer-to-peer lateral transshipment optimization.
    - Joint transfer and hospital allocation MILP with priority age dispatch.
    """
    def __init__(self, network: BloodSupplyNetwork, alpha: float = 0.95):
        super().__init__(network, DemandUncertaintyEngine(alpha))
        self.alpha = alpha

    def decide(
        self,
        current_inventory: Dict[Tuple[str, str, str, int], int],
        fresh_inflows: Dict[Tuple[str, str, str], int],
        requisitions: Dict[Tuple[str, str, str, str], int],
        historical_demands: Dict[Tuple[str, str], List[float]],
        in_transit_arrivals: Optional[Dict[Tuple[str, str, str, int], int]] = None,
        day: int = 1,
    ) -> SolverResult:
        # Compute Dynamic Safety Reserve: S_{b,c}(alpha) = Q_{b,c}(alpha) over lead time L
        safety_reserves: Dict[Tuple[str, str], float] = {}
        for bid in self.network.bank_ids:
            for c in COMPONENTS:
                # Component-specific lead time: platelets (2 days testing/serology) vs RBC (1 day)
                lead_time = 2 if c == "PLT" else 1
                history = historical_demands.get((bid, c), [10.0] * 14)
                
                # Check sample size: if >= 14 observations use empirical quantile, else use negative binomial
                if len(history) >= 14:
                    q_info = self.uncertainty_engine.compute_empirical_quantile(
                        history, lead_time=lead_time, alpha=self.alpha
                    )
                else:
                    q_info = self.uncertainty_engine.compute_parametric_negative_binomial_quantile(
                        history, lead_time=lead_time, alpha=self.alpha
                    )
                safety_reserves[(bid, c)] = q_info["quantile_reserve"]

        # Solve joint MILP with transfers and dynamic reserves enabled
        return self.solver.solve_epoch(
            current_inventory=current_inventory,
            fresh_inflows=fresh_inflows,
            requisitions=requisitions,
            safety_reserves=safety_reserves,
            in_transit_arrivals=in_transit_arrivals,
            allow_transfers=True,
        )
