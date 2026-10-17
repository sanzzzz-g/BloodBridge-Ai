"""
Unit and Integration Test Suite for BloodBridge AI Research Simulator.
Tests:
1. Biological Compatibility Gating (RBC vs Plasma Inversion)
2. Hand-Checkable Analytical Toy Examples (Conservation & Optimal Solution)
3. Inventory Age Transition and Expiration Lifecycle
4. Theoretical Theorem 1 Proof (Gaussian Quantile Equivalence to Fixed Stock)
5. Massive Demand Shortage Graceful Absorption (No Solver Crash)
6. Primary (5-Bank, 12-Hospital) and Debug (3-Bank, 6-Hospital) Topologies
7. Full Multi-Day Simulation Run with Zero Conservation Errors
"""

import pytest
import numpy as np

from .network import (
    COMPONENTS,
    BLOOD_GROUPS,
    SHELF_LIFE,
    COMPATIBILITY_MATRIX,
    BloodSupplyNetwork,
)
from .uncertainty import DemandUncertaintyEngine
from .scenarios import ScenarioGenerator
from .solvers import BloodSupplyMILPSolver
from .policies import (
<<<<<<< HEAD
=======
    BaselineHubSpokeFixedStock,
>>>>>>> 1fc7f12 (Add research simulator and verify transfer restrictions)
    BaselineIsolatedFixedStock,
    ProposedRiskAwareJointCoordination,
)
from .simulator import BloodSupplySimulator


# -------------------------------------------------------------
# Test 1: Biological Compatibility Inversion
# -------------------------------------------------------------
def test_biological_compatibility_matrix():
    # Red Blood Cells (PRBC): O- is universal donor, AB+ is universal recipient
    for gr in BLOOD_GROUPS:
        assert COMPATIBILITY_MATRIX[("O-", gr, "PRBC")] == 1, f"O- must be compatible with {gr} for PRBC"
    
    # A+ cannot donate RBC to O- or B+
    assert COMPATIBILITY_MATRIX[("A+", "O-", "PRBC")] == 0
    assert COMPATIBILITY_MATRIX[("A+", "B+", "PRBC")] == 0
    assert COMPATIBILITY_MATRIX[("A+", "AB+", "PRBC")] == 1

    # Fresh Frozen Plasma (FFP): AB is universal donor, O is universal recipient
    for gr in BLOOD_GROUPS:
        assert COMPATIBILITY_MATRIX[("AB+", gr, "FFP")] == 1, f"AB+ must donate FFP to {gr}"
    
    # O cannot donate Plasma to A or B
    assert COMPATIBILITY_MATRIX[("O+", "A+", "FFP")] == 0
    assert COMPATIBILITY_MATRIX[("O+", "AB+", "FFP")] == 0
    assert COMPATIBILITY_MATRIX[("O+", "O+", "FFP")] == 1


# -------------------------------------------------------------
# Test 2: Network Topologies
# -------------------------------------------------------------
def test_network_topologies():
    net_primary = BloodSupplyNetwork("primary")
    assert len(net_primary.banks) == 5
    assert len(net_primary.hospitals) == 12
    assert net_primary.bank_to_hospital_dist[("BANK-01", "H-05")] < 5.0 # Very close (Apex Center)

    net_debug = BloodSupplyNetwork("debug")
    assert len(net_debug.banks) == 3
    assert len(net_debug.hospitals) == 6
    assert net_debug.get_transfer_cost("BANK-01", "BANK-02") > 0.0


# -------------------------------------------------------------
# Test 3: Mathematical Theorem 1 (Gaussian Quantile = Fixed Safety Stock)
# -------------------------------------------------------------
def test_theorem1_gaussian_safety_stock_equivalence():
    engine = DemandUncertaintyEngine(service_level_alpha=0.95)
    lead_time = 4
    alpha = 0.95

    # Generate Gaussian i.i.d demand history
    rng = np.random.RandomState(42)
    mu_daily = 50.0
    sigma_daily = 8.0
    synth_demands = rng.normal(mu_daily, sigma_daily, size=5000).tolist()

    fixed_res = engine.compute_fixed_safety_stock_baseline(synth_demands, lead_time=lead_time, alpha=alpha)
    empirical_res = engine.compute_empirical_quantile(synth_demands, lead_time=lead_time, alpha=alpha)

    # SS_fixed = Z_alpha * sigma_daily * sqrt(L)
    # Under Gaussian i.i.d., empirical incremental safety stock Q(alpha) - mu*L converges to SS_fixed
    theoretical_ss = fixed_res["fixed_safety_stock"]
    empirical_ss = empirical_res["incremental_safety_stock"]

    # Difference is small sampling variation (< 8%)
    pct_diff = abs(theoretical_ss - empirical_ss) / theoretical_ss
    assert pct_diff < 0.08, f"Empirical SS ({empirical_ss}) diverged from theoretical SS ({theoretical_ss}) by {pct_diff*100:.2f}%"


# -------------------------------------------------------------
# Test 4: Hand-Checkable Analytical Toy Example (Optimal Solution Validation)
# -------------------------------------------------------------
def test_hand_checkable_allocation_and_transfers():
    net = BloodSupplyNetwork("debug")
    solver = BloodSupplyMILPSolver(net)

    # Bank 1 has 10 units of O+ PRBC aged 5 days
    # Bank 2 has 0 units
    current_inv = {("BANK-01", "O+", "PRBC", 5): 10}
    fresh_inflows = {}
    
    # Hospital 1 (served by Bank 2) has STAT emergency demand of 6 units
    # Hospital 5 (served by Bank 1) has ROUTINE demand of 3 units
    requisitions = {
        ("H-01", "O+", "PRBC", "STAT"): 6,
        ("H-05", "O+", "PRBC", "ROUTINE"): 3,
    }
    safety_reserves = {("BANK-01", "PRBC"): 0.0, ("BANK-02", "PRBC"): 0.0, ("BANK-03", "PRBC"): 0.0}

    # Case A: With Transfers & Global Optimization Enabled
    res = solver.solve_epoch(
        current_inventory=current_inv,
        fresh_inflows=fresh_inflows,
        requisitions=requisitions,
        safety_reserves=safety_reserves,
        allow_transfers=True,
    )

    assert res.status == "optimal"
    # Total available: 10 units. Total demand: 9 units (6 STAT + 3 ROUTINE).
    # Since 10 >= 9, there should be ZERO shortages!
    total_shortages = sum(res.shortages.values())
    assert total_shortages == 0, f"Expected 0 shortages, got {total_shortages}"

    # STAT demand for H-01 must be completely satisfied
    dispatched_to_h1 = sum(
        units for (b, h, gd, gr, c, a, u), units in res.dispatches.items() if h == "H-01"
    )
    assert dispatched_to_h1 == 6

    # 1 unit remaining in inventory aged 4
    assert res.end_inventory.get(("BANK-01", "O+", "PRBC", 4), 0) == 1


# -------------------------------------------------------------
# Test 5: Perishable Aging Transition and Biological Expiration
# -------------------------------------------------------------
def test_perishable_aging_lifecycle():
    net = BloodSupplyNetwork("debug")
    solver = BloodSupplyMILPSolver(net)

    # Day 1: Vault contains 5 units of Platelets aged a=2
    inv_t1 = {("BANK-01", "O+", "PLT", 2): 5}
    res_t1 = solver.solve_epoch(
        current_inventory=inv_t1,
        fresh_inflows={},
        requisitions={},
        safety_reserves={},
        allow_transfers=False,
    )
    assert res_t1.status == "optimal"
    assert sum(res_t1.expirations.values()) == 0
    # Units aged 2 must transition to residual age 1
    assert res_t1.end_inventory.get(("BANK-01", "O+", "PLT", 1), 0) == 5

    # Day 2: Vault has 5 units of age 1. Demand = 2 units.
    inv_t2 = res_t1.end_inventory
    req_t2 = {("H-05", "O+", "PLT", "STAT"): 2}
    res_t2 = solver.solve_epoch(
        current_inventory=inv_t2,
        fresh_inflows={},
        requisitions=req_t2,
        safety_reserves={},
        allow_transfers=False,
    )
    assert res_t2.status == "optimal"
    # 2 units dispatched
    assert sum(res_t2.dispatches.values()) == 2
    # The remaining 3 units at age 1 CANNOT be kept further and must expire today!
    expired_units = res_t2.expirations.get(("BANK-01", "O+", "PLT"), 0)
    assert expired_units == 3, f"Expected exactly 3 expired units, got {expired_units}"
    assert sum(res_t2.end_inventory.values()) == 0


# -------------------------------------------------------------
# Test 6: Infeasible Demand Graceful Handling (Absorbed as Shortage)
# -------------------------------------------------------------
def test_massive_shortage_handling():
    net = BloodSupplyNetwork("debug")
    solver = BloodSupplyMILPSolver(net)

    # Vault has only 10 units
    inv = {("BANK-01", "O-", "PRBC", 10): 10}
    # Catastrophic demand of 500 units
    req = {("H-01", "O-", "PRBC", "STAT"): 500}

    res = solver.solve_epoch(
        current_inventory=inv,
        fresh_inflows={},
        requisitions=req,
        safety_reserves={},
        allow_transfers=True,
    )

    # Must solve without crashing and gracefully report 490 units shortage
    assert res.status == "optimal"
    assert res.shortages.get(("H-01", "O-", "PRBC", "STAT"), 0) == 490
    assert sum(res.dispatches.values()) == 10


# -------------------------------------------------------------
# Test 7: Multi-Day Simulation End-to-End Execution
# -------------------------------------------------------------
def test_full_simulation_run():
    net = BloodSupplyNetwork("debug")
    gen = ScenarioGenerator(net)
    scenario = gen.generate(scenario_type="ORDINARY", horizon_days=3, seed=99)

    sim = BloodSupplySimulator(net)
    policy_prop = ProposedRiskAwareJointCoordination(net, alpha=0.95)
    result = sim.run(scenario, policy_prop, "Proposed-MILP")

    assert result.horizon_days == 3
    assert result.total_demanded > 0
    assert result.conservation_errors == 0, "Mass conservation must hold strictly with zero errors"
    assert result.fulfillment_rate_pct >= 0.0
    assert result.average_solve_time_ms < 500.0, f"Solve time ({result.average_solve_time_ms}ms) exceeds target"
<<<<<<< HEAD
=======




def test_hub_spoke_policy_restricts_transfer_directions():
    """Hub-and-spoke policy should permit only hub-to-satellite transfers."""
    net = BloodSupplyNetwork("debug")
    policy = BaselineHubSpokeFixedStock(net)

    hub_ids = [
        bid for bid in net.bank_ids
        if net.banks[bid].is_hub
    ]
    satellite_ids = [
        bid for bid in net.bank_ids
        if not net.banks[bid].is_hub
    ]

    assert len(hub_ids) == 1
    hub_id = hub_ids[0]

    current_inventory = {
        (hub_id, "O+", "PRBC", 5): 10,
    }

    result = policy.decide(
        current_inventory=current_inventory,
        fresh_inflows={},
        requisitions={},
        in_transit_arrivals={},
        historical_demands={},
    )

    assert result.status == "optimal"

    assert all(
        src == hub_id and dst in satellite_ids
        for src, dst, *_ in result.transfers
    )





def test_solver_respects_allowed_transfer_pairs():
    """The solver must exclude transfer routes not in the allowlist."""
    net = BloodSupplyNetwork("debug")
    solver = BloodSupplyMILPSolver(net)

    hub_ids = [
        bid for bid in net.bank_ids
        if net.banks[bid].is_hub
    ]
    satellite_ids = [
        bid for bid in net.bank_ids
        if not net.banks[bid].is_hub
    ]

    assert len(hub_ids) == 1
    hub_id = hub_ids[0]

    allowed_pairs = {
        (hub_id, satellite_id)
        for satellite_id in satellite_ids
    }

    # Stock at a satellite should not be transferable to another bank.
    satellite_id = satellite_ids[0]
    inventory = {
        (satellite_id, "O+", "PRBC", 5): 10,
    }

    result = solver.solve_epoch(
        current_inventory=inventory,
        fresh_inflows={},
        requisitions={},
        safety_reserves={},
        allow_transfers=True,
        allowed_transfer_pairs=allowed_pairs,
    )

    assert result.status == "optimal"
    assert all(
        (src, dst) in allowed_pairs
        for src, dst, *_ in result.transfers
    )
>>>>>>> 1fc7f12 (Add research simulator and verify transfer restrictions)
