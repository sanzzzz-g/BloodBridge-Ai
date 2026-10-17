# Phase 2: Formal Mathematical Model & Multi-Bank Network Formulation

**Document Code**: `BB-RES-P2-04`  
**Date**: October 15, 2026  
**Investigating Team**: Operations Research, Mathematical Optimization, and Systems Architecture Units  
**Scope**: Primary and debug network topologies, dynamic quantile-over-lead-time reserve formulation, full Mixed-Integer Linear Program (MILP), event-triggered re-planning protocol, and comparison with existing models.

---

## 1. Network Topologies & Geographic Graph

### 1.1 Option 1: Primary Network Configuration (5 Blood Banks, 12 Hospitals)
The primary experimental network models a regional healthcare territory divided into three operational sectors (Metropolitan Central, Northern Suburban, and Southern Industrial).

```
                      [BANK-01: Central Metro Hub]
                           /       |        \
                          /        |         \
                         /         |          \
      [BANK-02: North]--+          |           +--[BANK-03: East/Port]
         /     \                   |                  /     \
    [H-01]     [H-02]          [H-05, H-06]       [H-07]    [H-08]
    (Trauma 1) (General)       (Trauma 1, Cancer) (Pediatric)(General)
                                   |
                                   |
      [BANK-04: West Suburban]----+----[BANK-05: South Regional]
         /     \                                /     \
    [H-03]     [H-04]                       [H-09]    [H-10, H-11, H-12]
   (Community)(Trauma 2)                   (General)  (Trauma 2, Maternity, Clinic)
```

#### Node Directory & Parameter Profiles:

**Blood Centers ($\mathcal{B}$, $|B| = 5$):**
1. `BANK-01` (Central Metro Regional Hub): Coordinates major collections; storage capacity $C_b = 3,500$ units; automated component separator.
2. `BANK-02` (North District Blood Center): Serves northern trauma corridor; capacity $C_b = 1,200$ units.
3. `BANK-03` (East Maritime & Port Center): Serves coastal district and pediatric center; capacity $C_b = 1,000$ units.
4. `BANK-04` (West Valley Transfusion Center): Medium facility; capacity $C_b = 1,100$ units.
5. `BANK-05` (South Industrial Blood Center): High voluntary donor catchment; capacity $C_b = 1,600$ units.

**Hospitals ($\mathcal{H}$, $|H| = 12$):**
- `H-01` (City Memorial Trauma Center): Level 1 Trauma, 650 beds, BOR = 88.5%, high surgical demand.
- `H-02` (Northgate General Hospital): Regional General, 320 beds, BOR = 74.0%.
- `H-03` (Westside Community Hospital): Primary/Secondary Care, 180 beds, BOR = 62.5%.
- `H-04` (Valley Medical Center): Level 2 Trauma, 410 beds, BOR = 81.0%.
- `H-05` (University Apex Academic Medical Center): Level 1 Trauma & Quaternary Transplant, 900 beds, BOR = 91.2%.
- `H-06` (Metro Comprehensive Cancer Institute): Oncology & Hematology, 350 beds, BOR = 85.0% (heavy platelet and PRBC utilization).
- `H-07` (St. Jude Children's Specialty Hospital): Pediatric & Neonatal, 240 beds, BOR = 78.5% (special small-volume and washed units).
- `H-08` (Harbor General Hospital): Regional General, 280 beds, BOR = 71.0%.
- `H-09` (Southgate District Hospital): Secondary Care, 220 beds, BOR = 68.0%.
- `H-10` (Industrial Valley Trauma Center): Level 2 Trauma, 380 beds, BOR = 82.5%.
- `H-11` (Queen Mary Women's & Maternity Hospital): Specialized OB/GYN, 260 beds, BOR = 86.0% (PPH and cesarean PRBC/plasma demand).
- `H-12` (Riverside Urgent Care & Surgical Clinic): Ambulatory & Short-Stay, 120 beds, BOR = 58.0%.

---

### 1.2 Option 2: Debug & Scalability Network (3 Blood Banks, 6 Hospitals)
For fast unit testing, solver performance profiling, and algorithmic boundary checking:
- **Banks ($\mathcal{B}_{\text{debug}}$, $|B| = 3$):** `BANK-01` (Hub), `BANK-02` (Satellite North), `BANK-03` (Satellite South).
- **Hospitals ($\mathcal{H}_{\text{debug}}$, $|H| = 6$):** `H-01` (Level 1 Trauma), `H-02` (General), `H-05` (Academic/Cancer), `H-07` (Pediatric), `H-10` (Level 2 Trauma), `H-11` (Maternity).

---

## 2. Dynamic Safety Reserve Formulation: Quantile Over Replenishment Lead Time

### 2.1 The Replenishment Lead-Time Window
Let $b \in \mathcal{B}$ be a blood bank and $c \in \mathcal{C}$ be a blood component.
Let $L_{b,c}$ be the **replenishment lead time** (in integer days), defined as the time required for bank $b$ to receive a fresh batch of component $c$.
- For blood banks with active donor collection: $L_{b,c} = \tau_{\text{collection}} + \tau_{\text{testing\_serology}} + \tau_{\text{separation}} \approx 1\text{ to }2\text{ days}$.
- For blood banks relying on inter-bank transfers from the Central Hub: $L_{b,c} = \tau_{\text{transit}} \approx 0.5\text{ to }1\text{ day}$.

### 2.2 Lead-Time Demand Random Variable
Over the lead-time horizon $\tau \in \{1, \dots, L_{b,c}\}$, bank $b$ must support clinical demands from its assigned hospital set $\mathcal{H}_b$. The cumulative lead-time demand is a random variable:

$$\tilde{D}_{b,c}^{L}(t) = \sum_{\tau=1}^{L_{b,c}} \sum_{h \in \mathcal{H}_b} \sum_{g \in \mathcal{G}} \tilde{D}_{h,g,c}(t+\tau)$$

The predictive machine-learning engine outputs a conditional lead-time distribution:

$$\hat{F}_{b,c,t}(y) = \mathbb{P}\left(\tilde{D}_{b,c}^{L}(t) \le y \mid \mathcal{F}_t\right)$$

where $\mathcal{F}_t$ is the information filtration up to time $t$ (historical calendar trends, weather, scheduled elective surgical queues, and donor inflow forecasts).

### 2.3 Lead-Time Demand Quantile
For a target clinical service level $\alpha \in (0, 1)$ (e.g., $\alpha = 0.99$ for critical STAT components such as O- PRBC and platelets; $\alpha = 0.90$ for routine elective FFP):

$$Q_{b,c,t}(\alpha) = \inf \left\{ y \in \mathbb{R}_{\ge 0} : \hat{F}_{b,c,t}(y) \ge \alpha \right\}$$

### 2.4 Mathematical Prevention of Uncertainty Double-Counting
A common error in naive inventory models is adding an ad-hoc safety buffer $\Delta S$ to a baseline model that *already* plans for expected or upper-percentile demand.

To strictly avoid double-counting:
1. Let $\mu_{b,c,t}^{L} = \mathbb{E}[\tilde{D}_{b,c}^{L}(t) \mid \mathcal{F}_t]$ be the conditional mean demand over lead time.
2. In the optimization model's flow balance, scheduled dispatches already account for the expected demand stream $\mu_{b,c,t}^{L}$.
3. Therefore, the **Dynamic Safety Reserve Threshold** $S_{b,c,t}(\alpha)$ representing the minimum physical stock that must remain in vault $b$ at the end of period $t$ to protect against stochastic variation during replenishment is defined directly as:

$$S_{b,c,t}(\alpha) = Q_{b,c,t}(\alpha)$$

And the **incremental safety buffer** above the conditional expectation is:

$$\text{SS}_{b,c,t}^{\text{dynamic}}(\alpha) = \max\left(0, Q_{b,c,t}(\alpha) - \mu_{b,c,t}^{L}\right)$$

### 2.5 Theoretical Proof of Baseline Equivalence (Special Case)
**Theorem 1**: *If lead-time demand $\tilde{D}_{b,c}^{L}(t)$ is independent and identically normally distributed with mean $\mu_D \cdot L_{b,c}$ and variance $\sigma_D^2 \cdot L_{b,c}$, the dynamic quantile reserve reduces exactly to the textbook safety stock formula.*

*Proof*:
Under Gaussian assumptions, $\tilde{D}^{L} \sim \mathcal{N}(\mu_D L, \sigma_D^2 L)$.  
The $\alpha$-quantile of a Gaussian distribution is:
$$Q(\alpha) = \mu_D L + Z_{\alpha} \cdot (\sigma_D \sqrt{L})$$
Subtracting the expected lead-time demand $\mu_D L$:
$$\text{SS}^{\text{dynamic}}(\alpha) = Q(\alpha) - \mu_D L = Z_{\alpha} \cdot \sigma_D \sqrt{L} = \text{SS}^{\text{fixed}}$$
$\blacksquare$

*Significance*: This proves that the traditional fixed safety stock formula $\text{SS}^{\text{fixed}} = Z_{\alpha} \sigma \sqrt{L}$ is not a distinct competing paradigm, but merely an **asymptotically restrictive special case** of our dynamic quantile formulation. When empirical demand exhibits skewness, zero-inflation, or heavy tails (as documented in our verified PLOS ONE data), the quantile formulation $Q(\alpha)$ automatically shifts the reserve to guarantee true $\alpha$-coverage without assuming Gaussian symmetry.

---

## 3. Formal Mathematical Optimization Formulation (MILP)

### 3.1 Index Sets
- $b, b' \in \mathcal{B}$: Blood bank nodes ($\mathcal{B} = \{1, \dots, |\mathcal{B}|\}$).
- $h \in \mathcal{H}$: Hospital customer nodes ($\mathcal{H} = \{1, \dots, |\mathcal{H}|\}$).
- $c \in \mathcal{C}$: Biological components ($\mathcal{C} = \{\text{PRBC}, \text{PLT}, \text{FFP}, \text{WB}, \text{CRYO}\}$).
- $g_d, g_r, g \in \mathcal{G}$: ABO and RhD blood groups ($\mathcal{G} = \{\text{O-}, \text{O+}, \text{A-}, \text{A+}, \text{B-}, \text{B+}, \text{AB-}, \text{AB+}\}$).
- $a \in \mathcal{A}_c$: Discrete residual shelf-life cohorts in days, where $a \in \{1, 2, \dots, \text{ShelfLife}_c\}$. A unit with $a=1$ expires at the end of the current period if not transfused.
- $u \in \mathcal{U}$: Clinical urgency triage tiers ($\mathcal{U} = \{\text{STAT}, \text{URGENT}, \text{ROUTINE}\}$).
- $t \in \mathcal{T}$: Planning time horizon ($\mathcal{T} = \{1, 2, \dots, T\}$), where each time step $\Delta t = 1$ day.

---

### 3.2 Deterministic & Forecast Parameters

| Parameter | Unit | Definition |
| :--- | :--- | :--- |
| $\text{SL}_c$ | Days | Maximum shelf life ($\text{SL}_{\text{PLT}}=5$, $\text{SL}_{\text{WB}}=35$, $\text{SL}_{\text{PRBC}}=42$, $\text{SL}_{\text{FFP}}=365$, $\text{SL}_{\text{CRYO}}=365$) |
| $d_{b,h}$ | km | Road transit distance from blood bank $b$ to hospital $h$ |
| $d_{b,b'}$ | km | Road transit distance between blood banks $b$ and $b'$ |
| $\tau_{b,h}$ | Days | Transit lead time from bank $b$ to hospital $h$ ($\tau_{b,h} < 1$ for same-day local dispatch) |
| $\tau_{b,b'}$ | Days | Transit lead time for inter-bank transfer from $b$ to $b'$ ($\tau_{b,b'} \in \{0, 1\}$) |
| $\Omega_{g_d, g_r, c}$ | Binary $\{0, 1\}$ | Component-specific immunological compatibility: $1$ if donor group $g_d$ can be safely transfused to recipient $g_r$ for component $c$; $0$ otherwise |
| $R_{h,g_r,c,u,t}$ | Units | Verified clinical requisition from hospital $h$ for recipient group $g_r$, component $c$, urgency $u$ at day $t$ |
| $W_{b,g,c,t}$ | Units | Inflow of freshly processed donor units arriving at bank $b$ at time $t$ (enters with age $a = \text{SL}_c$) |
| $S_{b,c,t}(\alpha)$ | Units | Dynamic safety reserve threshold for component $c$ at bank $b$ at time $t$ |
| $\text{Cap}_b$ | Units | Maximum cold-chain vault storage capacity of bank $b$ |
| $c^{\text{trans}}_{b,b'}$ | Cost / Unit | Logistics transit cost per unit transferred between banks ($= \text{BaseFee} + \kappa \cdot d_{b,b'}$) |
| $c^{\text{hosp}}_{b,h}$ | Cost / Unit | Delivery cost per unit dispatched from bank $b$ to hospital $h$ |
| $c^{\text{short}}_{u,c}$ | Cost / Unit | Asymmetric penalty for unfulfilled hospital demand: $c^{\text{short}}_{\text{STAT}} \gg c^{\text{short}}_{\text{URGENT}} \gg c^{\text{short}}_{\text{ROUTINE}}$ |
| $c^{\text{exp}}_c$ | Cost / Unit | Biological wastage penalty for discarded expired unit |
| $c^{\text{res}}_c$ | Cost / Unit | Penalty for inventory falling below dynamic safety reserve $S_{b,c,t}(\alpha)$ |

---

### 3.3 Decision Variables

| Variable | Domain | Operational Meaning |
| :--- | :--- | :--- |
| $x_{b,h,g_d,g_r,c,a,u,t}$ | $\mathbb{Z}_{\ge 0}$ | Number of units of component $c$, donor group $g_d$, residual age $a$ dispatched from bank $b$ to hospital $h$ to fulfill request $g_r$, urgency $u$ at time $t$ |
| $y_{b,b',g,c,a,t}$ | $\mathbb{Z}_{\ge 0}$ | Number of units of component $c$, group $g$, age $a$ transferred laterally from source bank $b$ to destination bank $b'$ at time $t$ |
| $I_{b,g,c,a,t}$ | $\mathbb{Z}_{\ge 0}$ | Physical inventory of component $c$, group $g$, age $a$ held in bank $b$ at the end of time $t$ |
| $s_{h,g_r,c,u,t}$ | $\mathbb{Z}_{\ge 0}$ | Unfulfilled shortage for hospital $h$, recipient group $g_r$, component $c$, urgency $u$ at time $t$ |
| $w_{b,g,c,t}$ | $\mathbb{Z}_{\ge 0}$ | Expired units of component $c$, group $g$ discarded at bank $b$ at the conclusion of time $t$ |
| $v_{b,c,t}$ | $\mathbb{R}_{\ge 0}$ | Magnitude of safety reserve deficit below $S_{b,c,t}(\alpha)$ at bank $b$ for component $c$ at time $t$ |

---

### 3.4 Multi-Objective Cost Function
The objective function minimizes total network risk and operational cost:

$$\min \mathcal{J} = \sum_{t=1}^{T} \left( \mathcal{J}^{\text{short}}_t + \mathcal{J}^{\text{expiry}}_t + \mathcal{J}^{\text{transfer}}_t + \mathcal{J}^{\text{dispatch}}_t + \mathcal{J}^{\text{reserve}}_t \right)$$

Where each component is defined as:

1. **Clinical Shortage Penalty** (heavily weighted against STAT trauma stockouts):
   $$\mathcal{J}^{\text{short}}_t = \sum_{h \in \mathcal{H}} \sum_{g_r \in \mathcal{G}} \sum_{c \in \mathcal{C}} \sum_{u \in \mathcal{U}} c^{\text{short}}_{u,c} \cdot s_{h,g_r,c,u,t}$$
   *(Calibration: $c^{\text{short}}_{\text{STAT}} = 10,000$; $c^{\text{short}}_{\text{URGENT}} = 2,500$; $c^{\text{short}}_{\text{ROUTINE}} = 500$)*

2. **Perishable Wastage / Expiration Penalty**:
   $$\mathcal{J}^{\text{expiry}}_t = \sum_{b \in \mathcal{B}} \sum_{g \in \mathcal{G}} \sum_{c \in \mathcal{C}} c^{\text{exp}}_c \cdot w_{b,g,c,t}$$
   *(Calibration: $c^{\text{exp}}_{\text{PLT}} = 1,200$; $c^{\text{exp}}_{\text{PRBC}} = 800$; $c^{\text{exp}}_{\text{WB}} = 700$; $c^{\text{exp}}_{\text{FFP}} = 400$)*

3. **Inter-Bank Lateral Transshipment Logistics Cost**:
   $$\mathcal{J}^{\text{transfer}}_t = \sum_{b \in \mathcal{B}} \sum_{b' \in \mathcal{B} \setminus \{b\}} \sum_{g \in \mathcal{G}} \sum_{c \in \mathcal{C}} \sum_{a \in \mathcal{A}_c} c^{\text{trans}}_{b,b'} \cdot y_{b,b',g,c,a,t}$$

4. **Hospital Delivery Dispatch Cost**:
   $$\mathcal{J}^{\text{dispatch}}_t = \sum_{b \in \mathcal{B}} \sum_{h \in \mathcal{H}} \sum_{g_d \in \mathcal{G}} \sum_{g_r \in \mathcal{G}} \sum_{c \in \mathcal{C}} \sum_{a \in \mathcal{A}_c} \sum_{u \in \mathcal{U}} c^{\text{hosp}}_{b,h} \cdot x_{b,h,g_d,g_r,c,a,u,t}$$

5. **Dynamic Safety Reserve Violation Penalty**:
   $$\mathcal{J}^{\text{reserve}}_t = \sum_{b \in \mathcal{B}} \sum_{c \in \mathcal{C}} c^{\text{res}}_c \cdot v_{b,c,t}$$
   *(Calibration: $c^{\text{res}}_c = 600$)*

---

### 3.5 Structural Constraints

#### Constraint 1: Hospital Demand Fulfillment & Shortage Balance
For every hospital $h$, recipient blood group $g_r$, component $c$, urgency tier $u$, and day $t$:

$$\sum_{b \in \mathcal{B}} \sum_{g_d \in \mathcal{G}} \sum_{a=1}^{\text{SL}_c} \Omega_{g_d, g_r, c} \cdot x_{b,h,g_d,g_r,c,a,u,t} + s_{h,g_r,c,u,t} = R_{h,g_r,c,u,t}$$

*(Ensures demand is satisfied only by immunologically compatible donor units, or accounted for as an explicit shortage).*

#### Constraint 2: Strict Biological Compatibility Gating
For all $b, h, g_d, g_r, c, a, u, t$:

$$x_{b,h,g_d,g_r,c,a,u,t} \le M \cdot \Omega_{g_d, g_r, c}$$

*(Where $M$ is a sufficiently large integer; forces allocation to strictly zero whenever $\Omega_{g_d, g_r, c} = 0$, enforcing inverted plasma rules vs RBC rules).*

#### Constraint 3: Inventory Mass Balance & Perishable Age Transition
For every blood bank $b$, blood group $g$, component $c$, and day $t$:

**Case 3a: Fresh Inflow Units ($a = \text{SL}_c$):**
$$I_{b,g,c,\text{SL}_c,t} = W_{b,g,c,t} - \sum_{h \in \mathcal{H}} \sum_{g_r \in \mathcal{G}} \sum_{u \in \mathcal{U}} x_{b,h,g,g_r,c,\text{SL}_c,u,t} - \sum_{b' \neq b} y_{b,b',g,c,\text{SL}_c,t} + \sum_{b'' \neq b : \tau_{b'',b} = 1} y_{b'',b,g,c,\text{SL}_c,t-1}$$

**Case 3b: Intermediate Aging Cohorts ($1 \le a \le \text{SL}_c - 1$):**
$$I_{b,g,c,a,t} = I_{b,g,c,a+1,t-1} - \sum_{h \in \mathcal{H}} \sum_{g_r \in \mathcal{G}} \sum_{u \in \mathcal{U}} x_{b,h,g,g_r,c,a+1,u,t} - \sum_{b' \neq b} y_{b,b',g,c,a+1,t} + \sum_{b'' \neq b : \tau_{b'',b} = 1} y_{b'',b,g,c,a+1,t-1}$$

*(This equation formalizes biological perishability: inventory aged $a+1$ yesterday that is not dispatched or transferred today transitions deterministically into inventory aged $a$ today).*

#### Constraint 4: Outdating & Biological Discard Formulation
Units that reached residual life $a = 1$ at day $t-1$ and were neither allocated to hospital patients nor transferred during day $t$ cannot be held further and expire:

$$w_{b,g,c,t} = I_{b,g,c,1,t-1} - \sum_{h \in \mathcal{H}} \sum_{g_r \in \mathcal{G}} \sum_{u \in \mathcal{U}} x_{b,h,g,g_r,c,1,u,t} - \sum_{b' \neq b} y_{b,b',g,c,1,t}$$

$$\text{with } w_{b,g,c,t} \ge 0$$

#### Constraint 5: Outflow Availability Bound
Total dispatches and transfers of group $g$, component $c$, age $a$ from bank $b$ at time $t$ cannot exceed available stock:
- For $a = \text{SL}_c$:
  $$\sum_{h \in \mathcal{H}} \sum_{g_r \in \mathcal{G}} \sum_{u \in \mathcal{U}} x_{b,h,g,g_r,c,\text{SL}_c,u,t} + \sum_{b' \neq b} y_{b,b',g,c,\text{SL}_c,t} \le W_{b,g,c,t}$$
- For $1 \le a \le \text{SL}_c - 1$:
  $$\sum_{h \in \mathcal{H}} \sum_{g_r \in \mathcal{G}} \sum_{u \in \mathcal{U}} x_{b,h,g,g_r,c,a,u,t} + \sum_{b' \neq b} y_{b,b',g,c,a,t} \le I_{b,g,c,a,t-1}$$

#### Constraint 6: Dynamic Safety Reserve Deficit Tracking
For each blood bank $b$, component $c$, and day $t$:

$$\sum_{g \in \mathcal{G}} \sum_{a=1}^{\text{SL}_c} I_{b,g,c,a,t} + v_{b,c,t} \ge S_{b,c,t}(\alpha)$$

$$v_{b,c,t} \ge 0$$

*(If total physical inventory at bank $b$ falls below the dynamic lead-time quantile reserve $S_{b,c,t}(\alpha)$, slack variable $v_{b,c,t}$ becomes positive, incurring penalty $c^{\text{res}}_c$).*

#### Constraint 7: Physical Cold-Vault Capacity
For each blood bank $b$ and day $t$:

$$\sum_{g \in \mathcal{G}} \sum_{c \in \mathcal{C}} \sum_{a=1}^{\text{SL}_c} I_{b,g,c,a,t} \le \text{Cap}_b$$

#### Constraint 8: Non-Negativity & Integrality
$$x_{b,h,g_d,g_r,c,a,u,t} \in \mathbb{Z}_{\ge 0}, \quad y_{b,b',g,c,a,t} \in \mathbb{Z}_{\ge 0}, \quad I_{b,g,c,a,t} \in \mathbb{Z}_{\ge 0}$$
$$s_{h,g_r,c,u,t} \in \mathbb{Z}_{\ge 0}, \quad w_{b,g,c,t} \in \mathbb{Z}_{\ge 0}, \quad v_{b,c,t} \in \mathbb{R}_{\ge 0}$$

---

## 4. Event-Triggered Re-Planning Protocol (Rolling Horizon)

```
 [Routine Execution] ---> (Continuous Telemetry & Order Ingestion)
                                    |
                            [Trigger Monitor]
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
   Condition 1:              Condition 2:              Condition 3:
 Demand Surge Delta       Reserve Deficit Breach    Transport Delay Spike
 |Delta D| > theta_surge    v_{b,c,t} > theta_res    tau_delay > theta_delay
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
                     [IS RE-PLAN TRIGGERED? YES]
                                    |
               1. Freeze in-transit batches y (committed)
               2. Update initial inventory I_{b,g,c,a,t_now}
               3. Recompute Quantiles Q_{b,c,t}(alpha)
               4. Re-solve MILP over [t_now, t_now + H]
               5. Commit period t_now dispatch schedule
```

### 4.1 Trigger Conditions
The system executes on a rolling horizon of $H = 7$ days. Re-optimization is invoked at daily boundary $t$, but is also **immediately triggered intraday** if any of four state criteria occur:

1. **Surge Demand Trigger**:
   $$\sum_{g, c, u} R_{h,g,c,u,t_{\text{now}}} - \mathbb{E}[D_{h,c,t_{\text{now}}}] > \theta_{\text{surge}} \cdot \sigma_{D_{h,c}}$$
   *(A mass-casualty or major trauma surge exceeding normal confidence thresholds; default $\theta_{\text{surge}} = 2.5$).*

2. **Safety Reserve Depletion Trigger**:
   $$v_{b,c,t_{\text{now}}} > \theta_{\text{reserve}} \cdot S_{b,c,t_{\text{now}}}(\alpha)$$
   *(Physical stock breached more than $\theta_{\text{reserve}} = 30\%$ below target reserve).*

3. **Cold-Chain Transport Disruption Trigger**:
   $$\tau_{\text{actual}}(y_{b,b'}) - \tau_{\text{planned}}(y_{b,b'}) > \theta_{\text{delay}}$$
   *(Inter-bank transfer transit breakdown delaying delivery past $\theta_{\text{delay}} = 4\text{ hours}$).*

4. **Near-Expiry Batch Clustering Trigger**:
   $$\sum_{g} I_{b,g,c,a \le 2, t_{\text{now}}} > \theta_{\text{expiry}} \cdot \sum_{\tau=1}^{2} \mathbb{E}[D_{b,c,t+\tau}]$$
   *(Perishable batches with $\le 48$h remaining exceed local short-term clinical absorption capacity by $\theta_{\text{expiry}} = 1.4$, requiring proactive transfer to high-volume trauma centers).*

---

## 5. Comparison: What is Genuinely Different in the Proposed Model?

| Feature / Architectural Component | Standard Literature (e.g. Gunpinar 2015, Dehghani 2021) | Proposed BloodBridge AI Phase 2 Model | Genuine Technical Differentiation |
| :--- | :--- | :--- | :--- |
| **Safety Stock Definition** | Static buffer parameter ($k \sigma \sqrt{L}$) or ad-hoc penalty | Conditional demand quantile over lead time $S_{b,c,t}(\alpha) = Q_\alpha(\sum_{1}^L D_{t+\tau})$ | Directly driven by machine-learning predictive distribution; mathematically eliminates uncertainty double-counting. |
| **Coordination Scope** | Single central depot $\rightarrow$ hospital network | Multi-bank peer-to-peer network ($\mathcal{B} \times \mathcal{B}$) + hospital network ($\mathcal{B} \times \mathcal{H}$) | Simultaneously optimizes inter-bank lateral rebalancing and patient-level hospital allocations. |
| **Perishability Representation** | Often single component (Platelets only or RBC only) or continuous decay | Discrete age cohorts $a \in \{1,\dots, \text{SL}_c\}$ across all 5 biological components | Models distinct biological shelf-life interactions (5d Platelets vs 42d RBC vs 365d FFP) within the same network. |
| **Immunological Compatibility** | Strict identical match or RBC-only substitution | Bidirectional component-specific matrix $\Omega_{g_d, g_r, c}$ | Inverted compatibility for Plasma/Cryo (AB universal donor) vs PRBC/WB (O universal donor) strictly enforced via constraint. |
| **Execution Architecture** | Static open-loop batch run | Closed-loop rolling horizon with event-triggered re-planning | Responds intraday to emergency trauma surges, reserve breaches, and transit delays without waiting for overnight batch run. |

---

## 6. Assumptions & Unresolved Questions for Review

### 6.1 Explicit Modeling Assumptions
1. **Discrete Daily Time-Steps**: For the mathematical program, planning intervals are discretized into 24-hour periods ($\Delta t = 1$ day), while intraday emergency orders are handled via the event-triggered re-planning mechanism.
2. **Deterministic Intra-City Transit (Under Non-Disrupted States)**: Under normal conditions, transit times between regional blood banks in the same metro cluster are $\le 2$ hours ($\tau_{b,b'} = 0$ for same-day delivery, or $\tau_{b,b'} = 1$ for overnight transfers).
3. **No Quality Degradation Prior to Expiry**: Blood components stored within regulated temperature ranges (2°C–6°C for RBC, 20°C–24°C for platelets, $\le -18$°C for FFP) retain full clinical efficacy until age $a = 1$, after which they are discarded.
4. **Linear Logistics Transport Cost**: Inter-bank transport costs are modeled as affine functions of road distance ($c^{\text{trans}}_{b,b'} = \kappa_0 + \kappa_1 d_{b,b'}$).

### 6.2 Unresolved Questions for User Review Before Simulator Implementation
1. **Network Topology Selection for Phase 3 Simulator**:
   - Confirm that the simulator will default to **Option 1 (5 banks, 12 hospitals)** for all primary benchmark runs, with a configuration flag enabling **Option 2 (3 banks, 6 hospitals)** for quick test runs and solver validation.
2. **Solver Architecture for In-Browser vs Backend**:
   - The MILP formulation contains approximately $5 \times 12 \times 8 \times 8 \times 5 \times 42 \times 3 \approx 2.4 \times 10^6$ potential decision variables across a 7-day horizon. In full unconstrained form, this requires a commercial/open-source solver (e.g., HiGHS, CBC, or Python SciPy/PuLP in `ml_service/`). For the in-browser React interface, a fast primal heuristic / rolling decomposition must be calibrated to provide $<500$ms response times.
3. **Quantile Estimation Method**:
   - Confirm whether the demand quantile $Q_\alpha$ should be computed via empirical historical quantile rolling windows, parametric Negative-Binomial fitting, or Pinball-loss Gradient Boosted Quantile Regression.
