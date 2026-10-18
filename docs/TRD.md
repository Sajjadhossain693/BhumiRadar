# BhumiRadar — Technical Requirements Document (TRD)

**System Architecture & Technical Specifications**  
**Version**: 2.4.0  
**Stack**: React 18 | TypeScript 5.6 | Vite 5.4 | Leaflet | NIST FIPS 180-4 SHA-256  
**Repository**: `BhumiRadar`  

---

## 1. Architectural Principles & Technology Stack

BhumiRadar is architected as an ultra-high-reliability, zero-latency, client-side verified Single Page Application (SPA) designed to function predictably even in low-bandwidth rural land offices across Bangladesh.

### Technology Rationale
- **React 18 & TypeScript 5.6**: Provides strict compile-time type guarantees across intricate land records, legal ownership chains, and fiscal calculations.
- **Vite 5.4**: Lightning-fast ES module dev server (<100ms HMR) and optimized Rollup production bundler creating tree-shaken static assets.
- **Leaflet & Canvas GIS Engine**: Lightweight GIS renderer with native support for WGS-84 coordinate systems, custom GeoJSON polygon layers, dynamic styling, and responsive touch gestures.
- **Pure JavaScript FIPS 180-4 SHA-256 Engine**: Zero-external-dependency, bit-exact cryptographic hashing conforming to the National Institute of Standards and Technology (NIST) FIPS 180-4 specification. Guaranteed bit-for-bit repeatability across all browser engines (V8, JavaScriptCore, SpiderMonkey).
- **Custom Bilingual Localization Engine**: Custom micro-i18n engine (`src/i18n`) with instantaneous zero-re-render language switching, Bengali numeral transliteration (`১, ২, ৩...`), and localized currency/area formatting.
- **Pure CSS Custom Properties**: Zero heavy UI frameworks (Tailwind, Material UI, Bootstrap) to ensure total control over layout rendering speed, clean print stylesheet generation for legal certificates, and zero CSS build baggage.

---

## 2. Cryptographic Action Ledger Specification

### 2.1 Block Structure
Every governance action (mutation approval, citizen report filing, plot classification change, valuation update) is recorded in an immutable ledger with the following block schema:

```typescript
interface LedgerBlock {
  index: number;              // Monotonically increasing 0-indexed integer
  timestamp: string;          // ISO-8601 UTC timestamp string
  actionType: AuditActionType;// MUTATION_APPROVAL, ENCROACHMENT_REPORT, etc.
  actor: {
    userId: string;
    role: 'CITIZEN' | 'AC_LAND' | 'SUB_REGISTRAR' | 'SURVEYOR' | 'SYSTEM';
    office?: string;
  };
  payload: Record<string, unknown>; // Deterministically sorted payload
  previousHash: string;       // SHA-256 hex string of the preceding block
  hash: string;               // SHA-256 hex string of the current block
  status: 'COMMITTED' | 'TAMPERED';
}
```

### 2.2 Canonical Serialization & Hashing Algorithm
To guarantee cryptographic reproducibility regardless of object key order, BhumiRadar implements **RFC-8785 Canonical JSON Serialization** prior to hashing:

$$\text{CanonicalString}(B) = \text{index} + \text{timestamp} + \text{actionType} + \text{actorId} + \text{SortedJSON}(\text{payload}) + \text{previousHash}$$

$$\text{Block Hash} = \text{SHA256}_{\text{FIPS-180-4}}(\text{CanonicalString}(B))$$

**Genesis Block Properties**:
- `index`: `0`
- `previousHash`: `"0000000000000000000000000000000000000000000000000000000000000000"`
- `payload`: `{ system: "BhumiRadar Genesis Block", jurisdiction: "Bangladesh Ministry of Land" }`

### 2.3 Tamper Verification Algorithm
```typescript
function verifyLedgerChain(chain: LedgerBlock[]): { isValid: boolean; brokenIndex?: number } {
  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];
    const computedHash = computeBlockHash(current);
    if (computedHash !== current.hash) {
      return { isValid: false, brokenIndex: i };
    }
    if (i > 0) {
      const previous = chain[i - 1];
      if (current.previousHash !== previous.hash) {
        return { isValid: false, brokenIndex: i };
      }
    }
  }
  return { isValid: true };
}
```

---

## 3. Geospatial & Cadastral Computation Engine

### 3.1 Point-in-Polygon (Ray-Casting) Algorithm
Used to match GPS citizen reports, surveyor checkpoints, and field inquiries to exact cadastral dag (plot) polygons:

```typescript
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
```

### 3.2 Land Measurement Conversions
The system normalizes all plot measurements into decimals (`shangshok`) using standardized Bangladesh land conversion constants:

| Unit | Conversion to Decimal (`শতাংশ`) | Equivalent Square Feet | Equivalent Square Meters |
| :--- | :--- | :--- | :--- |
| **Decimal (শতাংশ / শতক)** | $1.00000$ | $435.60\text{ sq ft}$ | $40.4686\text{ m}^2$ |
| **Katha (কাঠা)** | $1.65289$ ($1\text{ Katha} \approx 1.65\text{ dec}$) | $720.00\text{ sq ft}$ | $66.8903\text{ m}^2$ |
| **Bigha (বিঘা)** | $33.05785$ ($20\text{ Katha} \approx 33\text{ dec}$) | $14,400.00\text{ sq ft}$ | $1,337.805\text{ m}^2$ |
| **Acre (একর)** | $100.00000$ ($3.025\text{ Bigha}$) | $43,560.00\text{ sq ft}$ | $4,046.856\text{ m}^2$ |

---

## 4. Statutory Fiscal & Valuation Formulae

### 4.1 Smart Mouza Valuation & Fee Breakdown
Let $A$ be the plot area in decimals, $R_{\text{mouza}}$ be the gazetted minimum rate per decimal, and $V_{\text{declared}}$ be the declared deed consideration amount:

$$\text{Statutory Benchmark Value } V_{\text{min}} = A \times R_{\text{mouza}}$$

$$\text{Taxable Valuation Basis } V_{\text{taxable}} = \max(V_{\text{declared}}, V_{\text{min}})$$

$$\text{Undervaluation Delta } \Delta = \max(0, V_{\text{min}} - V_{\text{declared}})$$

$$\text{Stamp Duty (The Stamp Act 1899)} = V_{\text{taxable}} \times 1.5\%$$

$$\text{Registration Fee (The Registration Act 1908)} = V_{\text{taxable}} \times 1.0\%$$

$$\text{Local Government Tax} = V_{\text{taxable}} \times \begin{cases} 2.0\% & \text{Rural / Union Parishad} \\ 3.0\% & \text{Paurashava / City Corporation} \end{cases}$$

$$\text{Advance Income Tax (AIT, Income Tax Act 2023 § 53H)} = V_{\text{taxable}} \times \begin{cases} 4.0\% & \text{Commercial / Prime Mouza} \\ 2.0\% & \text{Standard Residential / Agri} \end{cases}$$

$$\text{Total Government Revenue} = \text{Stamp Duty} + \text{Registration Fee} + \text{Local Tax} + \text{AIT}$$

---

## 5. Land Acquisition Compensation Formula (ARIPA 2017)

Under Section 8 of the *Acquisition and Requisition of Immovable Property Act, 2017*:

Let $V_{\text{base}}$ be the 12-month average market value of comparable deed transactions in the mouza, $C_{\text{infra}}$ be structural damage/building value, $C_{\text{trees}}$ be forestry/crop value, and $C_{\text{shifting}}$ be relocation cost:

$$\text{Statutory Premium Rate } P = \begin{cases} 200\% & \text{Public / Government Acquisition} \\ 300\% & \text{Non-Government / Commercial Project} \end{cases}$$

$$\text{Total Land Compensation} = V_{\text{base}} \times (1 + P)$$

$$\text{Gross Award Amount} = \text{Total Land Compensation} + C_{\text{infra}} + C_{\text{trees}} + C_{\text{shifting}}$$

---

## 6. Power of Attorney Sentinel Validation Matrix

Under Section 10 & 11 of the *Power of Attorney Act, 2012*:

| Check Code | Condition | Severity | System Action |
| :--- | :--- | :--- | :--- |
| **POA-01** | Deed revocation recorded in Sub-Registry | CRITICAL | Outright rejection of mutation or transfer deed. |
| **POA-02** | Expiry date < Current inspection date | CRITICAL | Flagged as legally invalid and non-executable. |
| **POA-03** | Attorney identity mismatch against NID registry | HIGH | Suspended pending biometric re-verification. |
| **POA-04** | Cumulative transferred area > Principal's khatian share | HIGH | Blocked for share quota violation. |
| **POA-05** | General PoA attempting Irrevocable (Byna) sale without explicit clause | CRITICAL | Flagged under Section 13 as ultra vires. |

---

## 7. Verification & Build Pipeline

The project features a lightweight zero-dependency Node.js test runner validating core cryptographic calculations, valuation math, and integrity verification:

```bash
# Execute standalone test suite
node scripts/bundleAndRun.js
# Or standard npm alias
npm test

# Typecheck and production bundle build
npm run build
```

Expected Output:
```text
Running test suite...
✔ Test 1: Bit-exact NIST SHA-256 produces exact test vector
✔ Test 2: Genesis block initializes with 64 zero previousHash
✔ Test 3: Ledger tamper detection flags altered blocks
✔ Test 4: Mouza valuation flags undervaluation when declared < gazetted
✔ Test 5: ARIPA 2017 computes 200% premium for public acquisition
✔ Test 6: ARIPA 2017 computes 300% premium for private acquisition
✔ Test 7: Point-in-polygon ray-casting matches plot boundary
...
All tests passed: 16 passed, 0 failed.
```
