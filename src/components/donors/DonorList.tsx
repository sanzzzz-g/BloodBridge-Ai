import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  FileCheck, 
  HeartHandshake, 
  Eye, 
  EyeOff, 
  Edit3, 
  Power,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Donor } from '../../types/donor';
import { ALL_BLOOD_GROUPS, BloodGroup } from '../../types/blood';
import { Badge } from '../common/Badge';
import { DonorModal } from './DonorModal';
import { DonorScreeningModal } from './DonorScreeningModal';
import { DonorEngagementPanel } from './DonorEngagementPanel';
import { Modal } from '../common/Modal';

export const DonorList: React.FC = () => {
  const { donors, toggleDonorStatus } = useData();
  const { canManageDonors } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [maskPii, setMaskPii] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [donorToEdit, setDonorToEdit] = useState<Donor | null>(null);
  const [screeningDonor, setScreeningDonor] = useState<Donor | null>(null);
  const [engagementDonor, setEngagementDonor] = useState<Donor | null>(null);

  const filteredDonors = donors.filter(d => {
    const matchesSearch = 
      d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || d.bloodGroup === selectedGroup;
    const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const maskContact = (text: string, type: 'email' | 'phone') => {
    if (!maskPii) return text;
    if (type === 'email') {
      const [user, domain] = text.split('@');
      return `${user.slice(0, 2)}***@${domain || '***'}`;
    }
    return text.slice(0, 4) + '***' + text.slice(-3);
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Registered Donor Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Voluntary blood donor lifecycle, qualified pre-screening triage, and contact preference management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMaskPii(!maskPii)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Toggle PII Masking for HIPAA compliance demonstration"
          >
            {maskPii ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            {maskPii ? 'PII Masked' : 'Mask PII'}
          </button>

          {canManageDonors && (
            <button
              onClick={() => {
                setDonorToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register New Donor
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
            placeholder="Search by name, ID, phone, email, or blood group..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Blood Group Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Group:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Groups</option>
              {ALL_BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deferred">Deferred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Donor Profile</th>
                <th className="py-3 px-3">Blood Group</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3">Last Donation</th>
                <th className="py-3 px-3">Triage & Cooldown</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDonors.map((donor) => {
                const isUniversal = donor.bloodGroup === 'O-';
                return (
                  <tr key={donor.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isUniversal
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}>
                          {donor.bloodGroup}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {donor.fullName}
                            {isUniversal && (
                              <span className="text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-900">
                                Universal
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {donor.nationalId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {donor.bloodGroup}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div>{maskContact(donor.email, 'email')}</div>
                      <div className="text-[11px] text-slate-400">{maskContact(donor.phone, 'phone')}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {donor.lastDonationDate || 'First time donor'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {donor.totalDonations} total units
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() => setScreeningDonor(donor)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Qualified Triage
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <Badge variant={donor.status === 'active' ? 'emerald' : 'slate'} size="sm">
                        {donor.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEngagementDonor(donor)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                          title="Donor engagement & history"
                        >
                          <HeartHandshake className="w-4 h-4 text-rose-500" />
                        </button>

                        {canManageDonors && (
                          <>
                            <button
                              onClick={() => {
                                setDonorToEdit(donor);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                              title="Edit donor details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleDonorStatus(donor.id, donor.status === 'active' ? 'inactive' : 'active')}
                              className={`p-1.5 rounded-md transition cursor-pointer ${
                                donor.status === 'active' 
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40' 
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title={donor.status === 'active' ? 'Deactivate donor' : 'Reactivate donor'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDonors.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No donor records match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Donor Modal */}
      <DonorModal
        donorToEdit={donorToEdit}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setDonorToEdit(null);
        }}
      />

      {/* Screening Modal */}
      <DonorScreeningModal
        donor={screeningDonor}
        isOpen={!!screeningDonor}
        onClose={() => setScreeningDonor(null)}
      />

      {/* Engagement Panel Modal */}
      {engagementDonor && (
        <Modal
          isOpen={!!engagementDonor}
          onClose={() => setEngagementDonor(null)}
          title={`Donor Engagement & Cooldown: ${engagementDonor.fullName}`}
          subtitle={`National ID: ${engagementDonor.nationalId} • Blood Group: ${engagementDonor.bloodGroup}`}
          maxWidth="2xl"
        >
          <DonorEngagementPanel
            donor={engagementDonor}
            onClose={() => setEngagementDonor(null)}
          />
        </Modal>
      )}
    </div>
  );
};
