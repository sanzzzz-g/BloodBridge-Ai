import { Donor } from '../types/donor';
import { InventoryBatch } from '../types/inventory';
import { Hospital } from '../types/hospital';
import { BloodRequest, AllocationItem } from '../types/request';
import { AuditLogEntry, AuditAction, UserRole, UserProfile } from '../types/audit';
import { 
  INITIAL_DONORS, 
  INITIAL_INVENTORY, 
  INITIAL_HOSPITALS, 
  INITIAL_REQUESTS, 
  INITIAL_AUDIT_LOGS, 
  DEMO_USERS 
} from './mockData';

const STORAGE_KEYS = {
  DONORS: 'bloodbridge_donors_v1',
  INVENTORY: 'bloodbridge_inventory_v1',
  HOSPITALS: 'bloodbridge_hospitals_v1',
  REQUESTS: 'bloodbridge_requests_v1',
  AUDIT_LOGS: 'bloodbridge_audit_logs_v1',
  CURRENT_USER: 'bloodbridge_current_user_v1',
  THEME: 'bloodbridge_theme_v1'
};

export class StorageService {
  // --- Current User ---
  static getCurrentUser(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEMO_USERS[0]; // Dr. Sarah Lin (Administrator) by default
  }

  static setCurrentUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  // --- Donors ---
  static getDonors(): Donor[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DONORS);
      if (stored) return JSON.parse(stored);
    } catch {}
    this.saveDonors(INITIAL_DONORS);
    return INITIAL_DONORS;
  }

  static saveDonors(donors: Donor[]): void {
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
  }

  // --- Inventory ---
  static getInventory(): InventoryBatch[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (stored) return JSON.parse(stored);
    } catch {}
    this.saveInventory(INITIAL_INVENTORY);
    return INITIAL_INVENTORY;
  }

  static saveInventory(inventory: InventoryBatch[]): void {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }

  // --- Hospitals ---
  static getHospitals(): Hospital[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
      if (stored) return JSON.parse(stored);
    } catch {}
    this.saveHospitals(INITIAL_HOSPITALS);
    return INITIAL_HOSPITALS;
  }

  static saveHospitals(hospitals: Hospital[]): void {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
  }

  // --- Requests ---
  static getRequests(): BloodRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (stored) return JSON.parse(stored);
    } catch {}
    this.saveRequests(INITIAL_REQUESTS);
    return INITIAL_REQUESTS;
  }

  static saveRequests(requests: BloodRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }

  // --- Audit Logs ---
  static getAuditLogs(): AuditLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (stored) return JSON.parse(stored);
    } catch {}
    this.saveAuditLogs(INITIAL_AUDIT_LOGS);
    return INITIAL_AUDIT_LOGS;
  }

  static saveAuditLogs(logs: AuditLogEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  static appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newEntry);
    this.saveAuditLogs(logs.slice(0, 500)); // Keep latest 500 records
    return newEntry;
  }

  // --- Theme ---
  static getTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    return 'light';
  }

  static setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  // --- Reset All to Initial Demo State ---
  static resetToDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(INITIAL_DONORS));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  }

  // --- Export Data to CSV ---
  static exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) return;

    // Flatten nested objects if necessary
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(field => {
          let val = row[field];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') val = JSON.stringify(val);
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
