import { BloodGroup, ComponentType } from './blood';

export type UrgencyLevel = 'STAT / Emergency' | 'Urgent (< 6 hrs)' | 'Routine Elective';

export type RequestStatus = 
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'rejected'
  | 'cancelled';

export interface AllocationItem {
  id: string;
  batchId: string;
  batchNumber: string;
  unitsAllocated: number;
  donorBloodGroup: BloodGroup;
  donorComponentType: ComponentType;
  expiryDate: string;
  selectionReason: string;
  allocatedAt: string;
  allocatedBy: string;
}

export interface BloodRequest {
  id: string;
  requestNumber: string; // e.g. REQ-2026-1042
  hospitalId: string;
  hospitalName: string;
  patientIdHash: string; // Anonymized patient ID (HIPAA/GDPR compliance)
  patientClinicalIndication: string;
  bloodGroup: BloodGroup;
  componentType: ComponentType;
  unitsRequested: number;
  unitsFulfilled: number;
  urgency: UrgencyLevel;
  requiredByDate: string; // ISO String
  status: RequestStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  specialRequirements?: string; // e.g., CMV negative, irradiated, leukoreduced
  allocations: AllocationItem[];
  createdAt: string;
  updatedAt: string;
}
