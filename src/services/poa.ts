/**
 * Power of Attorney (PoA) Revocation Sentinel Service
 * Digital Registry, Validity Verification, and Transaction Security Gating
 * Governed by The Power of Attorney Act, 2012 (Act No. 35 of 2012)
 */

import { recordAuditEvent } from './auditLedger';

export type PoaType =
  | 'general'           // সাধারণ আমমোক্তারনামা
  | 'special'           // বিশেষ আমমোক্তারনামা
  | 'irrevocable';      // অপ্রত্যাহারযোগ্য পাওয়ার অব অ্যাটর্নি (for sale/consideration)

export type PoaScopeAction =
  | 'sale'              // জমি বিক্রয় ও হস্তান্তর
  | 'mortgage'          // ব্যাংক বন্ধক ও ঋণ গ্রহণ
  | 'mutation'          // নামজারি ও জমাভাগ
  | 'litigation'        // আদালতে মামলা পরিচালনা
  | 'development'       // ডেভেলপার চুক্তি ও নির্মাণ
  | 'lease';            // ইজারা প্রদান

export type PoaStatus =
  | 'active'
  | 'revoked'
  | 'expired'
  | 'suspended'
  | 'revocation_requested'
  | 'unverified';

export interface PowerOfAttorneyRecord {
  id: string; // e.g. "POA-2024-DHK-0914"
  deedNo: string;
  subRegistryOfficeBn: string;
  subRegistryOfficeEn: string;
  poaType: PoaType;
  
  // Principal (Property Owner)
  principalName: string;
  principalNameBn: string;
  principalNidMasked: string; // e.g. "1985********5678"
  principalPhoneMasked: string;

  // Attorney (Authorized Representative)
  attorneyName: string;
  attorneyNameBn: string;
  attorneyNidMasked: string;
  attorneyPhoneMasked: string;

  // Validity Dates
  executionDate: string; // ISO
  expiryDate?: string;   // Optional (general PoA may be open-ended until revocation or death)
  
  // Scope and Linked Plots
  permittedScope: PoaScopeAction[];
  linkedPlotIds: string[];
  linkedDagNumbers: string[];
  mouza: string;
  mouzaBn: string;

  // Status and Revocation
  status: PoaStatus;
  revocationNoticeDate?: string;
  revocationDeedNo?: string;
  revocationReasonBn?: string;
  revocationReasonEn?: string;
  
  // Death event trigger note
  deathEventRecorded?: boolean;
  notes?: string;
}

export interface PoaVerificationResult {
  isValid: boolean;
  verdictCode:
    | 'VALID_FOR_TRANSACTION'
    | 'POA_REVOKED'
    | 'POA_EXPIRED'
    | 'POA_SUSPENDED'
    | 'ACTION_OUT_OF_SCOPE'
    | 'PLOT_NOT_LINKED'
    | 'PRINCIPAL_DEATH_DETERMINED'
    | 'RECORD_NOT_FOUND';
  status: PoaStatus;
  messageBn: string;
  messageEn: string;
  record?: PowerOfAttorneyRecord;
}

// Initial seed PoA registry
export const INITIAL_POA_REGISTRY: PowerOfAttorneyRecord[] = [
  {
    id: 'POA-2024-DHK-0914',
    deedNo: '5611/2024',
    subRegistryOfficeBn: 'উত্তরা সাব-রেজিস্ট্রার কার্যালয়, ঢাকা',
    subRegistryOfficeEn: 'Uttara Sub-Registry Office, Dhaka',
    poaType: 'general',
    principalName: 'Abdul Karim',
    principalNameBn: 'আব্দুল করিম',
    principalNidMasked: '1985********5678',
    principalPhoneMasked: '0171*****44',
    attorneyName: 'Mohammad Ali',
    attorneyNameBn: 'মোহাম্মদ আলী',
    attorneyNidMasked: '1990********6789',
    attorneyPhoneMasked: '0181*****22',
    executionDate: '2024-03-15',
    expiryDate: '2027-03-14',
    permittedScope: ['mutation', 'litigation'],
    linkedPlotIds: ['PLT-DHK-001'],
    linkedDagNumbers: ['88/88'],
    mouza: 'Balia',
    mouzaBn: 'বালিয়া',
    status: 'active',
    notes: 'নামজারি ও সহকারী জজ আদালতের মামলা মোকদ্দমা পরিচালনার সীমিত ক্ষমতা। জমি বিক্রয় ক্ষমতা অনুমোদিত নয়।',
  },
  {
    id: 'POA-2023-SAV-0412',
    deedNo: '1802/2023',
    subRegistryOfficeBn: 'সাভার সাব-রেজিস্ট্রার কার্যালয়, ঢাকা',
    subRegistryOfficeEn: 'Savar Sub-Registry Office, Dhaka',
    poaType: 'irrevocable',
    principalName: 'Fatema Begum',
    principalNameBn: 'ফাতেমা বেগম',
    principalNidMasked: '1987********7890',
    principalPhoneMasked: '0191*****11',
    attorneyName: 'Shamsul Haque',
    attorneyNameBn: 'শামসুল হক',
    attorneyNidMasked: '1978********8901',
    attorneyPhoneMasked: '0161*****33',
    executionDate: '2023-08-10',
    expiryDate: '2028-08-09',
    permittedScope: ['sale', 'mortgage', 'mutation', 'development'],
    linkedPlotIds: ['PLT-DHK-002'],
    linkedDagNumbers: ['1042'],
    mouza: 'Hemayetpur',
    mouzaBn: 'হেমায়েতপুর',
    status: 'revoked',
    revocationNoticeDate: '2025-11-20',
    revocationDeedNo: 'বাতিলনামা দলিল নং ৯৪০১/২০২৫',
    revocationReasonBn: 'মূল মালিক ফাতেমা বেগম কর্তৃক চুক্তিভঙ্গের কারণে সাব-রেজিস্ট্রি দলিলের মাধ্যমে আমমোক্তারনামা আনুষ্ঠানিকভাবে প্রত্যাহার ও বাতিল করা হয়েছে।',
    revocationReasonEn: 'Formally revoked and cancelled by principal through revocation deed due to breach of trust.',
  },
  {
    id: 'POA-2022-PAB-0108',
    deedNo: '3310/2022',
    subRegistryOfficeBn: 'পবা সাব-রেজিস্ট্রার কার্যালয়, রাজশাহী',
    subRegistryOfficeEn: 'Paba Sub-Registry Office, Rajshahi',
    poaType: 'special',
    principalName: 'Rabeya Khatun',
    principalNameBn: 'রাবেয়া খাতুন',
    principalNidMasked: '1991********9012',
    principalPhoneMasked: '0172*****55',
    attorneyName: 'Md. Jalal Uddin',
    attorneyNameBn: 'মোঃ জালাল উদ্দিন',
    attorneyNidMasked: '1988********0123',
    attorneyPhoneMasked: '0151*****99',
    executionDate: '2022-01-15',
    expiryDate: '2024-01-14',
    permittedScope: ['mutation'],
    linkedPlotIds: ['PLT-RJS-031'],
    linkedDagNumbers: ['44/B'],
    mouza: 'Paba',
    mouzaBn: 'পবা',
    status: 'expired',
    notes: 'মেয়াদোত্তীর্ণ আমমোক্তারনামা। ২০২৪ সালের ১৪ জানুয়ারি মেয়াদ উত্তীর্ণ হয়েছে।',
  },
  {
    id: 'POA-2025-CXB-0774',
    deedNo: '2299/2025',
    subRegistryOfficeBn: 'কক্সবাজার সদর সাব-রেজিস্ট্রি কার্যালয়',
    subRegistryOfficeEn: "Cox's Bazar Sadar Sub-Registry Office",
    poaType: 'general',
    principalName: 'Khaleda Zia',
    principalNameBn: 'খালেদা জিয়া',
    principalNidMasked: '1979********1234',
    principalPhoneMasked: '0182*****66',
    attorneyName: 'Abdul Mannan',
    attorneyNameBn: 'আব্দুল মান্নান',
    attorneyNidMasked: '1980********2345',
    attorneyPhoneMasked: '0192*****88',
    executionDate: '2025-04-12',
    permittedScope: ['sale', 'mortgage', 'development'],
    linkedPlotIds: ['PLT-CXB-006'],
    linkedDagNumbers: ['64'],
    mouza: "Cox's Bazar Sadar",
    mouzaBn: 'কক্সবাজার সদর',
    status: 'suspended',
    notes: 'মালিকের মৃত্যুর তথ্য যাচাইাধীন থাকায় সাব-রেজিস্ট্রার কার্যালয় কর্তৃক কার্যকারিতা সাময়িকভাবে স্থগিত।',
    deathEventRecorded: true,
  },
];

let poaStore: PowerOfAttorneyRecord[] = [...INITIAL_POA_REGISTRY];

export function getPoaRegistry(): PowerOfAttorneyRecord[] {
  return [...poaStore];
}

/**
 * Validates a Power of Attorney for a specific land transaction action
 */
export function verifyPoaForTransaction(params: {
  poaId: string;
  targetPlotId?: string;
  targetAction?: PoaScopeAction;
}): PoaVerificationResult {
  const record = poaStore.find(
    p => p.id.toLowerCase() === params.poaId.trim().toLowerCase() ||
         p.deedNo.toLowerCase().includes(params.poaId.trim().toLowerCase())
  );

  if (!record) {
    return {
      isValid: false,
      verdictCode: 'RECORD_NOT_FOUND',
      status: 'unverified',
      messageBn: `আমমোক্তারনামা আইডি বা দলিল নং '${params.poaId}' সরকারি ডাটাবেজে পাওয়া যায়নি। সাব-রেজিস্ট্রি মূল বালাম বই যাচাই করুন।`,
      messageEn: `PoA record '${params.poaId}' not found in registry. Verify physical volume records.`,
    };
  }

  // 1. Check if revoked
  if (record.status === 'revoked') {
    return {
      isValid: false,
      verdictCode: 'POA_REVOKED',
      status: 'revoked',
      record,
      messageBn: `⛔ আমমোক্তারনামাটি বাতিলকৃত (Revoked)! ${record.revocationDeedNo || ''} মূলে এই দলিল প্রত্যাহার করা হয়েছে। এই আমমোক্তারনামার মাধ্যমে কোনো লেনদেন আইনত অবৈধ ও দণ্ডনীয়।`,
      messageEn: `PROHIBITED: Power of Attorney is REVOKED. Transaction cannot proceed.`,
    };
  }

  // 2. Check if expired
  if (record.status === 'expired' || (record.expiryDate && new Date(record.expiryDate) < new Date())) {
    return {
      isValid: false,
      verdictCode: 'POA_EXPIRED',
      status: 'expired',
      record,
      messageBn: `⚠️ আমমোক্তারনামার মেয়াদ উত্তীর্ণ (Expired)! মেয়াদ উত্তীর্ণের তারিখ ছিল: ${record.expiryDate}।`,
      messageEn: `EXPIRED: Power of Attorney validity expired on ${record.expiryDate}.`,
    };
  }

  // 3. Check if suspended / death event
  if (record.status === 'suspended' || record.deathEventRecorded) {
    return {
      isValid: false,
      verdictCode: 'PRINCIPAL_DEATH_DETERMINED',
      status: 'suspended',
      record,
      messageBn: `⚠️ আমমোক্তারনামা স্থগিত (Suspended)! মূল মালিকের মৃত্যু সংক্রান্ত তথ্য বা আদালতের নোটিশের কারণে কার্যক্রম স্থগিত রয়েছে (পাওয়ার অব অ্যাটর্নি আইন ২০১২ এর ধারা ১২)।`,
      messageEn: `SUSPENDED: Power of attorney suspended pending death/legal status verification under Section 12.`,
    };
  }

  // 4. Check target plot linkage
  if (params.targetPlotId && !record.linkedPlotIds.includes(params.targetPlotId)) {
    return {
      isValid: false,
      verdictCode: 'PLOT_NOT_LINKED',
      status: record.status,
      record,
      messageBn: `⚠️ দাগ বহির্ভূত: এই আমমোক্তারনামাটি নির্বাচিত দাগ/প্লট (${params.targetPlotId}) এর জন্য প্রযোজ্য নয়। অন্তর্ভুক্ত দাগসমূহ: ${record.linkedDagNumbers.join(', ')}।`,
      messageEn: `Plot Mismatch: This PoA does not cover parcel ${params.targetPlotId}.`,
    };
  }

  // 5. Check permitted scope (e.g. sale vs mutation)
  if (params.targetAction && !record.permittedScope.includes(params.targetAction)) {
    return {
      isValid: false,
      verdictCode: 'ACTION_OUT_OF_SCOPE',
      status: record.status,
      record,
      messageBn: `⛔ ক্ষমতার অপব্যবহার ঝুঁকি (Out of Scope): এই আমমোক্তারনামায় '${params.targetAction === 'sale' ? 'জমি বিক্রয় ও সাফ-কবলা' : params.targetAction}' ক্ষমতা দেওয়া হয়নি! অনুমোদিত ক্ষমতা: ${record.permittedScope.join(', ')}।`,
      messageEn: `Scope Exceeded: Representative does not possess authorization for '${params.targetAction}'.`,
    };
  }

  return {
    isValid: true,
    verdictCode: 'VALID_FOR_TRANSACTION',
    status: 'active',
    record,
    messageBn: `✅ আমমোক্তারনামা সম্পূর্ণ সক্রিয় ও বৈধ (Valid)! প্রতিনিধি '${record.attorneyNameBn}' আইনানুগভাবে এই কার্যক্রম পরিচালনার অধিকারী।`,
    messageEn: `VALID: Power of attorney is verified active, unrevoked, and covers the transaction scope.`,
  };
}

/**
 * Initiates and executes official PoA Revocation with simulated OTP verification
 */
export function executePoaRevocation(params: {
  poaId: string;
  revocationDeedNo: string;
  reasonBn: string;
  reasonEn: string;
  actorId: string;
  simulatedOtp: string;
}): { success: boolean; message: string; record?: PowerOfAttorneyRecord } {
  // Verify simulated OTP (must be 6 digits, e.g. "882104" or any 6-digit code)
  if (!params.simulatedOtp || params.simulatedOtp.length !== 6) {
    return { success: false, message: 'অবৈধ ওটিপি কোড! অনুগ্রহ করে ৬-সংখ্যার যাচাইকরণ কোড প্রদান করুন।' };
  }

  const idx = poaStore.findIndex(p => p.id === params.poaId);
  if (idx === -1) {
    return { success: false, message: 'আমমোক্তারনামা রেকর্ড পাওয়া যায়নি।' };
  }

  const current = poaStore[idx];
  const updated: PowerOfAttorneyRecord = {
    ...current,
    status: 'revoked',
    revocationNoticeDate: new Date().toISOString().split('T')[0],
    revocationDeedNo: params.revocationDeedNo || `বাতিলনামা দলিল নং ${Math.floor(1000 + Math.random() * 9000)}/২০২৬`,
    revocationReasonBn: params.reasonBn,
    revocationReasonEn: params.reasonEn,
  };

  poaStore[idx] = updated;

  // Record into Cryptographic Audit Ledger
  recordAuditEvent({
    eventType: 'POA_REVOKED',
    resourceType: 'poa',
    resourceId: current.id,
    actorId: params.actorId,
    actorRole: 'AC_LAND',
    actionSummaryBn: `আমমোক্তারনামা ${current.id} (দলিল নং ${current.deedNo}) বাতিল ও প্রত্যাহার রেকর্ডভুক্তকরণ`,
    actionSummaryEn: `Power of Attorney ${current.id} formally revoked and barred from future transactions`,
    payload: {
      poaId: current.id,
      deedNo: current.deedNo,
      principal: current.principalName,
      revocationDeed: updated.revocationDeedNo,
      reason: params.reasonBn,
    },
  });

  return { success: true, message: 'আমমোক্তারনামাটি সফলভাবে বাতিল করা হয়েছে।', record: updated };
}

/**
 * Triggers simulated death event notification to automatically suspend PoA
 */
export function triggerSimulatedDeathNotice(poaId: string): PowerOfAttorneyRecord | null {
  const idx = poaStore.findIndex(p => p.id === poaId);
  if (idx === -1) return null;

  const current = poaStore[idx];
  const updated: PowerOfAttorneyRecord = {
    ...current,
    status: 'suspended',
    deathEventRecorded: true,
    notes: 'জাতীয় জন্ম ও মৃত্যু নিবন্ধন ডাটাবেজ (সিমুলেটেড ইন্টারফেস) হতে মূল মালিকের মৃত্যুর সংবাদ প্রাপ্তি সাপেক্ষে আমমোক্তারনামা সাময়িক স্থগিত।',
  };

  poaStore[idx] = updated;

  recordAuditEvent({
    eventType: 'POA_SUSPENDED',
    resourceType: 'poa',
    resourceId: current.id,
    actorId: 'SYSTEM-DEATH-REGISTRY',
    actorRole: 'SYSTEM',
    actionSummaryBn: `মূল মালিকের মৃত্যু নোটিশে আমমোক্তারনামা ${current.id} স্বয়ংক্রিয়ভাবে স্থগিতকরণ`,
    actionSummaryEn: `Automatic suspension of PoA ${current.id} triggered by principal death event notification`,
    payload: {
      poaId: current.id,
      principal: current.principalName,
      status: 'suspended',
    },
  });

  return updated;
}
