import React, { createContext, useContext, useState, useMemo } from 'react';
import { Donor } from '../types/donor';
import { InventoryBatch } from '../types/inventory';
import { Hospital } from '../types/hospital';
import { BloodRequest } from '../types/request';
import { AuditLogEntry, AuditAction } from '../types/audit';
import { StorageService } from '../lib/storage';
import { useAuth } from './AuthContext';
import { executeAtomicAllocation, getDaysUntilExpiry } from '../lib/allocationEngine';
import { COMPONENT_SPECS, ComponentType, BloodGroup } from '../types/blood';
import { validateDonorInput, validateRequestInput } from '../lib/validation';

interface DataContextType {
  donors: Donor[];
  inventory: InventoryBatch[];
  hospitals: Hospital[];
  requests: BloodRequest[];
  auditLogs: AuditLogEntry[];
  
  // Computed alerts
  nearExpiryBatches: InventoryBatch[];
  expiredBatches: InventoryBatch[];
  urgentRequests: BloodRequest[];
  totalAvailableUnits: number;
  availableUnitsByGroup: Record<BloodGroup, number>;
  availableUnitsByComponent: Record<ComponentType, number>;

  // Actions
  addDonor: (donorData: Omit<Donor, 'id' | 'createdAt' | 'updatedAt' | 'totalDonations'>) => { success: boolean; error?: string };
  updateDonor: (id: string, updates: Partial<Donor>) => { success: boolean; error?: string };
  toggleDonorStatus: (id: string, newStatus: 'active' | 'inactive') => void;
  
  addInventoryBatch: (batchData: Omit<InventoryBatch, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  updateBatchStatus: (id: string, status: InventoryBatch['status'], reason: string) => void;
  
  createRequest: (requestData: Omit<BloodRequest, 'id' | 'requestNumber' | 'unitsFulfilled' | 'status' | 'allocations' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string; request?: BloodRequest };
  updateRequestStatus: (id: string, status: BloodRequest['status'], reason?: string) => void;
  fulfillRequestAllocation: (requestId: string, batchAllocations: { batchId: string; unitsToAllocate: number }[]) => { success: boolean; error?: string };
  
  resetAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [donors, setDonors] = useState<Donor[]>(() => StorageService.getDonors());
  const [inventory, setInventory] = useState<InventoryBatch[]>(() => StorageService.getInventory());
  const [hospitals, setHospitals] = useState<Hospital[]>(() => StorageService.getHospitals());
  const [requests, setRequests] = useState<BloodRequest[]>(() => StorageService.getRequests());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => StorageService.getAuditLogs());

  const logAudit = (action: AuditAction, entityType: any, entityId: string, entityRef: string, details: string, metadata?: any) => {
    const entry = StorageService.appendAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      entityType,
      entityId,
      entityReference: entityRef,
      details,
      metadata
    });
    setAuditLogs(StorageService.getAuditLogs());
    return entry;
  };

  // Donor operations
  const addDonor = (donorData: Omit<Donor, 'id' | 'createdAt' | 'updatedAt' | 'totalDonations'>) => {
    const validation = validateDonorInput(donorData, donors);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.map(e => e.message).join(' ') };
    }

    const newDonor: Donor = {
      ...donorData,
      id: `donor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      totalDonations: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newDonor, ...donors];
    setDonors(updated);
    StorageService.saveDonors(updated);

    logAudit('DONOR_CREATED', 'donor', newDonor.id, `${newDonor.fullName} (${newDonor.nationalId})`, 
      `Registered new ${newDonor.bloodGroup} donor with qualified screening verification.`);

    return { success: true };
  };

  const updateDonor = (id: string, updates: Partial<Donor>) => {
    const validation = validateDonorInput(updates, donors, id);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.map(e => e.message).join(' ') };
    }

    const updated = donors.map(d => {
      if (d.id === id) {
        return { ...d, ...updates, updatedAt: new Date().toISOString() };
      }
      return d;
    });

    setDonors(updated);
    StorageService.saveDonors(updated);

    const d = updated.find(x => x.id === id);
    if (d) {
      logAudit('DONOR_UPDATED', 'donor', d.id, d.fullName, `Updated donor record.`);
    }

    return { success: true };
  };

  const toggleDonorStatus = (id: string, newStatus: 'active' | 'inactive') => {
    const updated = donors.map(d => {
      if (d.id === id) {
        return { ...d, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return d;
    });
    setDonors(updated);
    StorageService.saveDonors(updated);

    const d = updated.find(x => x.id === id);
    if (d) {
      logAudit('DONOR_STATUS_CHANGED', 'donor', d.id, d.fullName, `Changed donor status to ${newStatus}.`);
    }
  };

  // Inventory operations
  const addInventoryBatch = (batchData: Omit<InventoryBatch, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (batchData.units <= 0) {
      return { success: false, error: 'Units must be greater than zero.' };
    }

    const newBatch: InventoryBatch = {
      ...batchData,
      id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newBatch, ...inventory];
    setInventory(updated);
    StorageService.saveInventory(updated);

    logAudit('BATCH_INTAKE', 'inventory_batch', newBatch.id, newBatch.batchNumber,
      `Intake recorded: ${newBatch.units} units of ${newBatch.bloodGroup} ${newBatch.componentType}. Expiry: ${newBatch.expiryDate}.`);

    return { success: true };
  };

  const updateBatchStatus = (id: string, status: InventoryBatch['status'], reason: string) => {
    const updated = inventory.map(b => {
      if (b.id === id) {
        return { ...b, status, notes: `${b.notes ? b.notes + ' | ' : ''}Status update: ${reason}`, updatedAt: new Date().toISOString() };
      }
      return b;
    });
    setInventory(updated);
    StorageService.saveInventory(updated);

    const b = updated.find(x => x.id === id);
    if (b) {
      const action: AuditAction = status === 'quarantined' ? 'BATCH_QUARANTINED' : status === 'expired' ? 'BATCH_EXPIRED' : 'STOCK_ADJUSTED';
      logAudit(action, 'inventory_batch', b.id, b.batchNumber, `Status set to '${status}': ${reason}`);
    }
  };

  // Blood Request operations
  const createRequest = (requestData: Omit<BloodRequest, 'id' | 'requestNumber' | 'unitsFulfilled' | 'status' | 'allocations' | 'createdAt' | 'updatedAt'>) => {
    const validation = validateRequestInput(requestData);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.map(e => e.message).join(' ') };
    }

    const reqNum = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: BloodRequest = {
      ...requestData,
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      requestNumber: reqNum,
      unitsFulfilled: 0,
      status: requestData.urgency.startsWith('STAT') ? 'under_review' : 'submitted',
      allocations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newRequest, ...requests];
    setRequests(updated);
    StorageService.saveRequests(updated);

    logAudit('REQUEST_SUBMITTED', 'blood_request', newRequest.id, newRequest.requestNumber,
      `Submitted ${newRequest.urgency} request from ${newRequest.hospitalName} for ${newRequest.unitsRequested} units of ${newRequest.bloodGroup} ${newRequest.componentType}.`);

    return { success: true, request: newRequest };
  };

  const updateRequestStatus = (id: string, status: BloodRequest['status'], reason?: string) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          rejectionReason: status === 'rejected' ? reason : r.rejectionReason,
          cancellationReason: status === 'cancelled' ? reason : r.cancellationReason,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    setRequests(updated);
    StorageService.saveRequests(updated);

    const r = updated.find(x => x.id === id);
    if (r) {
      const action: AuditAction = status === 'approved' ? 'REQUEST_APPROVED' : status === 'rejected' ? 'REQUEST_REJECTED' : 'STOCK_ADJUSTED';
      logAudit(action, 'blood_request', r.id, r.requestNumber, `Status updated to '${status}'. ${reason ? 'Reason: ' + reason : ''}`);
    }
  };

  // Atomic Allocation Execution
  const fulfillRequestAllocation = (requestId: string, batchAllocations: { batchId: string; unitsToAllocate: number }[]) => {
    const targetRequest = requests.find(r => r.id === requestId);
    if (!targetRequest) {
      return { success: false, error: `Request ID ${requestId} not found.` };
    }

    try {
      // Execute strict atomic allocation with negative stock and expiry safeguards
      const result = executeAtomicAllocation(
        targetRequest,
        inventory,
        batchAllocations,
        currentUser.name
      );

      // Update state atomically
      const updatedRequests = requests.map(r => r.id === requestId ? result.updatedRequest : r);
      setRequests(updatedRequests);
      StorageService.saveRequests(updatedRequests);

      setInventory(result.updatedInventory);
      StorageService.saveInventory(result.updatedInventory);

      // Log audit
      const totalUnits = result.newAllocations.reduce((sum, a) => sum + a.unitsAllocated, 0);
      logAudit('REQUEST_ALLOCATED', 'blood_request', targetRequest.id, targetRequest.requestNumber,
        `Allocated ${totalUnits} unit(s) via FEFO protocol. Request status: ${result.updatedRequest.status}.`,
        { allocations: result.newAllocations }
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Atomic allocation failed.' };
    }
  };

  const resetAllData = () => {
    StorageService.resetToDemoData();
    setDonors(StorageService.getDonors());
    setInventory(StorageService.getInventory());
    setHospitals(StorageService.getHospitals());
    setRequests(StorageService.getRequests());
    setAuditLogs(StorageService.getAuditLogs());
  };

  // Computed metrics
  const nearExpiryBatches = useMemo(() => {
    return inventory.filter(b => {
      if (b.status !== 'available') return false;
      const days = getDaysUntilExpiry(b.expiryDate);
      return days > 0 && days <= 5; // Near expiry: 5 days or fewer
    });
  }, [inventory]);

  const expiredBatches = useMemo(() => {
    return inventory.filter(b => {
      const days = getDaysUntilExpiry(b.expiryDate);
      return days <= 0 || b.status === 'expired';
    });
  }, [inventory]);

  const urgentRequests = useMemo(() => {
    return requests.filter(r => 
      (r.status === 'submitted' || r.status === 'under_review' || r.status === 'approved' || r.status === 'partially_fulfilled') &&
      (r.urgency.includes('STAT') || r.urgency.includes('Urgent'))
    );
  }, [requests]);

  const totalAvailableUnits = useMemo(() => {
    return inventory
      .filter(b => b.status === 'available' && getDaysUntilExpiry(b.expiryDate) > 0)
      .reduce((sum, b) => sum + b.units, 0);
  }, [inventory]);

  const availableUnitsByGroup = useMemo(() => {
    const acc: Record<BloodGroup, number> = {
      'O-': 0, 'O+': 0, 'A-': 0, 'A+': 0, 'B-': 0, 'B+': 0, 'AB-': 0, 'AB+': 0
    };
    for (const b of inventory) {
      if (b.status === 'available' && getDaysUntilExpiry(b.expiryDate) > 0) {
        acc[b.bloodGroup] = (acc[b.bloodGroup] || 0) + b.units;
      }
    }
    return acc;
  }, [inventory]);

  const availableUnitsByComponent = useMemo(() => {
    const acc: Record<ComponentType, number> = {
      'Packed Red Blood Cells (PRBC)': 0,
      'Platelets (Single Donor / Pooled)': 0,
      'Fresh Frozen Plasma (FFP)': 0,
      'Whole Blood': 0,
      'Cryoprecipitate': 0
    };
    for (const b of inventory) {
      if (b.status === 'available' && getDaysUntilExpiry(b.expiryDate) > 0) {
        acc[b.componentType] = (acc[b.componentType] || 0) + b.units;
      }
    }
    return acc;
  }, [inventory]);

  return (
    <DataContext.Provider
      value={{
        donors,
        inventory,
        hospitals,
        requests,
        auditLogs,
        nearExpiryBatches,
        expiredBatches,
        urgentRequests,
        totalAvailableUnits,
        availableUnitsByGroup,
        availableUnitsByComponent,
        addDonor,
        updateDonor,
        toggleDonorStatus,
        addInventoryBatch,
        updateBatchStatus,
        createRequest,
        updateRequestStatus,
        fulfillRequestAllocation,
        resetAllData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
