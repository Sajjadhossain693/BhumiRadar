/**
 * Land Acquisition (LA) Direct Compensation Calculator & Payment Workflow Service
 * Based on Acquisition and Requisition of Immovable Property Act, 2017 (Act No. 21 of 2017)
 */

import { plots } from '../data/seed';
import { recordAuditEvent } from './auditLedger';

export type AcquiringPurpose = 'public_government' | 'non_government_commercial';

export type ClaimStatus =
  | 'draft'
  | 'documents_submitted'
  | 'ownership_verified'
  | 'valuation_reviewed'
  | 'approval_pending'
  | 'approved'
  | 'payment_initiated'
  | 'payment_confirmed'
  | 'disputed'
  | 'rejected';

export interface AcquisitionProject {
  id: string;
  nameBn: string;
  nameEn: string;
  gazetteRef: string;
  acquiringBody: string;
  district: string;
  upazila: string;
  defaultPurpose: AcquiringPurpose;
  statutoryMultiplier: number; // 3.0 (200% premium) or 4.0 (300% premium)
}

export interface ComparableDeedRecord {
  deedNo: string;
  date: string; // Within preceding 12 months
  mouza: string;
  landClass: string;
  areaDecimal: number;
  totalPrice: number;
  ratePerDecimal: number;
}

export interface CompensationClaim {
  id: string; // e.g. "LA-DHK-2026-0042"
  projectId: string;
  projectName: string;
  caseNo: string;
  plotId: string;
  dagNo: string;
  khatianNo: string;
  mouza: string;
  areaAcquiredDecimal: number;
  landClass: string;
  claimantName: string;
  claimantNid: string;
  claimantPhone: string;
  bankAccountNo: string;
  bankName: string;
  bankRoutingNo: string;
  
  // 12-Month Market Valuation
  twelveMonthAverageRatePerDecimal: number;
  comparableDeedsCount: number;
  baseLandMarketValue: number;

  // Statutory Additions under 2017 Act
  purpose: AcquiringPurpose;
  statutoryPremiumPct: number; // 200% or 300%
  statutoryPremiumAmount: number;

  // Ancillary compensation components
  structureValuation: number;     // অবকাঠামো
  treesValuation: number;         // গাছপালা
  cropsValuation: number;         // ফসল
  relocationAllowance: number;    // পুনর্বাসন ও স্থানান্তর ভাতা

  totalCompensationAmount: number;
  status: ClaimStatus;
  statusNotes?: string;
  approvalOfficer?: string;
  approvalDate?: string;

  // Payment Tracking Simulation (G2P / BEFTN)
  paymentReference?: string;
  paymentDisbursedAt?: string;
  simulatedEftBatchNo?: string;
}

export const ACQUISITION_PROJECTS: AcquisitionProject[] = [
  {
    id: 'PRJ-DHK-ASH-01',
    nameBn: 'ঢাকা-আশুলিয়া এলিভেটেড এক্সপ্রেসওয়ে নির্মাণ প্রকল্প',
    nameEn: 'Dhaka-Ashulia Elevated Expressway Construction Project',
    gazetteRef: 'বাংলাদেশ গেজেট অতিরিক্ত সংখ্যা স্মারক নং-সেতু/অধি-১২/২০২৪',
    acquiringBody: 'বাংলাদেশ সেতু কর্তৃপক্ষ (BBA)',
    district: 'ঢাকা',
    upazila: 'সাভার',
    defaultPurpose: 'public_government',
    statutoryMultiplier: 3.0, // Section 9(3)(a): 200% premium on market price
  },
  {
    id: 'PRJ-PADMA-RL-02',
    nameBn: 'পদ্মা সেতু সংযোগ রেলপথ প্রকল্প (ফেজ-২)',
    nameEn: 'Padma Bridge Rail Link Project (Phase-2)',
    gazetteRef: 'গেজেট প্রজ্ঞাপন নং-রেল/অধিগ্রহণ/২০২৩-০৮',
    acquiringBody: 'বাংলাদেশ রেলওয়ে',
    district: 'ঢাকা',
    upazila: 'কেরাণীগঞ্জ',
    defaultPurpose: 'public_government',
    statutoryMultiplier: 3.0,
  },
  {
    id: 'PRJ-TECH-PARK-03',
    nameBn: 'বঙ্গবন্ধু হাইটেক সিটি ও সফটওয়্যার টেকনোলজি পার্ক বিস্তার',
    nameEn: 'Bangabandhu Hi-Tech City Expansion Project',
    gazetteRef: 'আইসিটি প্রজ্ঞাপন স্মারক নং-হাইটেক/২০২৫-৮৮',
    acquiringBody: 'বাংলাদেশ হাইটেক পার্ক কর্তৃপক্ষ',
    district: 'ঢাকা',
    upazila: 'ধামরাই',
    defaultPurpose: 'public_government',
    statutoryMultiplier: 3.0,
  },
  {
    id: 'PRJ-PVT-EPZ-04',
    nameBn: 'বেসরকারি অর্থনৈতিক অঞ্চল ও রপ্তানি প্রক্রিয়াকরণ এলাকা',
    nameEn: 'Private Economic Zone Logistics Park',
    gazetteRef: 'বেজা/অধিগ্রহণ/বাণিজ্যিক-২০২৬/০৪',
    acquiringBody: 'বাণিজ্যিক অংশীদার সংস্থা',
    district: 'চট্টগ্রাম',
    upazila: "কক্সবাজার",
    defaultPurpose: 'non_government_commercial',
    statutoryMultiplier: 4.0, // Section 9(3)(b): 300% premium for non-government purpose
  },
];

// Preceding 12-Month Sample Comparable Registered Deeds
export const COMPARABLE_DEEDS: ComparableDeedRecord[] = [
  { deedNo: 'D-2025-104', date: '2025-05-12', mouza: 'হেমায়েতপুর', landClass: 'residential', areaDecimal: 10.0, totalPrice: 14500000, ratePerDecimal: 1450000 },
  { deedNo: 'D-2025-288', date: '2025-07-20', mouza: 'হেমায়েতপুর', landClass: 'residential', areaDecimal: 12.5, totalPrice: 18750000, ratePerDecimal: 1500000 },
  { deedNo: 'D-2025-412', date: '2025-10-14', mouza: 'হেমায়েতপুর', landClass: 'residential', areaDecimal: 8.0,  totalPrice: 12400000, ratePerDecimal: 1550000 },
  { deedNo: 'D-2025-601', date: '2025-12-05', mouza: 'হেমায়েতপুর', landClass: 'residential', areaDecimal: 15.0, totalPrice: 22200000, ratePerDecimal: 1480000 },
  { deedNo: 'D-2025-092', date: '2025-04-18', mouza: 'বালিয়া',     landClass: 'agricultural', areaDecimal: 25.0, totalPrice: 10500000, ratePerDecimal: 420000 },
  { deedNo: 'D-2025-331', date: '2025-08-22', mouza: 'বালিয়া',     landClass: 'agricultural', areaDecimal: 20.0, totalPrice: 8800000,  ratePerDecimal: 440000 },
];

/**
 * Calculates 12-month market rate for similar land in the mouza
 */
export function calculate12MonthMarketAverage(mouza: string, landClass: string): {
  averageRate: number;
  comparableCount: number;
  samples: ComparableDeedRecord[];
} {
  const matching = COMPARABLE_DEEDS.filter(
    d => d.mouza.toLowerCase().includes(mouza.toLowerCase()) || mouza.toLowerCase().includes(d.mouza.toLowerCase())
  );

  if (matching.length > 0) {
    const totalRates = matching.reduce((acc, curr) => acc + curr.ratePerDecimal, 0);
    return {
      averageRate: Math.round(totalRates / matching.length),
      comparableCount: matching.length,
      samples: matching,
    };
  }

  // Fallback estimation if no deeds in mouza
  return {
    averageRate: landClass === 'residential' ? 1200000 : 450000,
    comparableCount: 0,
    samples: [],
  };
}

export function computeLACompensationBreakdown(params: {
  areaAcquiredDecimal: number;
  twelveMonthAverageRatePerDecimal: number;
  purpose: AcquiringPurpose;
  structureValuation?: number;
  treesValuation?: number;
  cropsValuation?: number;
  relocationAllowance?: number;
}) {
  const baseLandMarketValue = Math.round(params.areaAcquiredDecimal * params.twelveMonthAverageRatePerDecimal);
  
  // Section 9(3) statutory premium:
  // Government/public project: 200% premium (total multiplier 3.0x)
  // Non-government project: 300% premium (total multiplier 4.0x)
  const statutoryPremiumPct = params.purpose === 'public_government' ? 200 : 300;
  const statutoryPremiumAmount = Math.round((baseLandMarketValue * statutoryPremiumPct) / 100);
  const totalLandCompensation = baseLandMarketValue + statutoryPremiumAmount;

  const structureValuation = Math.max(0, params.structureValuation || 0);
  const treesValuation = Math.max(0, params.treesValuation || 0);
  const cropsValuation = Math.max(0, params.cropsValuation || 0);
  const relocationAllowance = Math.max(0, params.relocationAllowance || 0);

  const ancillaryTotal = structureValuation + treesValuation + cropsValuation + relocationAllowance;
  const totalCompensationAmount = totalLandCompensation + ancillaryTotal;

  return {
    baseLandMarketValue,
    statutoryPremiumPct,
    statutoryPremiumAmount,
    totalLandCompensation,
    structureValuation,
    treesValuation,
    cropsValuation,
    relocationAllowance,
    ancillaryTotal,
    totalCompensationAmount,
  };
}

// Initial seed claims
const INITIAL_CLAIMS: CompensationClaim[] = [
  {
    id: 'LA-DHK-2026-0042',
    projectId: 'PRJ-DHK-ASH-01',
    projectName: 'ঢাকা-আশুলিয়া এলিভেটেড এক্সপ্রেসওয়ে নির্মাণ প্রকল্প',
    caseNo: 'অধিগ্রহণ কেস নং ০৭/২০২৫-২৬',
    plotId: 'PLT-DHK-002',
    dagNo: '1042',
    khatianNo: 'KH-5541',
    mouza: 'হেমায়েতপুর',
    areaAcquiredDecimal: 14.5,
    landClass: 'residential',
    claimantName: 'মোহাম্মদ আলী',
    claimantNid: '199023456789',
    claimantPhone: '01718001122',
    bankAccountNo: '205014802008899',
    bankName: 'সোনালী ব্যাংক পিএলসি',
    bankRoutingNo: '200260481',
    twelveMonthAverageRatePerDecimal: 1495000,
    comparableDeedsCount: 4,
    baseLandMarketValue: 21677500,
    purpose: 'public_government',
    statutoryPremiumPct: 200,
    statutoryPremiumAmount: 43355000,
    structureValuation: 3500000,
    treesValuation: 450000,
    cropsValuation: 0,
    relocationAllowance: 500000,
    totalCompensationAmount: 69482500,
    status: 'approved',
    approvalOfficer: 'কে. এম. সালাহউদ্দিন (অতিরিক্ত জেলা প্রশাসক - রাজস্ব)',
    approvalDate: '2026-02-12',
  },
  {
    id: 'LA-DHK-2026-0039',
    projectId: 'PRJ-TECH-PARK-03',
    projectName: 'বঙ্গবন্ধু হাইটেক সিটি ও সফটওয়্যার টেকনোলজি পার্ক বিস্তার',
    caseNo: 'অধিগ্রহণ কেস নং ১২/২০২৫-২৬',
    plotId: 'PLT-DHK-001',
    dagNo: '88/88',
    khatianNo: 'KH-1284',
    mouza: 'বালিয়া',
    areaAcquiredDecimal: 8.0,
    landClass: 'agricultural',
    claimantName: 'আব্দুল করিম',
    claimantNid: '198512345678',
    claimantPhone: '01819223344',
    bankAccountNo: '1082201994883',
    bankName: 'জনতা ব্যাংক পিএলসি',
    bankRoutingNo: '135260192',
    twelveMonthAverageRatePerDecimal: 430000,
    comparableDeedsCount: 2,
    baseLandMarketValue: 3440000,
    purpose: 'public_government',
    statutoryPremiumPct: 200,
    statutoryPremiumAmount: 6880000,
    structureValuation: 0,
    treesValuation: 180000,
    cropsValuation: 120000,
    relocationAllowance: 100000,
    totalCompensationAmount: 10720000,
    status: 'payment_confirmed',
    approvalOfficer: 'সহকারী কমিশনার (ভূমি), ধামরাই',
    approvalDate: '2026-01-20',
    paymentReference: 'G2P-EFT-2026-881204',
    paymentDisbursedAt: '2026-01-22T10:00:00.000Z',
    simulatedEftBatchNo: 'BEFTN-BATCH-DHK-0091',
  },
];

let claimsStore: CompensationClaim[] = [...INITIAL_CLAIMS];

export function getCompensationClaims(): CompensationClaim[] {
  return [...claimsStore];
}

export function createCompensationClaim(params: {
  projectId: string;
  plotId: string;
  claimantName: string;
  claimantNid: string;
  claimantPhone: string;
  bankAccountNo: string;
  bankName: string;
  bankRoutingNo: string;
  areaAcquiredDecimal: number;
  structureValuation?: number;
  treesValuation?: number;
  cropsValuation?: number;
  relocationAllowance?: number;
}): CompensationClaim {
  const project = ACQUISITION_PROJECTS.find(p => p.id === params.projectId) || ACQUISITION_PROJECTS[0];
  const plot = plots.find(p => p.id === params.plotId) || plots[0];

  const market = calculate12MonthMarketAverage(plot.mouza, plot.landClass);
  const breakdown = computeLACompensationBreakdown({
    areaAcquiredDecimal: params.areaAcquiredDecimal,
    twelveMonthAverageRatePerDecimal: market.averageRate,
    purpose: project.defaultPurpose,
    structureValuation: params.structureValuation,
    treesValuation: params.treesValuation,
    cropsValuation: params.cropsValuation,
    relocationAllowance: params.relocationAllowance,
  });

  const seq = claimsStore.length + 1;
  const id = `LA-${plot.district.toUpperCase().slice(0, 3)}-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

  const newClaim: CompensationClaim = {
    id,
    projectId: project.id,
    projectName: project.nameBn,
    caseNo: `অধিগ্রহণ মোকদ্দমা নং ${seq}/২০২৬`,
    plotId: plot.id,
    dagNo: plot.dag,
    khatianNo: plot.khatian,
    mouza: plot.mouzaBn,
    areaAcquiredDecimal: params.areaAcquiredDecimal,
    landClass: plot.landClass,
    claimantName: params.claimantName,
    claimantNid: params.claimantNid,
    claimantPhone: params.claimantPhone,
    bankAccountNo: params.bankAccountNo,
    bankName: params.bankName,
    bankRoutingNo: params.bankRoutingNo,
    twelveMonthAverageRatePerDecimal: market.averageRate,
    comparableDeedsCount: market.comparableCount,
    baseLandMarketValue: breakdown.baseLandMarketValue,
    purpose: project.defaultPurpose,
    statutoryPremiumPct: breakdown.statutoryPremiumPct,
    statutoryPremiumAmount: breakdown.statutoryPremiumAmount,
    structureValuation: breakdown.structureValuation,
    treesValuation: breakdown.treesValuation,
    cropsValuation: breakdown.cropsValuation,
    relocationAllowance: breakdown.relocationAllowance,
    totalCompensationAmount: breakdown.totalCompensationAmount,
    status: 'documents_submitted',
  };

  claimsStore = [newClaim, ...claimsStore];

  // Record into Cryptographic Audit Ledger
  recordAuditEvent({
    eventType: 'COMPENSATION_CALCULATED',
    resourceType: 'compensation_claim',
    resourceId: id,
    actorId: 'OFFICER-LA-PORTAL',
    actorRole: 'AC_LAND',
    actionSummaryBn: `ভূমি অধিগ্রহণ ক্ষতিপূরণ দাবি দাখিল (${project.nameBn}, পরিমাণ: ৳ ${breakdown.totalCompensationAmount.toLocaleString('bn-BD')})`,
    actionSummaryEn: `LA Compensation claim submitted (${project.nameEn}, Total: BDT ${breakdown.totalCompensationAmount.toLocaleString()})`,
    payload: {
      claimId: id,
      projectId: project.id,
      plotId: plot.id,
      claimantNid: params.claimantNid,
      totalAmount: breakdown.totalCompensationAmount,
    },
  });

  return newClaim;
}

/**
 * Approve Claim by Authorized Officer (ADC Revenue / AC Land)
 */
export function approveCompensationClaim(claimId: string, officerName: string): CompensationClaim | null {
  const idx = claimsStore.findIndex(c => c.id === claimId);
  if (idx === -1) return null;

  const current = claimsStore[idx];
  const updated: CompensationClaim = {
    ...current,
    status: 'approved',
    approvalOfficer: officerName,
    approvalDate: new Date().toISOString().split('T')[0],
  };

  claimsStore[idx] = updated;

  recordAuditEvent({
    eventType: 'COMPENSATION_CLAIM_APPROVED',
    resourceType: 'compensation_claim',
    resourceId: current.id,
    actorId: officerName,
    actorRole: 'AC_LAND',
    actionSummaryBn: `অতিরিক্ত জেলা প্রশাসক (রাজস্ব) কর্তৃক ক্ষতিপূরণ দাবি ${current.id} অনুমোদন (টাকা: ৳ ${current.totalCompensationAmount.toLocaleString('bn-BD')})`,
    actionSummaryEn: `ADC Revenue approved compensation claim ${current.id} (BDT ${current.totalCompensationAmount.toLocaleString()})`,
    payload: {
      claimId: current.id,
      approvedAmount: current.totalCompensationAmount,
      claimantNid: current.claimantNid,
      officer: officerName,
    },
  });

  return updated;
}

/**
 * Disburse Payment via Simulated Direct G2P / BEFTN EFT
 */
export function simulateDisbursePayment(claimId: string, officerName: string): CompensationClaim | null {
  const idx = claimsStore.findIndex(c => c.id === claimId);
  if (idx === -1) return null;

  const current = claimsStore[idx];
  const paymentReference = `G2P-EFT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const simulatedEftBatchNo = `BEFTN-BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const updated: CompensationClaim = {
    ...current,
    status: 'payment_confirmed',
    paymentReference,
    paymentDisbursedAt: new Date().toISOString(),
    simulatedEftBatchNo,
  };

  claimsStore[idx] = updated;

  recordAuditEvent({
    eventType: 'COMPENSATION_PAYMENT_INITIATED',
    resourceType: 'compensation_claim',
    resourceId: current.id,
    actorId: officerName,
    actorRole: 'AC_LAND',
    actionSummaryBn: `সরাসরি জি২পি/ইএফটি ক্ষতিপূরণ অর্থ প্রদান সম্পন্ন (রেফারেন্স: ${paymentReference}, ব্যাংক: ${current.bankName})`,
    actionSummaryEn: `Direct G2P/EFT compensation disbursement simulated (Ref: ${paymentReference}, Bank: ${current.bankName})`,
    payload: {
      claimId: current.id,
      disbursedAmount: current.totalCompensationAmount,
      bankAccount: current.bankAccountNo,
      bankRouting: current.bankRoutingNo,
      paymentReference,
      simulatedEftBatchNo,
    },
  });

  return updated;
}
