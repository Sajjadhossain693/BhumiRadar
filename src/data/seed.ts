import type {
  BankLien, Deed, EncroachmentAlert, FieldInspection, FraudAlert,
  KhasRecord, LitigationCase, Owner, Plot, TemporalEvent,
} from './types';

const owner = (id: string, name: string, nameBn: string, nid: string, f: string): Owner =>
  ({ id, name, nameBn, nid, fatherName: f });

// ===== Districts / upazilas (canonical EN + BN labels) =====
export const districts = [
  { id: 'dhaka',  en: 'Dhaka',         bn: 'ঢাকা' },
  { id: 'sylhet', en: 'Sylhet',        bn: 'সিলেট' },
  { id: 'rajshahi', en: 'Rajshahi',    bn: 'রাজশাহী' },
  { id: 'khulna', en: 'Khulna',        bn: 'খুলনা' },
  { id: 'barisal', en: 'Barisal',      bn: 'বরিশাল' },
  { id: 'chattogram', en: 'Chattogram',bn: 'চট্টগ্রাম' },
  { id: 'rangpur', en: 'Rangpur',      bn: 'রংপুর' },
  { id: 'mymensingh', en: 'Mymensingh',bn: 'ময়মনসিংহ' },
];

export const upazilasByDistrict: Record<string, Array<{ id: string; en: string; bn: string }>> = {
  dhaka: [
    { id: 'dhamrai', en: 'Dhamrai',         bn: 'ধামরাই' },
    { id: 'savar',   en: 'Savar',           bn: 'সাভার' },
    { id: 'keraniganj', en: 'Keraniganj',   bn: 'কেরাণীগঞ্জ' },
    { id: 'uttara',  en: 'Uttara',          bn: 'উত্তরা' },
  ],
  sylhet: [
    { id: 'moulvibazar', en: 'Moulvibazar', bn: 'মৌলভীবাজার' },
    { id: 'sylhet-sadar', en: 'Sylhet Sadar',bn: 'সিলেট সদর' },
  ],
  rajshahi: [
    { id: 'paba',  en: 'Paba',  bn: 'পবা' },
    { id: 'godagari', en: 'Godagari', bn: 'গোদাগাড়ী' },
  ],
  khulna: [
    { id: 'batiaghata', en: 'Batiaghata', bn: 'বটিয়াঘাটা' },
    { id: 'dacope', en: 'Dacope', bn: 'ডাকোপ' },
  ],
  barisal: [
    { id: 'barisal-sadar', en: 'Barisal Sadar', bn: 'বরিশাল সদর' },
    { id: 'banaripara', en: 'Banaripara', bn: 'বানারীপাড়া' },
  ],
  chattogram: [
    { id: 'coxsbazar', en: "Cox's Bazar", bn: 'কক্সবাজার' },
    { id: 'sandwip', en: 'Sandwip', bn: 'সন্দ্বীপ' },
  ],
  rangpur: [
    { id: 'kaunia', en: 'Kaunia', bn: 'কাউনিয়া' },
  ],
  mymensingh: [
    { id: 'muktagachha', en: 'Muktagachha', bn: 'মুক্তাগাছা' },
  ],
};

export const mouzasByUpazila: Record<string, Array<{ id: string; en: string; bn: string }>> = {
  dhamrai: [
    { id: 'balia', en: 'Balia', bn: 'বালিয়া' },
    { id: 'kushura', en: 'Kushura', bn: 'কুশুরা' },
    { id: 'sutiya', en: 'Sutiya', bn: 'সুতিয়া' },
  ],
  savar: [
    { id: 'hemayetpur', en: 'Hemayetpur', bn: 'হেমায়েতপুর' },
    { id: 'baipayl', en: 'Baipayl', bn: 'বাইপাইল' },
  ],
  keraniganj: [
    { id: 'kalatia', en: 'Kalatia', bn: 'কলাতিয়া' },
  ],
  uttara: [
    { id: 'uttara-sector4', en: 'Uttara Sector 4', bn: 'উত্তরা সেক্টর ৪' },
  ],
  moulvibazar: [
    { id: 'kulaura', en: 'Kulaura', bn: 'কুলাউড়া' },
  ],
  'sylhet-sadar': [
    { id: 'akhalia', en: 'Akhalia', bn: 'আখলিয়া' },
  ],
  paba: [
    { id: 'paba-s', en: 'Paba', bn: 'পবা' },
  ],
  godagari: [
    { id: 'godagari-s', en: 'Godagari', bn: 'গোদাগাড়ী' },
  ],
  batiaghata: [
    { id: 'batiaghata-s', en: 'Batiaghata', bn: 'বটিয়াঘাটা' },
  ],
  dacope: [
    { id: 'dacope-s', en: 'Dacope', bn: 'ডাকোপ' },
  ],
  'barisal-sadar': [
    { id: 'barisal-city', en: 'Barisal City', bn: 'বরিশাল শহর' },
  ],
  banaripara: [
    { id: 'banaripara-s', en: 'Banaripara', bn: 'বানারীপাড়া' },
  ],
  coxsbazar: [
    { id: 'coxsbazar-s', en: "Cox's Bazar Sadar", bn: 'কক্সবাজার সদর' },
  ],
  sandwip: [
    { id: 'sandwip-s', en: 'Sandwip Sadar', bn: 'সন্দ্বীপ সদর' },
  ],
  kaunia: [
    { id: 'kaunia-s', en: 'Kaunia Sadar', bn: 'কাউনিয়া সদর' },
  ],
  muktagachha: [
    { id: 'muktagachha-s', en: 'Muktagachha Sadar', bn: 'মুক্তাগাছা সদর' },
  ],
};

// ===== Owners =====
const owners: Owner[] = [
  owner('O-1', 'Abdul Karim',  'আব্দুল করিম',    '198512345678', 'Abdul Hamid'),
  owner('O-2', 'Mohammad Ali', 'মোহাম্মদ আলী',     '199023456789', 'Mohammad Osman'),
  owner('O-3', 'Fatema Begum', 'ফাতেমা বেগম',      '198734567890', 'Abdul Khalek'),
  owner('O-4', 'Shamsul Haque','শামসুল হক',       '197845678901', 'Shamsuddin'),
  owner('O-5', 'Rabeya Khatun','রাবেয়া খাতুন',    '199156789012', 'Amin Uddin'),
  owner('O-6', 'Md. Jalal Uddin','মোঃ জালাল উদ্দিন','198867890123', 'Md. Kamal Uddin'),
  owner('O-7', 'Khaleda Zia',  'খালেদা জিয়া',      '197978901234', 'Tofail Ahmed'),
  owner('O-8', 'Abdul Mannan', 'আব্দুল মান্নান',   '198089012345', 'Abdul Gani'),
  owner('GOV-1', 'Government of Bangladesh', 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', 'N/A', 'N/A'),
];

// Helper: a 6-vertex polygon in lat/lng space (Bangladesh)
const poly = (cx: number, cy: number, r = 0.008): [number, number][] => {
  const out: [number, number][] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6]);
  }
  return out;
};

const shapeFromPoly = (p: [number, number][]) => p.map(([lng, lat]) => ({ lat, lng }));

// ===== Plots =====
export const plots: Plot[] = [
  {
    id: 'PLT-DHK-001', khatian: 'KH-1284', dag: '88/88',
    district: 'Dhaka', districtBn: 'ঢাকা', upazila: 'Dhamrai', upazilaBn: 'ধামরাই',
    mouza: 'Balia', mouzaBn: 'বালিয়া', areaShotok: 32, areaDecimal: 24.5,
    owner: owners[0], ownershipType: 'malikana', landClass: 'agricultural', riskScore: 28,
    healthFactors: { legal: 18, physical: 12, environmental: 25, fraud: 8 },
    coords: { lat: 23.8800, lng: 90.1200 }, shape: shapeFromPoly(poly(90.1200, 23.8800)),
    status: 'active', erosion: 4,
    encumbrance: null,
  },
  {
    id: 'PLT-DHK-002', khatian: 'KH-1290', dag: '92',
    district: 'Dhaka', districtBn: 'ঢাকা', upazila: 'Savar', upazilaBn: 'সাভার',
    mouza: 'Hemayetpur', mouzaBn: 'হেমায়েতপুর', areaShotok: 18, areaDecimal: 14.0,
    owner: owners[1], ownershipType: 'malikana', landClass: 'residential', riskScore: 56,
    healthFactors: { legal: 22, physical: 38, environmental: 18, fraud: 12 },
    coords: { lat: 23.8530, lng: 90.2540 }, shape: shapeFromPoly(poly(90.2540, 23.8530, 0.006)),
    status: 'disputed', erosion: 0,
    encumbrance: { bank: 'Sonali Bank', amount: 850000, since: '2023-04-12' },
    unusualActivity: {
      id: 'ACT-002', plotId: 'PLT-DHK-002', type: 'boundary_shift',
      title: 'Boundary Deviation Detected', titleBn: 'ক্যাডাস্ট্রাল সীমানা বিচ্যুতি শনাক্ত',
      description: 'IoT sensor detected 14% deviation on boundary line.',
      descriptionBn: 'সীমানা পিলারে IoT সেন্সরে ১৪% বিচ্যুতি ও অননুমোদিত প্রাচীর শনাক্ত হয়েছে।',
      severity: 'medium', timestamp: '2026-01-17 08:30', source: 'iot_sensor',
    },
  },
  {
    id: 'PLT-SYL-014', khatian: 'KH-4421', dag: '188',
    district: 'Sylhet', districtBn: 'সিলেট', upazila: 'Moulvibazar', upazilaBn: 'মৌলভীবাজার',
    mouza: 'Kulaura', mouzaBn: 'কুলাউড়া', areaShotok: 48, areaDecimal: 37.2,
    owner: owners[2], ownershipType: 'malikana', landClass: 'agricultural', riskScore: 82,
    healthFactors: { legal: 25, physical: 92, environmental: 70, fraud: 5 },
    coords: { lat: 24.5200, lng: 92.0300 }, shape: shapeFromPoly(poly(92.0300, 24.5200, 0.012)),
    status: 'shikosti', erosion: 47,
    encumbrance: null,
    unusualActivity: {
      id: 'ACT-003', plotId: 'PLT-SYL-014', type: 'river_erosion',
      title: 'Rapid River Erosion Anomaly', titleBn: 'নদী সিকস্তি: নদীগর্ভে জমির আকস্মিক ভাঙন',
      description: 'Satellite radar indicates 47% erosion into riverbed within 30 days.',
      descriptionBn: 'উপগ্রহ চিত্রে ৩০ দিনে ৪৭% জমি নদীগর্ভে বিলীন শনাক্ত হয়েছে।',
      severity: 'critical', timestamp: '2026-01-17 09:12', source: 'satellite',
    },
  },
  {
    id: 'PLT-BAR-007', khatian: 'KH-7782', dag: '215',
    district: 'Barisal', districtBn: 'বরিশাল', upazila: 'Banaripara', upazilaBn: 'বানারীপাড়া',
    mouza: 'Banaripara', mouzaBn: 'বানারীপাড়া', areaShotok: 64, areaDecimal: 49.6,
    owner: owners[3], ownershipType: 'malikana', landClass: 'agricultural', riskScore: 22,
    healthFactors: { legal: 8, physical: 14, environmental: 22, fraud: 6 },
    coords: { lat: 22.7800, lng: 90.5500 }, shape: shapeFromPoly(poly(90.5500, 22.7800, 0.014)),
    status: 'poyosti', erosion: 0,
    encumbrance: null,
  },
  {
    id: 'PLT-RJS-031', khatian: 'KH-3301', dag: '44/B',
    district: 'Rajshahi', districtBn: 'রাজশাহী', upazila: 'Paba', upazilaBn: 'পবা',
    mouza: 'Paba', mouzaBn: 'পবা', areaShotok: 22, areaDecimal: 17.0,
    owner: owners[4], ownershipType: 'malikana', landClass: 'residential', riskScore: 44,
    healthFactors: { legal: 30, physical: 12, environmental: 18, fraud: 32 },
    coords: { lat: 24.3700, lng: 88.6500 }, shape: shapeFromPoly(poly(88.6500, 24.3700, 0.009)),
    status: 'encroached', erosion: 0,
    encumbrance: { bank: 'Janata Bank', amount: 1200000, since: '2022-11-05' },
    unusualActivity: {
      id: 'ACT-001', plotId: 'PLT-RJS-031', type: 'encroachment_attempt',
      title: 'Encroachment Attempt on Private Boundary', titleBn: 'মালিকানা সীমানায় অবৈধ দখল চেষ্টা শনাক্ত',
      description: 'Sensor SNS-RJS-014 triggered: unpermitted boundary wall construction.',
      descriptionBn: 'সেন্সর SNS-RJS-014 সক্রিয়: অননুমোদিত সীমানা প্রাচীর নির্মাণের অপচেষ্টা শনাক্ত।',
      severity: 'critical', timestamp: '2026-01-17 09:45', source: 'iot_sensor',
    },
  },
  {
    id: 'PLT-KHL-002', khatian: 'KH-9912', dag: '301',
    district: 'Khulna', districtBn: 'খুলনা', upazila: 'Dacope', upazilaBn: 'ডাকোপ',
    mouza: 'Dacope', mouzaBn: 'ডাকোপ', areaShotok: 88, areaDecimal: 68.1,
    owner: owners[5], ownershipType: 'malikana', landClass: 'agricultural', riskScore: 72,
    healthFactors: { legal: 20, physical: 78, environmental: 64, fraud: 10 },
    coords: { lat: 22.5800, lng: 89.5100 }, shape: shapeFromPoly(poly(89.5100, 22.5800, 0.016)),
    status: 'shikosti', erosion: 38,
    encumbrance: null,
  },
  {
    id: 'PLT-CXB-006', khatian: 'KH-2255', dag: '64',
    district: 'Chattogram', districtBn: 'চট্টগ্রাম', upazila: "Cox's Bazar", upazilaBn: 'কক্সবাজার',
    mouza: "Cox's Bazar Sadar", mouzaBn: 'কক্সবাজার সদর', areaShotok: 12, areaDecimal: 9.3,
    owner: owners[6], ownershipType: 'malikana', landClass: 'commercial', riskScore: 30,
    healthFactors: { legal: 22, physical: 10, environmental: 18, fraud: 24 },
    coords: { lat: 21.4272, lng: 92.0058 }, shape: shapeFromPoly(poly(92.0058, 21.4272, 0.006)),
    status: 'locked', erosion: 0,
    encumbrance: { bank: 'Dutch-Bangla Bank', amount: 2400000, since: '2024-01-19' },
  },
  {
    id: 'PLT-DHK-008', khatian: 'KH-1322', dag: '110',
    district: 'Dhaka', districtBn: 'ঢাকা', upazila: 'Keraniganj', upazilaBn: 'কেরাণীগঞ্জ',
    mouza: 'Kalatia', mouzaBn: 'কলাতিয়া', areaShotok: 26, areaDecimal: 20.1,
    owner: owners[7], ownershipType: 'malikana', landClass: 'residential', riskScore: 18,
    healthFactors: { legal: 6, physical: 8, environmental: 14, fraud: 4 },
    coords: { lat: 23.7050, lng: 90.4090 }, shape: shapeFromPoly(poly(90.4090, 23.7050, 0.008)),
    status: 'active', erosion: 0,
    encumbrance: null,
  },
  {
    id: 'PLT-RNG-019', khatian: 'KH-5005', dag: '275',
    district: 'Rangpur', districtBn: 'রংপুর', upazila: 'Kaunia', upazilaBn: 'কাউনিয়া',
    mouza: 'Kaunia Sadar', mouzaBn: 'কাউনিয়া সদর', areaShotok: 80, areaDecimal: 62.0,
    owner: owners[8], ownershipType: 'khas', khasClassification: 'agricultural', landClass: 'khas', riskScore: 36,
    healthFactors: { legal: 8, physical: 16, environmental: 30, fraud: 22 },
    coords: { lat: 25.7800, lng: 89.4300 }, shape: shapeFromPoly(poly(89.4300, 25.7800, 0.010)),
    status: 'under_review', erosion: 0,
    encumbrance: null,
  },
  {
    id: 'PLT-MYM-004', khatian: 'KH-6611', dag: '17',
    district: 'Mymensingh', districtBn: 'ময়মনসিংহ', upazila: 'Muktagachha', upazilaBn: 'মুক্তাগাছা',
    mouza: 'Muktagachha Sadar', mouzaBn: 'মুক্তাগাছা সদর', areaShotok: 19, areaDecimal: 14.7,
    owner: owners[1], ownershipType: 'malikana', landClass: 'agricultural', riskScore: 50,
    healthFactors: { legal: 18, physical: 28, environmental: 24, fraud: 18 },
    coords: { lat: 24.7700, lng: 90.2600 }, shape: shapeFromPoly(poly(90.2600, 24.7700, 0.008)),
    status: 'active', erosion: 12,
    encumbrance: null,
  },
  {
    id: 'PLT-KHS-DHK', khatian: 'KH-KHAS-01', dag: '১/খাস',
    district: 'Dhaka', districtBn: 'ঢাকা', upazila: 'Savar', upazilaBn: 'সাভার',
    mouza: 'Hemayetpur', mouzaBn: 'হেমায়েতপুর', areaShotok: 320, areaDecimal: 248.0,
    owner: owners[8], ownershipType: 'khas', khasClassification: 'aquatic', landClass: 'khas', riskScore: 84,
    healthFactors: { legal: 34, physical: 25, environmental: 88, fraud: 28 },
    coords: { lat: 23.8650, lng: 90.2650 }, shape: shapeFromPoly(poly(90.2650, 23.8650, 0.014)),
    status: 'encroached', erosion: 0,
    encumbrance: null,
    unusualActivity: {
      id: 'ACT-004', plotId: 'PLT-KHS-DHK', type: 'sand_filling',
      title: 'Illegal Sand Filling on Government Khas Canal', titleBn: 'সরকারি খাস খাল ও জলাশয়ে অবৈধ বালু ভরাট শনাক্ত',
      description: 'Satellite spectral NDWI drop indicates active land reclamation on government waterbody.',
      descriptionBn: 'উপগ্রহ বিশ্লেষণ ও IoT চিত্রে খাস জলাশয়ে অবৈধ ড্রেজিং ও বালু ভরাট কার্যক্রম শনাক্ত।',
      severity: 'critical', timestamp: '2026-01-17 09:52', source: 'satellite',
    },
  },
  {
    id: 'PLT-KHS-RJS', khatian: 'KH-KHAS-02', dag: '৫/খাস',
    district: 'Rajshahi', districtBn: 'রাজশাহী', upazila: 'Paba', upazilaBn: 'পবা',
    mouza: 'Paba', mouzaBn: 'পবা', areaShotok: 240, areaDecimal: 186.0,
    owner: owners[8], ownershipType: 'khas', khasClassification: 'urban', landClass: 'khas', riskScore: 22,
    healthFactors: { legal: 10, physical: 8, environmental: 15, fraud: 8 },
    coords: { lat: 24.3850, lng: 88.6650 }, shape: shapeFromPoly(poly(88.6650, 24.3850, 0.016)),
    status: 'allocated', erosion: 0,
    encumbrance: null,
  },
];

// ===== Deeds (per plot) =====
export const deeds: Record<string, Deed[]> = {
  'PLT-DHK-001': [
    { no: '5611',           date: '2016-04-12', type: 'inheritance', from: 'Abdul Hamid',  to: 'Abdul Karim',  status: 'cleared' },
    { no: '5912',           date: '2019-09-03', type: 'sale',        from: 'Abdul Karim',  to: 'Mohammad Ali', status: 'cleared' },
    { no: '6104',           date: '2025-02-15', type: 'encroachment',from: '—',            to: '—',            status: 'flagged' },
  ],
  'PLT-DHK-002': [
    { no: '3402',           date: '2018-07-22', type: 'sale',        from: 'Mohammad Ali', to: 'Fatema Begum', status: 'cleared' },
    { no: '3998',           date: '2022-12-04', type: 'mutation',    from: 'Fatema Begum', to: 'Shamsul Haque',status: 'under_review' },
  ],
  'PLT-SYL-014': [
    { no: '1201',           date: '2012-03-15', type: 'inheritance', from: '—',            to: 'Fatema Begum', status: 'cleared' },
    { no: '1522',           date: '2015-08-09', type: 'sale',        from: 'Fatema Begum', to: 'Abdul Karim',  status: 'cleared' },
  ],
  'PLT-BAR-007': [
    { no: '8801',           date: '2017-05-12', type: 'partition',   from: 'Brothers',     to: 'Shamsul Haque',status: 'cleared' },
  ],
  'PLT-RJS-031': [
    { no: '4422',           date: '2014-11-09', type: 'sale',        from: 'Amin Uddin',   to: 'Rabeya Khatun',status: 'cleared' },
    { no: '4701',           date: '2020-06-18', type: 'mutation',    from: 'Rabeya Khatun',to: 'Jalal Uddin',  status: 'flagged' },
  ],
};

// ===== Litigation =====
export const litigation: LitigationCase[] = [
  {
    id: 'LIT-001', caseNo: 'WP-4521/2024', court: 'High Court Division',
    petitioner: 'Abdul Karim', respondent: 'Mohammad Ali',
    orderType: 'injunction', plots: ['PLT-CXB-006', 'PLT-DHK-008'],
    lockDate: '2024-02-18', status: 'active',
    remarks: 'Title dispute pending since 2024.',
  },
  {
    id: 'LIT-002', caseNo: 'CS-118/2023', court: 'District Judge Court, Dhaka',
    petitioner: 'Fatema Begum', respondent: 'Abdul Karim',
    orderType: 'stay', plots: ['PLT-SYL-014'],
    lockDate: '2023-11-04', status: 'active',
    remarks: 'Shikosti claim under review.',
  },
  {
    id: 'LIT-003', caseNo: 'CR-208/2021', court: 'Sessions Court, Rajshahi',
    petitioner: 'Amin Uddin', respondent: 'Rabeya Khatun',
    orderType: 'attachment', plots: ['PLT-RJS-031'],
    lockDate: '2021-09-21', releaseDate: '2024-08-15', status: 'released',
    remarks: 'Case dismissed; lock released.',
  },
];

// ===== Bank liens =====
export const liens: BankLien[] = [
  { id: 'LN-001', bank: 'Sonali Bank',         branch: 'Dhamrai',         borrower: 'Abdul Karim',    amount: 850000,  outstanding: 320000,  startDate: '2023-04-12', endDate: '2028-04-11', encumbranceNo: 'EC-2023-0088', plotId: 'PLT-DHK-002', status: 'active' },
  { id: 'LN-002', bank: 'Janata Bank',         branch: 'Paba',            borrower: 'Rabeya Khatun',  amount: 1200000, outstanding: 0,       startDate: '2022-11-05', endDate: '2027-11-04', encumbranceNo: 'EC-2022-0211', plotId: 'PLT-RJS-031', status: 'released' },
  { id: 'LN-003', bank: 'Dutch-Bangla Bank',   branch: "Cox's Bazar",     borrower: 'Khaleda Zia',    amount: 2400000, outstanding: 1850000, startDate: '2024-01-19', endDate: '2034-01-18', encumbranceNo: 'EC-2024-0042', plotId: 'PLT-CXB-006', status: 'active' },
  { id: 'LN-004', bank: 'BRAC Bank',           branch: 'Banani',          borrower: 'Mohammad Ali',   amount: 600000,  outstanding: 145000,  startDate: '2025-06-30', endDate: '2030-06-29', encumbranceNo: 'EC-2025-0114', plotId: 'PLT-DHK-001', status: 'active' },
  { id: 'LN-005', bank: 'Islami Bank Bangladesh', branch: 'Moulvibazar', borrower: 'Fatema Begum',   amount: 1500000, outstanding: 1500000, startDate: '2024-09-12', encumbranceNo: 'EC-2024-0307', plotId: 'PLT-SYL-014', status: 'pending' },
];

// ===== Encroachment alerts =====
export const encroachmentAlerts: EncroachmentAlert[] = [
  { id: 'ENC-001', plotId: 'PLT-RJS-031', level: 'high',   detectedOn: '2026-01-14', evidence: ['satellite', 'sensor'],  sensorId: 'SNS-RJS-014', location: 'Paba · Mouza Paba', actionTaken: 'Field inspection scheduled', caseRef: 'ENC-RJS-2026-001' },
  { id: 'ENC-002', plotId: 'PLT-DHK-002', level: 'medium', detectedOn: '2026-01-08', evidence: ['satellite'],                location: 'Savar · Hemayetpur' },
  { id: 'ENC-003', plotId: 'PLT-BAR-007', level: 'low',    detectedOn: '2026-01-02', evidence: ['photo'],                   location: 'Banaripara · Banaripara' },
  { id: 'ENC-004', plotId: 'PLT-MYM-004', level: 'medium', detectedOn: '2025-12-22', evidence: ['satellite', 'photo', 'sensor'], sensorId: 'SNS-MYM-007', location: 'Muktagachha · Muktagachha Sadar' },
];

// ===== Fraud alerts =====
export const fraudAlerts: FraudAlert[] = [
  { id: 'FRD-001', plotId: 'PLT-RJS-031', type: 'benami',           severity: 'high',   description: 'Transferee NID does not match owner family record.', createdOn: '2026-01-12' },
  { id: 'FRD-002', plotId: 'PLT-DHK-001', type: 'duplicate_deed',   severity: 'medium', description: 'Deed 5611 referenced in two separate cases.',          createdOn: '2026-01-09' },
  { id: 'FRD-003', plotId: 'PLT-CXB-006', type: 'forgery',          severity: 'high',   description: 'Signature pattern inconsistent with prior deeds.',     createdOn: '2026-01-05' },
  { id: 'FRD-004', plotId: 'PLT-MYM-004', type: 'fake_mutation',    severity: 'low',    description: 'Mutation order number not in AC land office registry.', createdOn: '2025-12-28', dismissed: true },
];

// ===== Field inspections =====
export const inspections: FieldInspection[] = [
  { id: 'FI-001', plotId: 'PLT-DHK-001', inspector: 'Md. Monir Hossain',   status: 'completed',   dueDate: '2026-01-15', completedOn: '2026-01-15', notes: 'Boundary pillars intact, no visible encroachment.', finding: 'Compliant', gps: { lat: 23.8800, lng: 90.1200 } },
  { id: 'FI-002', plotId: 'PLT-RJS-031', inspector: 'Sharmin Akter',       status: 'in_progress', dueDate: '2026-01-18', notes: 'Sensing 18% deviation from cadastral map.', finding: 'Under review' },
  { id: 'FI-003', plotId: 'PLT-SYL-014', inspector: 'Kamal Uddin',         status: 'scheduled',   dueDate: '2026-01-25' },
  { id: 'FI-004', plotId: 'PLT-BAR-007', inspector: 'Md. Monir Hossain',   status: 'completed',   dueDate: '2026-01-09', completedOn: '2026-01-09', notes: 'New char formation confirmed by surveyor.', finding: 'Poyosti', gps: { lat: 22.7800, lng: 90.5500 } },
  { id: 'FI-005', plotId: 'PLT-DHK-008', inspector: 'Sharmin Akter',       status: 'completed',   dueDate: '2026-01-05', completedOn: '2026-01-05', notes: 'No issues found.', finding: 'Compliant', gps: { lat: 23.7050, lng: 90.4090 } },
];

// ===== Khas land =====
export const khasRecords: KhasRecord[] = [
  { id: 'KHS-001', classification: 'urban',       areaShotok: 240, allocatedTo: 'Rajshahi City Corp.',   allocDate: '2021-04-12', leaseNo: 'LS-2021-0044', status: 'allocated', district: 'Rajshahi', upazila: 'Paba',      mouza: 'Paba' },
  { id: 'KHS-002', classification: 'rural',       areaShotok: 120, status: 'vacant',                                                       district: 'Khulna',    upazila: 'Dacope',    mouza: 'Dacope' },
  { id: 'KHS-003', classification: 'aquatic',     areaShotok: 320, status: 'encroached',                                                    district: 'Barisal',   upazila: 'Banaripara',mouza: 'Banaripara' },
  { id: 'KHS-004', classification: 'agricultural', areaShotok: 80,  allocatedTo: 'BRRI',                  allocDate: '2022-08-22', leaseNo: 'LS-2022-0118', status: 'allocated', district: 'Rangpur',   upazila: 'Kaunia',    mouza: 'Kaunia Sadar' },
];

// ===== Temporal (last 10 years) =====
export const temporalEvents: TemporalEvent[] = [
  { year: 2016, area: 100, erosion: 2,  formation: 1, ndvi: 0.62, ndwi: 0.34, ndbi: 0.10, settlements: 12 },
  { year: 2017, area: 100, erosion: 4,  formation: 2, ndvi: 0.60, ndwi: 0.36, ndbi: 0.12, settlements: 14 },
  { year: 2018, area: 98,  erosion: 6,  formation: 1, ndvi: 0.58, ndwi: 0.40, ndbi: 0.14, settlements: 15 },
  { year: 2019, area: 96,  erosion: 8,  formation: 3, ndvi: 0.55, ndwi: 0.43, ndbi: 0.18, settlements: 17 },
  { year: 2020, area: 95,  erosion: 10, formation: 2, ndvi: 0.52, ndwi: 0.45, ndbi: 0.22, settlements: 18 },
  { year: 2021, area: 93,  erosion: 14, formation: 4, ndvi: 0.50, ndwi: 0.48, ndbi: 0.24, settlements: 20 },
  { year: 2022, area: 92,  erosion: 18, formation: 5, ndvi: 0.48, ndwi: 0.50, ndbi: 0.27, settlements: 22 },
  { year: 2023, area: 90,  erosion: 22, formation: 4, ndvi: 0.46, ndwi: 0.52, ndbi: 0.30, settlements: 25 },
  { year: 2024, area: 88,  erosion: 28, formation: 6, ndvi: 0.44, ndwi: 0.54, ndbi: 0.32, settlements: 28 },
  { year: 2025, area: 85,  erosion: 34, formation: 7, ndvi: 0.42, ndwi: 0.56, ndbi: 0.35, settlements: 32 },
  { year: 2026, area: 82,  erosion: 38, formation: 8, ndvi: 0.40, ndwi: 0.58, ndbi: 0.38, settlements: 35 },
];

// ===== Aggregate stats (computed) =====
export const computeStats = () => {
  const totalPlots = plots.length;
  const activeLitigation = litigation.filter(l => l.status === 'active').length;
  const encroachments = encroachmentAlerts.length;
  const bankLiens = liens.filter(l => l.status === 'active').length;
  const healthAvg = Math.round(plots.reduce((s, p) => s + p.riskScore, 0) / totalPlots);
  const shikostiPoyosti = plots.filter(p => p.status === 'shikosti' || p.status === 'poyosti').length;
  const fieldInspections = inspections.length;
  const citizenSearches = 1248; // simulated
  const govKhas = khasRecords.length;
  const fraudAlertsCount = fraudAlerts.filter(f => !f.dismissed).length;

  return { totalPlots, activeLitigation, encroachments, bankLiens, healthAvg, shikostiPoyosti, fieldInspections, citizenSearches, govKhas, fraudAlerts: fraudAlertsCount };
};
