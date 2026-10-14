import { BloodRequest, AllocationItem } from '../types/request';
import { InventoryBatch } from '../types/inventory';
import { checkCompatibility, CompatibilityCheckResult } from './compatibility';

export interface CandidateBatchEvaluation {
  batch: InventoryBatch;
  isEligible: boolean;
  exclusionReason: string | null;
  selectionScore: number;
  daysToExpiry: number;
  compatibility: CompatibilityCheckResult;
  recommendedUnitsToTake: number;
  explanation: string;
}

export interface SmartAllocationPlan {
  requestId: string;
  unitsRequested: number;
  unitsFulfilledCurrently: number;
  unitsStillNeeded: number;
  canFullyFulfill: boolean;
  totalEligibleUnitsAvailable: number;
  candidates: CandidateBatchEvaluation[];
  recommendedBatches: CandidateBatchEvaluation[];
  suggestedAllocations: {
    batchId: string;
    unitsToAllocate: number;
  }[];
  explanationSummary: string;
}

/**
 * Calculates days remaining until expiration.
 * Negative number means already expired.
 */
export function getDaysUntilExpiry(expiryDateStr: string, referenceDate: Date = new Date()): number {
  const expiry = new Date(expiryDateStr);
  const diffTime = expiry.getTime() - referenceDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates all inventory batches for a given blood request.
 * Implements FEFO (First-Expired, First-Out) with exact ABO match prioritization.
 */
export function evaluateCandidatesForRequest(
  request: BloodRequest,
  inventory: InventoryBatch[],
  referenceDate: Date = new Date()
): SmartAllocationPlan {
  const unitsNeeded = Math.max(0, request.unitsRequested - request.unitsFulfilled);
  const candidates: CandidateBatchEvaluation[] = [];

  for (const batch of inventory) {
    const daysToExpiry = getDaysUntilExpiry(batch.expiryDate, referenceDate);
    const compat = checkCompatibility(request.bloodGroup, batch.bloodGroup, request.componentType);

    let isEligible = true;
    let exclusionReason: string | null = null;

    // Check component type match
    if (batch.componentType !== request.componentType) {
      isEligible = false;
      exclusionReason = `Component mismatch (Batch is ${batch.componentType}, requested ${request.componentType})`;
    }
    // Check batch status
    else if (batch.status !== 'available') {
      isEligible = false;
      exclusionReason = `Batch status is '${batch.status}' (not available for allocation)`;
    }
    // Check available units
    else if (batch.units <= 0) {
      isEligible = false;
      exclusionReason = 'Zero units remaining in batch';
    }
    // Check expiration: strictly exclude expired units
    else if (daysToExpiry <= 0) {
      isEligible = false;
      exclusionReason = `Batch expired on ${batch.expiryDate} (${Math.abs(daysToExpiry)} days ago)`;
    }
    // Check safety testing
    else if (!batch.testingPassed) {
      isEligible = false;
      exclusionReason = 'Infectious disease marker clearance pending (HIV/HCV/HBV)';
    }
    // Check compatibility
    else if (!compat.isCompatible) {
      isEligible = false;
      exclusionReason = compat.clinicalRationale;
    }

    // Scoring calculation for eligible batches:
    // 1. FEFO (Earliest expiry gets highest bonus): max 1000 points - (daysToExpiry * 10)
    // 2. Exact match bonus: +100 points (prevents burning rare universal O- on A+ patients)
    // 3. Location / freshness factor
    let score = 0;
    let explanation = '';

    if (isEligible) {
      const fefoScore = Math.max(10, 500 - daysToExpiry * 5);
      const exactBonus = compat.isExactMatch ? 150 : 50;
      score = fefoScore + exactBonus;

      explanation = `Eligible: ${daysToExpiry}d to expiry (FEFO rank bonus). ${
        compat.isExactMatch ? 'Exact ABO match' : 'Compatible alternative'
      }. Passed viral screening.`;
    } else {
      explanation = `Excluded: ${exclusionReason}`;
    }

    candidates.push({
      batch,
      isEligible,
      exclusionReason,
      selectionScore: score,
      daysToExpiry,
      compatibility: compat,
      recommendedUnitsToTake: 0,
      explanation
    });
  }

  // Sort candidates:
  // Eligible first, then highest score (FEFO earliest expiry + exact match), then fewest days to expiry
  candidates.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    if (a.isEligible && b.isEligible) {
      // Primary: daysToExpiry ascending (FEFO)
      if (a.daysToExpiry !== b.daysToExpiry) {
        return a.daysToExpiry - b.daysToExpiry;
      }
      // Secondary: score descending (exact match preference)
      return b.selectionScore - a.selectionScore;
    }
    return 0;
  });

  // Calculate allocation recommendations up to unitsNeeded
  let remainingUnitsNeeded = unitsNeeded;
  let totalEligibleUnits = 0;
  const recommendedBatches: CandidateBatchEvaluation[] = [];
  const suggestedAllocations: { batchId: string; unitsToAllocate: number }[] = [];

  for (const candidate of candidates) {
    if (candidate.isEligible) {
      totalEligibleUnits += candidate.batch.units;

      if (remainingUnitsNeeded > 0) {
        const unitsToTake = Math.min(candidate.batch.units, remainingUnitsNeeded);
        candidate.recommendedUnitsToTake = unitsToTake;
        remainingUnitsNeeded -= unitsToTake;
        recommendedBatches.push(candidate);
        suggestedAllocations.push({
          batchId: candidate.batch.id,
          unitsToAllocate: unitsToTake
        });
      }
    }
  }

  const canFullyFulfill = remainingUnitsNeeded === 0;

  let explanationSummary = '';
  if (totalEligibleUnits === 0) {
    explanationSummary = `No eligible stock found for ${request.bloodGroup} ${request.componentType}. All current units are either expired, quarantined, or incompatible.`;
  } else if (!canFullyFulfill) {
    explanationSummary = `Partial inventory available: Found ${totalEligibleUnits} eligible units, but request requires ${unitsNeeded} units (${remainingUnitsNeeded} deficit).`;
  } else {
    explanationSummary = `Fully fulfillable with ${recommendedBatches.length} batch(es) selected via First-Expired First-Out (FEFO) protocol, prioritizing earliest safe expiry dates.`;
  }

  return {
    requestId: request.id,
    unitsRequested: request.unitsRequested,
    unitsFulfilledCurrently: request.unitsFulfilled,
    unitsStillNeeded: unitsNeeded,
    canFullyFulfill,
    totalEligibleUnitsAvailable: totalEligibleUnits,
    candidates,
    recommendedBatches,
    suggestedAllocations,
    explanationSummary
  };
}

/**
 * Execute atomic allocation against local state.
 * Validates stock availability, decrements inventory, creates allocations, updates request status.
 * Throws structured error if validation fails (preventing negative inventory or double allocation).
 */
export function executeAtomicAllocation(
  request: BloodRequest,
  inventory: InventoryBatch[],
  allocationsToExecute: { batchId: string; unitsToAllocate: number }[],
  allocatedBy: string
): {
  updatedRequest: BloodRequest;
  updatedInventory: InventoryBatch[];
  newAllocations: AllocationItem[];
} {
  if (allocationsToExecute.length === 0) {
    throw new Error('Allocation error: No batches selected for allocation.');
  }

  if (request.status === 'fulfilled' || request.status === 'cancelled' || request.status === 'rejected') {
    throw new Error(`Cannot allocate to request in status '${request.status}'.`);
  }

  const inventoryMap = new Map<string, InventoryBatch>(inventory.map(b => [b.id, { ...b }]));
  const createdAllocations: AllocationItem[] = [];
  let totalNewUnits = 0;

  for (const item of allocationsToExecute) {
    const batch = inventoryMap.get(item.batchId);
    if (!batch) {
      throw new Error(`Allocation error: Batch ID ${item.batchId} not found in inventory.`);
    }

    if (item.unitsToAllocate <= 0) {
      throw new Error(`Invalid allocation quantity: ${item.unitsToAllocate} units for batch ${batch.batchNumber}.`);
    }

    if (batch.status !== 'available') {
      throw new Error(`Batch ${batch.batchNumber} is not available (current status: ${batch.status}).`);
    }

    // Expiry check
    const daysLeft = getDaysUntilExpiry(batch.expiryDate);
    if (daysLeft <= 0) {
      throw new Error(`Safety violation: Cannot allocate expired batch ${batch.batchNumber} (expired ${batch.expiryDate}).`);
    }

    // Negative inventory prevention
    if (batch.units < item.unitsToAllocate) {
      throw new Error(
        `Insufficient stock: Batch ${batch.batchNumber} has only ${batch.units} units available, cannot allocate ${item.unitsToAllocate} units.`
      );
    }

    // Compatibility check
    const compat = checkCompatibility(request.bloodGroup, batch.bloodGroup, request.componentType);
    if (!compat.isCompatible) {
      throw new Error(`Incompatible allocation: Batch ${batch.bloodGroup} cannot be assigned to recipient ${request.bloodGroup} for ${request.componentType}.`);
    }

    // Decrement stock atomically
    batch.units -= item.unitsToAllocate;
    if (batch.units === 0) {
      batch.status = 'allocated';
    }
    batch.updatedAt = new Date().toISOString();

    const allocationItem: AllocationItem = {
      id: `alloc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      unitsAllocated: item.unitsToAllocate,
      donorBloodGroup: batch.bloodGroup,
      donorComponentType: batch.componentType,
      expiryDate: batch.expiryDate,
      selectionReason: `FEFO allocation: Expiry ${batch.expiryDate} (${daysLeft}d left). ${compat.clinicalRationale}`,
      allocatedAt: new Date().toISOString(),
      allocatedBy
    };

    createdAllocations.push(allocationItem);
    totalNewUnits += item.unitsToAllocate;
  }

  const newFulfilledCount = request.unitsFulfilled + totalNewUnits;
  let newStatus = request.status;
  if (newFulfilledCount >= request.unitsRequested) {
    newStatus = 'fulfilled';
  } else if (newFulfilledCount > 0) {
    newStatus = 'partially_fulfilled';
  }

  const updatedRequest: BloodRequest = {
    ...request,
    unitsFulfilled: newFulfilledCount,
    status: newStatus,
    allocations: [...request.allocations, ...createdAllocations],
    updatedAt: new Date().toISOString()
  };

  const updatedInventory = Array.from(inventoryMap.values());

  return {
    updatedRequest,
    updatedInventory,
    newAllocations: createdAllocations
  };
}
