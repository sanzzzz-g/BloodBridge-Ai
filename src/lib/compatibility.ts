import { BloodGroup, ComponentType } from '../types/blood';

/**
 * Component-specific compatibility evaluation.
 * Note: Clinical transfusion requires laboratory crossmatch and qualified signoff.
 */

// RBC & Whole Blood: Recipient -> Compatible Donor Blood Groups
const RBC_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

// Plasma (FFP & Cryo): Recipient -> Compatible Donor Blood Groups (Reverse of RBC)
// AB is universal plasma donor because AB plasma lacks Anti-A and Anti-B antibodies!
const PLASMA_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // O recipient has no A or B antigens on RBCs
  'O+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A-', 'A+', 'AB-', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B-', 'B+', 'AB-', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB-', 'AB+']
};

// Platelets Compatibility: ABO identical strongly preferred, followed by compatible plasma/antigen profiles
const PLATELET_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
  'A-': ['A-', 'A+', 'AB-', 'AB+', 'O-', 'O+'],
  'A+': ['A+', 'A-', 'AB+', 'AB-', 'O+', 'O-'],
  'B-': ['B-', 'B+', 'AB-', 'AB+', 'O-', 'O+'],
  'B+': ['B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'AB+', 'A-', 'A+', 'B-', 'B+', 'O-', 'O+'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
};

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  isExactMatch: boolean;
  priorityScore: number; // Higher is better (exact match > compatible > incompatible)
  clinicalRationale: string;
}

export function checkCompatibility(
  recipientBloodGroup: BloodGroup,
  donorBloodGroup: BloodGroup,
  component: ComponentType
): CompatibilityCheckResult {
  const isExact = recipientBloodGroup === donorBloodGroup;

  let compatibleDonors: BloodGroup[] = [];

  switch (component) {
    case 'Packed Red Blood Cells (PRBC)':
    case 'Whole Blood':
      compatibleDonors = RBC_COMPATIBILITY[recipientBloodGroup] || [];
      break;
    case 'Fresh Frozen Plasma (FFP)':
    case 'Cryoprecipitate':
      compatibleDonors = PLASMA_COMPATIBILITY[recipientBloodGroup] || [];
      break;
    case 'Platelets (Single Donor / Pooled)':
      compatibleDonors = PLATELET_COMPATIBILITY[recipientBloodGroup] || [];
      break;
    default:
      compatibleDonors = RBC_COMPATIBILITY[recipientBloodGroup] || [];
  }

  const isCompatible = compatibleDonors.includes(donorBloodGroup);

  if (!isCompatible) {
    return {
      isCompatible: false,
      isExactMatch: false,
      priorityScore: 0,
      clinicalRationale: `Incompatible: Donor ${donorBloodGroup} possesses antibodies or antigens reactive with Recipient ${recipientBloodGroup} for ${component}. Risk of acute hemolytic transfusion reaction.`
    };
  }

  if (isExact) {
    return {
      isCompatible: true,
      isExactMatch: true,
      priorityScore: 100,
      clinicalRationale: `Optimal: Exact ABO/Rh identical match (${recipientBloodGroup} to ${donorBloodGroup}). Preserves specialty universal donor inventory.`
    };
  }

  // Compatible alternative (e.g. O- RBC to A+ recipient, or AB FFP to O recipient)
  const isUniversalDonorRole = 
    (component.includes('Red') && donorBloodGroup === 'O-') ||
    (component.includes('Plasma') && donorBloodGroup.startsWith('AB'));

  return {
    isCompatible: true,
    isExactMatch: false,
    priorityScore: isUniversalDonorRole ? 80 : 70,
    clinicalRationale: `Clinically Compatible Alternative: Donor ${donorBloodGroup} unit is safe for Recipient ${recipientBloodGroup} under ${component} antibody-antigen protocol.`
  };
}

export function getCompatibleDonorGroups(
  recipientBloodGroup: BloodGroup,
  component: ComponentType
): BloodGroup[] {
  switch (component) {
    case 'Packed Red Blood Cells (PRBC)':
    case 'Whole Blood':
      return RBC_COMPATIBILITY[recipientBloodGroup] || [];
    case 'Fresh Frozen Plasma (FFP)':
    case 'Cryoprecipitate':
      return PLASMA_COMPATIBILITY[recipientBloodGroup] || [];
    case 'Platelets (Single Donor / Pooled)':
      return PLATELET_COMPATIBILITY[recipientBloodGroup] || [];
    default:
      return RBC_COMPATIBILITY[recipientBloodGroup] || [];
  }
}
