import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { useData } from '../../context/DataContext';
import { ALL_BLOOD_GROUPS, BloodGroup, ALL_COMPONENTS, ComponentType } from '../../types/blood';
import { useTheme } from '../../context/ThemeContext';

export const InventoryLevelChart: React.FC = () => {
  const { availableUnitsByGroup, inventory } = useData();
  const { theme } = useTheme();
  const [selectedView, setSelectedView] = useState<'by_group' | 'by_component'>('by_group');

  const isDark = theme === 'dark';

  // Group data
  const groupData = ALL_BLOOD_GROUPS.map(bg => {
    const units = availableUnitsByGroup[bg] || 0;
    // Critical threshold flag
    const isCritical = bg === 'O-' ? units < 5 : units < 3;
    return {
      name: bg,
      units,
      isCritical
    };
  });

  // Component data
  const componentData = ALL_COMPONENTS.map(comp => {
    const totalUnits = inventory
      .filter(b => b.componentType === comp && b.status === 'available')
      .reduce((sum, b) => sum + b.units, 0);
    return {
      name: comp.split(' ')[0], // Short name
      fullName: comp,
      units: totalUnits,
      isCritical: totalUnits < 4
    };
  });

  const activeData = selectedView === 'by_group' ? groupData : componentData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200">{data.fullName || label}</p>
          <p className="mt-1 text-rose-400 font-semibold font-mono text-sm">
            {data.units} Available Units
          </p>
          {data.isCritical && (
            <p className="text-amber-400 font-medium text-[10px] mt-1">
              ⚠️ Below safe reserve buffer (Needs donor mobilization)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Available Blood Reserve Distribution
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time eligible stock excluding expired or quarantined units
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setSelectedView('by_group')}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              selectedView === 'by_group'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            By Blood Group (ABO/Rh)
          </button>
          <button
            onClick={() => setSelectedView('by_component')}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              selectedView === 'by_component'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            By Component Type
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
            <XAxis 
              dataKey="name" 
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
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="units" radius={[4, 4, 0, 0]} maxBarSize={44}>
              {activeData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.name === 'O-' ? '#e11d48' : entry.isCritical ? '#f59e0b' : '#3b82f6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            Universal RBC Donor (O-)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Standard Eligible Supply
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Buffer Deficit Alert
          </span>
        </div>
        <span>Calculated from live batch database</span>
      </div>
    </div>
  );
};
