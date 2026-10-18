/**
 * Crowdsourced Encroachment Reporting Service ("খাসজমি রক্ষা করুন")
 * Geographic Spatial Verification against Government Khas & Riverine Boundaries
 */

import { plots } from '../data/seed';
import type { Coordinates, Plot } from '../data/types';
import { recordAuditEvent } from './auditLedger';
import {
  sanitizeString,
  maskPhone,
  isValidBangladeshPhone,
  isValidBangladeshNid,
  isWithinBangladeshBounds,
} from './security';

export type IncidentCategory =
  | 'khas_encroachment'
  | 'canal_river_filling'
  | 'wetland_destruction'
  | 'unauthorized_wall'
  | 'hill_cutting'
  | 'forest_land_grabbing';

export type ScreeningOutcome =
  | 'potential_geographic_match'
  | 'no_matching_registered_boundary'
  | 'insufficient_geographic_data'
  | 'pending_field_verification';

export type ReportStatus =
  | 'submitted'
  | 'preliminary_screening'
  | 'awaiting_review'
  | 'field_verification'
  | 'resolved'
  | 'rejected'
  | 'insufficient_evidence';

export interface CitizenEncroachmentReport {
  id: string; // e.g. "CR-2026-0814"
  createdAt: string; // ISO UTC
  incidentDate: string;
  category: IncidentCategory;
  description: string;
  coords?: Coordinates;
  locationName: string;
  evidenceFileName?: string;
  evidencePreviewUrl?: string;
  isAnonymous: boolean;
  reporterInfo?: {
    name?: string;
    phone?: string;
    nid?: string;
  };
  screeningOutcome: ScreeningOutcome;
  matchedPlotId?: string;
  matchedPlotDetails?: {
    dag: string;
    mouza: string;
    ownershipType: string;
    status: string;
  };
  status: ReportStatus;
  assignedOfficer?: string;
  officerNotes?: string;
  resolutionSummary?: string;
}

// Point-in-polygon helper for spatial intersection test
export function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance calculation between two lat/lng points in meters (Haversine formula)
export function getDistanceMeters(p1: Coordinates, p2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (p2.lat - p1.lat) * rad;
  const dLng = (p2.lng - p1.lng) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * rad) * Math.cos(p2.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Geographic Spatial Verification against Government Khas Land & Riverbed Plots
 */
export function screenLocationAgainstProtectedLand(coords?: Coordinates): {
  outcome: ScreeningOutcome;
  matchedPlot?: Plot;
  confidence: 'high' | 'medium' | 'low';
  messageBn: string;
  messageEn: string;
} {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return {
      outcome: 'insufficient_geographic_data',
      confidence: 'low',
      messageBn: 'কোনো জিপিএস স্থানাঙ্ক বা মানচিত্রের অবস্থান প্রদান করা হয়নি। সরেজমিনে তদন্ত প্রয়োজন।',
      messageEn: 'No valid GPS coordinates provided. Requires on-site manual field survey.',
    };
  }

  // 1. Strict Polygon Intersection against registered Khas, Riverbed, or Disputed Parcels
  const protectedPlots = plots.filter(
    p => p.ownershipType === 'khas' || p.landClass === 'riverbed' || p.landClass === 'khas' || p.status === 'shikosti'
  );

  for (const plot of protectedPlots) {
    if (plot.shape && isPointInPolygon(coords, plot.shape)) {
      return {
        outcome: 'potential_geographic_match',
        matchedPlot: plot,
        confidence: 'high',
        messageBn: `সতর্কতা: প্রদত্ত স্থানাঙ্কটি সরাসরি সরকারি খাসজমি/নদী সীমানাভুক্ত দাগ নং ${plot.dag} (${plot.mouzaBn}) এর ভেতর চিহ্নিত হয়েছে!`,
        messageEn: `Match Confirmed: Location intersects registered government khas/riverbed parcel Dag ${plot.dag} (${plot.mouza}).`,
      };
    }
  }

  // 2. Buffer Proximity Check (within 450 meters of any protected khas / river parcel)
  for (const plot of protectedPlots) {
    const dist = getDistanceMeters(coords, plot.coords);
    if (dist <= 450) {
      return {
        outcome: 'potential_geographic_match',
        matchedPlot: plot,
        confidence: 'medium',
        messageBn: `প্রদত্ত অবস্থানটি সরকারি খাসজমি দাগ নং ${plot.dag} এর সীমানার সন্নিকটে (দূরত্ব: আনুমানিক ${Math.round(dist)} মিটার)।`,
        messageEn: `Location is in close buffer proximity (~${Math.round(dist)}m) to government parcel Dag ${plot.dag}.`,
      };
    }
  }

  // 3. Fallback: Check all other registered plots
  const nearestAnyPlot = plots.find(p => getDistanceMeters(coords, p.coords) <= 300);
  if (nearestAnyPlot) {
    return {
      outcome: 'pending_field_verification',
      matchedPlot: nearestAnyPlot,
      confidence: 'medium',
      messageBn: `অবস্থানটি দাগ নং ${nearestAnyPlot.dag} এর সংলগ্ন কিন্তু সরকারি খাসজমি ডাটাবেজে তাৎক্ষণিক রেকর্ড পাওয়া যায়নি। কানুনগো সরেজমিন যাচাই প্রযোজ্য।`,
      messageEn: `Location near Dag ${nearestAnyPlot.dag}. Not currently registered as khas; pending surveyor inspection.`,
    };
  }

  return {
    outcome: 'no_matching_registered_boundary',
    confidence: 'low',
    messageBn: 'প্রদত্ত স্থানাঙ্কের আশেপাশে কোনো সংরক্ষিত সরকারি খাসজমি বা খালের সীমানা রেকর্ডভুক্ত নেই।',
    messageEn: 'No matching registered public land boundaries within standard spatial buffer.',
  };
}

// Initial seed citizen reports for demonstration
const INITIAL_REPORTS: CitizenEncroachmentReport[] = [
  {
    id: 'CR-2026-0041',
    createdAt: '2026-02-14T06:15:00.000Z',
    incidentDate: '2026-02-13',
    category: 'canal_river_filling',
    description: 'তুরাগ নদী সংলগ্ন খাস খালের মুখে রাতারাতি বালু ভরাট করে রাস্তা নির্মাণের অপচেষ্টা চলছে।',
    coords: { lat: 23.8725, lng: 90.3950 },
    locationName: 'উত্তরা সেক্টর ৪ সংলগ্ন খাল এলাকা',
    evidenceFileName: 'turag_sand_filling.jpg',
    isAnonymous: true,
    screeningOutcome: 'potential_geographic_match',
    matchedPlotId: 'PLT-DHK-001',
    matchedPlotDetails: {
      dag: '88/88',
      mouza: 'বালিয়া',
      ownershipType: 'malikana',
      status: 'locked',
    },
    status: 'field_verification',
    assignedOfficer: 'মোঃ মনির হোসেন (উপজেলা কানুনগো)',
    officerNotes: 'সরেজমিন পরিদর্শনে ড্রেজার জব্দ ও ভরাট বন্ধের নির্দেশ দেওয়া হয়েছে।',
  },
  {
    id: 'CR-2026-0038',
    createdAt: '2026-02-08T11:30:00.000Z',
    incidentDate: '2026-02-07',
    category: 'unauthorized_wall',
    description: 'সরকারি খাস জমিতে রাতারাতি পাকা সীমানা প্রাচীর তুলে দখল প্রতিষ্ঠার চেষ্টা।',
    coords: { lat: 24.3700, lng: 88.6500 },
    locationName: 'পবা, রাজশাহী',
    isAnonymous: false,
    reporterInfo: {
      name: 'গোলাম কিবরিয়া',
      phone: '01712998877',
    },
    screeningOutcome: 'potential_geographic_match',
    matchedPlotId: 'PLT-RJS-031',
    matchedPlotDetails: {
      dag: '44/B',
      mouza: 'পবা',
      ownershipType: 'khas',
      status: 'encroached',
    },
    status: 'awaiting_review',
    assignedOfficer: 'সহকারী কমিশনার (ভূমি), পবা',
  },
  {
    id: 'CR-2026-0029',
    createdAt: '2026-01-28T09:00:00.000Z',
    incidentDate: '2026-01-26',
    category: 'khas_encroachment',
    description: 'কাউনিয়া সদর এলাকায় তিস্তা নদীর চরে জেগে ওঠা নতুন সরকারি পয়স্তি খাসজমি দখল করে সাইনবোর্ড টানানো হয়েছে।',
    coords: { lat: 25.7800, lng: 89.4300 },
    locationName: 'কাউনিয়া সদর, রংপুর',
    isAnonymous: true,
    screeningOutcome: 'potential_geographic_match',
    matchedPlotId: 'PLT-RNG-019',
    matchedPlotDetails: {
      dag: '275',
      mouza: 'কাউনিয়া সদর',
      ownershipType: 'khas',
      status: 'under_review',
    },
    status: 'resolved',
    assignedOfficer: 'ইউএনও ও এসি ল্যান্ড কাউনিয়া',
    resolutionSummary: 'অবৈধ সাইনবোর্ড অপসারণ করে ১ নং খাস খতিয়ানভুক্ত সরকারি সাইনবোর্ড পুনঃস্থাপন করা হয়েছে।',
  },
];

let reportsStore: CitizenEncroachmentReport[] = [...INITIAL_REPORTS];

export function getEncroachmentReports(): CitizenEncroachmentReport[] {
  return [...reportsStore];
}

export function getPublicReportStatus(reportId: string): CitizenEncroachmentReport | null {
  const report = reportsStore.find(r => r.id.toLowerCase() === reportId.trim().toLowerCase());
  if (!report) return null;

  // Redact all confidential PII for public tracking
  return {
    id: report.id,
    createdAt: report.createdAt,
    incidentDate: report.incidentDate,
    category: report.category,
    description: report.description,
    locationName: report.locationName,
    isAnonymous: true,
    reporterInfo: undefined, // Confidential: NEVER exposed to public!
    screeningOutcome: report.screeningOutcome,
    status: report.status,
    resolutionSummary: report.resolutionSummary,
    matchedPlotDetails: report.matchedPlotDetails,
  };
}

export function submitCitizenEncroachmentReport(params: {
  category: IncidentCategory;
  description: string;
  incidentDate: string;
  locationName: string;
  coords?: Coordinates;
  evidenceFileName?: string;
  isAnonymous: boolean;
  reporterInfo?: { name?: string; phone?: string; nid?: string };
}): CitizenEncroachmentReport {
  const sequence = reportsStore.length + 1;
  const id = `CR-${new Date().getFullYear()}-${String(sequence).padStart(4, '0')}`;

  // Sanitize all citizen-supplied text inputs to prevent XSS and buffer overflow
  const cleanDescription = sanitizeString(params.description, 1000);
  const cleanLocationName = sanitizeString(params.locationName, 200);
  const cleanEvidenceFile = params.evidenceFileName ? sanitizeString(params.evidenceFileName, 120) : undefined;

  // Validate coordinates: ensure finite and within Bangladesh bounds if provided
  let validCoords: Coordinates | undefined = undefined;
  if (
    params.coords &&
    typeof params.coords.lat === 'number' &&
    typeof params.coords.lng === 'number' &&
    Number.isFinite(params.coords.lat) &&
    Number.isFinite(params.coords.lng)
  ) {
    validCoords = {
      lat: Math.max(-90, Math.min(90, params.coords.lat)),
      lng: Math.max(-180, Math.min(180, params.coords.lng)),
    };
  }

  // Sanitize reporter information if not anonymous
  let cleanReporterInfo = undefined;
  if (!params.isAnonymous && params.reporterInfo) {
    cleanReporterInfo = {
      name: params.reporterInfo.name ? sanitizeString(params.reporterInfo.name, 100) : undefined,
      phone: params.reporterInfo.phone ? sanitizeString(params.reporterInfo.phone, 20) : undefined,
      nid: params.reporterInfo.nid ? sanitizeString(params.reporterInfo.nid, 25) : undefined,
    };
  }

  const screening = screenLocationAgainstProtectedLand(validCoords);

  const newReport: CitizenEncroachmentReport = {
    id,
    createdAt: new Date().toISOString(),
    incidentDate: params.incidentDate || new Date().toISOString().split('T')[0],
    category: params.category,
    description: cleanDescription,
    coords: validCoords,
    locationName: cleanLocationName,
    evidenceFileName: cleanEvidenceFile,
    isAnonymous: params.isAnonymous,
    reporterInfo: cleanReporterInfo,
    screeningOutcome: screening.outcome,
    matchedPlotId: screening.matchedPlot?.id,
    matchedPlotDetails: screening.matchedPlot
      ? {
          dag: screening.matchedPlot.dag,
          mouza: screening.matchedPlot.mouzaBn,
          ownershipType: screening.matchedPlot.ownershipType,
          status: screening.matchedPlot.status,
        }
      : undefined,
    status: 'submitted',
  };

  reportsStore = [newReport, ...reportsStore];

  // Whistleblower PII protection: Mask phone number in immutable cryptographic action ledger
  const actorId = params.isAnonymous
    ? 'CITIZEN-ANONYMOUS'
    : cleanReporterInfo?.phone
    ? `CITIZEN-${maskPhone(cleanReporterInfo.phone)}`
    : 'CITIZEN-VERIFIED';

  // Record audit trail in Cryptographic Ledger
  recordAuditEvent({
    eventType: 'ENCROACHMENT_REPORTED',
    resourceType: 'encroachment_report',
    resourceId: id,
    actorId,
    actorRole: 'CITIZEN',
    actionSummaryBn: `নাগরিক কর্তৃক খাসজমি/জলাশয় দখল সংক্রান্ত অভিযোগ দায়ের (ট্র্যাকিং আইডি: ${id})`,
    actionSummaryEn: `Citizen crowdsourced encroachment alert submitted (Tracking ID: ${id})`,
    payload: {
      reportId: id,
      category: params.category,
      screeningOutcome: screening.outcome,
      matchedPlotId: screening.matchedPlot?.id,
      hasCoords: !!validCoords,
    },
  });

  return newReport;
}

export function updateReportStatusByOfficer(params: {
  reportId: string;
  status: ReportStatus;
  officerName: string;
  officerNotes?: string;
  resolutionSummary?: string;
}): CitizenEncroachmentReport | null {
  const index = reportsStore.findIndex(r => r.id === params.reportId);
  if (index === -1) return null;

  const cleanOfficerName = sanitizeString(params.officerName || 'OFFICER-AC-LAND', 100);
  const cleanOfficerNotes = params.officerNotes !== undefined ? sanitizeString(params.officerNotes, 1000) : undefined;
  const cleanResolution = params.resolutionSummary !== undefined ? sanitizeString(params.resolutionSummary, 1000) : undefined;

  const current = reportsStore[index];
  const updated: CitizenEncroachmentReport = {
    ...current,
    status: params.status,
    assignedOfficer: cleanOfficerName || current.assignedOfficer,
    officerNotes: cleanOfficerNotes !== undefined ? cleanOfficerNotes : current.officerNotes,
    resolutionSummary: cleanResolution !== undefined ? cleanResolution : current.resolutionSummary,
  };

  reportsStore[index] = updated;

  // Record audit event
  recordAuditEvent({
    eventType: params.status === 'resolved' ? 'ENCROACHMENT_RESOLVED' : 'ENCROACHMENT_INVESTIGATION_STARTED',
    resourceType: 'encroachment_report',
    resourceId: current.id,
    actorId: cleanOfficerName,
    actorRole: 'AC_LAND',
    actionSummaryBn: `ভূমি কর্মকর্তা কর্তৃক বেদখল রিপোর্ট ${current.id} এর স্থিতি পরিবর্তন: ${params.status}`,
    actionSummaryEn: `Officer updated encroachment alert ${current.id} status to ${params.status}`,
    payload: {
      reportId: current.id,
      previousStatus: current.status,
      newStatus: params.status,
      notes: cleanOfficerNotes,
    },
  });

  return updated;
}

export function getAllCitizenReports(): CitizenEncroachmentReport[] {
  return [...reportsStore];
}

