"""
Pytest Suite for BloodBridge AI Machine Learning Service
Tests input validation, chronological train/test split, and metric computation.
"""

import pytest
import datetime
import pandas as pd
from .forecaster import validate_input_data, engineer_features, run_chronological_evaluation, BaselineSeasonalNaive


def test_validation_rejects_empty_data():
    with pytest.raises(ValueError, match="dataset is empty"):
        validate_input_data([])


def test_validation_rejects_insufficient_data():
    sample_records = [
        {"date": f"2026-10-{i+1:02d}", "unitsDemanded": 5}
        for i in range(10) # 10 is < 14
    ]
    with pytest.raises(ValueError, match="Insufficient historical data"):
        validate_input_data(sample_records)


def test_validation_rejects_negative_units():
    sample_records = [
        {"date": f"2026-09-{i+1:02d}", "unitsDemanded": -2 if i == 5 else 6}
        for i in range(16)
    ]
    with pytest.raises(ValueError, match="non-negative"):
        validate_input_data(sample_records)


def test_chronological_pipeline_execution():
    records = []
    base = datetime.date(2026, 8, 1)
    for i in range(30):
        d = base + datetime.timedelta(days=i)
        records.append({
            "date": d.strftime("%Y-%m-%d"),
            "unitsDemanded": 8 + (i % 5)
        })

    df = validate_input_data(records)
    res = run_chronological_evaluation(df, horizon=7)

    assert res["status"] == "success"
    assert len(res["points"]) == 7
    assert res["mlMetrics"]["mae"] >= 0
    assert res["mlMetrics"]["rmse"] >= 0
    assert res["baselineMetrics"]["mae"] >= 0
    assert "disclaimer" in res
