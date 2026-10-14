import { BloodGroup, ComponentType } from '../types/blood';
import { 
  HistoricalDemandPoint, 
  ForecastPoint, 
  ModelMetrics, 
  ForecastAnalysis 
} from '../types/forecast';

/**
 * Validates historical demand dataset.
 * Throws structured errors for malformed, missing, or insufficient data.
 */
export function validateHistoricalData(data: HistoricalDemandPoint[]): void {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Forecasting error: Historical demand dataset is empty or undefined.');
  }

  if (data.length < 14) {
    throw new Error(`Forecasting error: Insufficient historical data points (${data.length} provided). A minimum of 14 chronological data points is required to avoid severe overfitting.`);
  }

  for (let i = 0; i < data.length; i++) {
    const pt = data[i];
    if (!pt.date || isNaN(new Date(pt.date).getTime())) {
      throw new Error(`Data validation error at row ${i}: Missing or invalid date '${pt.date}'.`);
    }
    if (typeof pt.unitsDemanded !== 'number' || isNaN(pt.unitsDemanded) || pt.unitsDemanded < 0) {
      throw new Error(`Data validation error at row ${i} (${pt.date}): Units demanded must be a non-negative number.`);
    }
  }
}

/**
 * Evaluates chronological Train/Test split:
 * Takes ordered data, uses first trainRatio for training, remaining for testing.
 * Prevents lookahead data leakage.
 */
export function chronologicalTrainTestSplit<T>(data: T[], trainRatio = 0.8): { train: T[]; test: T[] } {
  const trainSize = Math.max(7, Math.floor(data.length * trainRatio));
  return {
    train: data.slice(0, trainSize),
    test: data.slice(trainSize)
  };
}

/**
 * Calculates Mean Absolute Error (MAE) and Root Mean Square Error (RMSE).
 */
export function calculateMetrics(actuals: number[], predictions: number[]): { mae: number; rmse: number; r2: number } {
  if (actuals.length === 0 || actuals.length !== predictions.length) {
    return { mae: 0, rmse: 0, r2: 0 };
  }

  const n = actuals.length;
  let absErrorSum = 0;
  let sqErrorSum = 0;
  let actualSum = 0;

  for (let i = 0; i < n; i++) {
    const err = actuals[i] - predictions[i];
    absErrorSum += Math.abs(err);
    sqErrorSum += err * err;
    actualSum += actuals[i];
  }

  const meanActual = actualSum / n;
  let totalVarianceSum = 0;
  for (let i = 0; i < n; i++) {
    totalVarianceSum += Math.pow(actuals[i] - meanActual, 2);
  }

  const mae = absErrorSum / n;
  const rmse = Math.sqrt(sqErrorSum / n);
  const r2 = totalVarianceSum > 0 ? Math.max(0, 1 - (sqErrorSum / totalVarianceSum)) : 1;

  return {
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    r2: Number(r2.toFixed(3))
  };
}

/**
 * Baseline Model: Seasonal-Naive (lag 7 days) combined with 14-day rolling average.
 */
export class SeasonalNaiveForecaster {
  fit(history: HistoricalDemandPoint[]): void {
    // Baseline requires no complex parameter optimization
  }

  predict(history: HistoricalDemandPoint[], horizonDays: number): number[] {
    const predictions: number[] = [];
    const len = history.length;
    
    // Rolling 14-day mean as fallback
    const last14 = history.slice(-14).map(d => d.unitsDemanded);
    const rollingMean = last14.reduce((a, b) => a + b, 0) / (last14.length || 1);

    for (let day = 0; day < horizonDays; day++) {
      // Seasonal-naive lag 7
      const seasonalLagIndex = len - 7 + (day % 7);
      if (seasonalLagIndex >= 0 && seasonalLagIndex < len) {
        const seasonalVal = history[seasonalLagIndex].unitsDemanded;
        predictions.push(Math.round(seasonalVal));
      } else {
        predictions.push(Math.round(rollingMean));
      }
    }
    return predictions;
  }
}

/**
 * ML Regression Forecaster:
 * Features:
 * - Linear trend index (t)
 * - Day-of-week one-hot / cyclical (sin/cos of day of week)
 * - Weekend indicator
 * - 7-day lagged demand
 * - 14-day rolling mean
 * Uses L2 Regularized Ridge Regression solution (normal equations: (X^T X + λI)^-1 X^T y).
 */
export class RidgeDemandForecaster {
  private weights: number[] = [];
  private lambda = 0.5; // Ridge regularization factor

  private extractFeatures(point: HistoricalDemandPoint, index: number, historySoFar: number[]): number[] {
    const dow = point.dayOfWeek;
    const sinDow = Math.sin((2 * Math.PI * dow) / 7);
    const cosDow = Math.cos((2 * Math.PI * dow) / 7);
    const isWeekend = point.isWeekend ? 1.0 : 0.0;
    
    // Trend normalized
    const trend = index / 100;

    // Lag 7 feature
    const lag7 = historySoFar.length >= 7 ? historySoFar[historySoFar.length - 7] / 20 : 0.5;

    // Rolling 7 mean
    const recent7 = historySoFar.slice(-7);
    const rolling7 = recent7.length > 0 ? (recent7.reduce((a, b) => a + b, 0) / recent7.length) / 20 : 0.5;

    return [1.0, trend, sinDow, cosDow, isWeekend, lag7, rolling7];
  }

  fit(trainingData: HistoricalDemandPoint[]): void {
    const X: number[][] = [];
    const y: number[] = [];
    const demandValues: number[] = [];

    for (let i = 0; i < trainingData.length; i++) {
      const pt = trainingData[i];
      const features = this.extractFeatures(pt, i, demandValues);
      X.push(features);
      y.push(pt.unitsDemanded);
      demandValues.push(pt.unitsDemanded);
    }

    this.weights = this.solveRidgeRegression(X, y, this.lambda);
  }

  private solveRidgeRegression(X: number[][], y: number[], lambda: number): number[] {
    const numFeatures = X[0].length;
    const n = X.length;

    // Compute X^T * X
    const XtX: number[][] = Array.from({ length: numFeatures }, () => Array(numFeatures).fill(0));
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += X[k][i] * X[k][j];
        }
        XtX[i][j] = sum;
      }
    }

    // Add Ridge penalty to diagonal (excluding bias term at index 0)
    for (let i = 1; i < numFeatures; i++) {
      XtX[i][i] += lambda;
    }

    // Compute X^T * y
    const Xty: number[] = Array(numFeatures).fill(0);
    for (let i = 0; i < numFeatures; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * y[k];
      }
      Xty[i] = sum;
    }

    // Solve system via Gaussian elimination with partial pivoting
    return this.gaussianSolve(XtX, Xty);
  }

  private gaussianSolve(A: number[][], b: number[]): number[] {
    const n = b.length;
    const M: number[][] = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
          maxRow = k;
        }
      }

      // Swap
      const temp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = temp;

      // Check singular
      if (Math.abs(M[i][i]) < 1e-12) {
        continue;
      }

      // Eliminate
      for (let k = i + 1; k < n; k++) {
        const factor = M[k][i] / M[i][i];
        for (let j = i; j <= n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }

    // Back-substitution
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = M[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      x[i] = Math.abs(M[i][i]) > 1e-12 ? sum / M[i][i] : 0;
    }

    return x;
  }

  predictPoint(features: number[]): number {
    let dot = 0;
    for (let i = 0; i < features.length; i++) {
      dot += features[i] * (this.weights[i] || 0);
    }
    return Math.max(0, dot);
  }

  forecastFuture(
    history: HistoricalDemandPoint[], 
    horizonDays: number, 
    startDate: Date
  ): number[] {
    const predictions: number[] = [];
    const rollingHistory = history.map(h => h.unitsDemanded);

    for (let step = 0; step < horizonDays; step++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(forecastDate.getDate() + step);
      const dow = forecastDate.getDay();
      const isWeekend = dow === 0 || dow === 6;

      const dummyPt: HistoricalDemandPoint = {
        date: forecastDate.toISOString().split('T')[0],
        bloodGroup: history[0]?.bloodGroup || 'O+',
        componentType: history[0]?.componentType || 'Packed Red Blood Cells (PRBC)',
        unitsDemanded: 0,
        dayOfWeek: dow,
        isWeekend
      };

      const feats = this.extractFeatures(dummyPt, history.length + step, rollingHistory);
      const pred = Math.round(this.predictPoint(feats));
      predictions.push(pred);
      rollingHistory.push(pred);
    }

    return predictions;
  }
}

/**
 * Orchestrates full forecasting pipeline with chronological evaluation and risk alerts.
 */
export function runDemandForecastPipeline(
  data: HistoricalDemandPoint[],
  currentEligibleStock: number,
  horizonDays: 7 | 14 | 30 = 14
): ForecastAnalysis {
  validateHistoricalData(data);

  // Sort chronologically
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const bloodGroup = sortedData[0].bloodGroup;
  const componentType = sortedData[0].componentType;

  // 1. Chronological Train/Test Split (prevents data leakage)
  const { train, test } = chronologicalTrainTestSplit(sortedData, 0.8);

  // 2. Fit Baseline Forecaster
  const baselineModel = new SeasonalNaiveForecaster();
  baselineModel.fit(train);

  // Evaluate baseline on test set
  const baselineTestPreds = baselineModel.predict(train, test.length);
  const testActuals = test.map(t => t.unitsDemanded);
  const baselineMetricsCalc = calculateMetrics(testActuals, baselineTestPreds);

  // 3. Fit ML Ridge Regression
  const mlModel = new RidgeDemandForecaster();
  mlModel.fit(train);

  // Evaluate ML model on test set
  const mlTestPreds: number[] = [];
  const runningTrainDemand = train.map(t => t.unitsDemanded);
  for (let i = 0; i < test.length; i++) {
    const pt = test[i];
    // extract features using information available prior to point i
    const dow = pt.dayOfWeek;
    const sinDow = Math.sin((2 * Math.PI * dow) / 7);
    const cosDow = Math.cos((2 * Math.PI * dow) / 7);
    const isWeekend = pt.isWeekend ? 1.0 : 0.0;
    const trend = (train.length + i) / 100;
    const lag7 = runningTrainDemand.length >= 7 ? runningTrainDemand[runningTrainDemand.length - 7] / 20 : 0.5;
    const recent7 = runningTrainDemand.slice(-7);
    const rolling7 = recent7.length > 0 ? (recent7.reduce((a, b) => a + b, 0) / recent7.length) / 20 : 0.5;

    const feats = [1.0, trend, sinDow, cosDow, isWeekend, lag7, rolling7];
    const predVal = mlModel.predictPoint(feats);
    mlTestPreds.push(Math.round(predVal));
    runningTrainDemand.push(pt.unitsDemanded); // Append actual during backtest
  }
  const mlMetricsCalc = calculateMetrics(testActuals, mlTestPreds);

  // 4. Generate Future Forecast from end of dataset
  const lastDate = new Date(sortedData[sortedData.length - 1].date);
  const forecastStartDate = new Date(lastDate);
  forecastStartDate.setDate(forecastStartDate.getDate() + 1);

  // Retrain on all available data for future forecasting
  const productionMlModel = new RidgeDemandForecaster();
  productionMlModel.fit(sortedData);
  const futurePredictions = productionMlModel.forecastFuture(sortedData, horizonDays, forecastStartDate);
  const futureBaseline = baselineModel.predict(sortedData, horizonDays);

  // Build points with shortage risk analysis
  const points: ForecastPoint[] = [];
  let cumulativeProjectedDemand = 0;
  let remainingStock = currentEligibleStock;

  for (let i = 0; i < horizonDays; i++) {
    const fDate = new Date(forecastStartDate);
    fDate.setDate(fDate.getDate() + i);
    const dateStr = fDate.toISOString().split('T')[0];

    const pred = futurePredictions[i];
    const base = futureBaseline[i];
    cumulativeProjectedDemand += pred;
    remainingStock = Math.max(0, remainingStock - pred);

    // Confidence interval approximation based on model RMSE
    const stdDev = mlMetricsCalc.rmse > 0 ? mlMetricsCalc.rmse : 2.5;
    const lower = Math.max(0, Math.round(pred - 1.96 * stdDev));
    const upper = Math.round(pred + 1.96 * stdDev);

    let risk: 'none' | 'low' | 'moderate' | 'critical' = 'none';
    if (remainingStock <= 0) {
      risk = 'critical';
    } else if (remainingStock < pred * 2) {
      risk = 'moderate';
    } else if (remainingStock < pred * 4) {
      risk = 'low';
    }

    points.push({
      date: dateStr,
      predictedDemand: pred,
      baselineDemand: base,
      lowerBound: lower,
      upperBound: upper,
      shortageRisk: risk,
      projectedStock: remainingStock
    });
  }

  const deficit = Math.max(0, cumulativeProjectedDemand - currentEligibleStock);

  let riskSummary = '';
  if (deficit > 0) {
    riskSummary = `CRITICAL WARNING: Anticipated ${deficit}-unit shortage for ${bloodGroup} ${componentType} within the ${horizonDays}-day horizon. Current eligible inventory (${currentEligibleStock} units) is projected to deplete before day ${
      points.findIndex(p => p.shortageRisk === 'critical') + 1 || horizonDays
    }. Proactive donor mobilization recommended.`;
  } else if (currentEligibleStock - cumulativeProjectedDemand < 10) {
    riskSummary = `CAUTION: Supply buffer tight. Projected demand (${cumulativeProjectedDemand} units) approaches available stock (${currentEligibleStock} units). Minimal buffer remaining.`;
  } else {
    riskSummary = `STABLE: Eligible inventory of ${currentEligibleStock} units comfortably exceeds ${horizonDays}-day projected demand of ${cumulativeProjectedDemand} units.`;
  }

  const evalWindow = {
    startDate: test[0]?.date || sortedData[0].date,
    endDate: test[test.length - 1]?.date || sortedData[sortedData.length - 1].date,
    totalDays: test.length
  };

  const mlMetrics: ModelMetrics = {
    modelName: 'Ridge Regression (L2 Regularized + Cyclical Calendar)',
    mae: mlMetricsCalc.mae,
    rmse: mlMetricsCalc.rmse,
    r2Score: mlMetricsCalc.r2,
    evaluationWindow: evalWindow,
    trainSize: train.length,
    testSize: test.length
  };

  const baselineMetrics: ModelMetrics = {
    modelName: 'Seasonal-Naive (7-day lag + 14-day rolling mean)',
    mae: baselineMetricsCalc.mae,
    rmse: baselineMetricsCalc.rmse,
    r2Score: baselineMetricsCalc.r2,
    evaluationWindow: evalWindow,
    trainSize: train.length,
    testSize: test.length
  };

  return {
    bloodGroup,
    componentType,
    horizonDays,
    generatedAt: new Date().toISOString(),
    points,
    mlMetrics,
    baselineMetrics,
    currentEligibleStock,
    totalProjectedDemand: cumulativeProjectedDemand,
    projectedDeficitUnits: deficit,
    riskSummary
  };
}
