/**
 * Comprehensive Unit Test Suite for the Five Land Governance Modules
 * Tested with Node.js test runner: node --experimental-strip-types --test tests/governanceModules.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

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
  calculate12MonthMarketAverage,
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

// -------------------------------------------------------------
// MODULE 3: Cryptographic Audit Ledger Tests
// -------------------------------------------------------------
describe('Module 3: Cryptographic Civil Servant Action Ledger', () => {
  it('calculates deterministic standard SHA-256 hashes', () => {
    const hashHello = sha256('hello');
    assert.strictEqual(
      hashHello,
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      'SHA-256 hash of "hello" must match standard test vector'
    );
  });

  it('verifies that the initial hash chain is valid and unbroken', () => {
    resetLedgerIntegrity();
    const verification = verifyLedgerIntegrity();
    assert.strictEqual(verification.isValid, true, 'Initial ledger must be cryptographically valid');
    assert.strictEqual(verification.errors.length, 0, 'No errors in initial ledger');
    assert.ok(verification.totalEvents >= 5, 'Ledger has initial seed blocks');
  });

  it('appends a new event and maintains hash chain continuity', () => {
    const initialEvents = getAuditLedger();
    const prevCount = initialEvents.length;
    const lastHash = initialEvents[prevCount - 1].currentHash;

    const newEvent = recordAuditEvent({
      eventType: 'PLOT_REGISTRATION_LOCKED',
      resourceType: 'plot',
      resourceId: 'PLT-TEST-001',
      actorId: 'OFFICER-TEST',
      actorRole: 'AC_LAND',
      actionSummaryBn: 'টেস্ট প্লট লক জারি',
      actionSummaryEn: 'Test plot lock applied',
      payload: { reason: 'Test litigation' },
    });

    assert.strictEqual(newEvent.previousHash, lastHash, 'New event previousHash must match previous currentHash');
    assert.strictEqual(newEvent.sequence, prevCount + 1, 'Sequence must increment continuously');

    const verification = verifyLedgerIntegrity();
    assert.strictEqual(verification.isValid, true, 'Ledger must remain valid after append');
  });

  it('detects tampering when an event payload is modified', () => {
    const ledger = getAuditLedger();
    const targetEvent = ledger[1];

    simulateTamper(targetEvent.id, { forgedField: 'Illegal ownership change', amount: 99999999 });

    const verification = verifyLedgerIntegrity();
    assert.strictEqual(verification.isValid, false, 'Tampered ledger must be flagged as invalid');
    assert.ok(verification.errors.length > 0, 'Must record error for tampered block');

    // Reset integrity
    resetLedgerIntegrity();
    const restoredVerification = verifyLedgerIntegrity();
    assert.strictEqual(restoredVerification.isValid, true, 'Resetting restores valid ledger');
  });
});

// -------------------------------------------------------------
// MODULE 1: Smart Mouza Valuation Engine Tests
// -------------------------------------------------------------
describe('Module 1: Smart Mouza Valuation Engine & Fee Estimator', () => {
  it('correctly converts land units to standard Decimals', () => {
    assert.strictEqual(convertToDecimal(10, 'decimal'), 10);
    assert.strictEqual(convertToDecimal(10, 'shotok'), 10);
    assert.strictEqual(convertToDecimal(2, 'katha'), 3.3); // 2 * 1.65
    assert.strictEqual(convertToDecimal(1, 'bigha'), 33);  // 1 * 33
    assert.strictEqual(convertToDecimal(1, 'acre'), 100);  // 1 * 100
  });

  it('correctly converts decimals back to target units', () => {
    assert.strictEqual(convertFromDecimal(3.3, 'katha'), 2);
    assert.strictEqual(convertFromDecimal(33, 'bigha'), 1);
    assert.strictEqual(convertFromDecimal(100, 'acre'), 1);
  });

  it('flags undervaluation revenue evasion when declared value is below government minimum', () => {
    // In Uttara Sector 4, residential rate is 2,600,000 per decimal
    // For 2 decimals on highway (+25%), effective rate is 3,250,000 per decimal => Minimum 6,500,000
    const result = calculateLandValuation({
      mouzaId: 'uttara-sector4',
      landClass: 'residential',
      area: 2,
      unit: 'decimal',
      frontage: 'highway_main',
      declaredPrice: 4000000, // Declared only 4,000,000 (< 6,500,000)
    });

    assert.strictEqual(result.isUndervalued, true, 'Transaction must be marked as undervalued');
    assert.strictEqual(result.evasionRiskLevel, 'critical', 'Deficit > 25% must be critical risk');
    assert.ok(result.priceDifference < 0, 'Price difference must be negative');
    assert.strictEqual(result.fees.taxableValue, result.officialMinimumValuation, 'Taxes must be assessed on official minimum, not declared deficit');
  });

  it('approves transaction when declared price exceeds or equals minimum', () => {
    const result = calculateLandValuation({
      mouzaId: 'uttara-sector4',
      landClass: 'residential',
      area: 2,
      unit: 'decimal',
      frontage: 'highway_main',
      declaredPrice: 7500000, // Declared > 6,500,000
    });

    assert.strictEqual(result.isUndervalued, false, 'Transaction must not be undervalued');
    assert.strictEqual(result.evasionRiskLevel, 'none', 'No evasion risk');
    assert.ok(result.priceDifference > 0, 'Price difference must be positive');
  });

  it('calculates statutory registration fees and stamp duty correctly', () => {
    const result = calculateLandValuation({
      mouzaId: 'balia',
      landClass: 'agricultural',
      area: 10,
      unit: 'decimal',
      frontage: 'rural_earthen',
      declaredPrice: 5000000,
      inCityCorporation: false,
    });

    const taxable = result.fees.taxableValue;
    assert.strictEqual(result.fees.registrationFeeAmount, Math.round((taxable * 1.5) / 100));
    assert.strictEqual(result.fees.stampDutyAmount, Math.round((taxable * 1.5) / 100));
    assert.ok(result.fees.totalStatutoryFees > 0);
  });
});

// -------------------------------------------------------------
// MODULE 2: Crowdsourced Encroachment Alert Tests
// -------------------------------------------------------------
describe('Module 2: Crowdsourced Encroachment Alert ("খাসজমি রক্ষা করুন")', () => {
  it('detects point in polygon spatial intersection', () => {
    const squarePoly = [
      { lat: 20, lng: 20 },
      { lat: 20, lng: 30 },
      { lat: 30, lng: 30 },
      { lat: 30, lng: 20 },
    ];

    assert.strictEqual(isPointInPolygon({ lat: 25, lng: 25 }, squarePoly), true);
    assert.strictEqual(isPointInPolygon({ lat: 10, lng: 10 }, squarePoly), false);
  });

  it('screens coords and identifies proximity/match to registered land', () => {
    // Near Rajshahi Paba plot PLT-RJS-031 coords: 24.3700, 88.6500
    const screening = screenLocationAgainstProtectedLand({ lat: 24.3700, lng: 88.6500 });
    assert.ok(
      screening.outcome === 'potential_geographic_match' || screening.outcome === 'pending_field_verification',
      'Should flag potential match near registered coordinates'
    );
  });

  it('submits a citizen report and redacts confidential reporter info in public status', () => {
    const report = submitCitizenEncroachmentReport({
      category: 'khas_encroachment',
      description: 'অননুমোদিত দখল তৎপরতা পরিলক্ষিত হয়েছে।',
      incidentDate: '2026-02-15',
      locationName: 'সাভার হেমায়েতপুর',
      coords: { lat: 23.7925, lng: 90.2650 },
      isAnonymous: false,
      reporterInfo: { name: 'রহিম উল্লাহ', phone: '01711223344', nid: '1982123456789' },
    });

    assert.ok(report.id.startsWith('CR-'), 'Report must have valid reference ID');

    // Public lookup
    const publicView = getPublicReportStatus(report.id);
    assert.ok(publicView !== null, 'Public view should exist');
    assert.strictEqual(publicView.reporterInfo, undefined, 'Confidential reporterInfo must NEVER be exposed in public view');
    assert.strictEqual(publicView.isAnonymous, true, 'Public status enforces privacy');
  });

  it('allows officer status update and records audit trail', () => {
    const report = submitCitizenEncroachmentReport({
      category: 'canal_river_filling',
      description: 'খাল ভরাট',
      incidentDate: '2026-02-16',
      locationName: 'ধামরাই',
      isAnonymous: true,
    });

    const updated = updateReportStatusByOfficer({
      reportId: report.id,
      status: 'field_verification',
      officerName: 'সহকারী কমিশনার (ভূমি)',
      officerNotes: 'তদন্তকারী কর্মকর্তা নিয়োগ দেওয়া হয়েছে।',
    });

    assert.ok(updated !== null);
    assert.strictEqual(updated.status, 'field_verification');
  });
});

// -------------------------------------------------------------
// MODULE 4: LA Direct Compensation Calculator Tests
// -------------------------------------------------------------
describe('Module 4: LA Direct Compensation Calculator', () => {
  it('applies statutory 200% premium for public government projects under 2017 Act', () => {
    const breakdown = computeLACompensationBreakdown({
      areaAcquiredDecimal: 10,
      twelveMonthAverageRatePerDecimal: 1000000, // 10 Lac per decimal
      purpose: 'public_government',
    });

    assert.strictEqual(breakdown.baseLandMarketValue, 10000000, 'Base value is 1 Crore');
    assert.strictEqual(breakdown.statutoryPremiumPct, 200, 'Statutory premium is 200% under Sec 9(3)(a)');
    assert.strictEqual(breakdown.statutoryPremiumAmount, 20000000, 'Premium is 2 Crore');
    assert.strictEqual(breakdown.totalLandCompensation, 30000000, 'Total land multiplier is 3.0x (3 Crore)');
  });

  it('applies statutory 300% premium for non-government projects under 2017 Act', () => {
    const breakdown = computeLACompensationBreakdown({
      areaAcquiredDecimal: 10,
      twelveMonthAverageRatePerDecimal: 1000000,
      purpose: 'non_government_commercial',
    });

    assert.strictEqual(breakdown.statutoryPremiumPct, 300, 'Statutory premium is 300% under Sec 9(3)(b)');
    assert.strictEqual(breakdown.totalLandCompensation, 40000000, 'Total land multiplier is 4.0x (4 Crore)');
  });

  it('calculates multi-head compensation including structures, trees and relocation', () => {
    const breakdown = computeLACompensationBreakdown({
      areaAcquiredDecimal: 5,
      twelveMonthAverageRatePerDecimal: 1000000,
      purpose: 'public_government',
      structureValuation: 1500000,
      treesValuation: 200000,
      cropsValuation: 100000,
      relocationAllowance: 300000,
    });

    // 5 * 10 Lac = 50 Lac base + 100 Lac premium = 150 Lac land
    // Ancillary: 15 Lac + 2 Lac + 1 Lac + 3 Lac = 21 Lac
    // Total = 171 Lac (17,100,000)
    assert.strictEqual(breakdown.totalCompensationAmount, 17100000);
  });

  it('completes claim workflow and generates simulated G2P EFT payment reference', () => {
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

    assert.ok(claim.id.startsWith('LA-'));
    assert.strictEqual(claim.status, 'documents_submitted');

    // Officer approves
    const approved = approveCompensationClaim(claim.id, 'অতিরিক্ত জেলা প্রশাসক (রাজস্ব)');
    assert.ok(approved !== null);
    assert.strictEqual(approved.status, 'approved');

    // G2P payment disbursed
    const paid = simulateDisbursePayment(claim.id, 'হিসাবরক্ষণ কর্মকর্তা');
    assert.ok(paid !== null);
    assert.strictEqual(paid.status, 'payment_confirmed');
    assert.ok(paid.paymentReference?.startsWith('G2P-EFT-'));
  });
});

// -------------------------------------------------------------
// MODULE 5: PoA Revocation Sentinel Tests
// -------------------------------------------------------------
describe('Module 5: Power of Attorney Revocation Sentinel', () => {
  it('validates active, unrevoked PoA for permitted transaction scope', () => {
    const activePoa = getPoaRegistry().find(p => p.status === 'active');
    assert.ok(activePoa, 'Active PoA must exist in registry');

    const result = verifyPoaForTransaction({
      poaId: activePoa.id,
      targetPlotId: activePoa.linkedPlotIds[0],
      targetAction: activePoa.permittedScope[0],
    });

    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.verdictCode, 'VALID_FOR_TRANSACTION');
  });

  it('blocks transaction if PoA has been formally revoked', () => {
    const revokedPoa = getPoaRegistry().find(p => p.status === 'revoked');
    assert.ok(revokedPoa, 'Revoked PoA must exist in registry');

    const result = verifyPoaForTransaction({
      poaId: revokedPoa.id,
      targetAction: 'sale',
    });

    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.verdictCode, 'POA_REVOKED');
  });

  it('blocks transaction if representative attempts action outside permitted scope', () => {
    // POA-2024-DHK-0914 only allows 'mutation' and 'litigation', NOT 'sale'
    const result = verifyPoaForTransaction({
      poaId: 'POA-2024-DHK-0914',
      targetAction: 'sale',
    });

    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.verdictCode, 'ACTION_OUT_OF_SCOPE');
  });

  it('executes formal revocation with simulated OTP verification', () => {
    // Test invalid OTP
    const failedOtp = executePoaRevocation({
      poaId: 'POA-2024-DHK-0914',
      revocationDeedNo: 'বাতিলনামা ৪১০২/২০২৬',
      reasonBn: 'চুক্তি ভঙ্গ',
      reasonEn: 'Breach of agreement',
      actorId: 'OFFICER-TEST',
      simulatedOtp: '123', // Invalid OTP length
    });
    assert.strictEqual(failedOtp.success, false);

    // Test valid 6-digit OTP
    const success = executePoaRevocation({
      poaId: 'POA-2024-DHK-0914',
      revocationDeedNo: 'বাতিলনামা ৪১০২/২০২৬',
      reasonBn: 'চুক্তি ভঙ্গ',
      reasonEn: 'Breach of agreement',
      actorId: 'OFFICER-TEST',
      simulatedOtp: '882104',
    });
    assert.strictEqual(success.success, true);

    // Subsequent transaction check must be blocked
    const recheck = verifyPoaForTransaction({
      poaId: 'POA-2024-DHK-0914',
      targetAction: 'mutation',
    });
    assert.strictEqual(recheck.isValid, false);
    assert.strictEqual(recheck.verdictCode, 'POA_REVOKED');
  });

  it('suspends PoA upon simulated principal death event trigger', () => {
    const suspended = triggerSimulatedDeathNotice('POA-2025-CXB-0774');
    assert.ok(suspended !== null);
    assert.strictEqual(suspended.status, 'suspended');

    const result = verifyPoaForTransaction({
      poaId: 'POA-2025-CXB-0774',
    });
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.verdictCode, 'PRINCIPAL_DEATH_DETERMINED');
  });
});
