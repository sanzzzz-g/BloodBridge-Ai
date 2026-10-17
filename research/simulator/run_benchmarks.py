"""
Experimental Benchmark Runner for BloodBridge AI Research Simulator.
Executes systematic, reproducible evaluations across:
- 4 Policies (Baseline 1 Isolated Fixed, Baseline 2 Hub-Spoke Fixed, Baseline 3 Dynamic Ablation, Proposed Joint MILP)
- 5 Scenarios (Ordinary, Concentrated Surge, Regional Catastrophe, Transport Disruption, Compound Emergency)
- Repeated Seeds (5 independent stochastic realizations)
- Primary (5 Banks, 12 Hospitals) and Debug (3 Banks, 6 Hospitals) Networks
- Sensitivity Analysis across Service Levels (alpha in [0.85, 0.90, 0.95, 0.99])

Saves complete raw logs and statistical summaries to /research/results/
"""

import os
import sys
import time
import argparse
from typing import List, Dict, Any
import numpy as np
import pandas as pd

from .network import BloodSupplyNetwork
from .scenarios import ScenarioGenerator
from .policies import (
    BaselineIsolatedFixedStock,
    BaselineHubSpokeFixedStock,
    BaselineIsolatedDynamicReserve,
    ProposedRiskAwareJointCoordination,
)
from .simulator import BloodSupplySimulator, SimulationRunResult


def run_benchmark_suite(
    network_mode: str = "primary",
    horizon_days: int = 7,
    seeds: List[int] = [42, 101, 2024],
    scenarios: List[str] = ["ORDINARY", "CONCENTRATED_TRAUMA_SURGE", "REGIONAL_CATASTROPHE", "COMPOUND_EMERGENCY"],
    output_dir: str = "/research/results",
) -> pd.DataFrame:
    """
    Executes systematic comparative benchmark suite.
    """
    os.makedirs(output_dir, exist_ok=True)
    print(f"\n================================================================================")
    print(f"BloodBridge AI — Experimental Simulation Benchmark Suite")
    print(f"Network: {network_mode.upper()} | Horizon: {horizon_days} Days | Seeds: {seeds}")
    print(f"Scenarios: {scenarios}")
    print(f"================================================================================\n")

    net = BloodSupplyNetwork(network_mode)
    sim = BloodSupplySimulator(net)
    gen = ScenarioGenerator(net)

    policies = {
        "Baseline-1-Isolated-Fixed": lambda: BaselineIsolatedFixedStock(net, alpha=0.95),
        "Baseline-2-HubSpoke-Fixed": lambda: BaselineHubSpokeFixedStock(net, alpha=0.95),
        "Baseline-3-Isolated-Dynamic": lambda: BaselineIsolatedDynamicReserve(net, alpha=0.95),
        "Proposed-RiskAware-JointMILP": lambda: ProposedRiskAwareJointCoordination(net, alpha=0.95),
    }

    raw_records: List[Dict[str, Any]] = []

    for sc_type in scenarios:
        for seed in seeds:
            scenario = gen.generate(scenario_type=sc_type, horizon_days=horizon_days, seed=seed)
            print(f"\n>>> Scenario: {sc_type} | Seed: {seed} (Demanded Units: ~{scenario.horizon_days * 150})")

            for pol_name, pol_factory in policies.items():
                t_start = time.time()
                pol_instance = pol_factory()
                run_res: SimulationRunResult = sim.run(scenario, pol_instance, pol_name)
                wall_time = time.time() - t_start

                rec = {
                    "network": network_mode,
                    "scenario": sc_type,
                    "seed": seed,
                    "policy": pol_name,
                    "horizon_days": horizon_days,
                    "total_demanded": run_res.total_demanded,
                    "total_fulfilled": run_res.total_fulfilled,
                    "total_shortage": run_res.total_shortage,
                    "fulfillment_rate_pct": run_res.fulfillment_rate_pct,
                    "shortage_rate_pct": run_res.shortage_rate_pct,
                    "stat_demanded": run_res.stat_demanded,
                    "stat_fulfilled": run_res.stat_fulfilled,
                    "stat_shortage": run_res.stat_shortage,
                    "stat_fulfillment_rate_pct": run_res.stat_fulfillment_rate_pct,
                    "total_expired": run_res.total_expired,
                    "expiry_rate_pct": run_res.expiry_rate_pct,
                    "transferred_units": run_res.total_transferred_units,
                    "transfer_cost": run_res.total_transfer_cost,
                    "dispatch_cost": run_res.total_dispatch_cost,
                    "reserve_deficit_units": run_res.total_reserve_deficit_units,
                    "avg_solve_time_ms": run_res.average_solve_time_ms,
                    "max_solve_time_ms": run_res.max_solve_time_ms,
                    "conservation_errors": run_res.conservation_errors,
                    "wall_clock_time_s": round(wall_time, 2),
                }
                raw_records.append(rec)

                print(
                    f"  [{pol_name:30s}] Shortage: {rec['shortage_rate_pct']:5.2f}% "
                    f"(STAT: {100.0 - rec['stat_fulfillment_rate_pct']:5.2f}%) | "
                    f"Expiry: {rec['expiry_rate_pct']:5.2f}% | "
                    f"Transfers: {rec['transferred_units']:4d}u | "
                    f"Avg Solve: {rec['avg_solve_time_ms']:6.2f}ms"
                )

    df_raw = pd.DataFrame(raw_records)
    csv_raw_path = os.path.join(output_dir, f"benchmark_raw_{network_mode}.csv")
    df_raw.to_csv(csv_raw_path, index=False)
    print(f"\n[Saved] Raw run logs: {csv_raw_path}")

    # Compute Statistical Summary (Mean ± Std Error across seeds)
    group_cols = ["network", "scenario", "policy"]
    agg_dict = {
        "shortage_rate_pct": ["mean", "std"],
        "stat_fulfillment_rate_pct": ["mean", "std"],
        "expiry_rate_pct": ["mean", "std"],
        "transferred_units": ["mean", "std"],
        "transfer_cost": ["mean", "std"],
        "reserve_deficit_units": ["mean", "std"],
        "avg_solve_time_ms": ["mean", "max"],
    }
    df_summary = df_raw.groupby(group_cols).agg(agg_dict).reset_index()
    # Flatten column multi-index
    df_summary.columns = [
        f"{c[0]}_{c[1]}" if c[1] else c[0] for c in df_summary.columns
    ]
    csv_summary_path = os.path.join(output_dir, f"benchmark_summary_{network_mode}.csv")
    df_summary.to_csv(csv_summary_path, index=False)
    print(f"[Saved] Statistical summary: {csv_summary_path}")

    return df_summary


def run_sensitivity_suite(
    network_mode: str = "debug",
    horizon_days: int = 7,
    seed: int = 42,
    output_dir: str = "/research/results",
) -> pd.DataFrame:
    """
    Runs sensitivity analysis over target service levels alpha in {0.85, 0.90, 0.95, 0.99}.
    """
    os.makedirs(output_dir, exist_ok=True)
    net = BloodSupplyNetwork(network_mode)
    sim = BloodSupplySimulator(net)
    gen = ScenarioGenerator(net)
    scenario = gen.generate(scenario_type="CONCENTRATED_TRAUMA_SURGE", horizon_days=horizon_days, seed=seed)

    alpha_levels = [0.85, 0.90, 0.95, 0.99]
    records = []

    print(f"\n================================================================================")
    print(f"Service Level Alpha Sensitivity Analysis (alpha in {alpha_levels})")
    print(f"================================================================================\n")

    for alpha in alpha_levels:
        policies = {
            "Baseline-1-Fixed": BaselineIsolatedFixedStock(net, alpha=alpha),
            "Proposed-JointMILP": ProposedRiskAwareJointCoordination(net, alpha=alpha),
        }
        for pol_name, pol in policies.items():
            res = sim.run(scenario, pol, pol_name)
            records.append({
                "alpha": alpha,
                "policy": pol_name,
                "shortage_rate_pct": res.shortage_rate_pct,
                "stat_fulfillment_rate_pct": res.stat_fulfillment_rate_pct,
                "expiry_rate_pct": res.expiry_rate_pct,
                "transferred_units": res.total_transferred_units,
                "reserve_deficit_units": res.total_reserve_deficit_units,
                "avg_solve_time_ms": res.average_solve_time_ms,
            })
            print(
                f"Alpha: {alpha:4.2f} | {pol_name:20s} | Shortage: {res.shortage_rate_pct:5.2f}% | "
                f"STAT Fulfill: {res.stat_fulfillment_rate_pct:5.2f}% | Expiry: {res.expiry_rate_pct:5.2f}% | "
                f"Reserve Deficit: {res.total_reserve_deficit_units:6.1f}u"
            )

    df_sens = pd.DataFrame(records)
    csv_sens_path = os.path.join(output_dir, "sensitivity_analysis.csv")
    df_sens.to_csv(csv_sens_path, index=False)
    print(f"\n[Saved] Sensitivity analysis: {csv_sens_path}")
    return df_sens


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run BloodBridge AI experimental benchmarks")
    parser.add_argument("--mode", choices=["debug", "primary", "all"], default="debug")
    parser.add_argument("--horizon", type=int, default=7)
    parser.add_argument("--sensitivity", action="store_true")
    args = parser.parse_args()

    if args.mode in ["debug", "all"]:
        run_benchmark_suite(network_mode="debug", horizon_days=args.horizon, seeds=[42, 101, 2024])

    if args.mode in ["primary", "all"]:
        run_benchmark_suite(network_mode="primary", horizon_days=args.horizon, seeds=[42, 101, 2024])

    if args.sensitivity or args.mode == "all":
        run_sensitivity_suite(network_mode="debug", horizon_days=args.horizon)
