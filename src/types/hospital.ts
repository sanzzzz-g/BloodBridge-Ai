export type HospitalTier = 'Level 1 Trauma' | 'Level 2 Trauma' | 'Regional General' | 'Childrens Hospital' | 'Specialty Clinic';

export interface Hospital {
  id: string;
  name: string;
  licenseNumber: string;
  tier: HospitalTier;
  address: string;
  city: string;
  emergencyPhone: string;
  email: string;
  bloodBankDirector: string;
  activeRequestsCount: number;
  monthlyAverageUnits: number;
  isVerified: boolean;
  createdAt: string;
}
