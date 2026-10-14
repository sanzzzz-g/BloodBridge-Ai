"""
BloodBridge AI — Predictive Blood Demand Machine Learning Engine
Python Service with scikit-learn, pandas, and statistical baseline models.
"""

from typing import List, Dict, Any, Tuple
import datetime
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def validate_input_data(records: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Validates date-indexed historical demand input records.
    Raises ValueError for missing, malformed, or insufficient records (< 14 points).
    """
    if not records or len(records) == 0:
        raise ValueError("Forecasting input dataset is empty.")

    if len(records) < 14:
        raise ValueError(
            f"Insufficient historical data ({len(records)} points provided). "
            "A minimum of 14 chronological points is required to evaluate seasonality without overfitting."
        )

    df = pd.DataFrame(records)
    
    required_cols = {"date", "unitsDemanded"}
    if not required_cols.issubset(df.columns):
        raise ValueError(f"Input records must contain columns: {required_cols}")

    # Validate dates
    try:
        df["date"] = pd.to_datetime(df["date"])
    except Exception as e:
        raise ValueError(f"Malformed date encountered: {str(e)}")

    # Validate non-negative numbers
    if (df["unitsDemanded"] < 0).any():
        raise ValueError("Demand units must be non-negative values.")

    # Sort chronologically to prevent lookahead leakage
    df = df.sort_values("date").reset_index(drop=True)
    return df


def engineer_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Extracts time-series cyclical and calendar regression features:
    - Sin/Cos Day-of-Week
    - Weekend boolean
    - Normalized trend index
    - 7-day seasonal lag
    - 7-day rolling average
    """
    df = df.copy()
    dow = df["date"].dt.dayofweek
    df["sin_dow"] = np.sin(2 * np.pi * dow / 7.0)
    df["cos_dow"] = np.cos(2 * np.pi * dow / 7.0)
    df["is_weekend"] = (dow >= 5).astype(float)
    df["trend"] = np.arange(len(df)) / 100.0

    # Lags & rolling features with backward filling to prevent data leakage
    df["lag_7"] = df["unitsDemanded"].shift(7).bfill()
    df["rolling_7"] = df["unitsDemanded"].rolling(window=7, min_periods=1).mean()

    feature_cols = ["trend", "sin_dow", "cos_dow", "is_weekend", "lag_7", "rolling_7"]
    return df[feature_cols], df["unitsDemanded"]


class BaselineSeasonalNaive:
    """
    Control baseline model using 7-day seasonal naive lag with rolling mean fallback.
    """
    def __init__(self):
        self.history = None

    def fit(self, y: pd.Series):
        self.history = y.values

    def predict(self, horizon: int) -> np.ndarray:
        if self.history is None or len(self.history) == 0:
            raise ValueError("Baseline model not fitted.")
        
        preds = []
        hist_len = len(self.history)
        rolling_mean = np.mean(self.history[-14:])

        for step in range(horizon):
            idx = hist_len - 7 + (step % 7)
            if 0 <= idx < hist_len:
                preds.append(round(self.history[idx]))
            else:
                preds.append(round(rolling_mean))

        return np.array(preds)


class ScikitRidgeForecaster:
    """
    Primary predictive model using L2 Regularized Ridge Regression.
    Evaluated with chronological train/test split.
    """
    def __init__(self, alpha: float = 1.0):
        self.model = Ridge(alpha=alpha, positive=False)
        self.feature_names = None

    def fit(self, X: pd.DataFrame, y: pd.Series):
        self.feature_names = list(X.columns)
        self.model.fit(X, y)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        raw = self.model.predict(X)
        return np.clip(np.round(raw), 0, None)  # Units cannot be negative


def run_chronological_evaluation(df: pd.DataFrame, horizon: int = 14) -> Dict[str, Any]:
    """
    Executes chronological train/test split (80/20), evaluates both models on the test set,
    and returns MAE, RMSE, and future forecasted trajectories.
    """
    n = len(df)
    train_size = max(7, int(n * 0.8))

    train_df = df.iloc[:train_size].copy()
    test_df = df.iloc[train_size:].copy()

    # Engineer features
    X_train, y_train = engineer_features(train_df)
    X_test, y_test = engineer_features(test_df)

    # 1. Baseline Model
    baseline = BaselineSeasonalNaive()
    baseline.fit(y_train)
    baseline_test_preds = baseline.predict(len(test_df))
    base_mae = float(mean_absolute_error(y_test, baseline_test_preds))
    base_rmse = float(np.sqrt(mean_squared_error(y_test, baseline_test_preds)))

    # 2. Scikit-learn Ridge Model
    ridge = ScikitRidgeForecaster(alpha=0.5)
    ridge.fit(X_train, y_train)
    ml_test_preds = ridge.predict(X_test)
    ml_mae = float(mean_absolute_error(y_test, ml_test_preds))
    ml_rmse = float(np.sqrt(mean_squared_error(y_test, ml_test_preds)))
    ml_r2 = float(r2_score(y_test, ml_test_preds)) if np.var(y_test) > 0 else 1.0

    # 3. Retrain on all available data for future forecasting
    X_all, y_all = engineer_features(df)
    production_model = ScikitRidgeForecaster(alpha=0.5)
    production_model.fit(X_all, y_all)

    # Generate future horizon points
    last_date = df["date"].max()
    future_dates = [last_date + datetime.timedelta(days=i + 1) for i in range(horizon)]
    
    # Generate future feature rows iteratively
    future_preds = []
    current_history = list(df["unitsDemanded"].values)

    for i, f_date in enumerate(future_dates):
        dow = f_date.weekday()
        feats = {
            "trend": (n + i) / 100.0,
            "sin_dow": np.sin(2 * np.pi * dow / 7.0),
            "cos_dow": np.cos(2 * np.pi * dow / 7.0),
            "is_weekend": 1.0 if dow >= 5 else 0.0,
            "lag_7": current_history[-7] if len(current_history) >= 7 else np.mean(current_history),
            "rolling_7": np.mean(current_history[-7:])
        }
        X_step = pd.DataFrame([feats])
        pred_val = int(production_model.predict(X_step)[0])
        future_preds.append(pred_val)
        current_history.append(pred_val)

    baseline_all = BaselineSeasonalNaive()
    baseline_all.fit(df["unitsDemanded"])
    future_baseline = [int(v) for v in baseline_all.predict(horizon)]

    points = []
    for i, f_date in enumerate(future_dates):
        pred = future_preds[i]
        points.append({
            "date": f_date.strftime("%Y-%m-%d"),
            "predictedDemand": pred,
            "baselineDemand": future_baseline[i],
            "lowerBound": max(0, int(pred - 1.96 * ml_rmse)),
            "upperBound": int(pred + 1.96 * ml_rmse)
        })

    return {
        "status": "success",
        "evaluationWindow": {
            "startDate": test_df["date"].min().strftime("%Y-%m-%d"),
            "endDate": test_df["date"].max().strftime("%Y-%m-%d"),
            "testPointsCount": len(test_df)
        },
        "mlMetrics": {
            "modelName": "Scikit-Learn Ridge Regression (L2)",
            "mae": round(ml_mae, 2),
            "rmse": round(ml_rmse, 2),
            "r2Score": round(ml_r2, 3)
        },
        "baselineMetrics": {
            "modelName": "Seasonal-Naive (Lag 7 + Rolling Mean)",
            "mae": round(base_mae, 2),
            "rmse": round(base_rmse, 2)
        },
        "forecastHorizonDays": horizon,
        "points": points,
        "disclaimer": "DEMO / SIMULATED DATA ONLY. Not clinically or operationally validated for real hospital transfusion decisions."
    }
