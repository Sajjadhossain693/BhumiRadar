# BhumiRadar — Product Requirements Document (PRD)

**Project Name**: BhumiRadar (স্মার্ট ভূমি প্রশাসন ও ভূমি রেকর্ড স্বচ্ছতা পোর্টাল)  
**Sponsoring Authority**: Ministry of Land, Government of the People's Republic of Bangladesh  
**Document Version**: 2.4.0  
**Status**: Approved & Implemented  
**Date**: October 2026  

---

## 1. Executive Summary & Purpose

Land governance in Bangladesh represents one of the most critical socio-economic touchpoints in public administration. Approximately 70–80% of civil litigation in Bangladesh courts traces back to land disputes, boundary overlaps, forged Powers of Attorney, fraudulent mutations, and unauthorized encroachment upon government Khas (public) land and water bodies.

**BhumiRadar** is an intelligent, bilingual, satellite-assisted land governance and audit transparency portal. It bridges the gap between field-level land administration offices (Upazila Land Office / AC Land, Sub-Registry, Kanungo, Land Acquisition branch) and the citizens of Bangladesh. By combining GIS polygon boundary matching, automated cross-khatian anomaly detection, statutory minimum mouza rate enforcement, crowdsourced encroachment reporting, and a tamper-evident NIST FIPS 180-4 cryptographic action ledger, BhumiRadar delivers unprecedented transparency and operational velocity to land administration.

---

## 2. Target User Personas

| Persona | Role | Key Objectives & Pain Points |
| :--- | :--- | :--- |
| **Sadharan Nagorik (Citizen / Landowner)** | Citizen / Buyer / Inheritor | Seeks to verify land ownership before purchase, detect hidden legal disputes, verify if land is Khas/Vested, compute accurate deed registration taxes, track acquisition compensation, and report illegal grabbing anonymously. |
| **AC (Land) / Assistant Commissioner** | Upazila Revenue & Magisterial Authority | Needs instant mismatch alerts on mutation applications, spatial overlap detection, tracking of court injunctions, and verifiable cryptographic logs of all land record mutations. |
| **Sub-Registrar (Nibondhok)** | Ministry of Law / Registration Directorate | Needs to verify minimum government mouza rates to prevent stamp duty evasion, cross-check Power of Attorney validity in real time, and confirm seller ownership chains before executing deeds. |
| **Additional Deputy Commissioner (LA Branch)** | District Land Acquisition Officer | Requires accurate plot-by-plot award compensation calculations under ARIPA 2017 (200% public / 300% private premium), ownership dispute resolution, and transparent direct-disbursement tracking. |
| **Kanungo / Union Land Assistant Officer (Tahsildar)** | Field Cadastral & Demarcation Officer | Requires mobile-responsive field tools to inspect reported encroachments, cross-reference CS/SA/RS/BS cadastral layers, and conduct spatial spot-checks. |

---

## 3. Core Functional Modules & Scope

BhumiRadar is structured into **17 integrated modules** spanning four strategic governance pillars:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   BhumiRadar Unified Governance Framework               │
├───────────────────┬────────────────────┬─────────────────┬─────────────┤
│ I. Verification   │ II. Anti-Fraud &   │ III. Public     │ IV. Fiscal  │
│    & Spatial GIS  │     Encroachment   │      Integrity  │     & Legal │
├───────────────────┼────────────────────┼─────────────────┼─────────────┤
│ • Cadastral GIS   │ • Khas Radar       │ • Citizen Crime │ • Mouza     │
│ • Record Matcher  │ • River Encroach   │   Reporting     │   Valuation │
│ • Disputed Plots  │ • PoA Sentinel     │ • Cryptographic │ • LA Direct │
│ • Khatiyan Chain  │ • Anomaly Engine   │   Action Ledger │   Compensate│
│ • Zoning Explorer │ • Boundary Audit   │ • Gov Officer   │ • Tax Audit │
│                   │                    │   Portal        │ • Legal Feed│
└───────────────────┴────────────────────┴─────────────────┴─────────────┘
```

### Pillar I: Cadastral Verification & Spatial Intelligence
1. **Interactive Cadastral GIS Canvas**: Real-time Leaflet GIS rendering of Mouza plots, CS/SA/RS/BS boundaries, coordinate inspection, and satellite/topographic layer switching.
2. **Four-Tier Record Mismatch Detection**: Cross-references CS (Cadastral Survey), SA (State Acquisition), RS (Revisional Survey), and BS/City Survey records to spot area discrepancies, spelling inconsistencies, and unrecorded mutations.
3. **Khas, Vested & Waqf Red-Flagging**: Visual red-highlighting and automated boundary locks on plots classified as Government Khas, Enemy/Vested Property, River/Wetland, or Debottor estate.
4. **Ownership Chain & Genealogy Tracker**: Reconstructs generational transfer chains (Inheritance / Farayej, Sale deeds, Heba, Court decrees) to highlight broken links.
5. **Agricultural & Ecological Zoning Engine**: Surfaces land-use classification (Agricultural, Commercial, Residential, Wetland, Forest reserve) to prevent illegal conversion.

### Pillar II: Anti-Fraud & Encroachment Prevention
6. **Crowdsourced Citizen Encroachment Reporting**: Enables citizens and whistleblowers to submit geo-tagged incident reports with photo evidence, Khas plot tags, and anonymous submission options.
7. **Power of Attorney (PoA) Sentinel**: Validates registered PoA deeds against Section 10/11 of the PoA Act 2012, flagging unregistered revocations, expired mandates, and multi-district overlap fraud.
8. **Riverbank & Wetland Encroachment Tracker**: Monitors riverbank erosion (Nodi-Bhangon) and accretion (Char emergence), enforcing government ownership over newly surfaced silt land under Section 86/87 of the State Acquisition and Tenancy Act 1950.
9. **Heirship & Farayej Quota Validator**: Validates Muslim/Hindu inheritance shares to ensure female heirs and co-sharers (Shariks) are not excluded during mutations.

### Pillar III: Public Integrity & Cryptographic Audit
10. **Cryptographic Action Ledger**: Every mutation approval, encroachment investigation, boundary update, and valuation schedule edit is written as a hash-linked block using pure FIPS 180-4 SHA-256. Tampering with any historical block breaks the cryptographic chain with instant UI warning.
11. **Bifurcated Role-Based Portals**: Clean separation of views between public citizen searches and authenticated officer dashboards (AC Land, Sub-Registrar, LA Collector).
12. **Printable Official Land Verification Certificates**: Generates official, tamper-verifiable PDF reports with the national emblem, QR-verification code, cryptographic hash, and bilingual metadata.

### Pillar IV: Fiscal Transparency & Statutory Valuation
13. **Smart Mouza Valuation Engine**: Enforces government gazetted minimum mouza rates per decimal across land classifications, computing stamp duty (1.5%), registration fee (1%), local government tax (2-3%), and advance income tax (AIT Sec 53H). Instantly flags tax evasion when declared deed value falls below gazetted rates.
14. **Direct Land Acquisition (LA) Compensation Engine**: Implements the Acquisition and Requisition of Immovable Property Act 2017 (ARIPA) formula: 200% statutory premium for government infrastructure and 300% for non-government acquisitions, complete with direct BEFTN disbursement simulation.
15. **Court Case & Injunction Sentinel**: Tracks civil court title suits, temporary injunctions (Order 39, CPC), and land survey tribunal cases linked directly to plot numbers.
16. **Bilingual Engine (Bangla-First)**: Complete interface, numeral rendering, and legal terminology available in Bengali (`bn-BD`) and English (`en-US`).
17. **Offline-Resilient Client State Architecture**: Zero-downtime client-side state caching with immediate reactive updates.

---

## 4. Non-Functional Requirements (NFR)

- **Performance**: Sub-50ms cryptographic chain recalculation and block verification on 100+ transactions in standard desktop/mobile browsers.
- **Portability**: Pure zero-dependency client architecture with zero external binary or cloud vendor lock-in. Builds into optimized static assets deployable on any CDN or edge web server.
- **Security & Data Integrity**:
  - Deterministic RFC-8785 Canonical JSON sorting for hash repeatability.
  - XSS and HTML injection prevention across all citizen reporting and deed input fields.
  - Zero exposure of confidential citizen NID biometric hashes in public responses.
- **Accessibility & Usability**: Full support for Bengali typography (Noto Sans Bengali / Kalpurush), mobile touch viewports, and high-contrast alert badges for field officers.

---

## 5. Success Metrics & Key Results (OKRs)

- **95% Reduction** in manual calculation errors for deed registration taxes and stamp duties.
- **100% Auditability** of all land record mutations via tamper-evident cryptographic hash chains.
- **Zero Accidental Transfers** of recorded Khas or Vested property via automated boundary locking.
- **70% Acceleration** in Land Acquisition compensation claim verifications.
