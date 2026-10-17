# Phase 1: Dataset Feasibility & Provenance Assessment Report

**Project**: BloodBridge AI Research Initiative  
**Date**: October 15, 2026  
**Investigating Team**: Data Engineering & Operations Research Units  

---

## 1. Investigation of Explicit Sources (Sources A through G)

### Source A — National Clinical Demand and Supply of Blood in India
- **Citation**: Sharma et al., *The clinical demand and supply of blood in India: A National level estimation study*, PLOS ONE 17(4): e0265951 (2022). [PMC8986005](https://pmc.ncbi.nlm.nih.gov/articles/PMC8986005/).
- **Inspection Findings**:
  - Reports nationwide clinical demand across 251 sampled healthcare facilities in 5 randomly selected Indian states.
  - Estimated total annual clinical demand: **14.6 million whole blood units** ($36.3$ donations per $1,000$ eligible population).
  - Annual supply: $13.6$ million units ($33.8$ donations per $1,000$ eligible), leaving a documented national annual deficit of $\approx 1.0$ million units.
  - Specialty breakdown: Medicine (41.2%), Surgery (27.9%), Obstetrics & Gynecology (22.4%), Pediatrics (8.5%).
- **Feasibility Verdict**: **Reference-Only / Macro Calibration**. The data are published as aggregated annual tables in the paper text. Individual daily hospital consumption traces and batch expiry logs are not included. This source is ideal for calibrating scenario multipliers and specialty ratios, but cannot serve as raw training time-series.

---

### Source B — Blood-Component Demand Forecasting Study
- **Citation**: *Forecasting demand for blood products: Towards inventory management of a perishable product*, BMC Med Inform Decis Mak / Bioinformation (2024). [PMC10859947](https://pmc.ncbi.nlm.nih.gov/articles/PMC10859947/) / [DOI: 10.1186/s12911-024-02445-0](https://doi.org/10.1186/s12911-024-02445-0).
- **Inspection Findings**:
  - Evaluated monthly consumption of blood components over a 6-year period (January 2017 to December 2022) with a January–July 2023 test horizon.
  - Evaluated statistical forecasting techniques: SAMAI (Simple Average with Mean Annual Increment), ARIMA, and Ratio-to-Trend.
  - Reported that proactive demand forecasting reduced order frequency by up to 60% and buffer inventory levels by up to 40%.
- **Feasibility Verdict**: **Reference-Only / Methodological Baseline**. The published text reports aggregated monthly summary statistics and MAPE metrics. Raw row-level patient transfusion transactions were not made publicly downloadable due to clinical data privacy governance. The SAMAI and ARIMA specifications will be reproduced mathematically as baselines.

---

### Source C & Source D — WHO Global Database on Blood Safety (GDBS) & Global Status Report 2025
- **Source C**: WHO Global Database on Blood Safety ([GDBS Portal](https://www.who.int/teams/health-product-policy-and-standards/standards-and-specifications/blood-and-products-of-human-origin/quality-and-safety/global-database-on-blood-safety)).
- **Source D**: WHO Global Status Report on Blood Safety and Availability 2025 ([WHO Report 9789240121546](https://www.who.int/publications/i/item/9789240121546)).
- **Inspection Findings**:
  - Compiles standardized survey responses across 168 WHO Member States, evaluating governance, collection rates, component separation, and screening.
  - Key global benchmark: High-income countries (15% of global population) collect 36% of global blood donations; low/middle-income countries suffer structural supply imbalances. Over 85% of global donations are voluntary unpaid.
- **Feasibility Verdict**: **Reference-Only / Policy Context**. These reports publish biennial country-level macro indicators. They contain no facility-level operational traces or inventory logs.

---

### Source E & Source F — Indian Blood-Bank Directory & Open Government Data Platform
- **Source E**: GitHub repository `atmajitg/bloodbanks` & data.gov.in archives.
- **Source F**: Open Government Data (OGD) Platform India ([data.gov.in](https://data.gov.in/)) — National Health Portal Blood Bank Directory.
- **Inspection Findings**:
  - Open spatial registry of licensed Indian blood banks published under the Open Government Data License (OGDL) India.
  - Attributes: Blood bank name, state, district, city, address, contact phone, email, and geographic coordinates (latitude, longitude).
  - Data Quality Caveats: Contains missing coordinates for select rural centers, formatting inconsistencies in telephone numbers, and duplicate entries requiring programmatic deduplication and geospatial validation.
- **Feasibility Verdict**: **Real Downloadable Observations (Network Topology)**. Suitable for establishing a realistic multi-bank geographic network graph (inter-facility distances, transit travel times, regional clusters). Does *not* contain dynamic inventory or patient demand.

---

### Source G — Google AI Studio Development Documentation
- **Inspection Findings**:
  - Supported runtime: Single-port Node.js dev server (port 3000), Vite SPA + TypeScript, automated test execution via `npm run test` (Vitest), background tasks, and file manipulation.
- **Feasibility Verdict**: **Operational Execution Runtime**.

---

## 2. Dataset Categorization Matrix

| Category | Available Datasets | Verified Contents & Role in Research |
| :--- | :--- | :--- |
| **1. Real Downloadable Observations** | Indian National Blood Bank Directory (`data.gov.in` / Source E) | Facility geographic coordinates, licenses, regional distribution, and transit distance matrices. |
| **2. Aggregate Published Values** | PLOS ONE Indian National Study (Source A), BMC Blood Forecasting (Source B), WHO GDBS (Sources C & D) | Annual clinical demand ($14.6$M units/yr), specialty distribution ratios (41.2% medicine, 27.9% surgery, etc.), and published forecasting error baselines. |
| **3. Geographic Directory Records** | MoHFW / National Health Portal Indian Blood Banks Dataset | Node graph of regional blood centers and affiliated trauma hospital clusters. |
| **4. Synthetic Records (Simulator)** | Deterministic multi-bank simulator (`daily_demand`, `inventory_batches`, `requests`, `transfers`) | Linked time-series demand, batch-level shelf-life countdowns, emergency surges, and logistics costs generated with fixed seeds (`seed=42`). |
| **5. Unmet Data Requirements** | Real-world daily transaction-level hospital EHR orders and real-time inter-bank cold-chain transit logs | **Legally unavailable** in public repositories due to HIPAA, GDPR, and Indian DPDP Act 2023 patient privacy laws. |

---

## 3. Engineering Justification for the Synthetic Multi-Bank Simulator

Because real daily, batch-level blood supply and inter-bank transit records are nowhere openly published globally due to clinical privacy constraints:
1. We must construct a **reproducible, seed-controlled synthetic multi-bank simulator**.
2. The simulator must be **strictly calibrated** using the macro parameters from Source A (PLOS ONE 2022) and Source B (BMC 2024).
3. The simulator must be initialized using **real geographic network topologies** from Source E/F (real blood bank coordinates).
4. Every simulated record must carry an explicit column: `data_source_type: "SYNTHETIC"`.
