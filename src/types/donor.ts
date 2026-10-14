import { BloodGroup } from './blood';

export type DonorStatus = 'active' | 'inactive' | 'deferred';

export interface DonationHistoryItem {
  id: string;
  donorId: string;
  donationDate: string; // YYYY-MM-DD
  componentType: string;
  unitsCollected: number;
  location: string;
  hbLevel?: number; // Hemoglobin g/dL
  bloodPressure?: string;
  notes?: string;
}

export interface DonorScreeningChecklist {
  ageValid: boolean; // >= 18
  weightValid: boolean; // >= 50kg (110 lbs)
  recentTattooOrPiercing: boolean; // Last 3-6 months
  recentSurgeryOrIllness: boolean;
  currentMedications: boolean;
  travelToEndemicArea: boolean;
  hemoglobinVerified: boolean; // >= 12.5 g/dL (F) / 13.0 g/dL (M)
  consentSigned: boolean;
  notes?: string;
}

export interface DonorPreferences {
  contactMethod: 'email' | 'sms' | 'phone';
  remindersEnabled: boolean;
  emergencyAlertsEnabled: boolean;
  preferredCenter: string;
}

export interface Donor {
  id: string;
  nationalId: string; // Unique identifier (e.g. government ID or donor card number)
  fullName: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | 'undisclosed';
  status: DonorStatus;
  lastDonationDate: string | null; // YYYY-MM-DD
  totalDonations: number;
  eligibleFromDate: string | null; // Calculated cooldown date
  address?: string;
  city?: string;
  preferences: DonorPreferences;
  medicalScreening?: DonorScreeningChecklist;
  createdAt: string;
  updatedAt: string;
}
