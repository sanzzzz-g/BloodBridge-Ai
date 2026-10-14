import React, { useState } from 'react';
import { 
  Droplet, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  Flame,
  ArrowRight,
  Sparkles,
  Thermometer
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ALL_BLOOD_GROUPS, ALL_COMPONENTS, BloodGroup, ComponentType } from '../../types/blood';
import { Badge } from '../common/Badge';
import { getDaysUntilExpiry, getHoursUntilExpiry, isExpiringWithin48Hours } from '../../lib/allocationEngine';
import { StorageService } from '../../lib/storage';
import { AddBatchModal } from './AddBatchModal';
import { ComponentRuleMatrix } from './ComponentRuleMatrix';

export const InventoryList: React.FC = () => {
  const { inventory, updateBatchStatus } = useData();
  const { canManageInventory } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlyExpiring48h, setOnlyExpiring48h] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  // Compute batches expiring within next 48 hours
  const critical48hBatches = inventory.filter(
    b => b.status === 'available' && isExpiringWithin48Hours(b.expiryDate)
  );
  const critical48hUnitsCount = critical48hBatches.reduce((acc, b) => acc + b.units, 0);

  const filteredInventory = inventory.filter(b => {
    const isCritical48h = b.status === 'available' && isExpiringWithin48Hours(b.expiryDate);
    if (onlyExpiring48h && !isCritical48h) return false;

    const matchesSearch = 
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.componentType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || b.bloodGroup === selectedGroup;
    const matchesComponent = selectedComponent === 'all' || b.componentType === selectedComponent;
    const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;

    return matchesSearch && matchesGroup && matchesComponent && matchesStatus;
  });

  const handleExportCSV = () => {
    StorageService.exportToCSV(inventory, 'bloodbridge_inventory_report');
  };

  const handleQuarantine = (batchId: string, batchNumber: string) => {
    const reason = window.prompt(`Enter reason for quarantining batch ${batchNumber}:`, 'Pending confirmatory serology or temperature excursion audit');
    if (reason) {
      updateBatchStatus(batchId, 'quarantined', reason);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Droplet className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Biological Blood Bank Inventory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Component tracking, automated shelf-life countdowns, and cold-chain temperature surveillance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-blue-500" />
            {showMatrix ? 'Hide Rule Matrix' : 'Component Rule Matrix'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export CSV
          </button>

          {canManageInventory && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Intake Unit Batch
            </button>
          )}
        </div>
      </div>

      {/* Visual 48-Hour Critical Expiry Notification System */}
      {critical48hBatches.length > 0 && (
        <div className="rounded-xl p-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg border border-red-400/40 relative overflow-hidden animate-in fade-in">
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-white/5 transform skew-x-12 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-xs shrink-0 flex items-center justify-center animate-bounce">
                <Flame className="w-5 h-5 text-amber-200 fill-amber-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5">
                    Critical 48-Hour Expiry Alert
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-red-700 font-extrabold text-[10px] uppercase shadow-xs">
                    {critical48hBatches.length} {critical48hBatches.length === 1 ? 'Batch' : 'Batches'} • {critical48hUnitsCount} Units at Imminent Risk
                  </span>
                </div>
                <p className="text-xs text-red-100 mt-1 max-w-2xl leading-relaxed">
                  The highlighted stock units will expire within the next <strong>48 hours</strong>. Per First-Expired First-Out (FEFO) transfusion protocol, prioritize immediate clinical allocation to pending or upcoming hospital requisitions to avoid biological wastage.
                </p>
                {/* Specific batch badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {critical48hBatches.map(b => (
                    <span key={b.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-black/25 text-white text-[11px] font-mono border border-white/20">
                      <strong>{b.bloodGroup}</strong> {b.componentType.split(' ')[0]} ({b.units}u) • Exp: {b.expiryDate}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                onClick={() => setOnlyExpiring48h(!onlyExpiring48h)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  onlyExpiring48h 
                    ? 'bg-white text-red-700 hover:bg-red-50' 
                    : 'bg-black/30 hover:bg-black/40 text-white border border-white/30'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {onlyExpiring48h ? 'Showing Only <48h Units (Clear)' : 'Filter Critical <48h Units'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component Rule Matrix Reference Toggle */}
      {showMatrix && <ComponentRuleMatrix />}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by batch #, location, group, or component..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick 48h Toggle Button in Filter Bar */}
          <button
            onClick={() => setOnlyExpiring48h(!onlyExpiring48h)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              onlyExpiring48h
                ? 'bg-red-600 text-white shadow-xs'
                : critical48hBatches.length > 0
                ? 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            &lt; 48h Expiry ({critical48hBatches.length})
          </button>

          {/* Blood Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Blood Groups</option>
            {ALL_BLOOD_GROUPS.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          {/* Component Filter */}
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[200px]"
          >
            <option value="all">All Components</option>
            {ALL_COMPONENTS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="quarantined">Quarantined</option>
            <option value="expired">Expired</option>
            <option value="allocated">Allocated</option>
          </select>
        </div>
      </div>

      {/* Inventory Batches Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-3">Blood Group</th>
                <th className="py-3 px-3">Component & Quantity</th>
                <th className="py-3 px-3">Collection / Expiry</th>
                <th className="py-3 px-3">Vault Location & Temp</th>
                <th className="py-3 px-3">Safety & Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInventory.map((batch) => {
                const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                const hoursLeft = getHoursUntilExpiry(batch.expiryDate);
                const isExpired = daysLeft <= 0;
                const isCritical48h = batch.status === 'available' && daysLeft > 0 && daysLeft <= 2;
                const isNearExpiry = batch.status === 'available' && daysLeft > 2 && daysLeft <= 5;

                return (
                  <tr 
                    key={batch.id} 
                    className={`transition ${
                      isCritical48h
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-l-4 border-l-red-600 hover:bg-red-100/60 dark:hover:bg-red-950/60'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {batch.batchNumber}
                        </div>
                        {isCritical48h && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {batch.donorCode ? `Donor: ${batch.donorCode}` : 'Unlinked Donation'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs ${
                        batch.bloodGroup === 'O-'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : isCritical48h
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      }`}>
                        {batch.bloodGroup}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {batch.componentType}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-mono font-bold">
                        {batch.units} {batch.units === 1 ? 'Unit' : 'Units'} available
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 dark:text-slate-200">
                        Exp: <strong className="font-mono">{batch.expiryDate}</strong>
                      </div>
                      <div className="mt-1">
                        {isExpired ? (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Expired ({Math.abs(daysLeft)}d ago)
                          </span>
                        ) : isCritical48h ? (
                          <div className="space-y-1">
                            {/* Prominent Visual Status Badge for <48h */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase bg-red-600 text-white shadow-xs animate-pulse">
                              <Flame className="w-3 h-3 fill-amber-300 text-amber-300" />
                              EXPIRES IN &lt; 48H ({daysLeft === 1 ? '1 DAY' : '2 DAYS'})
                            </span>
                            <div className="text-[10px] text-red-700 dark:text-red-300 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> ~{hoursLeft}h left (FEFO priority dispatch)
                            </div>
                          </div>
                        ) : isNearExpiry ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> Near Expiry ({daysLeft}d left)
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            {daysLeft} days remaining
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div>{batch.location}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-sky-500" />
                        {batch.temperatureCelsius}°C
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        {isCritical48h ? (
                          <span className="inline-flex items-center font-bold text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-200 border border-red-300 dark:border-red-800">
                            CRITICAL 48H SPOILAGE RISK
                          </span>
                        ) : (
                          <Badge
                            variant={
                              batch.status === 'available'
                                ? 'emerald'
                                : batch.status === 'quarantined'
                                ? 'amber'
                                : batch.status === 'expired'
                                ? 'red'
                                : 'slate'
                            }
                            size="sm"
                          >
                            {batch.status.toUpperCase()}
                          </Badge>
                        )}
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                          batch.testingPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                        }`}>
                          {batch.testingPassed ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {batch.testingPassed ? 'Serology Cleared' : 'Testing Pending'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManageInventory && batch.status === 'available' && (
                          <button
                            onClick={() => handleQuarantine(batch.id, batch.batchNumber)}
                            className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-900 transition cursor-pointer"
                          >
                            Quarantine
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No inventory records match the current filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intake Batch Modal */}
      <AddBatchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
