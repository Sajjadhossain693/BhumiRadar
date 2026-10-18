# BhumiRadar — Statutory & Business Governance Rules (RULES)

**Statutory Matrix, Legal Invariants & Regulatory Safeguards**  
**Jurisdiction**: Bangladesh Land Law Framework  
**Version**: 2.4.0  

---

## 1. Statutory Legal Matrix

BhumiRadar encodes the statutory laws of Bangladesh directly into automated business logic and validation rules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Bangladesh Statutory Land Law Hierarchy               │
├───────────────────────────────┬────────────────────────────────────────┤
│ Primary Act / Ordinance       │ Statutory Application in BhumiRadar    │
├───────────────────────────────┼────────────────────────────────────────┤
│ State Acquisition and         │ Sec 143/144: Khatian record of rights, │
│ Tenancy Act, 1950 (SATA)      │ mutation workflow, Sec 86/87: Diluvion │
│                               │ (Bhangon) and Alluvion (Char) custody. │
├───────────────────────────────┼────────────────────────────────────────┤
│ Power of Attorney Act, 2012   │ Sec 10/11: Mandate validity, 30-day   │
│ & PoA Rules, 2015             │ revocation window, overseas execution. │
├───────────────────────────────┼────────────────────────────────────────┤
│ Acquisition & Requisition of  │ Sec 4, 7, 8: 200% premium for public   │
│ Immovable Property Act, 2017  │ acquisitions, 300% for non-govt, direct│
│ (ARIPA 2017)                  │ award compensation calculations.       │
├───────────────────────────────┼────────────────────────────────────────┤
│ The Registration Act, 1908    │ Mandatory registration of transfers,   │
│ & The Stamp Act, 1899         │ 1.5% Stamp Duty, 1.0% Registration Fee.│
├───────────────────────────────┼────────────────────────────────────────┤
│ Income Tax Act, 2023          │ Sec 53H: Advance Income Tax (AIT)      │
│                               │ on deed transfers vs Mouza rates.      │
├───────────────────────────────┼────────────────────────────────────────┤
│ Vested Property Return        │ Non-transferable state custodian locks │
│ Act, 2001 (and amendments)    │ on declared Vested / Enemy property.   │
├───────────────────────────────┼────────────────────────────────────────┤
│ Natural Water Reservoir       │ Prohibition of zoning changes on river,│
│ Conservation Act, 2000        │ canal, haor, beel, and wetland plots.  │
└───────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. Land Classification & Boundary Lock Invariants

### 2.1 Government Khas Land (`খাস জমি`)
- **Rule KHAS-01**: Plots categorized as Khas (Category 1, 2, or 3) are visually rendered in intense red (`#dc2626`) across all GIS cadastral overlays.
- **Rule KHAS-02 (Transfer Block)**: Any attempt to initiate a private deed transfer, sub-registry submission, or mutation application on a Khas plot triggers an instantaneous **CRITICAL HARD BLOCK**.
- **Rule KHAS-03 (Encroachment Prioritization)**: Whistleblower and citizen reports filed on Khas plots are prioritized with high investigative urgency for AC Land inspection.

### 2.2 Vested / Enemy Property (`অর্পিত সম্পত্তি`)
- **Rule VEST-01**: Plots designated under Schedule 'Ka' (non-releasable government leased) or Schedule 'Kha' are permanently flagged with warning badges.
- **Rule VEST-02**: Mutation applications require clearance verification from the District Vested Property Cell.

### 2.3 Riverbank Diluvion & Accretion (`নদী ভাঙন ও চর ভরাট`)
- **Rule CHAR-01 (Diluvion / ভাঙন)**: Under Section 86 of SATA 1950, when land is eroded by a river, the land revenue (Khajna) is abated, and ownership rights remain suspended for up to 30 years.
- **Rule CHAR-02 (Accretion / চর জাগা)**: Under Section 87 of SATA 1950, land emerging from a riverbed vests in the Government as Khas land. Private encroachment on newly emerged Chars is flagged as illegal under the River Conservation framework.

---

## 3. Power of Attorney Sentinel Rules

The Power of Attorney Sentinel implements strict validation checks derived from the *Power of Attorney Act, 2012*:

1. **Rule POA-AUTH**: An irrevocable Power of Attorney (`অপ্রত্যাহারযোগ্য আমমোক্তারনামা`) relating to immovable property must be registered under Section 52A of the Registration Act 1908. Unregistered notarized deeds are rejected.
2. **Rule POA-REVOCATION**: If a principal files an instrument of revocation (`বাতিলকরণ দলিল`), the deed status transitions to `REVOKED` and all pending mutation and registration proceedings linked to the agent are frozen.
3. **Rule POA-EXPIRY**: Standard powers of attorney with defined terms expire automatically upon reaching the sunset date or upon the death of either the principal or the attorney.
4. **Rule POA-JURISDICTION**: Powers executed overseas by Bangladeshi expatriates must bear authentication by the relevant Bangladesh Embassy/High Commission and endorsement by the Ministry of Foreign Affairs, Dhaka.

---

## 4. Fiscal Evasion & Valuation Invariants

1. **Rule VAL-BENCHMARK**: The minimum valuation benchmark is calculated as:
   $$\text{Benchmark} = \text{Plot Area (decimals)} \times \text{Government Mouza Rate per decimal}$$
2. **Rule VAL-UNDERVALUATION**: If $\text{Declared Value} < \text{Benchmark}$:
   - The transaction is flagged with an **Undervaluation Alert** (`রাজস্ব ফাঁকির ঝুঁকি`).
   - All statutory percentages (Stamp Duty, Registration Fee, Local Tax, AIT) are calculated based on the higher government benchmark, preventing loss to the national exchequer.
3. **Rule VAL-SPLIT-EVASION**: The system analyzes historical mutations to detect artificial fragmentation of large commercial plots into smaller residential parcels to evade higher tax brackets.

---

## 5. Direct LA Compensation Invariants (ARIPA 2017)

1. **Rule LA-PREMIUM**:
   - Government Infrastructure Project: $200\%$ statutory addition ($3 \times \text{Base Valuation}$).
   - Non-Government / Commercial Entity Project: $300\%$ statutory addition ($4 \times \text{Base Valuation}$).
2. **Rule LA-AWARD-LOCK**: Once Section 7 preliminary notice is published, no subsequent sale, mutation, or title transfer on the plot is permitted without NOC from the Additional Deputy Commissioner (Land Acquisition).
3. **Rule LA-DISBURSEMENT-AUDIT**: Every payment voucher disbursed to the recorded owner via direct account transfer is recorded in the Cryptographic Action Ledger with the National Identity Number (NID) and bank transaction ID.

---

## 6. Cryptographic Action Ledger Rules

1. **Rule LEDGER-FIPS**: All block digests must use bit-exact NIST FIPS 180-4 SHA-256 with deterministic canonical JSON key sorting.
2. **Rule LEDGER-CHAIN**: Every block must contain the exact SHA-256 hash of its immediate predecessor (`previousHash`).
3. **Rule LEDGER-IMMUTABLE**: In the event that any payload field, timestamp, or actor ID in a historical block is modified, the computed hash ceases to match the stored hash, triggering an instantaneous **TAMPER DETECTED** banner across all officer interfaces.
