import React from 'react';
import { AlertCircle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Badge } from '../common/Badge';

interface UrgencyAlertsProps {
  onOpenRequests: () => void;
  onOpenInventory: () => void;
  onAllocateRequest: (requestId: string) => void;
}

export const UrgencyAlerts: React.FC<UrgencyAlertsProps> = ({
  onOpenRequests,
  onOpenInventory,
  onAllocateRequest
}) => {
  const { urgentRequests, nearExpiryBatches } = useData();

  return (
    <div className="space-y-4">
      {/* STAT / Emergency Requests Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Critical Transfusion Requests
            </h4>
          </div>
          <button
            onClick={onOpenRequests}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View all ({urgentRequests.length})
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {urgentRequests.length === 0 ? (
          <div className="p-6 text-center rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400">
            <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            No pending STAT or urgent requests awaiting allocation.
          </div>
        ) : (
          <div className="space-y-2.5">
            {urgentRequests.slice(0, 3).map((req) => (
              <div 
                key={req.id}
                className="p-3 rounded-lg border border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="rose" size="sm">
                      {req.urgency}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {req.requestNumber}
                    </span>
                    <span className="text-xs text-slate-500">• {req.hospitalName}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                    Needs <strong className="text-rose-600 dark:text-rose-400">{req.unitsRequested} units</strong> of {req.bloodGroup} {req.componentType}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">
                    Indication: {req.patientClinicalIndication}
                  </p>
                </div>

                <button
                  onClick={() => onAllocateRequest(req.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  Allocate Stock
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Near Expiry Batches */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Near-Expiry Inventory (FEFO Watchlist)
            </h4>
          </div>
          <button
            onClick={onOpenInventory}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Manage inventory
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {nearExpiryBatches.length === 0 ? (
          <div className="p-6 text-center rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400">
            No stock batches expiring within the next 5 days.
          </div>
        ) : (
          <div className="space-y-2">
            {nearExpiryBatches.slice(0, 3).map((b) => (
              <div 
                key={b.id}
                className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center font-bold text-amber-700 dark:text-amber-300">
                    {b.bloodGroup}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {b.units} units • {b.componentType}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {b.batchNumber} • {b.location}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="amber" size="sm">
                    Expires {b.expiryDate}
                  </Badge>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                    Priority allocation
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
