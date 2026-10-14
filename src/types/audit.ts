export type UserRole = 'administrator' | 'blood_bank_staff' | 'hospital_staff' | 'donor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  organization: string; // e.g. "Metropolitan Central Blood Center" or "Mercy General Hospital"
  avatarUrl?: string;
  hospitalId?: string; // If role is hospital_staff
  donorId?: string; // If role is donor
}

export type AuditAction = 
  | 'DONOR_CREATED'
  | 'DONOR_UPDATED'
  | 'DONOR_STATUS_CHANGED'
  | 'BATCH_INTAKE'
  | 'BATCH_QUARANTINED'
  | 'BATCH_EXPIRED'
  | 'REQUEST_SUBMITTED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_ALLOCATED'
  | 'REQUEST_REJECTED'
  | 'STOCK_ADJUSTED'
  | 'DONATION_RECORDED'
  | 'SETTINGS_UPDATED';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  entityType: 'donor' | 'inventory_batch' | 'blood_request' | 'hospital' | 'system';
  entityId: string;
  entityReference: string; // e.g. "REQ-2026-1042" or "BATCH-2026-0891"
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}
