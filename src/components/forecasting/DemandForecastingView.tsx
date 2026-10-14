import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer, 
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  ALL_BLOOD_GROUPS, 
  ALL_COMPONENTS, 
  BloodGroup, 
  ComponentType 
} from '../../types/blood';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { generateSyntheticHistoricalDemand } from '../../lib/mockData';
import { runDemandForecastPipeline } from '../../lib/forecastingEngine';
import { Badge } from '../common/Badge';
import { 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  Download, 
  Calendar, 
  BarChart2, 
  CheckCircle2, 
  RefreshCw,
  Info
} from 'lucide-react';
import { StorageService } from '../../lib/storage';

export const DemandForecastingView: React.FC = () => {
  const { inventory } = useData();
  const { theme } = useTheme();

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O-');
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('Packed Red Blood Cells (PRBC)');
  const [horizonDays, setHorizonDays] = useState<7 | 14 | 30>(14);

  // Compute eligible inventory for selected group & component
  const currentEligibleStock = useMemo(() => {
    return inventory
      .filter(b => b.bloodGroup === selectedGroup && b.componentType === selectedComponent && b.status === 'available')
      .reduce((sum, b) => sum + b.units, 0);
  }, [inventory, selectedGroup, selectedComponent]);

  // Generate 60 days of reproducible synthetic historical demand
  const historicalData = useMemo(() => {
    return generateSyntheticHistoricalDemand(selectedGroup, selectedComponent, 60);
  }, [selectedGroup, selectedComponent]);

  // Execute forecasting pipeline
  const forecastResult = useMemo(() => {
    try {
      return runDemandForecastPipeline(historicalData, currentEligibleStock, horizonDays);
    } catch (e: any) {
      return null;
    }
  }, [historicalData, currentEligibleStock, horizonDays]);

  const isDark = theme === 'dark';

  // Format chart data combining recent historical points with future predictions
  const chartData = useMemo(() => {
    if (!forecastResult) return [];

    // Last 14 days of historical actuals
    const recentHistory = historicalData.slice(-14).map(h => ({
      date: h.date.slice(5), // MM-DD
      actualDemand: h.unitsDemanded,
      predictedDemand: null,
      baselineDemand: null,
      lowerBound: null,
      upperBound: null,
      type: 'historical'
    }));

    // Future prediction points
    const future = forecastResult.points.map(p => ({
      date: p.date.slice(5),
      actualDemand: null,
      predictedDemand: p.predictedDemand,
      baselineDemand: p.baselineDemand,
      lowerBound: p.lowerBound,
      upperBound: p.upperBound,
      type: 'forecast'
    }));

    return [...recentHistory, ...future];
  }, [historicalData, forecastResult]);

  const handleExportForecast = () => {
    if (!forecastResult) return;
    StorageService.exportToCSV(forecastResult.points, `bloodbridge_forecast_${selectedGroup}_${horizonDays}d`);
  };

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">
            Date: {label}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            return (
              <div key={index} className="flex items-center justify-between gap-3 text-[11px] py-0.5">
                <span style={{ color: entry.color }} className="font-semibold">
                  {entry.name}:
                </span>
                <span className="font-mono font-bold">
                  {entry.value} Units
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            AI Predictive Blood Demand Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chronological Ridge Regression with cyclical seasonality versus Seasonal-Naive baseline.
          </p>
        </div>

        <button
          onClick={handleExportForecast}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          Export Forecast CSV
        </button>
      </div>

      {/* Mandatory Prototype / Non-Clinical Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold uppercase tracking-wide text-[11px] text-amber-800 dark:text-amber-300">
            DEMO / SIMULATED DATA DISCLAIMER & REGULATORY DISCLOSURE:
          </span>
          <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
            This predictive engine is an academic software prototype. All input time-series and demand outputs are synthetic. Forecasts do not represent operationally validated hospital performance and must never be interpreted as clinical medical advice or guaranteed shortage predictions. Real-world inventory release requires validated transfusion medicine procedures.
          </p>
        </div>
      </div>

      {/* Configuration Control Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Blood Group */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Target Blood Group (ABO/Rh)
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as BloodGroup)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              {ALL_BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>
                  {bg} {bg === 'O-' ? '(Universal RBC)' : bg === 'AB+' ? '(Universal Plasma)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Component */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Component Type
            </label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value as ComponentType)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {ALL_COMPONENTS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Forecast Horizon */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Forecast Horizon
            </label>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              {([7, 14, 30] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setHorizonDays(h)}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    horizonDays === h
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Available Buffer Display */}
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Current Eligible Vault Reserve
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {currentEligibleStock} Units Available
          </div>
        </div>
      </div>

      {forecastResult && (
        <>
          {/* Risk Summary Alert */}
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 shadow-xs ${
            forecastResult.projectedDeficitUnits > 0
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
          }`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${forecastResult.projectedDeficitUnits > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
            <div>
              <div className="font-bold text-sm">
                {forecastResult.projectedDeficitUnits > 0 ? 'Anticipated Blood Supply Deficit Alert' : 'Inventory Equilibrium Maintained'}
              </div>
              <p className="mt-1 leading-relaxed">
                {forecastResult.riskSummary}
              </p>
            </div>
          </div>

          {/* Model Performance Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ML Model Metrics */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Primary ML: {forecastResult.mlMetrics.modelName}
                  </h4>
                </div>
                <Badge variant="rose" size="sm">Active ML Model</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-bold">MAE</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {forecastResult.mlMetrics.mae}
                  </span>
                  <span className="text-[9px] text-slate-400 block">units/day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-bold">RMSE</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {forecastResult.mlMetrics.rmse}
                  </span>
                  <span className="text-[9px] text-slate-400 block">spread</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-bold">R² Score</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {forecastResult.mlMetrics.r2Score}
                  </span>
                  <span className="text-[9px] text-slate-400 block">fit quality</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>Evaluation Window (Chronological Backtest):</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {forecastResult.mlMetrics.evaluationWindow.startDate} to {forecastResult.mlMetrics.evaluationWindow.endDate} ({forecastResult.mlMetrics.testSize}d)
                </span>
              </div>
            </div>

            {/* Baseline Model Metrics */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Baseline: {forecastResult.baselineMetrics.modelName}
                  </h4>
                </div>
                <Badge variant="slate" size="sm">Control Baseline</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-bold">MAE</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {forecastResult.baselineMetrics.mae}
                  </span>
                  <span className="text-[9px] text-slate-400 block">units/day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-bold">RMSE</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {forecastResult.baselineMetrics.rmse}
                  </span>
                  <span className="text-[9px] text-slate-400 block">spread</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-bold">R² Score</span>
                  <span className="text-base font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                    {forecastResult.baselineMetrics.r2Score}
                  </span>
                  <span className="text-[9px] text-slate-400 block">baseline fit</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>Prevented Lookahead Data Leakage:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Chronological 80/20 train/test split verified
                </span>
              </div>
            </div>
          </div>

          {/* Actual vs Predicted Demand Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Demand Trajectory: Recent Actuals (14d) & Projected Trajectory ({horizonDays}d Horizon)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shaded envelope indicates ±1.96 standard deviation confidence interval.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-500" /> Historical Actuals
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-600" /> ML Ridge Forecast
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-400 stroke-dasharray-2" /> Baseline
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke={isDark ? '#94a3b8' : '#64748b'} 
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke={isDark ? '#94a3b8' : '#64748b'} 
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />

                  {/* Confidence Interval Upper and Lower Bounds */}
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="transparent"
                    fill="url(#confidenceBand)"
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="transparent"
                    fill="transparent"
                    name="Lower Bound"
                  />

                  {/* Historical Demand Line */}
                  <Line
                    type="monotone"
                    dataKey="actualDemand"
                    stroke="#475569"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#475569' }}
                    name="Actual Demand"
                    connectNulls={false}
                  />

                  {/* ML Predicted Demand Line */}
                  <Line
                    type="monotone"
                    dataKey="predictedDemand"
                    stroke="#e11d48"
                    strokeWidth={3}
                    dot={{ r: 3.5, fill: '#e11d48' }}
                    name="ML Ridge Forecast"
                    connectNulls={false}
                  />

                  {/* Baseline Naive Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="baselineDemand"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                    name="Seasonal-Naive Baseline"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
