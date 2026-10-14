import { BloodGroup, ComponentType, COMPONENT_SPECS } from '../types/blood';
import { Donor } from '../types/donor';
import { InventoryBatch } from '../types/inventory';
import { Hospital } from '../types/hospital';
import { BloodRequest } from '../types/request';
import { AuditLogEntry, UserProfile } from '../types/audit';
import { HistoricalDemandPoint } from '../types/forecast';

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user_admin_01',
    name: 'Dr. Sarah Lin, MD, FCAP',
    email: 'sarah.lin@bloodbridge.org',
    role: 'administrator',
    title: 'Medical Director & Chief of Transfusion Medicine',
    organization: 'Metropolitan Blood Intelligence Center',
  },
  {
    id: 'user_staff_01',
    name: 'Marcus Reed, MLS (ASCP)',
    email: 'marcus.reed@bloodbridge.org',
    role: 'blood_bank_staff',
    title: 'Lead Transfusion Specialist & Inventory Officer',
    organization: 'Metropolitan Blood Intelligence Center',
  },
  {
    id: 'user_hospital_01',
    name: 'Dr. Emily Vance, MD',
    email: 'emily.vance@stjudetrauma.org',
    role: 'hospital_staff',
    title: 'Trauma Resuscitation Team Leader',
    organization: 'St. Jude Level 1 Trauma Center',
    hospitalId: 'hosp_01'
  },
  {
    id: 'user_donor_01',
    name: 'Alex Rivera (Universal Donor)',
    email: 'alex.rivera@example.com',
    role: 'donor',
    title: 'Active Gallon Club Donor (O-Negative)',
    organization: 'Community Donor Network',
    donorId: 'donor_01'
  }
];

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp_01',
    name: 'St. Jude Academic Medical Center',
    licenseNumber: 'HOSP-NY-89211',
    tier: 'Level 1 Trauma',
    address: '450 East River Parkway',
    city: 'New York, NY',
    emergencyPhone: '+1 (212) 555-0199',
    email: 'bloodbank@stjudetrauma.org',
    bloodBankDirector: 'Dr. Emily Vance, MD',
    activeRequestsCount: 3,
    monthlyAverageUnits: 145,
    isVerified: true,
    createdAt: '2025-01-15T08:00:00Z'
  },
  {
    id: 'hosp_02',
    name: 'Mercy Regional Health Pavilion',
    licenseNumber: 'HOSP-NY-44120',
    tier: 'Regional General',
    address: '1200 Mercy Boulevard',
    city: 'Brooklyn, NY',
    emergencyPhone: '+1 (718) 555-0142',
    email: 'transfusion@mercyhealth.org',
    bloodBankDirector: 'Dr. Robert Thorne',
    activeRequestsCount: 1,
    monthlyAverageUnits: 65,
    isVerified: true,
    createdAt: '2025-02-10T10:00:00Z'
  },
  {
    id: 'hosp_03',
    name: 'Children’s Hope Specialty Hospital',
    licenseNumber: 'HOSP-NY-77299',
    tier: 'Childrens Hospital',
    address: '88 Pediatric Way',
    city: 'Queens, NY',
    emergencyPhone: '+1 (718) 555-0188',
    email: 'pediatrics@childrenshope.org',
    bloodBankDirector: 'Dr. Anita Desai',
    activeRequestsCount: 2,
    monthlyAverageUnits: 40,
    isVerified: true,
    createdAt: '2025-03-01T09:30:00Z'
  },
  {
    id: 'hosp_04',
    name: 'Metropolitan Heart & Vascular Institute',
    licenseNumber: 'HOSP-NY-33902',
    tier: 'Specialty Clinic',
    address: '302 Lexington Avenue',
    city: 'New York, NY',
    emergencyPhone: '+1 (212) 555-0120',
    email: 'surgery@metroheart.org',
    bloodBankDirector: 'Dr. James Chen',
    activeRequestsCount: 0,
    monthlyAverageUnits: 30,
    isVerified: true,
    createdAt: '2025-03-12T11:00:00Z'
  }
];

export const INITIAL_DONORS: Donor[] = [
  {
    id: 'donor_01',
    nationalId: 'DONOR-ID-9081',
    fullName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 234-5678',
    bloodGroup: 'O-',
    dateOfBirth: '1992-06-14',
    gender: 'male',
    status: 'active',
    lastDonationDate: '2026-08-10',
    totalDonations: 14,
    eligibleFromDate: '2026-10-05',
    address: '742 Evergreen Terrace',
    city: 'New York, NY',
    preferences: {
      contactMethod: 'sms',
      remindersEnabled: true,
      emergencyAlertsEnabled: true,
      preferredCenter: 'Downtown Central Center'
    },
    medicalScreening: {
      ageValid: true,
      weightValid: true,
      recentTattooOrPiercing: false,
      recentSurgeryOrIllness: false,
      currentMedications: false,
      travelToEndemicArea: false,
      hemoglobinVerified: true,
      consentSigned: true,
      notes: 'Qualified donor. Hemoglobin 15.2 g/dL. No deferred travel.'
    },
    createdAt: '2024-04-12T10:00:00Z',
    updatedAt: '2026-08-10T14:30:00Z'
  },
  {
    id: 'donor_02',
    nationalId: 'DONOR-ID-4421',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 345-6789',
    bloodGroup: 'A+',
    dateOfBirth: '1988-11-22',
    gender: 'female',
    status: 'active',
    lastDonationDate: '2026-07-20',
    totalDonations: 9,
    eligibleFromDate: '2026-09-14',
    address: '124 Conch Street',
    city: 'Brooklyn, NY',
    preferences: {
      contactMethod: 'email',
      remindersEnabled: true,
      emergencyAlertsEnabled: false,
      preferredCenter: 'Brooklyn Heights Station'
    },
    medicalScreening: {
      ageValid: true,
      weightValid: true,
      recentTattooOrPiercing: false,
      recentSurgeryOrIllness: false,
      currentMedications: false,
      travelToEndemicArea: false,
      hemoglobinVerified: true,
      consentSigned: true
    },
    createdAt: '2024-08-20T11:00:00Z',
    updatedAt: '2026-07-20T12:00:00Z'
  },
  {
    id: 'donor_03',
    nationalId: 'DONOR-ID-3319',
    fullName: 'Kwame Mensah',
    email: 'kwame.mensah@example.com',
    phone: '+1 (555) 456-7890',
    bloodGroup: 'B+',
    dateOfBirth: '1995-03-08',
    gender: 'male',
    status: 'active',
    lastDonationDate: '2026-09-01',
    totalDonations: 6,
    eligibleFromDate: '2026-10-27',
    address: '512 Park Avenue',
    city: 'New York, NY',
    preferences: {
      contactMethod: 'sms',
      remindersEnabled: true,
      emergencyAlertsEnabled: true,
      preferredCenter: 'Downtown Central Center'
    },
    medicalScreening: {
      ageValid: true,
      weightValid: true,
      recentTattooOrPiercing: false,
      recentSurgeryOrIllness: false,
      currentMedications: false,
      travelToEndemicArea: false,
      hemoglobinVerified: true,
      consentSigned: true
    },
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2026-09-01T15:00:00Z'
  },
  {
    id: 'donor_04',
    nationalId: 'DONOR-ID-7822',
    fullName: 'Sophia Tanaka',
    email: 'sophia.tanaka@example.com',
    phone: '+1 (555) 567-8901',
    bloodGroup: 'AB+',
    dateOfBirth: '1999-09-19',
    gender: 'female',
    status: 'active',
    lastDonationDate: '2026-06-15',
    totalDonations: 4,
    eligibleFromDate: '2026-08-10',
    address: '890 Riverside Drive',
    city: 'New York, NY',
    preferences: {
      contactMethod: 'email',
      remindersEnabled: true,
      emergencyAlertsEnabled: false,
      preferredCenter: 'Uptown Medical Blood Bank'
    },
    medicalScreening: {
      ageValid: true,
      weightValid: true,
      recentTattooOrPiercing: false,
      recentSurgeryOrIllness: false,
      currentMedications: false,
      travelToEndemicArea: false,
      hemoglobinVerified: true,
      consentSigned: true
    },
    createdAt: '2025-05-18T14:00:00Z',
    updatedAt: '2026-06-15T11:00:00Z'
  },
  {
    id: 'donor_05',
    nationalId: 'DONOR-ID-6110',
    fullName: 'David O’Connor',
    email: 'david.oconnor@example.com',
    phone: '+1 (555) 678-9012',
    bloodGroup: 'O+',
    dateOfBirth: '1984-01-30',
    gender: 'male',
    status: 'active',
    lastDonationDate: '2026-09-18',
    totalDonations: 22,
    eligibleFromDate: '2026-11-13',
    address: '320 Hudson Street',
    city: 'New York, NY',
    preferences: {
      contactMethod: 'phone',
      remindersEnabled: true,
      emergencyAlertsEnabled: true,
      preferredCenter: 'Downtown Central Center'
    },
    medicalScreening: {
      ageValid: true,
      weightValid: true,
      recentTattooOrPiercing: false,
      recentSurgeryOrIllness: false,
      currentMedications: false,
      travelToEndemicArea: false,
      hemoglobinVerified: true,
      consentSigned: true
    },
    createdAt: '2023-11-05T08:00:00Z',
    updatedAt: '2026-09-18T10:00:00Z'
  },
  {
    id: 'donor_06',
    nationalId: 'DONOR-ID-5509',
    fullName: 'Zoya Patel',
    email: 'zoya.patel@example.com',
    phone: '+1 (555) 789-0123',
    bloodGroup: 'B-',
    dateOfBirth: '1997-04-12',
    gender: 'female',
    status: 'active',
    lastDonationDate: '2026-08-01',
    totalDonations: 3,
    eligibleFromDate: '2026-09-26',
    address: '42 Queens Blvd',
    city: 'Queens, NY',
    preferences: {
      contactMethod: 'sms',
      remindersEnabled: true,
      emergencyAlertsEnabled: true,
      preferredCenter: 'Queens Pavilion'
    },
    medicalScreening: {
      ageValid: true,
      weightValid: true,
      recentTattooOrPiercing: false,
      recentSurgeryOrIllness: false,
      currentMedications: false,
      travelToEndemicArea: false,
      hemoglobinVerified: true,
      consentSigned: true
    },
    createdAt: '2025-07-12T16:00:00Z',
    updatedAt: '2026-08-01T13:00:00Z'
  },
  {
    id: 'donor_07',
    nationalId: 'DONOR-ID-2289',
    fullName: 'Liam Tremblay',
    email: 'liam.tremblay@example.com',
    phone: '+1 (555) 890-1234',
    bloodGroup: 'AB-',
    dateOfBirth: '1990-12-05',
    gender: 'male',
    status: 'inactive',
    lastDonationDate: '2025-10-12',
    totalDonations: 5,
    eligibleFromDate: '2025-12-07',
    address: '101 5th Ave',
    city: 'New York, NY',
    preferences: {
      contactMethod: 'email',
      remindersEnabled: false,
      emergencyAlertsEnabled: false,
      preferredCenter: 'Downtown Central Center'
    },
    medicalScreening: {
      ageValid: true,
      weightValid: true,
      recentTattooOrPiercing: false,
      recentSurgeryOrIllness: false,
      currentMedications: false,
      travelToEndemicArea: false,
      hemoglobinVerified: true,
      consentSigned: true,
      notes: 'Donor requested temporary deactivation due to overseas relocation.'
    },
    createdAt: '2024-02-14T10:00:00Z',
    updatedAt: '2026-01-10T09:00:00Z'
  }
];

export const INITIAL_INVENTORY: InventoryBatch[] = [
  // PRBC - Packed Red Blood Cells (Shelf life 42d, 1-6°C)
  {
    id: 'batch_prbc_01',
    batchNumber: 'BATCH-2026-PRBC-0104',
    bloodGroup: 'O-',
    componentType: 'Packed Red Blood Cells (PRBC)',
    units: 6,
    collectionDate: '2026-09-20',
    expiryDate: '2026-11-01',
    location: 'Vault 1 - Cold Room A (Shelf 1)',
    temperatureCelsius: 3.8,
    status: 'available',
    donorCode: 'DONOR-ID-9081',
    testingPassed: true,
    crossmatchTag: 'CM-NEG-0920',
    notes: 'Universal RBC donor unit. High demand buffer.',
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z'
  },
  {
    id: 'batch_prbc_02',
    batchNumber: 'BATCH-2026-PRBC-0105',
    bloodGroup: 'O+',
    componentType: 'Packed Red Blood Cells (PRBC)',
    units: 14,
    collectionDate: '2026-09-18',
    expiryDate: '2026-10-30',
    location: 'Vault 1 - Cold Room A (Shelf 2)',
    temperatureCelsius: 4.1,
    status: 'available',
    donorCode: 'DONOR-ID-6110',
    testingPassed: true,
    crossmatchTag: 'CM-NEG-0918',
    createdAt: '2026-09-18T11:00:00Z',
    updatedAt: '2026-09-18T11:00:00Z'
  },
  {
    id: 'batch_prbc_03',
    batchNumber: 'BATCH-2026-PRBC-0099',
    bloodGroup: 'A+',
    componentType: 'Packed Red Blood Cells (PRBC)',
    units: 8,
    collectionDate: '2026-09-05',
    expiryDate: '2026-10-17', // Near expiry! ~4 days left
    location: 'Vault 1 - Cold Room A (Priority Front)',
    temperatureCelsius: 3.9,
    status: 'available',
    testingPassed: true,
    crossmatchTag: 'CM-NEG-0905',
    notes: 'Near expiry priority for upcoming scheduled surgeries.',
    createdAt: '2026-09-05T08:00:00Z',
    updatedAt: '2026-09-05T08:00:00Z'
  },
  {
    id: 'batch_prbc_04',
    batchNumber: 'BATCH-2026-PRBC-0112',
    bloodGroup: 'B+',
    componentType: 'Packed Red Blood Cells (PRBC)',
    units: 9,
    collectionDate: '2026-09-28',
    expiryDate: '2026-11-09',
    location: 'Vault 1 - Cold Room B (Shelf 1)',
    temperatureCelsius: 4.0,
    status: 'available',
    donorCode: 'DONOR-ID-3319',
    testingPassed: true,
    crossmatchTag: 'CM-NEG-0928',
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-09-28T09:00:00Z'
  },
  {
    id: 'batch_prbc_05',
    batchNumber: 'BATCH-2026-PRBC-0115',
    bloodGroup: 'AB-',
    componentType: 'Packed Red Blood Cells (PRBC)',
    units: 3,
    collectionDate: '2026-09-29',
    expiryDate: '2026-11-10',
    location: 'Vault 1 - Cold Room B (Shelf 3)',
    temperatureCelsius: 3.7,
    status: 'available',
    testingPassed: true,
    crossmatchTag: 'CM-NEG-0929',
    createdAt: '2026-09-29T14:00:00Z',
    updatedAt: '2026-09-29T14:00:00Z'
  },

  // Platelets (5 days shelf life, 20-24°C agitated)
  {
    id: 'batch_plt_01',
    batchNumber: 'BATCH-2026-PLT-0401',
    bloodGroup: 'O+',
    componentType: 'Platelets (Single Donor / Pooled)',
    units: 4,
    collectionDate: '2026-10-11',
    expiryDate: '2026-10-16', // 3 days left
    location: 'Agitator Unit 1 - Room 2',
    temperatureCelsius: 22.0,
    status: 'available',
    testingPassed: true,
    notes: 'Bacterial culture screening negative at 24h.',
    createdAt: '2026-10-11T09:00:00Z',
    updatedAt: '2026-10-11T09:00:00Z'
  },
  {
    id: 'batch_plt_02',
    batchNumber: 'BATCH-2026-PLT-0398',
    bloodGroup: 'A+',
    componentType: 'Platelets (Single Donor / Pooled)',
    units: 2,
    collectionDate: '2026-10-09',
    expiryDate: '2026-10-14', // 1 day left! Near expiry!
    location: 'Agitator Unit 1 - Priority Tray',
    temperatureCelsius: 21.8,
    status: 'available',
    testingPassed: true,
    notes: 'CRITICAL EXPIRY: Needs immediate hospital allocation.',
    createdAt: '2026-10-09T10:00:00Z',
    updatedAt: '2026-10-09T10:00:00Z'
  },
  {
    id: 'batch_plt_03',
    batchNumber: 'BATCH-2026-PLT-0405',
    bloodGroup: 'B-',
    componentType: 'Platelets (Single Donor / Pooled)',
    units: 3,
    collectionDate: '2026-10-12',
    expiryDate: '2026-10-17',
    location: 'Agitator Unit 2',
    temperatureCelsius: 22.1,
    status: 'available',
    testingPassed: true,
    createdAt: '2026-10-12T15:00:00Z',
    updatedAt: '2026-10-12T15:00:00Z'
  },

  // Fresh Frozen Plasma (FFP - 365 days shelf life, -18°C or colder)
  {
    id: 'batch_ffp_01',
    batchNumber: 'BATCH-2026-FFP-0019',
    bloodGroup: 'AB+',
    componentType: 'Fresh Frozen Plasma (FFP)',
    units: 12,
    collectionDate: '2026-04-10',
    expiryDate: '2027-04-10',
    location: 'Ultra-Deep Freezer F1 (-30°C)',
    temperatureCelsius: -28.5,
    status: 'available',
    testingPassed: true,
    notes: 'Universal Plasma Donor (AB). High quality coagulation factors.',
    createdAt: '2026-04-10T12:00:00Z',
    updatedAt: '2026-04-10T12:00:00Z'
  },
  {
    id: 'batch_ffp_02',
    batchNumber: 'BATCH-2026-FFP-0024',
    bloodGroup: 'O+',
    componentType: 'Fresh Frozen Plasma (FFP)',
    units: 8,
    collectionDate: '2026-05-15',
    expiryDate: '2027-05-15',
    location: 'Ultra-Deep Freezer F1 (-30°C)',
    temperatureCelsius: -29.0,
    status: 'available',
    testingPassed: true,
    createdAt: '2026-05-15T14:00:00Z',
    updatedAt: '2026-05-15T14:00:00Z'
  },

  // Cryoprecipitate
  {
    id: 'batch_cryo_01',
    batchNumber: 'BATCH-2026-CRYO-0008',
    bloodGroup: 'O-',
    componentType: 'Cryoprecipitate',
    units: 5,
    collectionDate: '2026-06-01',
    expiryDate: '2027-06-01',
    location: 'Ultra-Deep Freezer F2 (-30°C)',
    temperatureCelsius: -29.2,
    status: 'available',
    testingPassed: true,
    createdAt: '2026-06-01T11:00:00Z',
    updatedAt: '2026-06-01T11:00:00Z'
  },

  // Quarantined Batch (testing marker reactive or pending)
  {
    id: 'batch_quarantine_01',
    batchNumber: 'BATCH-2026-PRBC-0100',
    bloodGroup: 'A-',
    componentType: 'Packed Red Blood Cells (PRBC)',
    units: 2,
    collectionDate: '2026-10-01',
    expiryDate: '2026-11-12',
    location: 'Quarantine Chamber Q1',
    temperatureCelsius: 4.0,
    status: 'quarantined',
    testingPassed: false,
    notes: 'Secondary NAT testing confirmatory panel in progress.',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z'
  },

  // Expired Batch (strictly retained for disposal protocol / testing)
  {
    id: 'batch_expired_01',
    batchNumber: 'BATCH-2026-PLT-0390',
    bloodGroup: 'O-',
    componentType: 'Platelets (Single Donor / Pooled)',
    units: 1,
    collectionDate: '2026-10-02',
    expiryDate: '2026-10-07', // Already expired!
    location: 'Biohazard Disposal Staging',
    temperatureCelsius: 22.0,
    status: 'expired',
    testingPassed: true,
    notes: 'Scheduled for bio-incineration per SOP-BIO-14.',
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-08T08:00:00Z'
  }
];

export const INITIAL_REQUESTS: BloodRequest[] = [
  {
    id: 'req_01',
    requestNumber: 'REQ-2026-1042',
    hospitalId: 'hosp_01',
    hospitalName: 'St. Jude Academic Medical Center',
    patientIdHash: 'PT-894-A7X',
    patientClinicalIndication: 'Multitrauma motor vehicle collision with massive intra-abdominal hemorrhage',
    bloodGroup: 'O-',
    componentType: 'Packed Red Blood Cells (PRBC)',
    unitsRequested: 4,
    unitsFulfilled: 0,
    urgency: 'STAT / Emergency',
    requiredByDate: '2026-10-14T02:00:00Z',
    status: 'approved',
    specialRequirements: 'Emergency uncrossmatched / rapid thaw protocol',
    allocations: [],
    createdAt: '2026-10-13T19:30:00Z',
    updatedAt: '2026-10-13T19:40:00Z'
  },
  {
    id: 'req_02',
    requestNumber: 'REQ-2026-1039',
    hospitalId: 'hosp_02',
    hospitalName: 'Mercy Regional Health Pavilion',
    patientIdHash: 'PT-102-K9Q',
    patientClinicalIndication: 'Elective coronary artery bypass graft (CABG) with mild pre-op thrombocytopenia',
    bloodGroup: 'A+',
    componentType: 'Packed Red Blood Cells (PRBC)',
    unitsRequested: 3,
    unitsFulfilled: 0,
    urgency: 'Urgent (< 6 hrs)',
    requiredByDate: '2026-10-14T08:00:00Z',
    status: 'under_review',
    specialRequirements: 'Leukoreduced, CMV seronegative',
    allocations: [],
    createdAt: '2026-10-13T16:15:00Z',
    updatedAt: '2026-10-13T16:15:00Z'
  },
  {
    id: 'req_03',
    requestNumber: 'REQ-2026-1035',
    hospitalId: 'hosp_03',
    hospitalName: 'Children’s Hope Specialty Hospital',
    patientIdHash: 'PT-441-P02',
    patientClinicalIndication: 'Acute lymphoblastic leukemia with severe chemo-induced thrombocytopenia (<15k)',
    bloodGroup: 'O+',
    componentType: 'Platelets (Single Donor / Pooled)',
    unitsRequested: 2,
    unitsFulfilled: 2,
    urgency: 'STAT / Emergency',
    requiredByDate: '2026-10-13T12:00:00Z',
    status: 'fulfilled',
    specialRequirements: 'Irradiated, volume-reduced pediatric unit',
    allocations: [
      {
        id: 'alloc_001',
        batchId: 'batch_plt_01',
        batchNumber: 'BATCH-2026-PLT-0401',
        unitsAllocated: 2,
        donorBloodGroup: 'O+',
        donorComponentType: 'Platelets (Single Donor / Pooled)',
        expiryDate: '2026-10-16',
        selectionReason: 'FEFO match: Priority dispatch for pediatric leukemia thrombocytopenia.',
        allocatedAt: '2026-10-13T11:45:00Z',
        allocatedBy: 'Marcus Reed, MLS'
      }
    ],
    createdAt: '2026-10-13T11:00:00Z',
    updatedAt: '2026-10-13T11:45:00Z'
  },
  {
    id: 'req_04',
    requestNumber: 'REQ-2026-1030',
    hospitalId: 'hosp_04',
    hospitalName: 'Metropolitan Heart & Vascular Institute',
    patientIdHash: 'PT-993-M14',
    patientClinicalIndication: 'Routine hip arthroplasty reserve',
    bloodGroup: 'B+',
    componentType: 'Packed Red Blood Cells (PRBC)',
    unitsRequested: 2,
    unitsFulfilled: 0,
    urgency: 'Routine Elective',
    requiredByDate: '2026-10-16T10:00:00Z',
    status: 'submitted',
    allocations: [],
    createdAt: '2026-10-13T14:00:00Z',
    updatedAt: '2026-10-13T14:00:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_01',
    timestamp: '2026-10-13T19:40:00Z',
    actorId: 'user_admin_01',
    actorName: 'Dr. Sarah Lin, MD',
    actorRole: 'administrator',
    action: 'REQUEST_APPROVED',
    entityType: 'blood_request',
    entityId: 'req_01',
    entityReference: 'REQ-2026-1042',
    details: 'Approved STAT transfusion request for St. Jude Academic Medical Center (4 units O- PRBC).'
  },
  {
    id: 'audit_02',
    timestamp: '2026-10-13T11:45:00Z',
    actorId: 'user_staff_01',
    actorName: 'Marcus Reed, MLS',
    actorRole: 'blood_bank_staff',
    action: 'REQUEST_ALLOCATED',
    entityType: 'blood_request',
    entityId: 'req_03',
    entityReference: 'REQ-2026-1035',
    details: 'Fulfilled 2 units of Platelets (BATCH-2026-PLT-0401) using FEFO earliest-expiry algorithm for Childrens Hope.'
  },
  {
    id: 'audit_03',
    timestamp: '2026-10-12T15:00:00Z',
    actorId: 'user_staff_01',
    actorName: 'Marcus Reed, MLS',
    actorRole: 'blood_bank_staff',
    action: 'BATCH_INTAKE',
    entityType: 'inventory_batch',
    entityId: 'batch_plt_03',
    entityReference: 'BATCH-2026-PLT-0405',
    details: 'Intake and viral screening clearance completed for 3 units of B- Platelets.'
  },
  {
    id: 'audit_04',
    timestamp: '2026-10-05T10:00:00Z',
    actorId: 'user_admin_01',
    actorName: 'Dr. Sarah Lin, MD',
    actorRole: 'administrator',
    action: 'DONOR_CREATED',
    entityType: 'donor',
    entityId: 'donor_01',
    entityReference: 'Alex Rivera (DONOR-ID-9081)',
    details: 'Registered donor with verified screening protocol and O- universal donor profile.'
  }
];

/**
 * Generates 60 days of realistic, reproducible chronological daily demand data
 * for each blood group and component.
 */
export function generateSyntheticHistoricalDemand(
  bloodGroup: BloodGroup = 'O-',
  componentType: ComponentType = 'Packed Red Blood Cells (PRBC)',
  totalDays = 60
): HistoricalDemandPoint[] {
  const points: HistoricalDemandPoint[] = [];
  const baseDate = new Date('2026-08-15'); // 60 days before Oct 13, 2026

  // Base demand levels by blood group popularity & component
  const groupWeights: Record<BloodGroup, number> = {
    'O+': 9,
    'O-': 7, // High demand due to trauma use
    'A+': 7,
    'A-': 3,
    'B+': 4,
    'B-': 2,
    'AB+': 2,
    'AB-': 1
  };

  const compMultipliers: Record<ComponentType, number> = {
    'Packed Red Blood Cells (PRBC)': 1.0,
    'Platelets (Single Donor / Pooled)': 0.5,
    'Fresh Frozen Plasma (FFP)': 0.4,
    'Whole Blood': 0.3,
    'Cryoprecipitate': 0.2
  };

  const baseUnits = (groupWeights[bloodGroup] || 4) * (compMultipliers[componentType] || 0.8);

  for (let i = 0; i < totalDays; i++) {
    const curDate = new Date(baseDate);
    curDate.setDate(curDate.getDate() + i);
    const dow = curDate.getDay();
    const isWeekend = dow === 0 || dow === 6;

    // Weekdays typically have higher surgical elective transfusions; weekends have trauma spikes
    const dayFactor = isWeekend ? 0.75 : 1.15;
    
    // Seasonal weekly wave + slight upward trend over 60 days
    const weeklyCycle = Math.sin((2 * Math.PI * dow) / 7) * 1.5;
    const trendCycle = (i / totalDays) * 1.8;

    // Deterministic pseudo-random variation (reproducible seed)
    const pseudoRandom = Math.sin(i * 12.9898 + (bloodGroup.charCodeAt(0) || 1)) * 1.8;

    const rawUnits = baseUnits * dayFactor + weeklyCycle + trendCycle + pseudoRandom;
    const units = Math.max(1, Math.round(rawUnits));

    points.push({
      date: curDate.toISOString().split('T')[0],
      bloodGroup,
      componentType,
      unitsDemanded: units,
      dayOfWeek: dow,
      isWeekend
    });
  }

  return points;
}
