"""
BloodBridge AI — FastAPI Machine Learning Service
Exposes blood demand forecasting and chronological model evaluation endpoints.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from .forecaster import validate_input_data, run_chronological_evaluation

app = FastAPI(
    title="BloodBridge AI — Forecasting Service",
    version="1.0.0",
    description="Intelligent blood supply demand forecasting API with scikit-learn Ridge regression and Seasonal-Naive baseline."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DemandPointInput(BaseModel):
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    unitsDemanded: int = Field(..., ge=0, description="Quantity of blood units demanded")
    bloodGroup: Optional[str] = "O-"
    componentType: Optional[str] = "Packed Red Blood Cells (PRBC)"


class ForecastRequest(BaseModel):
    historicalData: List[DemandPointInput]
    horizonDays: Literal[7, 14, 30] = 14
    currentEligibleStock: Optional[int] = 0


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "BloodBridge AI ML Engine",
        "version": "1.0.0",
        "modelsSupported": ["RidgeRegression", "SeasonalNaive"]
    }


@app.post("/forecast")
def generate_forecast(payload: ForecastRequest):
    try:
        raw_records = [pt.model_dump() for pt in payload.historicalData]
        df = validate_input_data(raw_records)
        result = run_chronological_evaluation(df, horizon=payload.horizonDays)
        
        # Calculate shortage risk relative to current stock
        current_stock = payload.currentEligibleStock or 0
        total_projected = sum(p["predictedDemand"] for p in result["points"])
        deficit = max(0, total_projected - current_stock)

        result["currentEligibleStock"] = current_stock
        result["totalProjectedDemand"] = total_projected
        result["projectedDeficitUnits"] = deficit
        result["isShortageAnticipated"] = deficit > 0

        return result
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting pipeline error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml_service.main:app", host="0.0.0.0", port=8000, reload=True)
