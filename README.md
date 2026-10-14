# BloodBridge AI — Intelligent Blood Supply Intelligence Platform

**BloodBridge AI** is an intelligent Blood Bank Management System and Predictive Supply Optimization Platform designed to modernize voluntary donor engagement, cold-chain blood inventory tracking, hospital transfusion requisitions, and machine learning demand forecasting.

> **ACADEMIC PROTOTYPE NOTICE & CLINICAL DISCLAIMER:**
> BloodBridge AI is an experimental decision-support platform designed for operational demonstration and software testing. All records and time-series data are synthetic (marked DEMO DATA). Blood releases and clinical transfusions strictly require laboratory serological crossmatch (type & screen) and qualified human medical authorization.

---

## 1. System Architecture

BloodBridge AI follows a modular, decoupled architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       BloodBridge AI                        │
│                   Vite + React 19 + TypeScript              │
│       Tailwind CSS • Lucide Icons • Recharts Analytics       │
└───────────────────────┬─────────────────────────────┬───────┘
                        │                             │
                        ▼                             ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────┐
│     ACID Storage & Allocation Engine  │   │  AI Time-Series Forecaster    │
│  - FEFO (First-Expired, First-Out)    │   │  - Ridge Regression (L2)      │
│  - Component ABO/Rh Compatibility     │   │  - Seasonal-Naive (Lag 7)     │
│  - Negative Stock Prevention          │   │  - Chronological 80/20 Split  │
│  - Immutable Audit Trail Logging      │   │  - MAE & RMSE Evaluation      │
└───────────────────┬───────────────────┘   └───────────────┬───────────────┘
                    │                                       │
                    ▼                                       ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────┐
│        Supabase / PostgreSQL 15+      │   │    Python FastAPI Service     │
│  - Row Level Security (RLS) Policies  │   │  - scikit-learn & pandas      │
│  - Transactional Stored Procedures    │   │  - RESTful /forecast API      │
│  - Normalized Schema & Migrations     │   │  - Pytest Test Suite          │
└───────────────────────────────────────┘   └───────────────────────────────┘
```

---

## 2. Core Functional Modules

### A. Operations Dashboard
- Live computed metrics: Eligible stock units, registered active donors, pending hospital requests, and near-expiry batches.
- Recharts visualizations comparing stock levels across all 8 ABO/Rh blood groups and 5 biological components.
- Real-time notification center tracking STAT trauma requests and expiring batches.

### B. Donor Management
- Full lifecycle donor registry with unique National ID / Donor Card validation.
- Duplicate prevention blocking registered emails, phone numbers, or national IDs.
- Qualified pre-screening checklist (Age ≥ 18, Weight ≥ 50kg, Hb ≥ 12.5 g/dL, no recent tattoos or travel deferrals).
- Cooldown countdowns (56-day whole blood donation intervals).
- PII privacy masking toggle for HIPAA/GDPR compliance demonstrations.

### C. Blood Inventory Management
- Component-specific shelf life tracking:
  - **Whole Blood (WB)**: 35 days (1°C to 6°C)
  - **Packed Red Blood Cells (PRBC)**: 42 days (1°C to 6°C)
  - **Platelets (PLT)**: 5 days (20°C to 24°C with agitation)
  - **Fresh Frozen Plasma (FFP)**: 365 days (-18°C or colder)
  - **Cryoprecipitate (CRYO)**: 365 days (-18°C or colder)
- Automatic expiry date calculation upon intake.
- Visual alerts for expired (<= 0d) and near-expiry (<= 5d) batches.
- Cold vault temperature monitoring and quarantine status workflows.

### D. Hospital Transfusion Requisitions
- Hospital registry categorized by Trauma Tier (Level 1 Trauma, Level 2 Trauma, Regional General, Children's Specialty).
- Requisition status flow: `submitted` → `under_review` → `approved` → `partially_fulfilled` → `fulfilled` → `rejected`.
- Urgency tiers: `STAT / Emergency` (trauma resuscitation), `Urgent (< 6 hrs)`, and `Routine Elective`.
- Anonymized patient ID hashing.

### E. Smart Stock Allocation Engine (FEFO)
- Implements First-Expired, First-Out (FEFO) to minimize biological wastage.
- Component-specific compatibility evaluation:
  - **RBC / Whole Blood**: O- is universal donor; AB+ is universal recipient.
  - **Plasma (FFP / Cryo)**: Reverse of RBC! AB is universal donor; O is universal recipient.
  - **Platelets**: Identical ABO preferred, followed by compatible plasma/antigen profiles.
- Transparent ranking: explains why each candidate batch was selected or excluded.
- Atomic transaction execution preventing double-allocation and negative inventory.
- Mandatory human clinical sign-off gate before release.

### F. AI Demand Forecasting Engine
- Dual-model comparison: **Seasonal-Naive baseline** (7-day lag + rolling mean) vs **Scikit-learn Ridge Regression** (L2 regularized with day-of-week cyclical sine/cosine, weekend indicator, and seasonal lag features).
- Chronological train/test split (80% train, 20% test) preventing lookahead data leakage.
- Reports empirical Mean Absolute Error (MAE) and Root Mean Square Error (RMSE) with explicit evaluation date windows.
- Forecast horizons: 7, 14, and 30 days.
- Interactive confidence interval area chart comparing projected demand against available eligible stock to flag shortages.

### G. Regulatory Compliance & Audit Logs
- Immutable audit log capturing Actor, Role, Timestamp, Action Type, Entity Reference, and Delta Details.
- One-click CSV exports for inventory ledgers, donor registries, requests, and audit logs.

---

## 3. Technology Stack

- **Frontend**: React 19, Vite 8, TypeScript, Tailwind CSS, Lucide Icons
- **Charts**: Recharts
- **Frontend Automated Testing**: Vitest
- **Backend & Database**: Supabase with PostgreSQL 15+ (DDL migrations & RLS in `/supabase/migrations/`)
- **ML Microservice**: Python 3.11, FastAPI, pandas, scikit-learn, Pytest (`/ml_service/`)

---

## 4. Role-Based Access Control (RBAC) Demo Personas

BloodBridge AI includes 4 pre-configured demo personas switchable directly in the navigation header:

| Persona | Role | Permissions |
| :--- | :--- | :--- |
| **Dr. Sarah Lin, MD, FCAP** | `administrator` | Full system access, audit logs, inventory intake, request approval, policy settings |
| **Marcus Reed, MLS** | `blood_bank_staff` | Inventory intake, batch quarantine, FEFO allocation execution, audit logging |
| **Dr. Emily Vance, MD** | `hospital_staff` | Hospital requisition submission, order tracking, STAT trauma requests |
| **Alex Rivera** | `donor` | Personal donation history, screening vitals, reminder preferences, appointment booking |

---

## 5. Automated Testing Suite

BloodBridge AI features 12 comprehensive automated test suites covering all business-critical logic:

1. **Valid Donor Registration**: Validates required fields, email format, phone, and ABO blood group.
2. **Missing Required Fields**: Enforces error reporting for empty mandatory inputs.
3. **Invalid Email & Phone Format**: Rejects malformed contact identifiers.
4. **Duplicate Donor Detection**: Blocks duplicate national IDs and registered emails.
5. **Medical Specifications Validation**: Validates all 8 blood groups and 5 component types.
6. **Expired Stock Exclusion**: Guarantees expired units are never considered for allocation.
7. **Insufficient Stock Rejection**: Identifies deficits when request quantity exceeds eligible stock.
8. **Successful Allocation & Inventory Decrement**: Verifies accurate stock decrement and status transition.
9. **Negative Inventory Prevention**: Rejects attempts to allocate more units than available in a batch.
10. **Forecast Input Validation**: Throws structured validation errors for missing or < 14 data points.
11. **Chronological Model Evaluation**: Verifies 80/20 train/test split without data leakage, computes MAE and RMSE.
12. **Role-Based Authorization**: Enforces role restrictions between medical staff, clinicians, and donors.

### Running Frontend Tests:
```bash
npm run test
```

### Running Backend Python ML Tests:
```bash
cd ml_service
pytest test_forecaster.py -v
```

---

## 6. Running the Application Locally

### Frontend:
```bash
# Install dependencies
npm install

# Start Vite development server on port 3000
npm run dev

# Run automated tests
npm run test

# Build for production
npm run build
```

### Python ML Service:
```bash
cd ml_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 7. Limitations & Future Roadmap

- **Clinical Crossmatch**: Software pre-screening does not substitute for laboratory serological crossmatch or antibody screens. Future iterations could integrate with electronic health record (EHR) HL7 / FHIR interfaces.
- **Cold-Chain IoT Hardware**: Storage temperature values are currently recorded via laboratory entry. Future expansion would connect directly to IoT thermocouple sensors via MQTT.
- **Advanced Deep Learning**: As real multi-year hospital data accumulates, transformer-based time-series architectures (e.g. PatchTST) could be trained alongside the Ridge baseline.
