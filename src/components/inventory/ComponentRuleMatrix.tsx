import React from 'react';
import { COMPONENT_SPECS, ALL_COMPONENTS } from '../../types/blood';
import { ShieldAlert, Thermometer, Clock, Info } from 'lucide-react';

export const ComponentRuleMatrix: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <Info className="w-4 h-4" />
        </span>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Component Shelf-Life & Temperature Protocol Specifications
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validated biological preservation parameters per AABB and FDA standards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_COMPONENTS.map((compKey) => {
          const spec = COMPONENT_SPECS[compKey];
          return (
            <div 
              key={spec.code}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {spec.type}
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {spec.code}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span><strong>{spec.shelfLifeDays} days</strong> shelf life</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                  <span>{spec.storageTemp}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {spec.indication}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
