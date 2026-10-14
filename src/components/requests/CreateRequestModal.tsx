import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { 
  ALL_BLOOD_GROUPS, 
  ALL_COMPONENTS, 
  BloodGroup, 
  ComponentType 
} from '../../types/blood';
import { UrgencyLevel } from '../../types/request';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ isOpen, onClose }) => {
  const { hospitals, createRequest } = useData();
  const { currentUser } = useAuth();

  const [hospitalId, setHospitalId] = useState(currentUser.hospitalId || (hospitals[0]?.id ?? ''));
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [componentType, setComponentType] = useState<ComponentType>('Packed Red Blood Cells (PRBC)');
  const [unitsRequested, setUnitsRequested] = useState(2);
  const [urgency, setUrgency] = useState<UrgencyLevel>('Urgent (< 6 hrs)');
  const [requiredByDate, setRequiredByDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 6);
    return d.toISOString().slice(0, 16);
  });
  const [patientIdHash, setPatientIdHash] = useState(() => `PT-${Math.floor(100 + Math.random() * 900)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`);
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetHosp = hospitals.find(h => h.id === hospitalId) || hospitals[0];
    if (!targetHosp) {
      setFormError('Please select an authorized hospital facility.');
      return;
    }

    if (!clinicalIndication.trim()) {
      setFormError('Patient clinical indication is mandatory for transfusion audit.');
      return;
    }

    const res = createRequest({
      hospitalId: targetHosp.id,
      hospitalName: targetHosp.name,
      patientIdHash,
      patientClinicalIndication: clinicalIndication,
      bloodGroup,
      componentType,
      unitsRequested,
      urgency,
      requiredByDate: new Date(requiredByDate).toISOString(),
      specialRequirements: specialRequirements || undefined
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to submit transfusion request.');
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Clinical Transfusion Request"
      subtitle="Authorized hospital requisition for emergency or scheduled blood components"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Requisition Error:</span> {formError}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Requesting Hospital Facility *
            </label>
            <select
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.tier})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Urgency Level *
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
              className={`w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden ${
                urgency.startsWith('STAT') ? 'text-rose-600' : 'text-slate-900 dark:text-white'
              }`}
            >
              <option value="STAT / Emergency">STAT / Emergency (Immediate Life-Threatening Need)</option>
              <option value="Urgent (< 6 hrs)">Urgent (&lt; 6 hrs Operating Room / Trauma)</option>
              <option value="Routine Elective">Routine Elective (Scheduled Procedure Reserve)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recipient Blood Group (ABO/Rh) *
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {ALL_BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Component Type *
            </label>
            <select
              value={componentType}
              onChange={(e) => setComponentType(e.target.value as ComponentType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {ALL_COMPONENTS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Required Units Count *
            </label>
            <input
              type="number"
              min={1}
              max={50}
              required
              value={unitsRequested}
              onChange={(e) => setUnitsRequested(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Required By Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={requiredByDate}
              onChange={(e) => setRequiredByDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Clinical Indication & Diagnosis *
          </label>
          <input
            type="text"
            required
            value={clinicalIndication}
            onChange={(e) => setClinicalIndication(e.target.value)}
            placeholder="e.g. Ruptured aortic aneurysm, acute post-partum hemorrhage, severe anemia Hb 6.2 g/dL"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Special Pre-Transfusion Modifiers (Optional)
          </label>
          <input
            type="text"
            value={specialRequirements}
            onChange={(e) => setSpecialRequirements(e.target.value)}
            placeholder="e.g. Irradiated, CMV negative, washed RBCs, pediatric split"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Submit Requisition
          </button>
        </div>
      </form>
    </Modal>
  );
};
