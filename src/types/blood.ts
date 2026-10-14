export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export type ComponentType = 
  | 'Whole Blood'
  | 'Packed Red Blood Cells (PRBC)'
  | 'Platelets (Single Donor / Pooled)'
  | 'Fresh Frozen Plasma (FFP)'
  | 'Cryoprecipitate';

export interface ComponentSpecification {
  type: ComponentType;
  code: string;
  shelfLifeDays: number;
  storageTemp: string;
  indication: string;
  description: string;
}

export const COMPONENT_SPECS: Record<ComponentType, ComponentSpecification> = {
  'Whole Blood': {
    type: 'Whole Blood',
    code: 'WB',
    shelfLifeDays: 35,
    storageTemp: '1°C to 6°C',
    indication: 'Massive hemorrhage, active bleeding with hypovolemia',
    description: 'Unseparated blood containing red cells, plasma, and clotting factors.'
  },
  'Packed Red Blood Cells (PRBC)': {
    type: 'Packed Red Blood Cells (PRBC)',
    code: 'PRBC',
    shelfLifeDays: 42,
    storageTemp: '1°C to 6°C',
    indication: 'Severe anemia, surgical blood loss, trauma resuscitation',
    description: 'Erythrocytes with plasma removed; elevates oxygen-carrying capacity.'
  },
  'Platelets (Single Donor / Pooled)': {
    type: 'Platelets (Single Donor / Pooled)',
    code: 'PLT',
    shelfLifeDays: 5,
    storageTemp: '20°C to 24°C with continuous agitation',
    indication: 'Thrombocytopenia, severe bleeding, hematologic malignancies',
    description: 'Essential for primary hemostasis; rapid shelf life requires active management.'
  },
  'Fresh Frozen Plasma (FFP)': {
    type: 'Fresh Frozen Plasma (FFP)',
    code: 'FFP',
    shelfLifeDays: 365,
    storageTemp: '-18°C or colder',
    indication: 'Coagulopathy, liver disease, reversal of warfarin anticoagulation',
    description: 'Fluid portion of blood unit frozen within 8 hours; contains all coagulation factors.'
  },
  'Cryoprecipitate': {
    type: 'Cryoprecipitate',
    code: 'CRYO',
    shelfLifeDays: 365,
    storageTemp: '-18°C or colder',
    indication: 'Hypofibrinogenemia, massive transfusion protocols, Factor XIII deficiency',
    description: 'Concentrated source of fibrinogen, Factor VIII, and von Willebrand factor.'
  }
};

export const ALL_BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
export const ALL_COMPONENTS: ComponentType[] = [
  'Packed Red Blood Cells (PRBC)',
  'Platelets (Single Donor / Pooled)',
  'Fresh Frozen Plasma (FFP)',
  'Whole Blood',
  'Cryoprecipitate'
];
