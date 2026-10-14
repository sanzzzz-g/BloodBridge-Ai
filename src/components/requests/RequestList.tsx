import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Layers
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { BloodRequest, RequestStatus } from '../../types/request';
import { Badge } from '../common/Badge';
import { StorageService } from '../../lib/storage';
import { CreateRequestModal } from './CreateRequestModal';
import { SmartAllocationModal } from './SmartAllocationModal';
import { Modal } from '../common/Modal';

export const RequestList: React.FC = () => {
  const { requests, updateRequestStatus } = useData();
  const { canSubmitHospitalRequest, canApproveRequests } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'fulfilled' | 'rejected'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequestForAllocation, setSelectedRequestForAllocation] = useState<BloodRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<BloodRequest | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('Insufficient regional donor inventory buffer; alternative clinic referral arranged.');

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientIdHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.componentType.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'pending') {
      matchesTab = r.status === 'submitted' || r.status === 'under_review' || r.status === 'approved' || r.status === 'partially_fulfilled';
    } else if (activeTab === 'fulfilled') {
      matchesTab = r.status === 'fulfilled';
    } else if (activeTab === 'rejected') {
      matchesTab = r.status === 'rejected' || r.status === 'cancelled';
    }

    return matchesSearch && matchesTab;
  });

  const handleExportCSV = () => {
    StorageService.exportToCSV(requests, 'bloodbridge_transfusion_requests');
  };

  const handleConfirmReject = () => {
    if (!rejectingRequest) return;
    updateRequestStatus(rejectingRequest.id, 'rejected', rejectionReasonText);
    setRejectingRequest(null);
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency.includes('STAT')) return <Badge variant="red" size="sm">{urgency}</Badge>;
    if (urgency.includes('Urgent')) return <Badge variant="rose" size="sm">{urgency}</Badge>;
    return <Badge variant="slate" size="sm">{urgency}</Badge>;
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'fulfilled': return <Badge variant="emerald" size="sm">FULFILLED</Badge>;
      case 'partially_fulfilled': return <Badge variant="blue" size="sm">PARTIAL</Badge>;
      case 'approved': return <Badge variant="purple" size="sm">APPROVED</Badge>;
      case 'under_review': return <Badge variant="amber" size="sm">UNDER REVIEW</Badge>;
      case 'submitted': return <Badge variant="slate" size="sm">SUBMITTED</Badge>;
      case 'rejected': return <Badge variant="red" size="sm">REJECTED</Badge>;
      case 'cancelled': return <Badge variant="slate" size="sm">CANCELLED</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Hospital Transfusion Requisitions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Emergency trauma resuscitation orders, scheduled surgical reserves, and explainable stock allocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export CSV
          </button>

          {canSubmitHospitalRequest && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Transfusion Request
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by request #, hospital, patient ID hash, or component..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
          {(['all', 'pending', 'fulfilled', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab === 'pending' ? 'Active / Pending' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Requisition & Hospital</th>
                <th className="py-3 px-3">Urgency</th>
                <th className="py-3 px-3">Target Component & Group</th>
                <th className="py-3 px-3">Quantity & Fulfillment</th>
                <th className="py-3 px-3">Clinical Indication</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.map((req) => {
                const isFulfilled = req.status === 'fulfilled';
                const isRejected = req.status === 'rejected' || req.status === 'cancelled';
                const canAllocateThis = canApproveRequests && !isFulfilled && !isRejected;

                return (
                  <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {req.requestNumber}
                        <span className="text-[10px] text-slate-400 font-normal">({req.patientIdHash})</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                        {req.hospitalName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Needed by: {new Date(req.requiredByDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {getUrgencyBadge(req.urgency)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center text-xs">
                          {req.bloodGroup}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {req.componentType}
                          </div>
                          {req.specialRequirements && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              ★ {req.specialRequirements}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {req.unitsFulfilled} / {req.unitsRequested} Units
                      </div>
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (req.unitsFulfilled / req.unitsRequested) * 100)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-[11px]">
                        {req.patientClinicalIndication}
                      </p>
                      {req.rejectionReason && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          Reason: {req.rejectionReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {getStatusBadge(req.status)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canAllocateThis && (
                          <button
                            onClick={() => setSelectedRequestForAllocation(req)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Smart Allocate
                          </button>
                        )}

                        {canApproveRequests && !isFulfilled && !isRejected && (
                          <button
                            onClick={() => setRejectingRequest(req)}
                            className="px-2 py-1 text-slate-400 hover:text-rose-600 text-[11px] font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          >
                            Reject
                          </button>
                        )}

                        {isFulfilled && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transfusion requests match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Smart Allocation Modal */}
      <SmartAllocationModal
        request={selectedRequestForAllocation}
        isOpen={!!selectedRequestForAllocation}
        onClose={() => setSelectedRequestForAllocation(null)}
      />

      {/* Rejection Confirmation Modal */}
      {rejectingRequest && (
        <Modal
          isOpen={!!rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          title={`Reject Requisition: ${rejectingRequest.requestNumber}`}
          subtitle="A transparent clinical reason is mandatory to satisfy transfusion audit standards"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Formal Reason for Rejection / Deferral *
              </label>
              <textarea
                rows={3}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
