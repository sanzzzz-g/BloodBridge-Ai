import { BloodGroup, ComponentType } from './blood';

export type BatchStatus = 'available' | 'reserved' | 'quarantined' | 'expired' | 'allocated';

export interface InventoryBatch {
  id: string;
  batchNumber: string; // e.g. BATCH-2026-0891
  bloodGroup: BloodGroup;
  componentType: ComponentType;
  units: number; // Volume in standard units (e.g., 1 unit ~ 450-500ml)
  collectionDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  location: string; // e.g. "Main Vault - Refrigerator A2"
  temperatureCelsius: number;
  status: BatchStatus;
  donorId?: string;
  donorCode?: string;
  testingPassed: boolean; // Infectious disease marker clearance (HIV, Hepatitis B/C, Syphilis)
  crossmatchTag?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAuditRecord {
  id: string;
  batchId: string;
  action: 'intake' | 'allocation' | 'disposal' | 'transfer' | 'quarantine' | 'manual_adjustment';
  unitsChanged: number;
  unitsAfter: number;
  reason: string;
  performedBy: string;
  timestamp: string;
}
