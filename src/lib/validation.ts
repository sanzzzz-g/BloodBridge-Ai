import { ALL_BLOOD_GROUPS, ALL_COMPONENTS, BloodGroup, ComponentType } from '../types/blood';
import { Donor } from '../types/donor';

export interface ValidationError {
  field: string;
  message: string;
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 compliant regex for standard email format
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Supports international formats, dashes, dots, spaces, e.g. +1 (555) 019-2834, +44 20 7946 0919, 555-123-4567
  const cleaned = phone.replace(/[\s().-]/g, '');
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(cleaned);
}

export function isValidBloodGroup(group: any): group is BloodGroup {
  return typeof group === 'string' && ALL_BLOOD_GROUPS.includes(group as BloodGroup);
}

export function isValidComponentType(component: any): component is ComponentType {
  return typeof component === 'string' && ALL_COMPONENTS.includes(component as ComponentType);
}

export interface DonorInput {
  nationalId: string;
  fullName: string;
  email: string;
  phone: string;
  bloodGroup: string;
  dateOfBirth?: string;
  gender?: string;
}

export function validateDonorInput(input: Partial<DonorInput>, existingDonors: Donor[] = [], excludeDonorId?: string): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  // Required Fields
  if (!input.fullName || !input.fullName.trim()) {
    errors.push({ field: 'fullName', message: 'Full name is required.' });
  } else if (input.fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters.' });
  }

  if (!input.nationalId || !input.nationalId.trim()) {
    errors.push({ field: 'nationalId', message: 'Donor National ID or Donor Card # is required.' });
  }

  if (!input.email || !input.email.trim()) {
    errors.push({ field: 'email', message: 'Email address is required.' });
  } else if (!isValidEmail(input.email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address (e.g. name@domain.com).' });
  }

  if (!input.phone || !input.phone.trim()) {
    errors.push({ field: 'phone', message: 'Phone number is required.' });
  } else if (!isValidPhone(input.phone)) {
    errors.push({ field: 'phone', message: 'Please provide a valid telephone number (7-15 digits).' });
  }

  if (!input.bloodGroup) {
    errors.push({ field: 'bloodGroup', message: 'Blood group selection is required.' });
  } else if (!isValidBloodGroup(input.bloodGroup)) {
    errors.push({ 
      field: 'bloodGroup', 
      message: `Invalid blood group '${input.bloodGroup}'. Supported groups: ${ALL_BLOOD_GROUPS.join(', ')}.` 
    });
  }

  // Duplicate checks against existing donors
  if (input.nationalId || input.email || input.phone) {
    for (const donor of existingDonors) {
      if (excludeDonorId && donor.id === excludeDonorId) continue;

      if (input.nationalId && donor.nationalId.toLowerCase() === input.nationalId.trim().toLowerCase()) {
        errors.push({
          field: 'nationalId',
          message: `A donor record with National ID '${input.nationalId}' already exists in the system (Duplicate detected).`
        });
      }
      if (input.email && donor.email.toLowerCase() === input.email.trim().toLowerCase()) {
        errors.push({
          field: 'email',
          message: `The email address '${input.email}' is already registered to donor '${donor.fullName}'.`
        });
      }
      if (input.phone) {
        const cleanExisting = donor.phone.replace(/[\s().-]/g, '');
        const cleanInput = input.phone.replace(/[\s().-]/g, '');
        if (cleanExisting === cleanInput) {
          errors.push({
            field: 'phone',
            message: `The phone number '${input.phone}' is already registered to donor '${donor.fullName}'.`
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRequestInput(input: {
  hospitalId?: string;
  bloodGroup?: string;
  componentType?: string;
  unitsRequested?: number;
  requiredByDate?: string;
  urgency?: string;
}): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!input.hospitalId) {
    errors.push({ field: 'hospitalId', message: 'Hospital selection is required.' });
  }

  if (!input.bloodGroup || !isValidBloodGroup(input.bloodGroup)) {
    errors.push({ field: 'bloodGroup', message: 'Valid recipient blood group is required.' });
  }

  if (!input.componentType || !isValidComponentType(input.componentType)) {
    errors.push({ field: 'componentType', message: 'Valid component type is required.' });
  }

  if (!input.unitsRequested || input.unitsRequested <= 0 || !Number.isInteger(input.unitsRequested)) {
    errors.push({ field: 'unitsRequested', message: 'Units requested must be a positive integer.' });
  }

  if (!input.requiredByDate) {
    errors.push({ field: 'requiredByDate', message: 'Required-by date is mandatory.' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
