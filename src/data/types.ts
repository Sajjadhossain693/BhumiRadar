// Centralized mock data store. Plots, deeds, litigation, liens, etc.
// IDs, dates, and reference numbers are language-independent on purpose.

export type Coordinates = { lat: number; lng: number };

export type Owner = {
  id: string;
  name: string;        // proper noun — kept as-is (transliterated name)
  nameBn?: string;     // optional Bengali form
  nid: string;
  fatherName: string;
};

export type UnusualActivity = {
  id: string;
  plotId: string;
  type: 'encroachment_attempt' | 'sand_filling' | 'river_erosion' | 'fraud_deed' | 'boundary_shift';
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: string;
  source: 'satellite' | 'iot_sensor' | 'drone' | 'citizen_report';
};

export type Plot = {
  id: string;            // e.g. "PLT-DHK-001"
  khatian: string;       // khatian number
  dag: string;           // dag number
  district: string;      // English canonical
  districtBn: string;    // Bengali label
  upazila: string;
  upazilaBn: string;
  mouza: string;
  mouzaBn: string;
  areaShotok: number;
  areaDecimal: number;
  owner: Owner;
  ownershipType: 'khas' | 'malikana';
  khasClassification?: 'urban' | 'rural' | 'aquatic' | 'agricultural';
  landClass: 'residential' | 'agricultural' | 'commercial' | 'khas' | 'riverbed';
  riskScore: number;     // 0-100 (lower = safer)
  healthFactors: { legal: number; physical: number; environmental: number; fraud: number };
  coords: Coordinates;
  shape: Coordinates[];   // polygon vertices
  status: 'active' | 'encroached' | 'disputed' | 'locked' | 'shikosti' | 'poyosti' | 'under_review' | 'allocated';
  erosion: number;        // 0-100 % of area eroded
  encumbrance: { bank: string; amount: number; since: string } | null;
  unusualActivity?: UnusualActivity | null;
};

export type Deed = {
  no: string;
  date: string;       // ISO
  type: 'sale' | 'gift' | 'inheritance' | 'partition' | 'mutation' | 'encroachment';
  from: string;
  to: string;
  status: 'cleared' | 'under_review' | 'flagged';
};

export type LitigationCase = {
  id: string;
  caseNo: string;
  court: string;
  petitioner: string;
  respondent: string;
  orderType: 'stay' | 'injunction' | 'attachment';
  plots: string[];
  lockDate: string;
  releaseDate?: string;
  status: 'active' | 'released';
  remarks: string;
};

export type BankLien = {
  id: string;
  bank: string;
  branch: string;
  borrower: string;
  amount: number;
  outstanding: number;
  startDate: string;
  endDate?: string;
  encumbranceNo: string;
  plotId: string;
  status: 'active' | 'released' | 'pending';
};

export type EncroachmentAlert = {
  id: string;
  plotId: string;
  level: 'high' | 'medium' | 'low';
  detectedOn: string;
  evidence: Array<'satellite' | 'photo' | 'sensor'>;
  sensorId?: string;
  location: string;
  actionTaken?: string;
  caseRef?: string;
};

export type FraudAlert = {
  id: string;
  plotId: string;
  type:
    | 'duplicate_deed'
    | 'benami'
    | 'forgery'
    | 'fake_encumbrance'
    | 'fake_mutation'
    | 'identity_mismatch';
  severity: 'high' | 'medium' | 'low';
  description: string;
  createdOn: string;
  dismissed?: boolean;
};

export type FieldInspection = {
  id: string;
  plotId: string;
  inspector: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  completedOn?: string;
  notes?: string;
  finding?: string;
  gps?: Coordinates;
};

export type KhasRecord = {
  id: string;
  classification: 'urban' | 'rural' | 'aquatic' | 'agricultural';
  areaShotok: number;
  allocatedTo?: string;
  allocDate?: string;
  leaseNo?: string;
  status: 'vacant' | 'allocated' | 'encroached';
  district: string;
  upazila: string;
  mouza: string;
};

export type TemporalEvent = {
  year: number;
  area: number;          // total area (shotok)
  erosion: number;       // %
  formation: number;     // poyosti
  ndvi: number;          // 0-1
  ndwi: number;          // 0-1
  ndbi: number;          // 0-1
  settlements: number;
};
