import React, { useState } from 'react';
import { Donor } from '../../types/donor';
import { 
  Heart, 
  Calendar, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BellRing
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface DonorEngagementPanelProps {
  donor: Donor;
  onClose: () => void;
}

export const DonorEngagementPanel: React.FC<DonorEngagementPanelProps> = ({ donor, onClose }) => {
  const [notificationSentMessage, setNotificationSentMessage] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState('Downtown Central Center');

  // Cooldown calculation: 56 days for Whole Blood donation
  const calculateDaysUntilEligible = () => {
    if (!donor.lastDonationDate) return 0;
    const lastDate = new Date(donor.lastDonationDate);
    const cooldownDays = 56;
    const eligibleDate = new Date(lastDate);
    eligibleDate.setDate(eligibleDate.getDate() + cooldownDays);

    const now = new Date();
    const diffTime = eligibleDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysUntilEligible = calculateDaysUntilEligible();
  const isEligibleNow = daysUntilEligible === 0;

  const handleSendSimulatedReminder = () => {
    const channel = donor.preferences?.contactMethod?.toUpperCase() || 'SMS';
    const message = `[SIMULATED ${channel}]: "Hello ${donor.fullName}, thank you for being a BloodBridge lifesaver! You are eligible to donate. Urgent need for ${donor.bloodGroup} units. Tap to schedule."`;
    setNotificationSentMessage(message);
    setTimeout(() => {
      // Auto clear after 6 seconds
    }, 6000);
  };

  return (
    <div className="space-y-5">
      {/* Donor Header Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-rose-100/60 dark:from-rose-950/40 dark:to-slate-900 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-rose-900/30">
            {donor.bloodGroup}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {donor.fullName}
              </h3>
              <Badge variant={donor.status === 'active' ? 'emerald' : 'slate'} size="sm">
                {donor.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {donor.nationalId} • Lifetime Donations: <strong className="text-rose-600 dark:text-rose-400">{donor.totalDonations} units</strong>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Current Cooldown Status
          </div>
          <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
            {isEligibleNow ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Eligible to Donate Now
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Clock className="w-4 h-4" /> {daysUntilEligible} days cooldown remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Simulated Notification Toast */}
      {notificationSentMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Communication Dispatch Simulated:</span>
            <p className="font-mono text-[11px] mt-0.5 bg-emerald-100/60 dark:bg-emerald-900/40 p-1.5 rounded">
              {notificationSentMessage}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              Per requirements, real external messaging is not triggered without a configured gateway.
            </span>
          </div>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Engagement Dispatch */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <BellRing className="w-4 h-4 text-rose-500" />
            Direct Mobilization & Reminders
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Donor preference: <strong className="text-slate-700 dark:text-slate-200 uppercase">{donor.preferences?.contactMethod || 'SMS'}</strong>. Reminders enabled.
          </p>

          <button
            onClick={handleSendSimulatedReminder}
            className="w-full py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Trigger Simulated Availability Notification
          </button>
        </div>

        {/* Appointment Scheduler */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Calendar className="w-4 h-4 text-sky-500" />
            Book Next Donation Slot
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Preferred Donation Station</label>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="Downtown Central Center">Downtown Central Blood Center</option>
              <option value="Uptown Medical Station">Uptown Medical Blood Station</option>
              <option value="Brooklyn Heights Mobile Bus">Brooklyn Heights Mobile Unit</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-400">
            Next available window: <strong className="text-slate-600 dark:text-slate-300">Tomorrow, 09:30 AM</strong>
          </div>
        </div>
      </div>

      {/* Donation History List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Donation Vitals & History Log
        </h4>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Packed Red Blood Cells (PRBC) - 1 Unit
              </div>
              <div className="text-[11px] text-slate-400">
                Date: {donor.lastDonationDate || '2026-08-10'} • Center: Downtown Central
              </div>
            </div>
            <div className="text-right text-[11px]">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Hb: 15.2 g/dL</span>
              <div className="text-slate-400">BP: 120/78 mmHg</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Whole Blood Donation - 1 Unit
              </div>
              <div className="text-[11px] text-slate-400">
                Date: 2026-05-14 • Center: Downtown Central
              </div>
            </div>
            <div className="text-right text-[11px]">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Hb: 14.8 g/dL</span>
              <div className="text-slate-400">BP: 118/76 mmHg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
