import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Donor } from '../../types/donor';
import { ALL_BLOOD_GROUPS, BloodGroup } from '../../types/blood';
import { useData } from '../../context/DataContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface DonorModalProps {
  donorToEdit: Donor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DonorModal: React.FC<DonorModalProps> = ({
  donorToEdit,
  isOpen,
  onClose
}) => {
  const { addDonor, updateDonor } = useData();

  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'undisclosed'>('male');
  const [city, setCity] = useState('New York, NY');
  const [contactMethod, setContactMethod] = useState<'email' | 'sms' | 'phone'>('sms');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [emergencyAlertsEnabled, setEmergencyAlertsEnabled] = useState(true);

  // Screening checklist state
  const [ageValid, setAgeValid] = useState(true);
  const [weightValid, setWeightValid] = useState(true);
  const [hemoglobinVerified, setHemoglobinVerified] = useState(true);
  const [consentSigned, setConsentSigned] = useState(true);
  const [screeningNotes, setScreeningNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (donorToEdit) {
      setFullName(donorToEdit.fullName);
      setNationalId(donorToEdit.nationalId);
      setEmail(donorToEdit.email);
      setPhone(donorToEdit.phone);
      setBloodGroup(donorToEdit.bloodGroup);
      setDateOfBirth(donorToEdit.dateOfBirth || '1995-01-01');
      setGender(donorToEdit.gender);
      setCity(donorToEdit.city || 'New York, NY');
      setContactMethod(donorToEdit.preferences?.contactMethod || 'sms');
      setRemindersEnabled(donorToEdit.preferences?.remindersEnabled ?? true);
      setEmergencyAlertsEnabled(donorToEdit.preferences?.emergencyAlertsEnabled ?? true);
      
      const sc = donorToEdit.medicalScreening;
      if (sc) {
        setAgeValid(sc.ageValid);
        setWeightValid(sc.weightValid);
        setHemoglobinVerified(sc.hemoglobinVerified);
        setConsentSigned(sc.consentSigned);
        setScreeningNotes(sc.notes || '');
      }
    } else {
      setFullName('');
      setNationalId(`DONOR-ID-${Math.floor(1000 + Math.random() * 9000)}`);
      setEmail('');
      setPhone('');
      setBloodGroup('O+');
      setDateOfBirth('1995-01-01');
      setGender('male');
      setCity('New York, NY');
      setContactMethod('sms');
      setRemindersEnabled(true);
      setEmergencyAlertsEnabled(true);
      setAgeValid(true);
      setWeightValid(true);
      setHemoglobinVerified(true);
      setConsentSigned(true);
      setScreeningNotes('Pre-screening verification confirmed.');
    }
    setFormError(null);
  }, [donorToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      nationalId,
      fullName,
      email,
      phone,
      bloodGroup,
      dateOfBirth,
      gender,
      status: 'active' as const,
      lastDonationDate: donorToEdit ? donorToEdit.lastDonationDate : null,
      eligibleFromDate: donorToEdit ? donorToEdit.eligibleFromDate : new Date().toISOString().split('T')[0],
      city,
      preferences: {
        contactMethod,
        remindersEnabled,
        emergencyAlertsEnabled,
        preferredCenter: 'Downtown Central Center'
      },
      medicalScreening: {
        ageValid,
        weightValid,
        recentTattooOrPiercing: false,
        recentSurgeryOrIllness: false,
        currentMedications: false,
        travelToEndemicArea: false,
        hemoglobinVerified,
        consentSigned,
        notes: screeningNotes
      }
    };

    if (donorToEdit) {
      const res = updateDonor(donorToEdit.id, payload);
      if (!res.success) {
        setFormError(res.error || 'Failed to update donor.');
        return;
      }
    } else {
      const res = addDonor(payload);
      if (!res.success) {
        setFormError(res.error || 'Failed to register donor.');
        return;
      }
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={donorToEdit ? `Edit Donor: ${donorToEdit.fullName}` : 'Register New Blood Donor'}
      subtitle="Complete donor identity, validated contact information, and initial triage screening"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Validation Error:</span> {formError}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jordan Miller"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              National ID / Donor Card # *
            </label>
            <input
              type="text"
              required
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="e.g. DONOR-ID-9081"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Blood Group (ABO & Rh Factor) *
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {ALL_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg} {bg === 'O-' ? '(Universal RBC Donor)' : bg === 'AB+' ? '(Universal RBC Recipient)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Screening Checklist Section */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            Qualified Pre-Screening Questionnaire (Triage Requirements)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={ageValid}
                onChange={(e) => setAgeValid(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Age verified ≥ 18 years</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={weightValid}
                onChange={(e) => setWeightValid(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Weight verified ≥ 50 kg</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={hemoglobinVerified}
                onChange={(e) => setHemoglobinVerified(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Hb level verified (≥12.5 g/dL)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={consentSigned}
                onChange={(e) => setConsentSigned(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Informed Consent Signed</span>
            </label>
          </div>
        </div>

        {/* Preferences */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Preferred Channel:</span>
            {(['sms', 'email', 'phone'] as const).map(ch => (
              <label key={ch} className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="contactMethod"
                  value={ch}
                  checked={contactMethod === ch}
                  onChange={() => setContactMethod(ch)}
                  className="text-rose-600"
                />
                <span className="uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-400">{ch}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                className="rounded text-rose-600"
              />
              <span className="text-slate-600 dark:text-slate-400">Eligibility reminders</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyAlertsEnabled}
                onChange={(e) => setEmergencyAlertsEnabled(e.target.checked)}
                className="rounded text-rose-600"
              />
              <span className="text-slate-600 dark:text-slate-400">STAT emergency alerts</span>
            </label>
          </div>
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
            {donorToEdit ? 'Save Changes' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
