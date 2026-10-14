import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  User, 
  Calendar,
  Layers
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StorageService } from '../../lib/storage';
import { Badge } from '../common/Badge';

export const AuditLogView: React.FC = () => {
  const { auditLogs, inventory, requests, donors } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedReportTab, setSelectedReportTab] = useState<'audit_logs' | 'inventory_summary' | 'expiry_report'>('audit_logs');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const handleExportLogs = () => {
    StorageService.exportToCSV(auditLogs, 'bloodbridge_compliance_audit_logs');
  };

  const handleExportInventorySummary = () => {
    StorageService.exportToCSV(inventory, 'bloodbridge_inventory_summary');
  };

  const handleExportRequestsSummary = () => {
    StorageService.exportToCSV(requests, 'bloodbridge_requests_fulfillment');
  };

  const getActionColor = (action: string) => {
    if (action.includes('ALLOCATED') || action.includes('APPROVED')) return 'emerald';
    if (action.includes('REJECTED') || action.includes('QUARANTINED') || action.includes('EXPIRED')) return 'red';
    if (action.includes('INTAKE') || action.includes('CREATED')) return 'blue';
    return 'slate';
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Regulatory Compliance Reports & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable chain of custody for donor intake, testing clearance, allocations, and stock disposals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportLogs}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export Audit CSV
          </button>
          <button
            onClick={handleExportInventorySummary}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export Inventory Summary
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold max-w-fit">
        <button
          onClick={() => setSelectedReportTab('audit_logs')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer ${
            selectedReportTab === 'audit_logs'
              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Immutable Audit Trail ({auditLogs.length})
        </button>
        <button
          onClick={() => setSelectedReportTab('inventory_summary')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer ${
            selectedReportTab === 'inventory_summary'
              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Inventory Chain of Custody
        </button>
        <button
          onClick={() => setSelectedReportTab('expiry_report')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer ${
            selectedReportTab === 'expiry_report'
              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Expiry & Waste Surveillance
        </button>
      </div>

      {selectedReportTab === 'audit_logs' && (
        <>
          {/* Search and Action Filter */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search audit records by actor, action, reference, or details..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Action Types</option>
              <option value="REQUEST_ALLOCATED">REQUEST_ALLOCATED</option>
              <option value="REQUEST_APPROVED">REQUEST_APPROVED</option>
              <option value="REQUEST_SUBMITTED">REQUEST_SUBMITTED</option>
              <option value="REQUEST_REJECTED">REQUEST_REJECTED</option>
              <option value="BATCH_INTAKE">BATCH_INTAKE</option>
              <option value="BATCH_QUARANTINED">BATCH_QUARANTINED</option>
              <option value="DONOR_CREATED">DONOR_CREATED</option>
              <option value="DONOR_STATUS_CHANGED">DONOR_STATUS_CHANGED</option>
            </select>
          </div>

          {/* Audit Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp & ID</th>
                    <th className="py-3 px-3">Actor</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Entity Reference</th>
                    <th className="py-3 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.id}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {log.actorName}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {log.actorRole.replace(/_/g, ' ')}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <Badge variant={getActionColor(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {log.entityReference}
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {log.details}
                      </td>
                    </tr>
                  ))}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No audit records match the selected filter query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedReportTab === 'inventory_summary' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Current Active Stock Ledger by Blood Group
            </h4>
            <button
              onClick={handleExportInventorySummary}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Download Full Ledger
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(group => {
              const units = inventory
                .filter(b => b.bloodGroup === group && b.status === 'available')
                .reduce((s, b) => s + b.units, 0);

              return (
                <div key={group} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="font-bold text-sm block text-slate-900 dark:text-white">{group}</span>
                  <span className="text-lg font-mono font-extrabold text-rose-600 dark:text-rose-400">{units}</span>
                  <span className="text-[10px] text-slate-400 block">Eligible Units Available</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedReportTab === 'expiry_report' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Shelf-Life Waste Prevention & Disposal Tracking
            </h4>
            <span className="text-xs text-slate-500 font-medium">AABB Standard Audit Compliance</span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {inventory.filter(b => b.status === 'expired' || b.status === 'quarantined').map(b => (
              <div key={b.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {b.batchNumber} ({b.bloodGroup} {b.componentType})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Expiry: {b.expiryDate} • Status: <strong className="uppercase">{b.status}</strong>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500 max-w-xs italic">
                  {b.notes || 'Recorded in biohazard disposition queue'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
