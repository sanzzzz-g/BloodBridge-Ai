"""
Scenario Generator for BloodBridge AI Simulator.
Implements:
1. Ordinary Demand Scenario (calibrated to verified Sharma et al. PLOS ONE data)
2. Concentrated Trauma Surge Scenario (Localized mass casualty shock at H-01 / H-05)
3. Multi-Site Regional Catastrophe Scenario (Simultaneous trauma surge across H-01, H-04, H-05, H-10)
4. Supply Disruptions & Cold-Chain Transport Delay Shocks
5. Fixed-seed reproducibility across baseline and proposed policies
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple
import numpy as np

from .network import (
    COMPONENTS,
    BLOOD_GROUPS,
    URGENCY_TIERS,
    SHELF_LIFE,
    BloodSupplyNetwork,
)


# Verified ABO/Rh population proportions in India (Sharma et al. / National Blood Transfusion Council)
POPULATION_BLOOD_GROUP_WEIGHTS = {
    "O+": 0.370,
    "B+": 0.320,
    "A+": 0.220,
    "AB+": 0.060,
    "O-": 0.015,
    "B-": 0.008,
    "A-": 0.005,
    "AB-": 0.002,
}

# Normalizes weights to sum to 1.0 exactly
_bg_keys = list(POPULATION_BLOOD_GROUP_WEIGHTS.keys())
_bg_probs = np.array([POPULATION_BLOOD_GROUP_WEIGHTS[k] for k in _bg_keys])
_bg_probs = _bg_probs / np.sum(_bg_probs)


# Component distribution in daily clinical demand
COMPONENT_DEMAND_FRACTIONS = {
    "PRBC": 0.58,   # Packed red cells dominate clinical requisitions
    "PLT": 0.20,    # Short shelf life, oncology / trauma
    "FFP": 0.16,    # Coagulopathy, liver, surgery
    "WB": 0.04,     # Whole blood (declining in metro centers)
    "CRYO": 0.02,   # Hypofibrinogenemia, massive hemorrhage
}


@dataclass
class DemandRequisition:
    hospital_id: str
    recipient_group: str
    component: str
    urgency: str
    day: int
    units: int


@dataclass
class SimulationScenario:
    name: str
    scenario_type: str
    horizon_days: int
    seed: int
    # Daily hospital requisitions: dict keyed by (hospital_id, recipient_group, component, urgency, day)
    requisitions: Dict[Tuple[str, str, str, str, int], int]
    # Daily fresh donor inflows: dict keyed by (bank_id, group, component, day)
    fresh_inflows: Dict[Tuple[str, str, str, int], int]
    # Inter-bank transit delays: dict keyed by (source_bank, dest_bank, day) -> integer delay days
    transit_delays: Dict[Tuple[str, str, int], int]
    # Initial inventory at t=0: dict keyed by (bank_id, group, component, residual_age) -> int units
    initial_inventory: Dict[Tuple[str, str, str, int], int]


class ScenarioGenerator:
    """
    Constructs deterministic, seed-locked operational and emergency shock scenarios.
    """
    def __init__(self, network: BloodSupplyNetwork):
        self.network = network

    def generate(
        self,
        scenario_type: str = "ORDINARY",
        horizon_days: int = 14,
        seed: int = 42,
    ) -> SimulationScenario:
        """
        Generates scenario with exact reproducibility.
        scenario_type options:
        - "ORDINARY": Baseline seasonal demand and routine donor collection
        - "CONCENTRATED_TRAUMA_SURGE": Localized 400% surge at H-01/H-05 on days 4-5
        - "REGIONAL_CATASTROPHE": Wide disaster across all trauma centers + 60% donor drop
        - "TRANSPORT_DISRUPTION": Road blockages causing 1-day inter-bank delay
        - "COMPOUND_EMERGENCY": Regional catastrophe + transport delay + supply drop
        """
        rng = np.random.RandomState(seed)

        requisitions: Dict[Tuple[str, str, str, str, int], int] = {}
        fresh_inflows: Dict[Tuple[str, str, str, int], int] = {}
        transit_delays: Dict[Tuple[str, str, int], int] = {}
        initial_inventory: Dict[Tuple[str, str, str, int], int] = {}

        # 1. Generate Initial Inventory at t=0
        # Spread across ages up to component shelf life
        for bid, bank in self.network.banks.items():
            for c in COMPONENTS:
                sl = SHELF_LIFE[c]
                # Effective inventory base scaled to bank capacity
                comp_stock = bank.capacity * 0.15 * COMPONENT_DEMAND_FRACTIONS[c]
                for g_idx, g in enumerate(_bg_keys):
                    group_stock = comp_stock * _bg_probs[g_idx]
                    # Uniform or triangular distribution across residual age cohorts
                    for a in range(1, sl + 1):
                        # Units per cohort
                        units = int(np.round(group_stock / sl))
                        if a <= 2 and c == "PLT":
                            # Critical near-expiry platelet test cohorts
                            units = max(1, units)
                        initial_inventory[(bid, g, c, a)] = units

        # 2. Generate Daily Donor Inflows W_{b,g,c,t}
        for t in range(1, horizon_days + 1):
            for bid, bank in self.network.banks.items():
                daily_base = bank.daily_collection_mean
                
                # Check for supply disruption shock
                if scenario_type in ["REGIONAL_CATASTROPHE", "COMPOUND_EMERGENCY"] and t in [4, 5, 6]:
                    # Severe donor collection drop: voluntary drives cancelled
                    daily_base *= 0.35

                # Daily Poisson-distributed donor turnouts
                total_donors = rng.poisson(max(1.0, daily_base))

                # Assign collected units across components and blood groups
                for g_idx, g in enumerate(_bg_keys):
                    prob_g = _bg_probs[g_idx]
                    for c in COMPONENTS:
                        prob_c = COMPONENT_DEMAND_FRACTIONS[c]
                        # Fresh units arrive with maximum shelf life SL_c
                        units = rng.poisson(max(0.1, total_donors * prob_g * prob_c))
                        fresh_inflows[(bid, g, c, t)] = units

        # 3. Generate Hospital Clinical Requisitions R_{h,gr,c,u,t}
        for t in range(1, horizon_days + 1):
            day_of_week = (t - 1) % 7 # 0 = Monday, 6 = Sunday
            # Elective surgical dip on weekends (Saturday & Sunday)
            weekend_multiplier = 0.60 if day_of_week in [5, 6] else 1.0

            for hid, hosp in self.network.hospitals.items():
                base_demand = (hosp.bed_count * hosp.bor * 0.04) * hosp.daily_demand_scale * weekend_multiplier

                # Check for Emergency Shocks
                surge_multiplier_prbc = 1.0
                surge_multiplier_plt = 1.0
                stat_boost = 0.0

                if scenario_type == "CONCENTRATED_TRAUMA_SURGE" and t in [4, 5]:
                    if hid in ["H-01", "H-05"]:
                        # 400% surge in red cells and platelets for mass-casualty resuscitation
                        surge_multiplier_prbc = 4.0
                        surge_multiplier_plt = 3.5
                        stat_boost = 0.50 # 50% of demand shifts to STAT urgency

                elif scenario_type in ["REGIONAL_CATASTROPHE", "COMPOUND_EMERGENCY"] and t in [4, 5]:
                    if "Trauma" in hosp.tier or hid in ["H-01", "H-04", "H-05", "H-10"]:
                        surge_multiplier_prbc = 3.0
                        surge_multiplier_plt = 2.5
                        stat_boost = 0.40

                for c in COMPONENTS:
                    mult = surge_multiplier_prbc if c in ["PRBC", "WB"] else (surge_multiplier_plt if c == "PLT" else 1.0)
                    comp_demand = base_demand * COMPONENT_DEMAND_FRACTIONS[c] * mult

                    # Triage breakdown across urgency tiers
                    stat_frac = min(0.8, 0.10 + stat_boost)
                    urgent_frac = 0.35
                    routine_frac = max(0.05, 1.0 - (stat_frac + urgent_frac))

                    for gr_idx, gr in enumerate(_bg_keys):
                        group_frac = _bg_probs[gr_idx]

                        # In emergency mass casualties, universal O- demand surges disproportionately
                        if stat_boost > 0 and gr == "O-":
                            group_frac *= 2.5

                        units_stat = rng.poisson(max(0.0, comp_demand * group_frac * stat_frac))
                        units_urg  = rng.poisson(max(0.0, comp_demand * group_frac * urgent_frac))
                        units_rout = rng.poisson(max(0.0, comp_demand * group_frac * routine_frac))

                        requisitions[(hid, gr, c, "STAT", t)] = units_stat
                        requisitions[(hid, gr, c, "URGENT", t)] = units_urg
                        requisitions[(hid, gr, c, "ROUTINE", t)] = units_rout

        # 4. Generate Transit Delays
        for t in range(1, horizon_days + 1):
            for b1 in self.network.bank_ids:
                for b2 in self.network.bank_ids:
                    if b1 == b2:
                        continue
                    delay = 0
                    if scenario_type in ["TRANSPORT_DISRUPTION", "COMPOUND_EMERGENCY"] and t in [4, 5]:
                        # Arterial logistics bottleneck: 1 full day delay
                        delay = 1
                    transit_delays[(b1, b2, t)] = delay

        return SimulationScenario(
            name=f"{scenario_type}_seed_{seed}_h{horizon_days}",
            scenario_type=scenario_type,
            horizon_days=horizon_days,
            seed=seed,
            requisitions=requisitions,
            fresh_inflows=fresh_inflows,
            transit_delays=transit_delays,
            initial_inventory=initial_inventory,
        )
