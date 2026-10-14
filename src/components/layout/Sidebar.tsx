import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Droplet, 
  FileText, 
  LineChart, 
  Building2, 
  History, 
  Activity,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export type NavigationTab = 
  | 'dashboard'
  | 'donors'
  | 'inventory'
  | 'requests'
  | 'forecasting'
  | 'hospitals'
  | 'audit';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { donors, inventory, requests, urgentRequests, nearExpiryBatches } = useData();

  const pendingRequestsCount = requests.filter(r => r.status === 'submitted' || r.status === 'under_review').length;

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'donors' as NavigationTab,
      label: 'Donor Registry',
      icon: Users,
      badge: `${donors.length}`
    },
    {
      id: 'inventory' as NavigationTab,
      label: 'Blood Inventory',
      icon: Droplet,
      badge: nearExpiryBatches.length > 0 ? `${nearExpiryBatches.length} Expiring` : null,
      badgeColor: 'amber'
    },
    {
      id: 'requests' as NavigationTab,
      label: 'Transfusion Requests',
      icon: FileText,
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : null,
      badgeColor: urgentRequests.length > 0 ? 'rose' : 'blue'
    },
    {
      id: 'forecasting' as NavigationTab,
      label: 'AI Demand Forecast',
      icon: LineChart,
      badge: 'ML Engine'
    },
    {
      id: 'hospitals' as NavigationTab,
      label: 'Hospitals & Trauma',
      icon: Building2,
      badge: null
    },
    {
      id: 'audit' as NavigationTab,
      label: 'Reports & Audit Logs',
      icon: History,
      badge: null
    }
  ];

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-700 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/40 text-white font-bold">
              <Activity className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-1">
                BloodBridge <span className="text-rose-500 font-black">AI</span>
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                Supply Intelligence
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Operational Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-950'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor === 'rose'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : item.badgeColor === 'amber'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System Summary Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Total Units</span>
              <span className="font-mono font-bold text-rose-400">
                {inventory.reduce((acc, b) => b.status === 'available' ? acc + b.units : acc, 0)} units
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                style={{ width: '68%' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Network Online
              </span>
              <span>v2.4 LTS</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
