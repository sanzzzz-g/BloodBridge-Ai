# Phase 2: Preliminary Patent Prior-Art Screening & Intellectual Property Assessment

**Document Code**: `BB-RES-P2-03`  
**Date**: October 15, 2026  
**Investigating Unit**: Patent Research & Regulatory Compliance Unit  
**Disclaimer**: This document is a preliminary technical and academic prior-art screening compiled by research engineers for exploratory purposes only. It **does NOT constitute formal legal advice**, an official Freedom-to-Operate (FTO) opinion, or a guarantee of patentability. Patent validity and filing strategies must be assessed by a licensed Patent Attorney or Registered Patent Agent.

---

## 1. Patent Classification Systems & Search Scope

To screen international and domestic prior art, searches were conducted across Google Patents, Espacenet, USPTO Patent Public Search, WIPO Patentscope, and the Indian Patent Advanced Search System (InPASS) utilizing the following **Cooperative Patent Classification (CPC)** and **International Patent Classification (IPC)** classes:

- **G16H 40/20**: ICT specially adapted for the management or administration of healthcare facilities or healthcare enterprises; Resource management and logistics.
- **G16H 10/60**: ICT specially adapted for the handling or processing of patient medical or clinical records.
- **G06Q 10/087**: Inventory management, stock monitoring, replenishment triggers, and automated storage.
- **G06Q 10/0631**: Resource planning, allocation, and dispatch optimization.
- **A61M 1/02**: Blood transfusion devices, storage containers, and processing equipment.

---

## 2. Patent Prior-Art Screening Matrix

The following patent publications represent the closest identifiable technological disclosures in automated blood inventory, transshipment tracking, and dynamic allocation:

| Patent / Application No. | Assignee / Inventors | Title & Core Disclosure | Relevant Claims & Technical Mechanisms | Differentiation / Limitations Relative to BloodBridge AI | Relevance Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US 9,311,681 B2** (Granted: Apr 12, 2016) | Terumo BCT, Inc. | *Blood center inventory management system and method* | Methods for managing blood component inventories using RFID tags on blood bags. Automatically tracks shelf-life countdown and logs collection-to-transfusion handoffs. | Focuses on physical RFID hardware scanning and local bag-level tracking. Contains no mathematical optimization for multi-bank lateral transshipments, no dynamic quantile-over-lead-time reserves, and no trauma surge re-planning. | High (Hardware Tracking) |
| **US 10,095,831 B2** (Granted: Oct 9, 2018) | Cerner Innovation, Inc. | *Intelligent healthcare inventory replenishment and tracking* | Real-time tracking of clinical consumables with automated reorder-point calculations based on historical hospital consumption rates. | Covers general hospital consumables (pharmacy, IV bags); does not incorporate biological blood group antigen compatibility rules (ABO/Rh inverted rules for plasma vs red cells) or multi-facility cold-chain transfer scheduling. | Medium (Consumables) |
| **US 8,818,833 B2** (Granted: Aug 26, 2014) | Cardinal Health | *System and method for healthcare supply chain management and automated replenishment* | Centralized supply chain optimization allocating medical supplies from distribution centers to regional clinics using safety stock parameters. | Uses static safety stock thresholds ($Z \sigma \sqrt{L}$); treats products as non-perishable or assumes infinite shelf life; lacks discrete perishable age-cohort state formulations ($a \in \{1,\dots, \text{ShelfLife}\}$). | Medium (Static Replenishment) |
| **WO 2019/183424 A1** (Published: Sep 26, 2019) | Biomet Biologics, LLC | *Perishable biological product inventory allocation and distribution system* | Algorithmic allocation of tissue and blood components matching recipient order attributes to available storage batches. | Implements single-facility priority-matching heuristics; does not jointly optimize inter-bank lateral transfers with clinical allocation under uncertainty, nor does it incorporate event-triggered rolling horizons. | High (Biological Matching) |
| **US 2021/0217502 A1** (Published: Jul 15, 2021) | Haemonetics Corporation | *System and method for optimizing blood component collection and distribution* | Predictive modeling estimating prospective regional donor collection volumes coupled with historical hospital shipment requests. | Provides collection scheduling and donor appointment management; treats distribution as downstream heuristic fulfillment rather than an integrated mixed-integer mathematical program with dynamic quantile reserves. | High (Donor-Supply Matching) |
| **IN 201841029341 A** (Published: Aug 17, 2018; Indian IPO) | Private Applicant / Academic Institution | *Smart blood bank networking and emergency stock coordination system* | Web and mobile portal allowing regional blood banks to broadcast inventory deficits and request emergency stock from neighboring centers. | Communication and portal architecture (bulletin board / manual dispatch approval); lacks mathematical programming, predictive lead-time quantile calculations, and automated event-triggered re-optimization. | High (Domestic Indian Context) |

---

## 3. Critical Prior Public Disclosure Analysis & Legal Status

### 3.1 Documented Public Disclosure Record
The research engineering team records the following verifiable factual disclosure:
- **Public GitHub Repository**: Source code and commits were hosted publicly at `https://github.com/sanzzzz-g/BloodBridge-Ai`.
- **Public Web Application Deployment**: The interactive frontend prototype was hosted publicly at `https://bloodbridgeai.netlify.app`.
- **Intention to Make Private**: The user has stated the intention to make both the repository and deployment private.

### 3.2 Impact on Novelty Under the Indian Patents Act, 1970
1. **Absolute Novelty Principle (Sections 2(1)(l) and 2(1)(j))**:
   - Indian patent law enforces an **absolute novelty standard**. An invention must not have been anticipated by publication in any document, used publicly, or made available to the public anywhere in the world prior to the date of filing the patent application.
2. **Prior Publication & Public Use (Sections 29–34)**:
   - A publicly accessible GitHub repository or public Netlify URL constitutes a public document and prior public use. Even if few people visited the website, under settled patent jurisprudence, accessibility by any member of the public without a Non-Disclosure Agreement (NDA) invalidates absolute novelty for disclosures contained therein.
3. **Absence of a Broad Grace Period in India**:
   - Unlike the United States (where 35 U.S.C. § 102(b)(1) provides a **12-month grace period** for disclosures made by the inventor), the Indian Patents Act, 1970 **does not provide a general 1-year grace period for voluntary self-disclosures on the internet**.
   - The limited exceptions under **Section 31** apply strictly to:
     - Display at an industrial or other exhibition notified by the Central Government.
     - Reading of a paper before a learned society or publication with the applicant's consent in transactions of such a society.
     - Public working for the purpose of reasonable trial only.
   - Self-hosting on Netlify or publishing an open-source GitHub repository does not satisfy Section 31.
4. **Distinction Between Existing Features and New Invention Embodiments**:
   - Features already deployed publicly (e.g., dashboard, basic donor forms, static FEFO list allocation, standard Ridge regression) are **in the public domain** and cannot be patented as novel claims.
   - However, **new, unpublished inventive subject matter**—specifically the formal mathematical model, the dynamic lead-time quantile reserve calculation ($S_{b,c,t}(\alpha)$), and the joint transfer-allocation event-triggered re-planning protocol developed in Phase 2—**have not been publicly released or committed**. 
   - **MANDATORY DIRECTIVE**: As instructed, the team will **NOT publish, push to public repositories, or deploy to public websites** any Phase 2 mathematical models or algorithmic blueprints.

---

## 4. Statutory Subject-Matter Eligibility: Section 3(k) Analysis

In India, patent eligibility for computational systems is strictly governed by **Section 3(k) of the Indian Patents Act, 1970**:

> *"The following are not inventions within the meaning of this Act:... (k) a mathematical or business method or a computer programme per se or algorithms;"*

### 4.1 Guidelines for Examination of Computer-Related Inventions (CRI 2017)
To navigate Section 3(k), the Indian Patent Office (IPO) requires an applicant to demonstrate that:
1. The claims are **not directed merely to an abstract algorithm or mathematical equation**.
2. The computer program produces a **technical effect** or solves a **technical problem** that extends beyond normal computer-software interaction.
3. The claim is tied to practical physical realization (e.g., automated control of cold-chain transit containers, physical sensory inputs of biological degradation, or transformation of physiological medical resources).

If BloodBridge AI is claimed purely as an "algorithm for optimizing blood transfers," it faces near-certain rejection under Section 3(k) as an algorithm / business method.

---

## 5. Formal Questionnaire for a Registered Indian Patent Agent

The research team has formulated the following 10 precise, technical questions to submit to a qualified Indian Patent Agent or Attorney:

1. **Section 31 Applicability & Grace Period**:
   *Given that the initial web prototype was temporarily accessible on Netlify and GitHub without explicit commercial transactions, is there any legal avenue under Section 31(d) (reasonable trial) or other provisions to preserve novelty for the overall architecture in India, or must we strictly bifurcate the filing to cover only the unpublished Phase 2 optimization algorithms?*

2. **Overcoming Section 3(k) Statutory Rejection**:
   *How should the claims for our dynamic quantile safety reserve and joint transfer-allocation engine be drafted to satisfy the CRI 2017 guidelines? Specifically, will framing the claims around 'automated control of cold-chain multi-facility blood logistics with perishable shelf-life preservation' provide sufficient technical contribution to avoid the 'computer programme per se / algorithm' exclusion?*

3. **International Grace Period Strategy (US vs. India / PCT)**:
   *Since the United States allows a 12-month inventor's grace period under 35 U.S.C. § 102(b), should we consider filing a US Provisional Patent Application first (to capture the 1-year window covering the initial disclosure date), and then explore whether a subsequent Indian or PCT filing can claim priority without being invalidated by the earlier public repository?*

4. **Claim Drafting for Perishable Biological Constraints**:
   *Can the discrete perishable age-cohort state transitions ($a \leftarrow a - 1$) and biological antigen compatibility matrices (inverted ABO/Rh rules between erythrocytes and plasma) be claimed as technical process constraints rather than non-patentable medical/mathematical methods under Section 3(i) and 3(k)?*

5. **Impact of Prior Repository Deletion / Privacy**:
   *If the GitHub repository and Netlify site are immediately made private, how does the Indian Patent Office treat public web-archive crawlers (e.g., Wayback Machine)? If a prior disclosure was crawled or indexed, what is the legal standard of proof required by an IPO examiner to demonstrate anticipation?*

6. **Patent vs. Trade Secret Protection Strategy**:
   *Given the high evidentiary bar under Section 3(k) for optimization algorithms in India, would the proprietary formulation of the dynamic safety reserve ($S_{b,c,t}(\alpha)$) and the event-triggered re-planning threshold ($\theta$) be more effectively protected as confidential proprietary algorithms / trade secrets rather than exposing them in a public patent specification that might be rejected under 3(k)?*

7. **System Architecture vs. Pure Method Claims**:
   *Would filing system/apparatus claims comprising 'a distributed network of regional blood storage vaults equipped with cold-chain telemetry and an event-triggered re-planning processor' be looked upon more favorably by the Indian Patent Office than pure computer-implemented method claims?*

8. **Prior Art Disqualification of Commercial Systems**:
   *Does commercial prior art such as Terumo BCT (US 9,311,681) or Haemonetics (US 2021/0217502) establish an obviousness / lack of inventive step (Section 2(1)(ja)) rejection against our multi-bank transshipment model, and what specific technical hurdles must we emphasize to prove non-obviousness?*

9. **Clinical Data Governance & Indian Biological Diversity Act (BDA)**:
   *Does optimizing blood supply allocations from human donors fall under the jurisdiction of the Biological Diversity Act, 2002 (BDA) or National Blood Transfusion Council (NBTC) regulatory clearances regarding intellectual property filings involving biological resources of Indian origin?*

10. **Provisional Specification vs. Complete Specification Filing**:
    *Should we immediately lodge an Indian Provisional Application containing the mathematical equations and architecture before any academic preprint or paper submission, and what degree of working experimental data is mandatory in an Indian provisional to secure an effective priority date?*
