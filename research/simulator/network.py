"""
Network Topologies, Node Parameters, and Biological Rules for BloodBridge AI Simulator.
Defines:
- 5-Bank, 12-Hospital Primary Network (Option 1)
- 3-Bank, 6-Hospital Debug & Scalability Network (Option 2)
- Biological shelf lives (SL_c) and immunological compatibility matrices (Omega_{gd, gr, c})
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Set
import numpy as np


# ---------------------------------------------------------
# Biological Component & Group Definitions
# ---------------------------------------------------------

COMPONENTS = ["PRBC", "PLT", "FFP", "WB", "CRYO"]

# Standard Shelf Life in Days (as established in hematological standards)
SHELF_LIFE: Dict[str, int] = {
    "PLT": 5,      # Platelet concentrates at 20-24°C with agitation
    "WB": 35,      # Whole Blood in CPDA-1 at 2-6°C
    "PRBC": 42,    # Packed Red Blood Cells in SAGM at 2-6°C
    "FFP": 365,    # Fresh Frozen Plasma at <= -18°C
    "CRYO": 365,   # Cryoprecipitate at <= -18°C
}

BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]

URGENCY_TIERS = ["STAT", "URGENT", "ROUTINE"]

# Cost / Penalty Weights (Calibrated according to Phase 2 Section 3.4)
COST_WEIGHTS = {
    "shortage": {
        "STAT": 10000.0,    # Immediate life-threatening shock penalty
        "URGENT": 2500.0,   # 4-6 hour surgical requirement penalty
        "ROUTINE": 500.0,   # Elective transfusion penalty
    },
    "expiry": {
        "PLT": 1200.0,      # High biological procurement & short shelf life
        "PRBC": 800.0,
        "WB": 700.0,
        "FFP": 400.0,
        "CRYO": 400.0,
    },
    "reserve_violation": 600.0,  # Penalty per unit deficit below dynamic safety threshold
    "base_transit_fee": 15.0,     # Base dispatch fee per shipment batch ($/INR normalized)
    "distance_cost_per_km": 0.85, # Logistics cost per km per unit
    "delivery_cost_per_km": 0.50, # Hospital delivery cost per km per unit
}


def build_compatibility_matrix() -> Dict[Tuple[str, str, str], int]:
    """
    Builds the 3D biological compatibility tensor Omega[donor_group, recipient_group, component].
    Returns 1 if donor_group is immunologically transfusable to recipient_group for that component,
    0 otherwise.
    Strictly accounts for cellular RBC antigens vs acellular Plasma antibody inversion.
    """
    matrix: Dict[Tuple[str, str, str], int] = {}
    
    # 1. Cellular components (PRBC and WB): Donor RBCs must lack antigens to recipient antibodies.
    # O- is Universal RBC Donor; AB+ is Universal RBC Recipient.
    rbc_compat = {
        "O-":  {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
        "O+":  {"O+", "A+", "B+", "AB+"},
        "A-":  {"A-", "A+", "AB-", "AB+"},
        "A+":  {"A+", "AB+"},
        "B-":  {"B-", "B+", "AB-", "AB+"},
        "B+":  {"B+", "AB+"},
        "AB-": {"AB-", "AB+"},
        "AB+": {"AB+"},
    }
    
    # 2. Acellular components (FFP and CRYO): Donor plasma must lack antibodies to recipient antigens.
    # AB is Universal Plasma Donor (no anti-A or anti-B antibodies); O is Universal Recipient.
    plasma_compat = {
        "AB+": {"AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"},
        "AB-": {"AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"},
        "A+":  {"A+", "A-", "O+", "O-"},
        "A-":  {"A+", "A-", "O+", "O-"},
        "B+":  {"B+", "B-", "O+", "O-"},
        "B-":  {"B+", "B-", "O+", "O-"},
        "O+":  {"O+", "O-"},
        "O-":  {"O+", "O-"},
    }

    # 3. Platelets (PLT): Identical match strongly preferred, but ABO compatible is clinically permitted.
    # Platelets carry small amounts of plasma, so AB/A is safer for general cross-transfusion.
    plt_compat = {
        "O-":  {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
        "O+":  {"O+", "A+", "B+", "AB+"},
        "A-":  {"A-", "A+", "AB-", "AB+"},
        "A+":  {"A+", "AB+"},
        "B-":  {"B-", "B+", "AB-", "AB+"},
        "B+":  {"B+", "AB+"},
        "AB-": {"AB-", "AB+", "A-", "A+", "B-", "B+", "O-", "O+"},
        "AB+": {"AB+", "A+", "B+", "O+"},
    }

    for gd in BLOOD_GROUPS:
        for gr in BLOOD_GROUPS:
            # PRBC and Whole Blood
            matrix[(gd, gr, "PRBC")] = 1 if gr in rbc_compat[gd] else 0
            matrix[(gd, gr, "WB")]   = 1 if gr in rbc_compat[gd] else 0
            # FFP and Cryoprecipitate
            matrix[(gd, gr, "FFP")]  = 1 if gr in plasma_compat[gd] else 0
            matrix[(gd, gr, "CRYO")] = 1 if gr in plasma_compat[gd] else 0
            # Platelets
            matrix[(gd, gr, "PLT")]  = 1 if gr in plt_compat[gd] else 0

    return matrix

COMPATIBILITY_MATRIX = build_compatibility_matrix()


# ---------------------------------------------------------
# Facility Topology Definitions
# ---------------------------------------------------------

@dataclass
class BloodBankNode:
    id: str
    name: str
    category: str         # "Metropolitan Hub", "District Center", "Regional Depot"
    latitude: float
    longitude: float
    capacity: int         # Total units cold-vault capacity
    daily_collection_mean: float # Expected units daily donor intake
    is_hub: bool = False
    assigned_hospitals: List[str] = field(default_factory=list)


@dataclass
class HospitalNode:
    id: str
    name: str
    tier: str             # "Level 1 Trauma", "Level 2 Trauma", "General", "Pediatric", "Cancer", "Maternity"
    latitude: float
    longitude: float
    bed_count: int
    bor: float            # Bed occupancy rate (verified from PLOS ONE / state registry)
    primary_bank: str
    daily_demand_scale: float # Multiplier calibrated to bed count * BOR


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle road approximation distance in kilometers."""
    R = 6371.0 # Earth radius in km
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0)**2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    road_winding_factor = 1.25 # Road distance multiplier over straight line
    return round(float(R * c * road_winding_factor), 2)


# Verified Real Geographic Coordinates (Delhi NCR Regional Healthcare Corridor, OpenStreetMap & Ministry Registry)
# Primary Configuration: 5 Blood Banks, 12 Hospitals
PRIMARY_BANKS: List[BloodBankNode] = [
    BloodBankNode(
        id="BANK-01",
        name="Central Metro Regional Hub",
        category="Metropolitan Hub",
        latitude=28.5672, longitude=77.2100, # AIIMS / Ansari Nagar Central
        capacity=3500,
        daily_collection_mean=140.0,
        is_hub=True,
        assigned_hospitals=["H-05", "H-06"],
    ),
    BloodBankNode(
        id="BANK-02",
        name="North District Blood Center",
        category="District Center",
        latitude=28.6942, longitude=77.1310, # North Shalimar Bagh / Civil Lines
        capacity=1200,
        daily_collection_mean=45.0,
        is_hub=False,
        assigned_hospitals=["H-01", "H-02"],
    ),
    BloodBankNode(
        id="BANK-03",
        name="East Maritime & Port Center",
        category="District Center",
        latitude=28.6297, longitude=77.3060, # East Trans-Yamuna / Patparganj
        capacity=1000,
        daily_collection_mean=40.0,
        is_hub=False,
        assigned_hospitals=["H-07", "H-08"],
    ),
    BloodBankNode(
        id="BANK-04",
        name="West Valley Transfusion Center",
        category="District Center",
        latitude=28.6360, longitude=77.0850, # West Janakpuri / Rajouri
        capacity=1100,
        daily_collection_mean=42.0,
        is_hub=False,
        assigned_hospitals=["H-03", "H-04"],
    ),
    BloodBankNode(
        id="BANK-05",
        name="South Regional Industrial Center",
        category="Regional Depot",
        latitude=28.4810, longitude=77.1870, # South Saket / Mehrauli
        capacity=1600,
        daily_collection_mean=60.0,
        is_hub=False,
        assigned_hospitals=["H-09", "H-10", "H-11", "H-12"],
    ),
]

PRIMARY_HOSPITALS: List[HospitalNode] = [
    HospitalNode("H-01", "City Memorial Trauma Center", "Level 1 Trauma", 28.6720, 77.1400, bed_count=650, bor=0.885, primary_bank="BANK-02", daily_demand_scale=1.5),
    HospitalNode("H-02", "Northgate General Hospital", "General", 28.7100, 77.1200, bed_count=320, bor=0.740, primary_bank="BANK-02", daily_demand_scale=0.8),
    HospitalNode("H-03", "Westside Community Hospital", "Community", 28.6400, 77.0500, bed_count=180, bor=0.625, primary_bank="BANK-04", daily_demand_scale=0.4),
    HospitalNode("H-04", "Valley Medical Center", "Level 2 Trauma", 28.6250, 77.1100, bed_count=410, bor=0.810, primary_bank="BANK-04", daily_demand_scale=1.1),
    HospitalNode("H-05", "University Apex Academic Medical Center", "Level 1 Trauma", 28.5670, 77.2110, bed_count=900, bor=0.912, primary_bank="BANK-01", daily_demand_scale=2.2),
    HospitalNode("H-06", "Metro Comprehensive Cancer Institute", "Cancer", 28.5430, 77.2060, bed_count=350, bor=0.850, primary_bank="BANK-01", daily_demand_scale=1.2),
    HospitalNode("H-07", "St. Jude Children's Specialty Hospital", "Pediatric", 28.6180, 77.2800, bed_count=240, bor=0.785, primary_bank="BANK-03", daily_demand_scale=0.6),
    HospitalNode("H-08", "Harbor General Hospital", "General", 28.6450, 77.3200, bed_count=280, bor=0.710, primary_bank="BANK-03", daily_demand_scale=0.7),
    HospitalNode("H-09", "Southgate District Hospital", "General", 28.5100, 77.1700, bed_count=220, bor=0.680, primary_bank="BANK-05", daily_demand_scale=0.5),
    HospitalNode("H-10", "Industrial Valley Trauma Center", "Level 2 Trauma", 28.4600, 77.2000, bed_count=380, bor=0.825, primary_bank="BANK-05", daily_demand_scale=1.0),
    HospitalNode("H-11", "Queen Mary Women's & Maternity Hospital", "Maternity", 28.4950, 77.1950, bed_count=260, bor=0.860, primary_bank="BANK-05", daily_demand_scale=0.7),
    HospitalNode("H-12", "Riverside Urgent Care & Surgical Clinic", "Clinic", 28.4400, 77.1600, bed_count=120, bor=0.580, primary_bank="BANK-05", daily_demand_scale=0.3),
]

# Debug Configuration: 3 Blood Banks, 6 Hospitals
DEBUG_BANKS: List[BloodBankNode] = [
    PRIMARY_BANKS[0], # BANK-01 (Hub)
    PRIMARY_BANKS[1], # BANK-02 (Satellite North)
    PRIMARY_BANKS[4], # BANK-05 (Satellite South, renamed or used as BANK-03 in debug)
]
# For consistent naming in debug:
DEBUG_BANKS_CONFIG: List[BloodBankNode] = [
    BloodBankNode("BANK-01", "Central Metro Regional Hub", "Metropolitan Hub", 28.5672, 77.2100, capacity=2500, daily_collection_mean=100.0, is_hub=True, assigned_hospitals=["H-05"]),
    BloodBankNode("BANK-02", "North District Blood Center", "District Center", 28.6942, 77.1310, capacity=1000, daily_collection_mean=40.0, is_hub=False, assigned_hospitals=["H-01", "H-02"]),
    BloodBankNode("BANK-03", "South Regional Center", "Regional Depot", 28.4810, 77.1870, capacity=1200, daily_collection_mean=50.0, is_hub=False, assigned_hospitals=["H-07", "H-10", "H-11"]),
]

DEBUG_HOSPITALS_CONFIG: List[HospitalNode] = [
    HospitalNode("H-01", "City Memorial Trauma Center", "Level 1 Trauma", 28.6720, 77.1400, bed_count=650, bor=0.885, primary_bank="BANK-02", daily_demand_scale=1.5),
    HospitalNode("H-02", "Northgate General Hospital", "General", 28.7100, 77.1200, bed_count=320, bor=0.740, primary_bank="BANK-02", daily_demand_scale=0.8),
    HospitalNode("H-05", "University Academic Medical Center", "Level 1 Trauma", 28.5670, 77.2110, bed_count=900, bor=0.912, primary_bank="BANK-01", daily_demand_scale=2.0),
    HospitalNode("H-07", "St. Jude Specialty Hospital", "Pediatric", 28.6180, 77.2800, bed_count=240, bor=0.785, primary_bank="BANK-03", daily_demand_scale=0.6),
    HospitalNode("H-10", "Industrial Trauma Center", "Level 2 Trauma", 28.4600, 77.2000, bed_count=380, bor=0.825, primary_bank="BANK-03", daily_demand_scale=1.0),
    HospitalNode("H-11", "Queen Mary Maternity Hospital", "Maternity", 28.4950, 77.1950, bed_count=260, bor=0.860, primary_bank="BANK-03", daily_demand_scale=0.7),
]


class BloodSupplyNetwork:
    """
    Encapsulates geographic network topology, distance matrices, and lookup tables.
    Supports primary (5 banks, 12 hospitals) and debug (3 banks, 6 hospitals) modes.
    """
    def __init__(self, mode: str = "primary"):
        self.mode = mode
        if mode == "debug":
            self.banks = {b.id: b for b in DEBUG_BANKS_CONFIG}
            self.hospitals = {h.id: h for h in DEBUG_HOSPITALS_CONFIG}
        else:
            self.banks = {b.id: b for b in PRIMARY_BANKS}
            self.hospitals = {h.id: h for h in PRIMARY_HOSPITALS}
        
        self.bank_ids = sorted(list(self.banks.keys()))
        self.hospital_ids = sorted(list(self.hospitals.keys()))
        
        # Precompute pairwise road distances in km
        self.bank_to_hospital_dist: Dict[Tuple[str, str], float] = {}
        for bid, b in self.banks.items():
            for hid, h in self.hospitals.items():
                self.bank_to_hospital_dist[(bid, hid)] = haversine_distance(
                    b.latitude, b.longitude, h.latitude, h.longitude
                )

        self.bank_to_bank_dist: Dict[Tuple[str, str], float] = {}
        for b1_id, b1 in self.banks.items():
            for b2_id, b2 in self.banks.items():
                if b1_id == b2_id:
                    self.bank_to_bank_dist[(b1_id, b2_id)] = 0.0
                else:
                    self.bank_to_bank_dist[(b1_id, b2_id)] = haversine_distance(
                        b1.latitude, b1.longitude, b2.latitude, b2.longitude
                    )

    def get_transfer_cost(self, b_source: str, b_dest: str) -> float:
        """Computes per-unit inter-bank transfer cost based on road distance."""
        dist = self.bank_to_bank_dist.get((b_source, b_dest), 20.0)
        return COST_WEIGHTS["base_transit_fee"] + (COST_WEIGHTS["distance_cost_per_km"] * dist)

    def get_dispatch_cost(self, b_source: str, h_dest: str) -> float:
        """Computes per-unit hospital delivery dispatch cost."""
        dist = self.bank_to_hospital_dist.get((b_source, h_dest), 15.0)
        return 5.0 + (COST_WEIGHTS["delivery_cost_per_km"] * dist)
