import React from 'react';
import { 
  Users, 
  Droplet, 
  FileText, 
  AlertTriangle, 
  PlusCircle, 
  TrendingUp, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from './StatCard';
import { InventoryLevelChart } from './InventoryLevelChart';
import { UrgencyAlerts } from './UrgencyAlerts';
import { ActivityFeed } from './ActivityFeed';
import { NavigationTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenCreateRequest: () => void;
  onOpenAddBatch: () => void;
  onOpenAddDonor: () => void;
  onOpenAllocateModal: (requestId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCreateRequest,
  onOpenAddBatch,
  onOpenAddDonor,
  onOpenAllocateModal
}) => {
  const { 
    donors, 
    inventory, 
    requests, 
    nearExpiryBatches, 
    totalAvailableUnits 
  } = useData();
  const { canManageInventory, canSubmitHospitalRequest, canManageDonors } = useAuth();

  const pendingRequests = requests.filter(r => r.status === 'submitted' || r.status === 'under_review');
  const activeDonors = donors.filter(d => d.status === 'active');

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transfusion Intelligence Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-hospital supply orchestration, automated FEFO allocation, and predictive demand analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSubmitHospitalRequest && (
            <button
              onClick={onOpenCreateRequest}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              New Blood Request
            </button>
          )}

          {canManageInventory && (
            <button
              onClick={onOpenAddBatch}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Droplet className="w-4 h-4 text-rose-400" />
              Intake Unit Batch
            </button>
          )}

          {canManageDonors && (
            <button
              onClick={onOpenAddDonor}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              + Register Donor
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Eligible Blood Reserve"
          value={`${totalAvailableUnits} Units`}
          subtitle="Non-expired & tested"
          icon={Droplet}
          accentColor="rose"
          trend={{ value: `${inventory.filter(b => b.status === 'available').length} batches`, isPositive: true, label: 'in cold vault' }}
          onClick={() => onNavigate('inventory')}
        />

        <StatCard
          title="Registered Donors"
          value={donors.length}
          subtitle={`${activeDonors.length} eligible now`}
          icon={Users}
          accentColor="emerald"
          trend={{ value: '+14%', isPositive: true, label: 'monthly growth' }}
          onClick={() => onNavigate('donors')}
        />

        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          subtitle={`${requests.filter(r => r.urgency.startsWith('STAT')).length} STAT Priority`}
          icon={FileText}
          accentColor="blue"
          trend={{ value: `${requests.filter(r => r.status === 'fulfilled').length} fulfilled`, isPositive: true, label: 'this period' }}
          onClick={() => onNavigate('requests')}
        />

        <StatCard
          title="Near-Expiry Watch"
          value={nearExpiryBatches.length}
          subtitle="Expires in <= 5 days"
          icon={AlertTriangle}
          accentColor={nearExpiryBatches.length > 0 ? 'amber' : 'purple'}
          trend={{ 
            value: nearExpiryBatches.length > 0 ? 'FEFO Action Required' : 'Optimal shelf life', 
            isPositive: nearExpiryBatches.length === 0, 
            label: '' 
          }}
          onClick={() => onNavigate('inventory')}
        />
      </div>

      {/* AI Forecasting Callout Banner */}
      <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-rose-600/30 border border-rose-500/40 text-rose-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                AI Demand Forecasting Engine Active
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Ridge ML + Seasonal Naive
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Chronological backtesting evaluates 7, 14, and 30-day horizons with MAE/RMSE tracking. Proactively simulate shortages for universal O- and rapid-thaw FFP inventory.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('forecasting')}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
        >
          <TrendingUp className="w-4 h-4" />
          Launch Forecast Simulator
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid: Inventory Level Chart + Urgency Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InventoryLevelChart />
          <ActivityFeed onOpenAuditLogs={() => onNavigate('audit')} />
        </div>

        <div className="space-y-6">
          <UrgencyAlerts
            onOpenRequests={() => onNavigate('requests')}
            onOpenInventory={() => onNavigate('inventory')}
            onAllocateRequest={onOpenAllocateModal}
          />
        </div>
      </div>
    </div>
  );
};
