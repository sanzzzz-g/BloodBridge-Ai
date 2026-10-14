import { BloodGroup, ComponentType } from './blood';

export interface HistoricalDemandPoint {
  date: string; // YYYY-MM-DD
  bloodGroup: BloodGroup;
  componentType: ComponentType;
  unitsDemanded: number;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  isWeekend: boolean;
  holidayOrEvent?: string;
}

export interface ForecastPoint {
  date: string;
  predictedDemand: number;
  baselineDemand: number;
  lowerBound: number;
  upperBound: number;
  shortageRisk: 'none' | 'low' | 'moderate' | 'critical';
  projectedStock: number;
}

export interface ModelMetrics {
  modelName: string;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  r2Score: number;
  evaluationWindow: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  trainSize: number;
  testSize: number;
}

export interface ForecastAnalysis {
  bloodGroup: BloodGroup;
  componentType: ComponentType;
  horizonDays: 7 | 14 | 30;
  generatedAt: string;
  points: ForecastPoint[];
  mlMetrics: ModelMetrics;
  baselineMetrics: ModelMetrics;
  currentEligibleStock: number;
  totalProjectedDemand: number;
  projectedDeficitUnits: number;
  riskSummary: string;
}
