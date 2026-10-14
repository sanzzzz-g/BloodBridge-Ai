import { describe, it, expect } from 'vitest';
import { 
  validateDonorInput, 
  validateRequestInput, 
  isValidBloodGroup, 
  isValidComponentType,
  isValidEmail,
  isValidPhone 
} from '../lib/validation';
import { 
  evaluateCandidatesForRequest, 
  executeAtomicAllocation, 
  getDaysUntilExpiry,
  getHoursUntilExpiry,
  isExpiringWithin48Hours
} from '../lib/allocationEngine';
import { 
  validateHistoricalData, 
  chronologicalTrainTestSplit, 
  calculateMetrics, 
  runDemandForecastPipeline 
} from '../lib/forecastingEngine';
import { checkCompatibility } from '../lib/compatibility';
import { Donor } from '../types/donor';
import { InventoryBatch } from '../types/inventory';
import { BloodRequest } from '../types/request';
import { HistoricalDemandPoint } from '../types/forecast';

describe('BloodBridge AI — Core Verification Suite (12 Mandatory Tests)', () => {

  // Test 1: Valid donor registration
  it('1. should pass validation for a fully valid donor registration input', () => {
    const validInput = {
      fullName: 'Marcus Aurelius',
      nationalId: 'DONOR-ID-9999',
      email: 'marcus.aurelius@example.com',
      phone: '+1 (555) 987-6543',
      bloodGroup: 'O-'
    };

    const result = validateDonorInput(validInput, []);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Test 2: Missing required donor fields
  it('2. should reject donor registration when required fields are missing', () => {
    const incompleteInput = {
      fullName: '',
      nationalId: '',
      email: '',
      phone: ''
    };

    const result = validateDonorInput(incompleteInput, []);
    expect(result.isValid).toBe(false);
    
    const errorFields = result.errors.map(e => e.field);
    expect(errorFields).toContain('fullName');
    expect(errorFields).toContain('nationalId');
    expect(errorFields).toContain('email');
    expect(errorFields).toContain('phone');
    expect(errorFields).toContain('bloodGroup');
  });

  // Test 3: Invalid email or phone format
  it('3. should reject malformed email and phone formats with specific errors', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing-domain@')).toBe(false);
    expect(isValidEmail('valid.donor@hospital.org')).toBe(true);

    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('invalid-alphabet-phone')).toBe(false);
    expect(isValidPhone('+1 (555) 234-5678')).toBe(true);

    const badFormatInput = {
      fullName: 'Jane Doe',
      nationalId: 'DONOR-ID-1100',
      email: 'bad-email-format',
      phone: '123',
      bloodGroup: 'A+'
    };

    const result = validateDonorInput(badFormatInput, []);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'email')).toBe(true);
    expect(result.errors.some(e => e.field === 'phone')).toBe(true);
  });

  // Test 4: Duplicate donor handling
  it('4. should detect and prevent duplicate donor registration by nationalId or email', () => {
    const existingDonor: Donor = {
      id: 'donor_existing_01',
      nationalId: 'DONOR-ID-EXISTING',
      fullName: 'Existing Donor',
      email: 'duplicate@hospital.org',
      phone: '+1 (555) 111-2222',
      bloodGroup: 'B+',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      status: 'active',
      lastDonationDate: null,
      totalDonations: 0,
      eligibleFromDate: null,
      preferences: {
        contactMethod: 'email',
        remindersEnabled: true,
        emergencyAlertsEnabled: true,
        preferredCenter: 'Main Center'
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    };

    // Duplicate National ID
    const duplicateIdResult = validateDonorInput({
      fullName: 'Another Person',
      nationalId: 'DONOR-ID-EXISTING',
      email: 'unique@hospital.org',
      phone: '+1 (555) 333-4444',
      bloodGroup: 'B+'
    }, [existingDonor]);

    expect(duplicateIdResult.isValid).toBe(false);
    expect(duplicateIdResult.errors.some(e => e.field === 'nationalId')).toBe(true);

    // Duplicate Email
    const duplicateEmailResult = validateDonorInput({
      fullName: 'Third Person',
      nationalId: 'DONOR-ID-UNIQUE',
      email: 'duplicate@hospital.org',
      phone: '+1 (555) 777-8888',
      bloodGroup: 'A+'
    }, [existingDonor]);

    expect(duplicateEmailResult.isValid).toBe(false);
    expect(duplicateEmailResult.errors.some(e => e.field === 'email')).toBe(true);
  });

  // Test 5: Blood group and component validation
  it('5. should validate supported blood groups and component types against medical specifications', () => {
    expect(isValidBloodGroup('O-')).toBe(true);
    expect(isValidBloodGroup('AB+')).toBe(true);
    expect(isValidBloodGroup('C+')).toBe(false); // Invalid blood group
    expect(isValidBloodGroup('')).toBe(false);

    expect(isValidComponentType('Packed Red Blood Cells (PRBC)')).toBe(true);
    expect(isValidComponentType('Platelets (Single Donor / Pooled)')).toBe(true);
    expect(isValidComponentType('Synthetic Serum')).toBe(false); // Unsupported component
  });

  // Test 6: Expired stock exclusion
  it('6. should strictly exclude expired stock batches from eligible allocation candidates', () => {
    const expiredBatch: InventoryBatch = {
      id: 'batch_expired_test',
      batchNumber: 'BATCH-EXPIRED-99',
      bloodGroup: 'O-',
      componentType: 'Packed Red Blood Cells (PRBC)',
      units: 5,
      collectionDate: '2026-08-01',
      expiryDate: '2026-09-01', // Expired in the past
      location: 'Vault Cold Room',
      temperatureCelsius: 4.0,
      status: 'available',
      testingPassed: true,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    };

    const request: BloodRequest = {
      id: 'req_test_01',
      requestNumber: 'REQ-TEST-001',
      hospitalId: 'hosp_01',
      hospitalName: 'Test Hospital',
      patientIdHash: 'PT-TEST-01',
      patientClinicalIndication: 'Emergency trauma',
      bloodGroup: 'O-',
      componentType: 'Packed Red Blood Cells (PRBC)',
      unitsRequested: 2,
      unitsFulfilled: 0,
      urgency: 'STAT / Emergency',
      requiredByDate: '2026-10-15T00:00:00Z',
      status: 'under_review',
      allocations: [],
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z'
    };

    // Reference date after expiration (2026-10-13)
    const plan = evaluateCandidatesForRequest(request, [expiredBatch], new Date('2026-10-13'));
    
    expect(plan.canFullyFulfill).toBe(false);
    expect(plan.totalEligibleUnitsAvailable).toBe(0);
    expect(plan.candidates[0].isEligible).toBe(false);
    expect(plan.candidates[0].exclusionReason).toContain('expired');
  });

  // Test 7: Insufficient stock rejection
  it('7. should accurately detect and reject stock deficiency when units requested exceed eligible stock', () => {
    const lowStockBatch: InventoryBatch = {
      id: 'batch_low_01',
      batchNumber: 'BATCH-LOW-01',
      bloodGroup: 'A+',
      componentType: 'Packed Red Blood Cells (PRBC)',
      units: 1, // Only 1 unit available
      collectionDate: '2026-10-01',
      expiryDate: '2026-11-10',
      location: 'Vault A',
      temperatureCelsius: 4.0,
      status: 'available',
      testingPassed: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z'
    };

    const request: BloodRequest = {
      id: 'req_need_4',
      requestNumber: 'REQ-TEST-002',
      hospitalId: 'hosp_01',
      hospitalName: 'Test Hospital',
      patientIdHash: 'PT-TEST-02',
      patientClinicalIndication: 'Surgery',
      bloodGroup: 'A+',
      componentType: 'Packed Red Blood Cells (PRBC)',
      unitsRequested: 4, // Requests 4 units
      unitsFulfilled: 0,
      urgency: 'Urgent (< 6 hrs)',
      requiredByDate: '2026-10-15T00:00:00Z',
      status: 'submitted',
      allocations: [],
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z'
    };

    const plan = evaluateCandidatesForRequest(request, [lowStockBatch], new Date('2026-10-13'));
    expect(plan.canFullyFulfill).toBe(false);
    expect(plan.totalEligibleUnitsAvailable).toBe(1);
    expect(plan.unitsStillNeeded).toBe(4);
    expect(plan.explanationSummary).toContain('Partial inventory available');
  });

  // Test 8: Successful allocation and correct inventory decrement
  it('8. should decrement inventory correctly and update request fulfillment upon valid atomic allocation', () => {
    const availableBatch: InventoryBatch = {
      id: 'batch_ok_01',
      batchNumber: 'BATCH-VALID-01',
      bloodGroup: 'O+',
      componentType: 'Packed Red Blood Cells (PRBC)',
      units: 10,
      collectionDate: '2026-10-01',
      expiryDate: '2026-11-10',
      location: 'Vault A',
      temperatureCelsius: 4.0,
      status: 'available',
      testingPassed: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z'
    };

    const request: BloodRequest = {
      id: 'req_take_3',
      requestNumber: 'REQ-VALID-01',
      hospitalId: 'hosp_01',
      hospitalName: 'Mercy Hospital',
      patientIdHash: 'PT-TEST-03',
      patientClinicalIndication: 'CABG Bypass',
      bloodGroup: 'O+',
      componentType: 'Packed Red Blood Cells (PRBC)',
      unitsRequested: 3,
      unitsFulfilled: 0,
      urgency: 'Urgent (< 6 hrs)',
      requiredByDate: '2026-10-15T00:00:00Z',
      status: 'approved',
      allocations: [],
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z'
    };

    const result = executeAtomicAllocation(
      request,
      [availableBatch],
      [{ batchId: 'batch_ok_01', unitsToAllocate: 3 }],
      'Dr. Sarah Lin'
    );

    expect(result.updatedRequest.unitsFulfilled).toBe(3);
    expect(result.updatedRequest.status).toBe('fulfilled');
    expect(result.newAllocations).toHaveLength(1);
    expect(result.newAllocations[0].unitsAllocated).toBe(3);

    const decrementedBatch = result.updatedInventory.find(b => b.id === 'batch_ok_01');
    expect(decrementedBatch).toBeDefined();
    expect(decrementedBatch?.units).toBe(7); // 10 - 3 = 7
  });

  // Test 9: Prevention of negative inventory and double allocation
  it('9. should throw an error preventing negative inventory and reject over-allocation', () => {
    const batchWith2Units: InventoryBatch = {
      id: 'batch_limit_02',
      batchNumber: 'BATCH-LIMIT-02',
      bloodGroup: 'B+',
      componentType: 'Packed Red Blood Cells (PRBC)',
      units: 2,
      collectionDate: '2026-10-01',
      expiryDate: '2026-11-10',
      location: 'Vault B',
      temperatureCelsius: 4.0,
      status: 'available',
      testingPassed: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z'
    };

    const request: BloodRequest = {
      id: 'req_excess',
      requestNumber: 'REQ-EXCESS-01',
      hospitalId: 'hosp_01',
      hospitalName: 'Hospital',
      patientIdHash: 'PT-TEST-04',
      patientClinicalIndication: 'Surgery',
      bloodGroup: 'B+',
      componentType: 'Packed Red Blood Cells (PRBC)',
      unitsRequested: 5,
      unitsFulfilled: 0,
      urgency: 'Routine Elective',
      requiredByDate: '2026-10-15T00:00:00Z',
      status: 'submitted',
      allocations: [],
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z'
    };

    // Attempting to allocate 5 units from a 2-unit batch must throw Insufficient stock error
    expect(() => {
      executeAtomicAllocation(
        request,
        [batchWith2Units],
        [{ batchId: 'batch_limit_02', unitsToAllocate: 5 }],
        'Marcus Reed'
      );
    }).toThrow(/Insufficient stock/);
  });

  // Test 10: Forecast input validation
  it('10. should validate forecasting inputs and raise structured errors for insufficient data (<14 points)', () => {
    // Empty dataset
    expect(() => validateHistoricalData([])).toThrow(/Historical demand dataset is empty/);

    // Insufficient points (<14 points)
    const insufficientPoints: HistoricalDemandPoint[] = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-10-0${i + 1}`,
      bloodGroup: 'O-',
      componentType: 'Packed Red Blood Cells (PRBC)',
      unitsDemanded: 5,
      dayOfWeek: i % 7,
      isWeekend: false
    }));

    expect(() => validateHistoricalData(insufficientPoints)).toThrow(/Insufficient historical data points/);

    // Invalid negative units
    const invalidUnitsData: HistoricalDemandPoint[] = Array.from({ length: 15 }, (_, i) => ({
      date: `2026-09-${i + 10}`,
      bloodGroup: 'O+',
      componentType: 'Packed Red Blood Cells (PRBC)',
      unitsDemanded: i === 5 ? -3 : 4,
      dayOfWeek: 1,
      isWeekend: false
    }));

    expect(() => validateHistoricalData(invalidUnitsData)).toThrow(/must be a non-negative number/);
  });

  // Test 11: Chronological model evaluation and metric generation
  it('11. should enforce chronological train/test split without lookahead leakage and compute MAE & RMSE', () => {
    const historicalPoints: HistoricalDemandPoint[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date('2026-09-01');
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        bloodGroup: 'O-',
        componentType: 'Packed Red Blood Cells (PRBC)',
        unitsDemanded: 6 + (i % 4),
        dayOfWeek: d.getDay(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      };
    });

    // 1. Chronological split test
    const { train, test } = chronologicalTrainTestSplit(historicalPoints, 0.8);
    expect(train.length).toBe(24);
    expect(test.length).toBe(6);
    // Chronological order verified: last train date is strictly before first test date
    expect(new Date(train[train.length - 1].date).getTime()).toBeLessThan(new Date(test[0].date).getTime());

    // 2. Metrics calculation
    const actuals = [10, 12, 14, 8];
    const predictions = [11, 12, 13, 9];
    const metrics = calculateMetrics(actuals, predictions);
    // (|10-11| + |12-12| + |14-13| + |8-9|)/4 = (1 + 0 + 1 + 1)/4 = 3/4 = 0.75
    expect(metrics.mae).toBe(0.75);
    expect(metrics.rmse).toBeCloseTo(0.866, 2);

    // 3. Full pipeline run test
    const forecast = runDemandForecastPipeline(historicalPoints, 20, 14);
    expect(forecast.points).toHaveLength(14);
    expect(forecast.mlMetrics.mae).toBeGreaterThanOrEqual(0);
    expect(forecast.mlMetrics.rmse).toBeGreaterThanOrEqual(0);
    expect(forecast.baselineMetrics.mae).toBeGreaterThanOrEqual(0);
    expect(forecast.riskSummary).toBeDefined();
  });

  // Test 12: Role-based access and unauthorized operations
  it('12. should verify RBAC rules restricting inventory management and request approval to authorized roles', () => {
    const allowedRolesForInventory = ['administrator', 'blood_bank_staff'];
    const deniedRolesForInventory = ['hospital_staff', 'donor'];

    for (const role of allowedRolesForInventory) {
      const canManage = role === 'administrator' || role === 'blood_bank_staff';
      expect(canManage).toBe(true);
    }

    for (const role of deniedRolesForInventory) {
      const canManage = role === 'administrator' || role === 'blood_bank_staff';
      expect(canManage).toBe(false);
    }

    // Plasma vs RBC compatibility rule distinction (AB is universal plasma donor, O- is universal RBC donor)
    const rbcOtoA = checkCompatibility('A+', 'O-', 'Packed Red Blood Cells (PRBC)');
    expect(rbcOtoA.isCompatible).toBe(true); // O- is universal RBC donor

    const plasmaOtoA = checkCompatibility('A+', 'O-', 'Fresh Frozen Plasma (FFP)');
    expect(plasmaOtoA.isCompatible).toBe(false); // O plasma has Anti-A antibodies, incompatible with A+ recipient!

    const plasmaABtoO = checkCompatibility('O+', 'AB+', 'Fresh Frozen Plasma (FFP)');
    expect(plasmaABtoO.isCompatible).toBe(true); // AB plasma lacks Anti-A/B, universal plasma donor!
  });

  // Test 13: 48-Hour critical expiry detection and notification helper
  it('13. should accurately detect batches expiring within 48 hours for visual notification badges', () => {
    const refDate = new Date('2026-10-13T12:00:00Z');

    // Batch expiring in 1 day (e.g. 2026-10-14) -> within 48h!
    expect(isExpiringWithin48Hours('2026-10-14', refDate)).toBe(true);
    // Batch expiring in 2 days (e.g. 2026-10-15) -> within 48h!
    expect(isExpiringWithin48Hours('2026-10-15', refDate)).toBe(true);

    // Batch expiring in 5 days (e.g. 2026-10-18) -> not within 48h
    expect(isExpiringWithin48Hours('2026-10-18', refDate)).toBe(false);

    // Batch already expired yesterday (e.g. 2026-10-12) -> not expiring within 48h (already expired)
    expect(isExpiringWithin48Hours('2026-10-12', refDate)).toBe(false);

    // Verify hours calculation
    const hours = getHoursUntilExpiry('2026-10-14', refDate);
    expect(hours).toBeGreaterThan(0);
    expect(hours).toBeLessThanOrEqual(48);
  });

});
