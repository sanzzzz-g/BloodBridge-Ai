import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { 
  ALL_BLOOD_GROUPS, 
  ALL_COMPONENTS, 
  BloodGroup, 
  ComponentType, 
  COMPONENT_SPECS 
} from '../../types/blood';
import { useData } from '../../context/DataContext';
import { AlertCircle, Calendar, ShieldCheck, Thermometer } from 'lucide-react';

interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBatchModal: React.FC<AddBatchModalProps> = ({ isOpen, onClose }) => {
  const { addInventoryBatch, donors } = useData();

  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [componentType, setComponentType] = useState<ComponentType>('Packed Red Blood Cells (PRBC)');
  const [units, setUnits] = useState(1);
  const [collectionDate, setCollectionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('Vault 1 - Cold Room A (Shelf 1)');
  const [temperatureCelsius, setTemperatureCelsius] = useState(4.0);
  const [testingPassed, setTestingPassed] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-calculate expiry date when componentType or collectionDate changes
  useEffect(() => {
    if (collectionDate && componentType) {
      const spec = COMPONENT_SPECS[componentType];
      const coll = new Date(collectionDate);
      const exp = new Date(coll);
      exp.setDate(exp.getDate() + (spec?.shelfLifeDays || 35));
      setExpiryDate(exp.toISOString().split('T')[0]);

      // Set default storage temp
      if (componentType === 'Platelets (Single Donor / Pooled)') {
        setTemperatureCelsius(22.0);
        setLocation('Agitator Unit 1 - Room 2');
      } else if (componentType.includes('Plasma') || componentType.includes('Cryo')) {
        setTemperatureCelsius(-28.0);
        setLocation('Ultra-Deep Freezer F1 (-30°C)');
      } else {
        setTemperatureCelsius(4.0);
        setLocation('Vault 1 - Cold Room A');
      }
    }
  }, [componentType, collectionDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (units <= 0 || !Number.isInteger(units)) {
      setFormError('Units must be a positive integer.');
      return;
    }

    const matchedDonor = donors.find(d => d.id === selectedDonorId);
    const prefix = componentType.includes('Red') ? 'PRBC' : componentType.includes('Platelet') ? 'PLT' : componentType.includes('Plasma') ? 'FFP' : 'WB';
    const batchNumber = `BATCH-${new Date().getFullYear()}-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = addInventoryBatch({
      batchNumber,
      bloodGroup,
      componentType,
      units,
      collectionDate,
      expiryDate,
      location,
      temperatureCelsius,
      status: 'available',
      donorId: matchedDonor?.id,
      donorCode: matchedDonor?.nationalId,
      testingPassed,
      notes: notes || `Direct phlebotomy intake. Validated ${COMPONENT_SPECS[componentType].shelfLifeDays}d shelf life.`
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to record inventory batch intake.');
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Blood Unit Batch Intake & Testing Clearance"
      subtitle="Record newly harvested or delivered blood units into the cold chain inventory vault"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Error:</span> {formError}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
                <option key={c} value={c}>
                  {c} ({COMPONENT_SPECS[c].shelfLifeDays}d shelf life)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Blood Group (ABO/Rh) *
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
              Units Count (Quantity) *
            </label>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Collection Date *
            </label>
            <input
              type="date"
              required
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Calculated Expiry Date</span>
              <span className="text-[10px] text-rose-600 font-bold">Auto-calculated (+{COMPONENT_SPECS[componentType]?.shelfLifeDays}d)</span>
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Storage Vault Location *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Storage Temperature (°C) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={temperatureCelsius}
              onChange={(e) => setTemperatureCelsius(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Associated Registered Donor (Optional)
            </label>
            <select
              value={selectedDonorId}
              onChange={(e) => setSelectedDonorId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              <option value="">Unlinked / Mobile Collection</option>
              {donors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.bloodGroup} - {d.nationalId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Infectious Disease Safety Clearance */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={testingPassed}
              onChange={(e) => setTestingPassed(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                Infectious Disease Testing Clearance (HIV-1/2, HCV, HBV, Syphilis)
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                Confirm that serological and nucleic acid testing (NAT) have been performed and found non-reactive prior to placing stock in the available pool.
              </span>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
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
            Record Intake Batch
          </button>
        </div>
      </form>
    </Modal>
  );
};
