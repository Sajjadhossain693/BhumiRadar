import {
  sha256,
  getAuditLedger,
  verifyLedgerIntegrity,
  recordAuditEvent,
  simulateTamper,
  resetLedgerIntegrity,
} from '../src/services/auditLedger.ts';

import {
  convertToDecimal,
  convertFromDecimal,
  calculateLandValuation,
} from '../src/services/valuation.ts';

import {
  screenLocationAgainstProtectedLand,
  submitCitizenEncroachmentReport,
  getPublicReportStatus,
  updateReportStatusByOfficer,
  isPointInPolygon,
} from '../src/services/encroachmentReport.ts';

import {
  computeLACompensationBreakdown,
  createCompensationClaim,
  approveCompensationClaim,
  simulateDisbursePayment,
} from '../src/services/laCompensation.ts';

import {
  verifyPoaForTransaction,
  executePoaRevocation,
  triggerSimulatedDeathNotice,
  getPoaRegistry,
} from '../src/services/poa.ts';

import assert from 'node:assert';

console.log('🧪 Starting BhumiRadar Land Governance Module Test Suite...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    failed++;
  }
}

// Module 3: Audit Ledger
console.log('📌 Testing Module 3: Cryptographic Civil Servant Action Ledger');
test('calculates deterministic standard SHA-256 hashes', () => {
  const hash = sha256('hello');
  assert.strictEqual(hash, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});

test('verifies that the initial hash chain is valid and unbroken', () => {
  resetLedgerIntegrity();
  const res = verifyLedgerIntegrity();
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.ok(res.totalEvents >= 5);
});

test('appends a new event and maintains hash chain continuity', () => {
  const prevCount = getAuditLedger().length;
  const newEvt = recordAuditEvent({
    eventType: 'PLOT_REGISTRATION_LOCKED',
    resourceType: 'plot',
    resourceId: 'PLT-TEST-001',
    actorId: 'OFFICER-TEST',
    actorRole: 'AC_LAND',
    actionSummaryBn: 'টেস্ট প্লট লক জারি',
    actionSummaryEn: 'Test plot lock applied',
    payload: { test: true },
  });
  assert.strictEqual(newEvt.sequence, prevCount + 1);
  assert.strictEqual(verifyLedgerIntegrity().isValid, true);
});

test('detects tampering when an event payload is modified', () => {
  const target = getAuditLedger()[1];
  simulateTamper(target.id, { forgedField: 'Unauthorized change' });
  assert.strictEqual(verifyLedgerIntegrity().isValid, false);
  resetLedgerIntegrity();
  assert.strictEqual(verifyLedgerIntegrity().isValid, true);
});

// Module 1: Smart Mouza Valuation Engine
console.log('\n📌 Testing Module 1: Smart Mouza Valuation Engine & Fee Estimator');
test('correctly converts land units to standard Decimals', () => {
  assert.strictEqual(convertToDecimal(10, 'decimal'), 10);
  assert.strictEqual(convertToDecimal(10, 'shotok'), 10);
  assert.strictEqual(convertToDecimal(2, 'katha'), 3.3);
  assert.strictEqual(convertToDecimal(1, 'bigha'), 33);
  assert.strictEqual(convertToDecimal(1, 'acre'), 100);
});

test('flags undervaluation revenue evasion when declared value is below government minimum', () => {
  const result = calculateLandValuation({
    mouzaId: 'uttara-sector4',
    landClass: 'residential',
    area: 2,
    unit: 'decimal',
    frontage: 'highway_main',
    declaredPrice: 4000000,
  });
  assert.strictEqual(result.isUndervalued, true);
  assert.strictEqual(result.evasionRiskLevel, 'critical');
  assert.ok(result.priceDifference < 0);
  assert.strictEqual(result.fees.taxableValue, result.officialMinimumValuation);
});

test('approves transaction when declared price exceeds or equals minimum', () => {
  const result = calculateLandValuation({
    mouzaId: 'uttara-sector4',
    landClass: 'residential',
    area: 2,
    unit: 'decimal',
    frontage: 'highway_main',
    declaredPrice: 7500000,
  });
  assert.strictEqual(result.isUndervalued, false);
  assert.strictEqual(result.evasionRiskLevel, 'none');
  assert.ok(result.priceDifference > 0);
});

// Module 2: Crowdsourced Encroachment Alert
console.log('\n📌 Testing Module 2: Crowdsourced Encroachment Alert ("খাসজমি রক্ষা করুন")');
test('detects point in polygon spatial intersection', () => {
  const poly = [
    { lat: 20, lng: 20 },
    { lat: 20, lng: 30 },
    { lat: 30, lng: 30 },
    { lat: 30, lng: 20 },
  ];
  assert.strictEqual(isPointInPolygon({ lat: 25, lng: 25 }, poly), true);
  assert.strictEqual(isPointInPolygon({ lat: 10, lng: 10 }, poly), false);
});

test('submits citizen report and redacts confidential reporter info in public status', () => {
  const report = submitCitizenEncroachmentReport({
    category: 'khas_encroachment',
    description: 'খাসজমি ভরাট',
    incidentDate: '2026-02-15',
    locationName: 'সাভার',
    coords: { lat: 23.7925, lng: 90.2650 },
    isAnonymous: false,
    reporterInfo: { name: 'রহিম উল্লাহ', phone: '01711223344', nid: '1982123456789' },
  });
  assert.ok(report.id.startsWith('CR-'));
  const pub = getPublicReportStatus(report.id);
  assert.strictEqual(pub.reporterInfo, undefined);
  assert.strictEqual(pub.isAnonymous, true);
});

// Module 4: LA Direct Compensation Calculator
console.log('\n📌 Testing Module 4: LA Direct Compensation Calculator (2017 Act)');
test('applies statutory 200% premium for public government projects under 2017 Act', () => {
  const breakdown = computeLACompensationBreakdown({
    areaAcquiredDecimal: 10,
    twelveMonthAverageRatePerDecimal: 1000000,
    purpose: 'public_government',
  });
  assert.strictEqual(breakdown.baseLandMarketValue, 10000000);
  assert.strictEqual(breakdown.statutoryPremiumPct, 200);
  assert.strictEqual(breakdown.totalLandCompensation, 30000000);
});

test('completes claim workflow and generates simulated G2P EFT payment reference', () => {
  const claim = createCompensationClaim({
    projectId: 'PRJ-DHK-ASH-01',
    plotId: 'PLT-DHK-002',
    claimantName: 'পরীক্ষামূলক আবেদনকারী',
    claimantNid: '198511223344',
    claimantPhone: '01700112233',
    bankAccountNo: '2050119948201',
    bankName: 'সোনালী ব্যাংক পিএলসি',
    bankRoutingNo: '200260481',
    areaAcquiredDecimal: 5.0,
  });
  const approved = approveCompensationClaim(claim.id, 'অতিরিক্ত জেলা প্রশাসক (রাজস্ব)');
  assert.strictEqual(approved.status, 'approved');
  const paid = simulateDisbursePayment(claim.id, 'হিসাবরক্ষণ কর্মকর্তা');
  assert.strictEqual(paid.status, 'payment_confirmed');
  assert.ok(paid.paymentReference?.startsWith('G2P-EFT-'));
});

// Module 5: PoA Revocation Sentinel
console.log('\n📌 Testing Module 5: Power of Attorney Revocation Sentinel');
test('validates active, unrevoked PoA for permitted transaction scope', () => {
  const activePoa = getPoaRegistry().find(p => p.status === 'active');
  const res = verifyPoaForTransaction({
    poaId: activePoa.id,
    targetPlotId: activePoa.linkedPlotIds[0],
    targetAction: activePoa.permittedScope[0],
  });
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.verdictCode, 'VALID_FOR_TRANSACTION');
});

test('blocks transaction if PoA has been formally revoked', () => {
  const revokedPoa = getPoaRegistry().find(p => p.status === 'revoked');
  const res = verifyPoaForTransaction({
    poaId: revokedPoa.id,
    targetAction: 'sale',
  });
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.verdictCode, 'POA_REVOKED');
});

test('blocks transaction if representative attempts action outside permitted scope', () => {
  const res = verifyPoaForTransaction({
    poaId: 'POA-2024-DHK-0914',
    targetAction: 'sale',
  });
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.verdictCode, 'ACTION_OUT_OF_SCOPE');
});

test('executes formal revocation with simulated OTP verification', () => {
  const success = executePoaRevocation({
    poaId: 'POA-2024-DHK-0914',
    revocationDeedNo: 'বাতিলনামা ৪১০২/২০২৬',
    reasonBn: 'চুক্তি ভঙ্গ',
    reasonEn: 'Breach of agreement',
    actorId: 'OFFICER-TEST',
    simulatedOtp: '882104',
  });
  assert.strictEqual(success.success, true);
  const recheck = verifyPoaForTransaction({
    poaId: 'POA-2024-DHK-0914',
    targetAction: 'mutation',
  });
  assert.strictEqual(recheck.isValid, false);
  assert.strictEqual(recheck.verdictCode, 'POA_REVOKED');
});

test('suspends PoA upon simulated principal death event trigger', () => {
  const suspended = triggerSimulatedDeathNotice('POA-2025-CXB-0774');
  assert.ok(suspended !== null);
  assert.strictEqual(suspended.status, 'suspended');
  const res = verifyPoaForTransaction({
    poaId: 'POA-2025-CXB-0774',
  });
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.verdictCode, 'PRINCIPAL_DEATH_DETERMINED');
});

console.log(`\n========================================`);
console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
