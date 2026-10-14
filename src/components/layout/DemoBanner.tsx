import React from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const DemoBanner: React.FC = () => {
  const { resetAllData } = useData();

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100 uppercase tracking-wider text-[10px]">
          <ShieldAlert className="w-3 h-3 text-amber-700 dark:text-amber-300" />
          Academic Prototype • Demo Data
        </span>
        <span className="hidden sm:inline text-amber-800 dark:text-amber-300">
          BloodBridge AI is an experimental decision-support platform. All records are synthetic. Transfusions require clinical laboratory crossmatch and qualified medical authorization.
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={resetAllData}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-medium transition cursor-pointer"
          title="Reset dataset back to default synthetic state"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Demo Data
        </button>
      </div>
    </div>
  );
};
