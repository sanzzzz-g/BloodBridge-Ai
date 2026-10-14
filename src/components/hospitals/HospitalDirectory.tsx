import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  PlusCircle, 
  Activity,
  User
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface HospitalDirectoryProps {
  onOpenCreateRequest: () => void;
}

export const HospitalDirectory: React.FC<HospitalDirectoryProps> = ({ onOpenCreateRequest }) => {
  const { hospitals, requests } = useData();
  const { canSubmitHospitalRequest } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.tier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Hospital Network & Trauma Centers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified healthcare facilities authorized to submit transfusion requisitions under state license.
          </p>
        </div>

        {canSubmitHospitalRequest && (
          <button
            onClick={onOpenCreateRequest}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Submit Transfusion Order
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search hospitals by name, city, trauma tier, or license..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Grid of Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHospitals.map((hosp) => {
          const activeHospitalRequests = requests.filter(
            r => r.hospitalId === hosp.id && (r.status === 'submitted' || r.status === 'under_review' || r.status === 'approved')
          );

          return (
            <div 
              key={hosp.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {hosp.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={hosp.tier.includes('Level 1') ? 'red' : 'purple'} size="sm">
                        {hosp.tier}
                      </Badge>
                      <span className="font-mono text-[11px] text-slate-400">
                        {hosp.licenseNumber}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{hosp.address}, {hosp.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-mono font-medium">{hosp.emergencyPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{hosp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Director: <strong>{hosp.bloodBankDirector}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="text-slate-500 dark:text-slate-400">
                  Monthly Volume: <strong className="text-slate-800 dark:text-slate-200">{hosp.monthlyAverageUnits} units</strong>
                </div>

                <div className="font-semibold text-rose-600 dark:text-rose-400">
                  {activeHospitalRequests.length} Active {activeHospitalRequests.length === 1 ? 'Order' : 'Orders'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
