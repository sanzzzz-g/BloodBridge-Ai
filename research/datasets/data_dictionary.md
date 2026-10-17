# BloodBridge AI Research Data Dictionary

This document formalizes the data models, variables, units, data types, and integrity constraints for the research coordination simulator and optimization pipeline.

---

## 1. Daily Demand (`daily_demand`)

| Column Name | Type | Unit / Allowed Values | Description | Nullable |
| :--- | :--- | :--- | :--- | :--- |
| `date` | `DATE` | `YYYY-MM-DD` | Calendar date of demand observation | No |
| `bank_id` | `VARCHAR(32)` | Valid `bank_id` | Associated supplying regional blood center | No |
| `hospital_id` | `VARCHAR(32)` | Valid `hospital_id` | Hospital requisition origin | No |
| `blood_group` | `ENUM` | `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+` | ABO and RhD antigen group | No |
| `component` | `ENUM` | `PRBC`, `PLT`, `FFP`, `WB`, `CRYO` | Biological blood component type | No |
| `units_requested` | `INTEGER` | Standard Units ($\ge 0$) | Total clinical units ordered on this date | No |
| `data_source_type` | `ENUM` | `REAL`, `AGGREGATE_CALIBRATED`, `SYNTHETIC` | Explicit data provenance classification | No |

---

## 2. Inventory Batches (`inventory_batches`)

| Column Name | Type | Unit / Allowed Values | Description | Nullable |
| :--- | :--- | :--- | :--- | :--- |
| `batch_id` | `VARCHAR(64)` | Unique string (e.g. `BATCH-2026-0891`) | Global unique identifier of unit batch | No |
| `bank_id` | `VARCHAR(32)` | Valid `bank_id` | Physical holding blood center | No |
| `blood_group` | `ENUM` | ABO/RhD 8-group list | ABO/Rh group of donor unit | No |
| `component` | `ENUM` | 5 biological component types | Component classification | No |
| `units_available` | `INTEGER` | Count ($\ge 0$) | Residual unallocated units in batch | No |
| `collection_date` | `DATE` | `YYYY-MM-DD` | Date of donor collection | No |
| `expiry_date` | `DATE` | `YYYY-MM-DD` | Expiry cutoff (must be $\ge$ collection date) | No |
| `storage_status` | `ENUM` | `AVAILABLE`, `QUARANTINED`, `RESERVED`, `EXPIRED`, `ALLOCATED` | Operational availability state | No |
| `storage_temp_celsius`| `NUMERIC(4,1)`| Degrees Celsius (°C) | Measured cold-chain temperature | No |

---

## 3. Hospital Nodes (`hospitals`)

| Column Name | Type | Unit / Allowed Values | Description | Nullable |
| :--- | :--- | :--- | :--- | :--- |
| `hospital_id` | `VARCHAR(32)` | Unique node ID (e.g. `HOSP-01`) | Primary hospital identifier | No |
| `hospital_name` | `VARCHAR(128)`| String | Registered hospital name | No |
| `region` | `VARCHAR(64)` | Region/Metropolitan zone | Geographic territory designation | No |
| `latitude` | `NUMERIC(9,6)`| Decimal Degrees (-90.0 to 90.0) | Geographic latitude coordinate | No |
| `longitude` | `NUMERIC(9,6)`| Decimal Degrees (-180.0 to 180.0) | Geographic longitude coordinate | No |
| `hospital_type` | `ENUM` | `LEVEL_1_TRAUMA`, `LEVEL_2_TRAUMA`, `REGIONAL_GENERAL`, `PEDIATRIC_SPECIALTY` | Trauma tier and demand profile | No |

---

## 4. Blood Center Nodes (`blood_banks`)

| Column Name | Type | Unit / Allowed Values | Description | Nullable |
| :--- | :--- | :--- | :--- | :--- |
| `bank_id` | `VARCHAR(32)` | Unique node ID (e.g. `BANK-01`) | Primary blood center identifier | No |
| `bank_name` | `VARCHAR(128)`| String | Blood bank / transfusion service facility | No |
| `region` | `VARCHAR(64)` | Region/Metropolitan zone | Operational jurisdiction | No |
| `latitude` | `NUMERIC(9,6)`| Decimal Degrees (-90.0 to 90.0) | Geographic latitude coordinate | No |
| `longitude` | `NUMERIC(9,6)`| Decimal Degrees (-180.0 to 180.0) | Geographic longitude coordinate | No |
| `storage_capacity`| `INTEGER` | Standard Units ($\ge 100$) | Maximum cold vault holding volume | No |

---

## 5. Requisitions (`requests`)

| Column Name | Type | Unit / Allowed Values | Description | Nullable |
| :--- | :--- | :--- | :--- | :--- |
| `request_id` | `VARCHAR(64)` | Unique ID (e.g. `REQ-2026-1042`) | Requisition order identifier | No |
| `hospital_id` | `VARCHAR(32)` | Valid `hospital_id` | Requesting healthcare facility | No |
| `request_time` | `TIMESTAMPTZ` | ISO 8601 Timestamp | Precise submission timestamp | No |
| `blood_group` | `ENUM` | ABO/Rh 8-group list | Recipient target blood group | No |
| `component` | `ENUM` | 5 biological component types | Ordered biological component | No |
| `units_required` | `INTEGER` | Count ($> 0$) | Total required quantity | No |
| `urgency` | `ENUM` | `STAT_EMERGENCY`, `URGENT_6H`, `ROUTINE_ELECTIVE` | Clinical urgency triage priority | No |
| `requested_delivery_time`| `TIMESTAMPTZ`| ISO 8601 Timestamp | Mandatory required-by deadline | No |

---

## 6. Inter-Bank Transfers (`transfers`)

| Column Name | Type | Unit / Allowed Values | Description | Nullable |
| :--- | :--- | :--- | :--- | :--- |
| `transfer_id` | `VARCHAR(64)` | Unique string (`TRF-...`) | Inter-bank logistics transaction ID | No |
| `source_bank` | `VARCHAR(32)` | Valid `bank_id` | Supplying donor facility | No |
| `destination_bank`| `VARCHAR(32)` | Valid `bank_id` | Requesting destination facility | No |
| `component` | `ENUM` | 5 biological component types | Transferred component | No |
| `units` | `INTEGER` | Count ($> 0$) | Total transferred volume | No |
| `dispatch_time` | `TIMESTAMPTZ` | ISO 8601 Timestamp | Actual/projected departure time | No |
| `arrival_time` | `TIMESTAMPTZ` | ISO 8601 Timestamp | Actual/projected delivery arrival | No |
| `transport_cost` | `NUMERIC(10,2)`| Monetary Units (USD / INR) | Transit logistics, cold-box, vehicle cost | No |
| `status` | `ENUM` | `PLANNED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED` | Logistics tracking state | No |

---

## 7. Simulation Scenarios (`scenario_configurations`)

| Parameter Name | Type | Default Value | Clinical / Operational Meaning |
| :--- | :--- | :--- | :--- |
| `scenario_id` | `VARCHAR(32)` | `SCEN-NORMAL` | Identifier of experimental run |
| `random_seed` | `INTEGER` | `42` | Seed for pseudo-random reproducibility |
| `demand_multiplier` | `FLOAT` | `1.0` (Range: 0.5 - 3.0) | Scale factor for baseline hospital orders |
| `supply_disruption` | `FLOAT` | `0.0` (Range: 0.0 - 0.8) | Fractional drop in voluntary donor inflow |
| `emergency_surge` | `BOOLEAN` | `false` | Massive trauma casualty surge activation |
| `transport_delay_hrs`| `FLOAT` | `0.0` (Range: 0.0 - 12.0) | Transit disruption/congestion delay in hours |
| `expiry_pressure` | `ENUM` | `STANDARD`, `ELEVATED` | Fraction of initial stock near expiry ($\le 48$h) |

---

## 8. Coordination Event Logs (`coordination_event_log`)

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `event_id` | `VARCHAR(64)` | Unique timestamped event key |
| `timestamp` | `TIMESTAMPTZ` | Exact moment of trigger |
| `event_type` | `ENUM` | `NEW_REQUEST`, `DEMAND_SURGE`, `RESERVE_VIOLATION`, `EXPIRY_ALERT`, `REPLAN_TRIGGERED` |
| `triggering_entity` | `VARCHAR(64)` | ID of request, batch, or bank causing event |
| `decision_taken` | `TEXT` | Optimization action recommended or executed |
| `rejected_alternatives`| `TEXT` | Explanations why alternate transfers/batches were infeasible |
| `scenario_id` | `VARCHAR(32)` | Linked simulation trial |
