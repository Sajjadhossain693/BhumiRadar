/**
 * Cryptographic Civil Servant Action Ledger Service
 * Tamper-Evident SHA-256 Chained Audit Trail for Land Administration Actions
 */

// Portable pure JavaScript SHA-256 implementation ensuring identical deterministic
// hashing across Node.js unit tests, Vite dev server, and web browsers.
export function sha256(str: string): string {
  function rotr(n: number, b: number): number {
    return (n >>> b) | (n << (32 - b));
  }
  function ch(x: number, y: number, z: number): number {
    return (x & y) ^ (~x & z);
  }
  function maj(x: number, y: number, z: number): number {
    return (x & y) ^ (x & z) ^ (y & z);
  }
  function sigma0(x: number): number {
    return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
  }
  function sigma1(x: number): number {
    return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
  }
  function gamma0(x: number): number {
    return rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
  }
  function gamma1(x: number): number {
    return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      bytes.push(c);
    } else if (c < 2048) {
      bytes.push((c >> 6) | 192, (c & 63) | 128);
    } else if ((c & 0xfc00) === 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
      bytes.push((c >> 18) | 240, ((c >> 12) & 63) | 128, ((c >> 6) & 63) | 128, (c & 63) | 128);
    } else {
      bytes.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
    }
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) {
    bytes.push(0);
  }

  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }
  words.push(Math.floor(bitLength / 0x100000000));
  words.push(bitLength >>> 0);

  const W = new Int32Array(64);
  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      W[t] = words[i + t];
    }
    for (let t = 16; t < 64; t++) {
      W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) | 0;
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    for (let t = 0; t < 64; t++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) | 0;
      const T2 = (sigma0(a) + maj(a, b, c)) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) | 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

export type AuditActorRole = 'AC_LAND' | 'KANUNGO' | 'SURVEYOR' | 'SUB_REGISTRAR' | 'CITIZEN' | 'SYSTEM' | 'ADMIN';

export type AuditResourceType =
  | 'plot'
  | 'poa'
  | 'compensation_claim'
  | 'encroachment_report'
  | 'valuation_schedule'
  | 'litigation_case'
  | 'bank_lien';

export type AuditEventType =
  | 'PLOT_REGISTRATION_LOCKED'
  | 'PLOT_REGISTRATION_UNLOCKED'
  | 'MUTATION_ORDER_ISSUED'
  | 'ENCROACHMENT_REPORTED'
  | 'ENCROACHMENT_SCREENED'
  | 'ENCROACHMENT_INVESTIGATION_STARTED'
  | 'ENCROACHMENT_RESOLVED'
  | 'POA_REGISTERED'
  | 'POA_REVOKED'
  | 'POA_SUSPENDED'
  | 'COMPENSATION_CALCULATED'
  | 'COMPENSATION_CLAIM_APPROVED'
  | 'COMPENSATION_PAYMENT_INITIATED'
  | 'VALUATION_SCHEDULE_APPLIED';

export interface AuditEvent {
  id: string;
  sequence: number;
  timestamp: string; // ISO UTC format
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  resourceId: string;
  actorId: string;
  actorRole: AuditActorRole;
  actionSummaryBn: string;
  actionSummaryEn: string;
  payload: Record<string, any>;
  previousHash: string;
  currentHash: string;
  tampered?: boolean;
}

export interface VerificationResult {
  isValid: boolean;
  totalEvents: number;
  verifiedCount: number;
  errors: Array<{
    eventId: string;
    sequence: number;
    description: string;
    expectedHash: string;
    actualHash: string;
  }>;
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Deterministically serializes an object with sorted keys.
 * Hardened against prototype pollution (__proto__, constructor) and circular recursion DoS.
 */
export function canonicalSerialize(obj: any, depth = 0, seen = new WeakSet()): string {
  if (depth > 12) {
    return '"[MAX_DEPTH_EXCEEDED]"';
  }
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (seen.has(obj)) {
    return '"[CIRCULAR_REF]"';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalSerialize(item, depth + 1, seen)).join(',') + ']';
  }

  // Filter out hazardous prototype pollution keys
  const keys = Object.keys(obj)
    .filter(k => k !== '__proto__' && k !== 'constructor' && k !== 'prototype')
    .sort();

  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalSerialize(obj[k], depth + 1, seen)).join(',') + '}';
}

/**
 * Computes canonical hash for an audit block
 */
export function computeEventHash(params: {
  sequence: number;
  timestamp: string;
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  resourceId: string;
  actorId: string;
  actorRole: AuditActorRole;
  payload: Record<string, any>;
  previousHash: string;
}): string {
  const canonicalString = [
    params.sequence,
    params.timestamp,
    params.eventType,
    params.resourceType,
    params.resourceId,
    params.actorId,
    params.actorRole,
    canonicalSerialize(params.payload),
    params.previousHash,
  ].join('|');

  return sha256(canonicalString);
}

// Seed baseline initial chain representing prior verifiable administrative actions
function createInitialLedger(): AuditEvent[] {
  const seeds: Array<Omit<AuditEvent, 'currentHash' | 'previousHash' | 'sequence'> & { sequence?: number }> = [
    {
      id: 'EVT-2026-0001',
      timestamp: '2026-01-10T08:30:00.000Z',
      eventType: 'PLOT_REGISTRATION_LOCKED',
      resourceType: 'plot',
      resourceId: 'PLT-DHK-001',
      actorId: 'OFFICER-ACL-01',
      actorRole: 'AC_LAND',
      actionSummaryBn: 'দাগ নং ৮৮/৮৮ (ধামরাই) এর ওপর হাইকোর্ট স্থগিতাদেশ নং WP-4521/2024 কার্যকরীকরণ',
      actionSummaryEn: 'Imposed High Court stay order WP-4521/2024 lock on Dag 88/88 (Dhamrai)',
      payload: { caseNo: 'WP-4521/2024', court: 'High Court Division', orderType: 'injunction' },
    },
    {
      id: 'EVT-2026-0002',
      timestamp: '2026-01-14T09:45:00.000Z',
      eventType: 'ENCROACHMENT_SCREENED',
      resourceType: 'encroachment_report',
      resourceId: 'ENC-001',
      actorId: 'SYSTEM',
      actorRole: 'SYSTEM',
      actionSummaryBn: 'পবা মৌজায় দাগ ৪৪/বি সীমানায় আইওটি সেন্সর SNS-RJS-014 সতর্কবার্তার স্যাটেলাইট যাচাই',
      actionSummaryEn: 'Satellite automated cross-verification of IoT boundary sensor alert SNS-RJS-014',
      payload: { sensorId: 'SNS-RJS-014', severity: 'high', location: 'Paba' },
    },
    {
      id: 'EVT-2026-0003',
      timestamp: '2026-01-18T10:15:00.000Z',
      eventType: 'POA_REGISTERED',
      resourceType: 'poa',
      resourceId: 'POA-2024-DHK-0914',
      actorId: 'SUBREG-DHK-04',
      actorRole: 'SUB_REGISTRAR',
      actionSummaryBn: 'উত্তরা সাব-রেজিস্ট্রি অফিসে নিবন্ধিত সাধারণ আমমোক্তারনামা রেকর্ডভুক্তকরণ',
      actionSummaryEn: 'Registered General Power of Attorney registered at Uttara Sub-Registry',
      payload: { deedNo: '5611/2024', principalNid: '198512345678', attorneyNid: '199023456789' },
    },
    {
      id: 'EVT-2026-0004',
      timestamp: '2026-02-01T11:00:00.000Z',
      eventType: 'VALUATION_SCHEDULE_APPLIED',
      resourceType: 'valuation_schedule',
      resourceId: 'SCH-DHK-2026',
      actorId: 'ADMIN-IGR-01',
      actorRole: 'ADMIN',
      actionSummaryBn: 'ঢাকা জেলার উত্তরা ও সাভার উপজেলার সরকারি সর্বনিম্ন মৌজা রেট ২০২৬ কার্যকর',
      actionSummaryEn: 'Applied 2026 official minimum mouza valuation schedule for Dhaka district',
      payload: { gazetteRef: 'SRO-42/2026', effectiveYear: 2026, status: 'active' },
    },
    {
      id: 'EVT-2026-0005',
      timestamp: '2026-02-10T14:20:00.000Z',
      eventType: 'COMPENSATION_CALCULATED',
      resourceType: 'compensation_claim',
      resourceId: 'LA-DHK-2026-042',
      actorId: 'OFFICER-LA-02',
      actorRole: 'AC_LAND',
      actionSummaryBn: 'ঢাকা-আশুলিয়া এলিভেটেড এক্সপ্রেসওয়ে অধিগ্রহণ কেস নং ০৭/২০২৫ এর ক্ষতিপূরণ প্রাক্কলন',
      actionSummaryEn: 'Initial statutory compensation assessment for Dhaka-Ashulia Elevated Expressway project',
      payload: { project: 'Dhaka-Ashulia Expressway', plotId: 'PLT-DHK-002', statutoryMultiplier: 3.0 },
    },
  ];

  const ledger: AuditEvent[] = [];
  let prev = GENESIS_HASH;

  for (let idx = 0; idx < seeds.length; idx++) {
    const s = seeds[idx];
    const seq = idx + 1;
    const currentHash = computeEventHash({
      sequence: seq,
      timestamp: s.timestamp,
      eventType: s.eventType,
      resourceType: s.resourceType,
      resourceId: s.resourceId,
      actorId: s.actorId,
      actorRole: s.actorRole,
      payload: s.payload,
      previousHash: prev,
    });

    const event: AuditEvent = {
      ...s,
      sequence: seq,
      previousHash: prev,
      currentHash,
    };
    ledger.push(event);
    prev = currentHash;
  }

  return ledger;
}

// In-memory ledger storage initialized with verified seed chain
let auditLedgerState: AuditEvent[] = createInitialLedger();

/**
 * Appends a new verified event to the cryptographic audit ledger
 */
export function recordAuditEvent(params: {
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  resourceId: string;
  actorId: string;
  actorRole: AuditActorRole;
  actionSummaryBn: string;
  actionSummaryEn: string;
  payload: Record<string, any>;
}): AuditEvent {
  const prevEvent = auditLedgerState[auditLedgerState.length - 1];
  const previousHash = prevEvent ? prevEvent.currentHash : GENESIS_HASH;
  const sequence = auditLedgerState.length + 1;
  const timestamp = new Date().toISOString();
  const id = `EVT-${new Date().getFullYear()}-${String(sequence).padStart(4, '0')}`;

  const currentHash = computeEventHash({
    sequence,
    timestamp,
    eventType: params.eventType,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    payload: params.payload,
    previousHash,
  });

  const newEvent: AuditEvent = {
    id,
    sequence,
    timestamp,
    eventType: params.eventType,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionSummaryBn: params.actionSummaryBn,
    actionSummaryEn: params.actionSummaryEn,
    payload: params.payload,
    previousHash,
    currentHash,
  };

  auditLedgerState = [...auditLedgerState, newEvent];
  return newEvent;
}

/**
 * Returns the complete audit chain
 */
export function getAuditLedger(): AuditEvent[] {
  return [...auditLedgerState];
}

/**
 * Cryptographically verifies every block in the ledger:
 * 1. Checks that sequence numbers are continuous and strictly increasing.
 * 2. Checks that previousHash correctly references the previous block's currentHash.
 * 3. Re-computes SHA-256 for each block and validates against stored currentHash.
 */
export function verifyLedgerIntegrity(): VerificationResult {
  const errors: VerificationResult['errors'] = [];
  let prevHash = GENESIS_HASH;
  let verifiedCount = 0;

  for (let i = 0; i < auditLedgerState.length; i++) {
    const event = auditLedgerState[i];

    // Check sequence continuity
    if (event.sequence !== i + 1) {
      errors.push({
        eventId: event.id,
        sequence: event.sequence,
        description: `Sequence break detected at index ${i}. Expected ${i + 1}, found ${event.sequence}.`,
        expectedHash: 'valid_sequence',
        actualHash: 'broken_sequence',
      });
    }

    // Check previousHash link
    if (event.previousHash !== prevHash) {
      errors.push({
        eventId: event.id,
        sequence: event.sequence,
        description: `Previous hash pointer mismatch! Previous block hash was ${prevHash.substring(0, 10)}..., but block ${event.id} points to ${event.previousHash.substring(0, 10)}...`,
        expectedHash: prevHash,
        actualHash: event.previousHash,
      });
    }

    // Recompute currentHash
    const expectedHash = computeEventHash({
      sequence: event.sequence,
      timestamp: event.timestamp,
      eventType: event.eventType,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      actorId: event.actorId,
      actorRole: event.actorRole,
      payload: event.payload,
      previousHash: event.previousHash,
    });

    if (expectedHash !== event.currentHash || event.tampered) {
      errors.push({
        eventId: event.id,
        sequence: event.sequence,
        description: `Cryptographic SHA-256 mismatch! Payload or metadata was altered. Expected ${expectedHash.substring(0, 12)}..., stored ${event.currentHash.substring(0, 12)}...`,
        expectedHash,
        actualHash: event.currentHash,
      });
    } else {
      verifiedCount++;
    }

    prevHash = event.currentHash;
  }

  return {
    isValid: errors.length === 0,
    totalEvents: auditLedgerState.length,
    verifiedCount,
    errors,
  };
}

/**
 * Tampering simulation utility to demonstrate detection in tests and UI
 */
export function simulateTamper(eventId: string, modifiedPayload: Record<string, any>): boolean {
  const idx = auditLedgerState.findIndex(e => e.id === eventId);
  if (idx === -1) return false;

  auditLedgerState = auditLedgerState.map((e, i) => {
    if (i === idx) {
      return {
        ...e,
        payload: modifiedPayload,
        tampered: true,
      };
    }
    return e;
  });
  return true;
}

/**
 * Restores ledger integrity by resetting to untampered baseline
 */
export function resetLedgerIntegrity(): void {
  auditLedgerState = createInitialLedger();
}
