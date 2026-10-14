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
  Archive,
  Thermometer
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ALL_BLOOD_GROUPS, ALL_COMPONENTS, BloodGroup, ComponentType } from '../../types/blood';
import { Badge } from '../common/Badge';
import { getDaysUntilExpiry } from '../../lib/allocationEngine';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const filteredInventory = inventory.filter(b => {
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
                const isExpired = daysLeft <= 0;
                const isNearExpiry = daysLeft > 0 && daysLeft <= 5;

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {batch.batchNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {batch.donorCode ? `Donor: ${batch.donorCode}` : 'Unlinked Donation'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs ${
                        batch.bloodGroup === 'O-'
                          ? 'bg-rose-600 text-white shadow-xs'
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isExpired ? (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Expired ({Math.abs(daysLeft)}d ago)
                          </span>
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
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                          batch.testingPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                        }`}>
                          {batch.testingPassed ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {batch.testingPassed ? 'Serology Cleared' : 'Testing Pending'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canManageInventory && batch.status === 'available' && (
                        <button
                          onClick={() => handleQuarantine(batch.id, batch.batchNumber)}
                          className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-900 transition cursor-pointer"
                        >
                          Quarantine
                        </button>
                      )}
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
