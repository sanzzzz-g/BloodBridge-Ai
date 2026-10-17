# Research Datasets Directory Structure

This directory houses all empirical, published aggregate, directory, and reproducible synthetic datasets for **BloodBridge AI**.

```
research/datasets/
├── README.md               # This document (provenance & hygiene guidelines)
├── source_register.csv     # Master register of all external and benchmark sources
├── data_dictionary.md      # Detailed column definitions, units, and constraints
├── raw/                    # Untouched original downloads (read-only)
├── processed/              # Normalized, cleaned, and calibrated tables
└── synthetic/              # Deterministic, seeded synthetic simulation runs
```

## Data Provenance & Ethical Boundaries

1. **Strict Category Separation**:
   - `raw/`: Verifiable downloads directly from primary open data portals (e.g. facility directories).
   - `processed/`: Standardized facility tables extracted from verified sources.
   - `synthetic/`: Generated datasets with explicit fixed random seeds (`random_seed=42, 101, 2024`) strictly segregated from real clinical files. Every record includes `data_source_type: 'SYNTHETIC'`.
2. **Zero Fabrication Policy**:
   - If row-level patient or hospital daily consumption records are not openly published by health authorities due to patient confidentiality (HIPAA / GDPR / Indian Digital Personal Data Protection Act 2023), they are explicitly documented as **unavailable** rather than simulated under a false label.
   - Published aggregate statistics (e.g. from Source A, PLOS ONE 2022: 14.6M units national clinical demand, 41.2% medicine, 27.9% surgery, 22.4% ob-gyn, 8.5% pediatrics) are used strictly for **macro-scenario calibration**.
