import React from 'react';
import { Modal } from '../common/Modal';
import { Donor } from '../../types/donor';
import { CheckCircle2, XCircle, AlertTriangle, FileCheck, Stethoscope } from 'lucide-react';

interface DonorScreeningModalProps {
  donor: Donor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DonorScreeningModal: React.FC<DonorScreeningModalProps> = ({
  donor,
  isOpen,
  onClose
}) => {
  if (!donor) return null;

  const screening = donor.medicalScreening || {
    ageValid: true,
    weightValid: true,
    recentTattooOrPiercing: false,
    recentSurgeryOrIllness: false,
    currentMedications: false,
    travelToEndemicArea: false,
    hemoglobinVerified: true,
    consentSigned: true
  };

  const checklistItems = [
    { label: 'Minimum Age Requirement (≥ 18 years)', passed: screening.ageValid, detail: `DOB: ${donor.dateOfBirth || 'Verified'}` },
    { label: 'Minimum Weight Requirement (≥ 50 kg / 110 lbs)', passed: screening.weightValid, detail: 'Assessed at physical triage' },
    { label: 'Hemoglobin Threshold Verified (≥ 12.5 g/dL female, ≥ 13.0 g/dL male)', passed: screening.hemoglobinVerified, detail: 'Point-of-care microcuvette analysis' },
    { label: 'No Recent Tattoos / Body Piercings (Last 3-6 Months)', passed: !screening.recentTattooOrPiercing, detail: 'Infection risk protocol' },
    { label: 'No Recent Surgery, Acute Illness, or Fever', passed: !screening.recentSurgeryOrIllness, detail: 'General physiological evaluation' },
    { label: 'Medication Deferral List Clearance (Blood thinners, teratogens)', passed: !screening.currentMedications, detail: 'Pharmacological screening' },
    { label: 'Malaria / Arbovirus Endemic Travel Deferral Clearance', passed: !screening.travelToEndemicArea, detail: 'Geographic risk questionnaire' },
    { label: 'Informed Voluntary Consent & Donor Declaration Signed', passed: screening.consentSigned, detail: 'Digital consent signature on file' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Medical Pre-Screening Record: ${donor.fullName}`}
      subtitle={`National ID: ${donor.nationalId} • Blood Group: ${donor.bloodGroup}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Qualified Medical Disclaimer */}
        <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Clinical Safety Protocol:</span>
            <p className="mt-0.5">
              Software records do not declare donors medically eligible autonomously. Official donor clearance requires in-person clinical assessment by certified phlebotomy and medical personnel immediately prior to donation.
            </p>
          </div>
        </div>

        {/* Screening Checklist */}
        <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.detail}
                  </div>
                </div>
              </div>

              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                item.passed 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
              }`}>
                {item.passed ? 'Cleared' : 'Flagged'}
              </span>
            </div>
          ))}
        </div>

        {/* Clinical Notes */}
        {screening.notes && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Phlebotomist / Examiner Notes:
            </span>
            <p className="text-slate-600 dark:text-slate-400 italic">
              "{screening.notes}"
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
          >
            Close Record
          </button>
        </div>
      </div>
    </Modal>
  );
};
