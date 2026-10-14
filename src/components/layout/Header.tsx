import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Bell, 
  UserCheck, 
  Building2, 
  Shield, 
  HeartHandshake, 
  AlertCircle,
  Clock,
  Menu,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types/audit';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onNavigateToRequests: () => void;
  onNavigateToInventory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onNavigateToRequests,
  onNavigateToInventory
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, switchUser, availableUsers } = useAuth();
  const { nearExpiryBatches, urgentRequests } = useData();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const totalAlerts = nearExpiryBatches.length + urgentRequests.length;

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'administrator': return <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'blood_bank_staff': return <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'hospital_staff': return <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'donor': return <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'administrator': return 'System Admin';
      case 'blood_bank_staff': return 'Blood Bank Staff';
      case 'hospital_staff': return 'Hospital Clinician';
      case 'donor': return 'Donor Portal';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">
            Metropolitan Transfusion Network
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Center Node #04 • Regional Blood Reserve
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Role Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setIsRoleDropdownOpen(!isRoleDropdownOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
              {getRoleIcon(currentUser.role)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {currentUser.name.split(',')[0]}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {getRoleLabel(currentUser.role)}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Persona (RBAC Demo)
                </span>
              </div>
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer ${
                    currentUser.id === user.id ? 'bg-rose-50/70 dark:bg-rose-950/30' : ''
                  }`}
                >
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user.name}
                      {currentUser.id === user.id && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Active</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {user.title}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {user.organization}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsRoleDropdownOpen(false);
            }}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalAlerts}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Active Clinical & Stock Alerts ({totalAlerts})
                </span>
                <span className="text-[10px] text-slate-400">Real-time Feed</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {urgentRequests.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      onNavigateToRequests();
                    }}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex gap-2.5 items-start"
                  >
                    <div className="p-1 rounded bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{r.urgency} Request</span>
                        <span className="text-[10px] text-red-600 font-bold">{r.requestNumber}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        {r.hospitalName} requires {r.unitsRequested} units of {r.bloodGroup} {r.componentType}.
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> Needs review & allocation
                      </span>
                    </div>
                  </div>
                ))}

                {nearExpiryBatches.map(b => (
                  <div 
                    key={b.id}
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      onNavigateToInventory();
                    }}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex gap-2.5 items-start"
                  >
                    <div className="p-1 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Near Expiry Batch</span>
                        <span className="text-[10px] text-amber-600 font-mono font-bold">{b.batchNumber}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        {b.units} units of {b.bloodGroup} {b.componentType} expiring on {b.expiryDate}.
                      </p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1 inline-block">
                        First-Expired First-Out priority candidate
                      </span>
                    </div>
                  </div>
                ))}

                {totalAlerts === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active shortage or critical expiry alerts at this time.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
