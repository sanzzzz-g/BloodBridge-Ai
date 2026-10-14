import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { BloodRequest } from '../../types/request';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { evaluateCandidatesForRequest } from '../../lib/allocationEngine';
import { Badge } from '../common/Badge';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';

interface SmartAllocationModalProps {
  request: BloodRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SmartAllocationModal: React.FC<SmartAllocationModalProps> = ({
  request,
  isOpen,
  onClose
}) => {
  const { inventory, fulfillRequestAllocation } = useData();
  const { currentUser, canApproveRequests } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!request) return null;

  // Run FEFO smart allocation candidate evaluation
  const plan = evaluateCandidatesForRequest(request, inventory);

  const handleExecuteAllocation = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (plan.suggestedAllocations.length === 0) {
      setErrorMessage('No eligible candidate stock batches available to allocate for this request.');
      return;
    }

    setIsSubmitting(true);
    const result = fulfillRequestAllocation(request.id, plan.suggestedAllocations);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to complete atomic allocation transaction.');
    } else {
      setSuccessMessage('Allocation executed successfully! Inventory decremented and audit log recorded.');
      setTimeout(() => {
        onClose();
      }, 1400);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Intelligent Transfusion Allocation: ${request.requestNumber}`}
      subtitle={`Recipient: ${request.hospitalName} • Needs ${plan.unitsStillNeeded} Unit(s) of ${request.bloodGroup} ${request.componentType}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Status / Alert Messages */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Allocation Error:</span> {errorMessage}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Transaction Success:</span> {successMessage}
            </div>
          </div>
        )}

        {/* Clinical Summary Bar */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                Requisition Target:
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {request.unitsRequested} units ({request.unitsFulfilled} already fulfilled)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Urgency: <strong className="text-slate-800 dark:text-slate-200">{request.urgency}</strong> • Indication: {request.patientClinicalIndication}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={plan.canFullyFulfill ? 'emerald' : plan.totalEligibleUnitsAvailable > 0 ? 'amber' : 'red'} size="md">
              {plan.canFullyFulfill ? '100% Stock Match Available' : plan.totalEligibleUnitsAvailable > 0 ? 'Partial Stock Available' : 'Deficit / No Stock'}
            </Badge>
          </div>
        </div>

        {/* Algorithm Rationale Banner */}
        <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">FEFO (First-Expired, First-Out) Optimization Engine:</span>
            <p className="mt-0.5 text-sky-800 dark:text-sky-300">
              {plan.explanationSummary}
            </p>
          </div>
        </div>

        {/* Candidate Batches Detailed Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Evaluated Candidate Inventory ({plan.candidates.length} Batches Checked)
            </span>
            <span className="text-[11px] text-slate-400">
              Ranked by shelf-life & ABO compatibility
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {plan.candidates.map((cand, idx) => {
              const b = cand.batch;
              const isSelected = cand.recommendedUnitsToTake > 0;

              return (
                <div 
                  key={b.id} 
                  className={`p-3 text-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-l-4 border-l-rose-600' 
                      : cand.isEligible 
                      ? 'bg-white dark:bg-slate-900' 
                      : 'bg-slate-50/50 dark:bg-slate-800/30 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {cand.isEligible ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {b.batchNumber}
                        </span>
                        <span className="font-extrabold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
                          {b.bloodGroup}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {b.units} units available
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                            Selected: Take {cand.recommendedUnitsToTake} {cand.recommendedUnitsToTake === 1 ? 'unit' : 'units'}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Expires: <strong className="font-mono text-slate-700 dark:text-slate-300">{b.expiryDate}</strong> ({cand.daysToExpiry}d remaining) • {b.location}
                      </div>

                      <p className={`text-[11px] mt-1 italic ${cand.isEligible ? 'text-slate-600 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400 font-medium'}`}>
                        {cand.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Score: {cand.selectionScore}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cand.isEligible ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {cand.isEligible ? 'Eligible' : 'Excluded'}
                    </span>
                  </div>
                </div>
              );
            })}

            {plan.candidates.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No inventory batches of component type {request.componentType} found in storage.
              </div>
            )}
          </div>
        </div>

        {/* Human Clinical Sign-off Disclaimer */}
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Human-in-the-Loop Clinical Verification:</span>
            <p className="mt-0.5 text-[11px]">
              Per blood transfusion safety protocols, blood is never released autonomously. By clicking "Authorize & Fulfill", you certify that patient identity, antibody screen, and compatibility have been reviewed by a qualified transfusion specialist.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            Signoff Actor: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong> ({currentUser.role})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            {canApproveRequests ? (
              <button
                type="button"
                onClick={handleExecuteAllocation}
                disabled={isSubmitting || plan.suggestedAllocations.length === 0}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Processing Transaction...' : `Authorize & Fulfill (${plan.suggestedAllocations.reduce((s, a) => s + a.unitsToAllocate, 0)} Units)`}
              </button>
            ) : (
              <span className="text-xs text-rose-500 font-semibold px-2 py-1 bg-rose-50 dark:bg-rose-950 rounded">
                Staff / Admin role required to authorize allocation
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
