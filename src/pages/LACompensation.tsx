import React, { useState, useMemo } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { useToast } from '../components/ui/Toaster';
import {
  ACQUISITION_PROJECTS,
  computeLACompensationBreakdown,
  createCompensationClaim,
  approveCompensationClaim,
  simulateDisbursePayment,
  getCompensationClaims,
  calculate12MonthMarketAverage,
  AcquisitionProject,
  CompensationClaim,
} from '../services/laCompensation';

export const LACompensation: React.FC = () => {
  const { t, lang } = useI18n();
  const { show } = useToast();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(ACQUISITION_PROJECTS[0].id);
  const [landAreaDecimal, setLandAreaDecimal] = useState<number>(10);
  const [structuresValue, setStructuresValue] = useState<number>(350000);
  const [cropsValue, setCropsValue] = useState<number>(45000);
  const [treesValue, setTreesValue] = useState<number>(80000);
  const [relocationValue, setRelocationValue] = useState<number>(100000);

  // New claim form state
  const [claimantName, setClaimantName] = useState<string>('আবুল কাশেম শেখ');
  const [claimantNid, setClaimantNid] = useState<string>('19782692015487');
  const [claimantPhone, setClaimantPhone] = useState<string>('01712998877');
  const [plotId, setPlotId] = useState<string>('PLT-DHK-001');
  const [bankAccountNo, setBankAccountNo] = useState<string>('2050189020014');
  const [bankName, setBankName] = useState<string>('Sonali Bank PLC (Dhamrai Branch)');
  const [bankRoutingNo, setBankRoutingNo] = useState<string>('200260142');
  const [claims, setClaims] = useState<CompensationClaim[]>(() => getCompensationClaims());
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [selectedClaimForPayment, setSelectedClaimForPayment] = useState<CompensationClaim | null>(null);

  const activeProject: AcquisitionProject = useMemo(() => {
    return ACQUISITION_PROJECTS.find(p => p.id === selectedProjectId) || ACQUISITION_PROJECTS[0];
  }, [selectedProjectId]);

  const marketRate = useMemo(() => {
    return calculate12MonthMarketAverage('উত্তরা', 'residential');
  }, []);

  const calculation = useMemo(() => {
    return computeLACompensationBreakdown({
      areaAcquiredDecimal: landAreaDecimal,
      twelveMonthAverageRatePerDecimal: marketRate.averageRate,
      purpose: activeProject.defaultPurpose,
      structureValuation: structuresValue,
      cropsValuation: cropsValue,
      treesValuation: treesValue,
      relocationAllowance: relocationValue,
    });
  }, [activeProject, landAreaDecimal, marketRate.averageRate, structuresValue, cropsValue, treesValue, relocationValue]);

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim = createCompensationClaim({
      projectId: activeProject.id,
      plotId,
      claimantName,
      claimantNid,
      claimantPhone,
      bankAccountNo,
      bankName,
      bankRoutingNo,
      areaAcquiredDecimal: landAreaDecimal,
      structureValuation: structuresValue,
      cropsValuation: cropsValue,
      treesValuation: treesValue,
      relocationAllowance: relocationValue,
    });

    setClaims(getCompensationClaims());
    setShowClaimModal(false);
    show(
      'success',
      lang === 'bn'
        ? `দাবি #${newClaim.id} সফলভাবে দাখিল হয়েছে ও অডিট লেজারে রেকর্ড করা হয়েছে!`
        : `Claim #${newClaim.id} submitted and recorded in audit ledger!`
    );
  };

  const handleApprove = (claimId: string) => {
    const updated = approveCompensationClaim(claimId, 'কে. এম. সালাহউদ্দিন (অতিরিক্ত জেলা প্রশাসক - রাজস্ব)');
    if (updated) {
      setClaims(getCompensationClaims());
      show(
        'success',
        lang === 'bn'
          ? `দাবি #${claimId} এসি ল্যান্ড ও এডিসি (রাজস্ব) কর্তৃক অনুমোদিত হয়েছে!`
          : `Claim #${claimId} approved by Land Authority!`
      );
    }
  };

  const handleDisburse = (claimId: string) => {
    const res = simulateDisbursePayment(claimId, 'কে. এম. সালাহউদ্দিন (অতিরিক্ত জেলা প্রশাসক - রাজস্ব)');
    if (res) {
      setClaims(getCompensationClaims());
      setSelectedClaimForPayment(res);
      show(
        'success',
        lang === 'bn'
          ? `G2P ডিরেক্ট EFT বাউচার ${res.paymentReference} তৈরি হয়েছে এবং অর্থ বিতরণ সম্পন্ন!`
          : `G2P Direct EFT disbursement voucher ${res.paymentReference} processed!`
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <div className="crumb"><I.land size={14} /> {lang === 'bn' ? 'ভূমি অধিগ্রহণ ও ক্ষতিপূরণ ব্যবস্থাপনা' : 'Land Acquisition & Resettlement'}</div>
          <h1>{lang === 'bn' ? 'ভূমি অধিগ্রহণ সরাসরি ক্ষতিপূরণ ক্যালকুলেটর (LA Direct Compensation)' : 'LA Direct Compensation Calculator'}</h1>
          <p className="muted" style={{ marginTop: -4 }}>
            {lang === 'bn'
              ? 'স্থাবর সম্পত্তি অধিগ্রহণ ও হুকুমদখল আইন ২০১৭: ধারা ৯(৩) এর ২০০%/৩০০% ক্ষতিপূরণ, বিগত ১২ মাসের গড় দলিল মূল্য ও সরাসরি ব্যাংক একাউন্টে EFT বিতরণ'
              : 'Acquisition and Requisition of Immovable Property Act 2017: Section 9(3) statutory 200%/300% multipliers & simulated G2P Direct EFT'}
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn-primary" onClick={() => setShowClaimModal(true)}>
            <I.plus size={16} /> {lang === 'bn' ? 'নতুন ক্ষতিপূরণ দাবি দাখিল' : 'Submit Compensation Claim'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4 mb-16">
        <div className="kpi k-info">
          <div className="kpi__label">{lang === 'bn' ? 'বিগত ১২ মাসের গড় বাজার মূল্য' : '12-Month Deed Avg Value'}</div>
          <div className="kpi__value" style={{ fontSize: '1.4rem' }}>
            ৳ {calculation.baseLandMarketValue.toLocaleString()}
          </div>
          <small className="muted">
            ৳ {marketRate.averageRate.toLocaleString()} {lang === 'bn' ? '/শতক' : '/decimal'}
          </small>
        </div>

        <div className="kpi k-success">
          <div className="kpi__label">
            {lang === 'bn' ? 'ধারা ৯(৩) সংবিধিবদ্ধ অতিরিক্ত ক্ষতিপূরণ' : 'Statutory Act 2017 Premium'}
          </div>
          <div className="kpi__value" style={{ fontSize: '1.4rem', color: 'var(--success-700)' }}>
            ৳ {calculation.statutoryPremiumAmount.toLocaleString()}
          </div>
          <small style={{ fontWeight: 600, color: 'var(--success-700)' }}>
            +{calculation.statutoryPremiumPct}% {activeProject.defaultPurpose === 'public_government' ? (lang === 'bn' ? '(সরকারি প্রকল্প)' : '(Public)') : (lang === 'bn' ? '(বাণিজ্যিক প্রকল্প)' : '(Commercial)')}
          </small>
        </div>

        <div className="kpi k-gold">
          <div className="kpi__label">{lang === 'bn' ? 'অবকাঠামো, ফসল ও স্থানান্তর' : 'Structures, Crops & Moving'}</div>
          <div className="kpi__value" style={{ fontSize: '1.4rem' }}>
            ৳ {calculation.ancillaryTotal.toLocaleString()}
          </div>
          <small className="muted">{lang === 'bn' ? 'সরাসরি প্রদেয় অন্যান্য ক্ষতিপূরণ' : 'Direct add-on components'}</small>
        </div>

        <div className="kpi k-purple">
          <div className="kpi__label">{lang === 'bn' ? 'সর্বমোট প্রদেয় ক্ষতিপূরণ (Award)' : 'Total Statutory Award'}</div>
          <div className="kpi__value" style={{ fontSize: '1.4rem', color: 'var(--primary-700)' }}>
            ৳ {calculation.totalCompensationAmount.toLocaleString()}
          </div>
          <small className="muted">{lang === 'bn' ? 'সরাসরি ব্যাংক একাউন্টে প্রদেয়' : 'Payable via G2P EFT'}</small>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid mb-16" style={{ gridTemplateColumns: '1.15fr 1fr' }}>
        {/* Left Form: Project & Input Settings */}
        <div className="card">
          <div className="card__title">
            <h3><I.edit size={16} /> {lang === 'bn' ? 'অধিগ্রহণ প্রকল্প ও জমির পরিমাণ নির্ধারণ' : 'Project & Land Area Input'}</h3>
            <span className="badge badge-info">{activeProject.id}</span>
          </div>

          <div className="mb-12">
            <label className="label">{lang === 'bn' ? 'অধিগ্রহণ প্রকল্প নির্বাচন করুন' : 'Select Acquisition Project'}</label>
            <select
              className="select"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
            >
              {ACQUISITION_PROJECTS.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {lang === 'bn'
                    ? `${proj.nameBn} (${proj.district}) — ${proj.defaultPurpose === 'public_government' ? 'সরকারি (২০০% ক্ষতিপূরণ)' : 'বাণিজ্যিক (৩০০% ক্ষতিপূরণ)'}`
                    : `${proj.nameEn} (${proj.district})`}
                </option>
              ))}
            </select>
          </div>

          <div className="row gap-12 mb-12">
            <div style={{ flex: 1 }}>
              <label className="label">{lang === 'bn' ? 'অধিগ্রহণকৃত জমির পরিমাণ (শতক)' : 'Acquired Area (Decimals)'}</label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                className="input"
                value={landAreaDecimal}
                onChange={e => setLandAreaDecimal(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">{lang === 'bn' ? 'প্রকল্পের ধরন ও সংবিধিবদ্ধ গুণক' : 'Statutory Act Multiplier'}</label>
              <div
                style={{
                  padding: '9px 12px',
                  background: 'var(--ink-50)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--ink-800)',
                }}
              >
                {activeProject.defaultPurpose === 'public_government'
                  ? (lang === 'bn' ? 'ধারা ৯(৩)(ক): ২০০% অতিরিক্ত' : 'Sec 9(3)(a): 200% Premium')
                  : (lang === 'bn' ? 'ধারা ৯(৩)(খ): ৩০০% অতিরিক্ত' : 'Sec 9(3)(b): 300% Premium')}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 12 }}>
            <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>
              {lang === 'bn' ? 'অন্যান্য সহায়ক ক্ষতিপূরণ উপাদান (BDT):' : 'Additional Compensation Heads (BDT):'}
            </strong>

            <div className="grid grid-2" style={{ gap: 10 }}>
              <div>
                <label className="label">{lang === 'bn' ? 'অবকাঠামো ও ঘরবাড়ি মূল্য' : 'Structures / Buildings'}</label>
                <input
                  type="number"
                  className="input"
                  value={structuresValue}
                  onChange={e => setStructuresValue(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="label">{lang === 'bn' ? 'ফসল ও মৌসুমি উৎপাদন' : 'Standing Crops'}</label>
                <input
                  type="number"
                  className="input"
                  value={cropsValue}
                  onChange={e => setCropsValue(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="label">{lang === 'bn' ? 'ফলজ ও বনজ বৃক্ষ' : 'Trees / Timber'}</label>
                <input
                  type="number"
                  className="input"
                  value={treesValue}
                  onChange={e => setTreesValue(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="label">{lang === 'bn' ? 'পুনর্বাসন ও স্থানান্তর ক্ষতি' : 'Relocation Allowance'}</label>
                <input
                  type="number"
                  className="input"
                  value={relocationValue}
                  onChange={e => setRelocationValue(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="mt-14" style={{ padding: 10, background: '#eff6ff', borderRadius: 6, fontSize: '0.82rem', color: '#1e40af' }}>
            ℹ️ <strong>{lang === 'bn' ? 'বিগত ১২ মাসের বাজার দলিলের ভিত্তি:' : 'Market Data Basis:'}</strong>{' '}
            সাব-রেজিস্ট্রি অফিসে নিবন্ধিত তুলনামূলক দলিলের গড় হার প্রতি শতক ৳{marketRate.averageRate.toLocaleString()} ({marketRate.comparableCount} টি দলিল)।
          </div>
        </div>

        {/* Right Panel: Statutory Calculation Breakdown */}
        <div className="card">
          <div className="card__title">
            <h3><I.scale size={16} /> {lang === 'bn' ? 'আইনসম্মত ক্ষতিপূরণ রোয়েদাদ হিসাব' : 'Statutory Compensation Award'}</h3>
            <span className="badge badge-purple">{lang === 'bn' ? 'আইন ২০১৭' : 'Act 2017'}</span>
          </div>

          <table className="table" style={{ fontSize: '0.88rem' }}>
            <tbody>
              <tr>
                <td>
                  <strong>{lang === 'bn' ? '১. জমির মূল বাজার দর' : '1. Base Land Market Value'}</strong>
                  <div className="muted text-xs">
                    {landAreaDecimal} {lang === 'bn' ? 'শতক' : 'decimals'} × ৳{marketRate.averageRate.toLocaleString()}
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {calculation.baseLandMarketValue.toLocaleString()}
                </td>
              </tr>

              <tr style={{ background: '#f0fdf4' }}>
                <td>
                  <strong style={{ color: '#166534' }}>
                    {lang === 'bn' ? '২. সংবিধিবদ্ধ অতিরিক্ত ক্ষতিপূরণ' : '2. Statutory Premium'}
                  </strong>
                  <div className="muted text-xs" style={{ color: '#15803d' }}>
                    {calculation.statutoryPremiumPct}% {lang === 'bn' ? 'অতিরিক্ত (আইনের ধারা ৯(৩))' : 'statutory addition'}
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                  + ৳ {calculation.statutoryPremiumAmount.toLocaleString()}
                </td>
              </tr>

              <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
                <td>
                  {lang === 'bn' ? 'জমির মোট আইনি ক্ষতিপূরণ (১ + ২)' : 'Total Land Compensation (1 + 2)'}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--primary-800)' }}>
                  ৳ {calculation.totalLandCompensation.toLocaleString()}
                </td>
              </tr>

              <tr>
                <td>{lang === 'bn' ? '৩. ঘরবাড়ি ও অবকাঠামো ক্ষতিপূরণ' : '3. Structures Award'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {calculation.structureValuation.toLocaleString()}
                </td>
              </tr>

              <tr>
                <td>{lang === 'bn' ? '৪. ফলজ ও বনজ বৃক্ষ' : '4. Trees Award'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {calculation.treesValuation.toLocaleString()}
                </td>
              </tr>

              <tr>
                <td>{lang === 'bn' ? '৫. দণ্ডায়মান ফসল ক্ষতিপূরণ' : '5. Standing Crops Award'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {calculation.cropsValuation.toLocaleString()}
                </td>
              </tr>

              <tr>
                <td>{lang === 'bn' ? '৬. স্থানান্তর ও পুনর্বাসন ভাতা' : '6. Relocation & Shifting'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {calculation.relocationAllowance.toLocaleString()}
                </td>
              </tr>

              <tr style={{ background: 'var(--ink-50)', borderTop: '2px solid var(--border-color)' }}>
                <td style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--ink-900)' }}>
                  {lang === 'bn' ? 'সর্বমোট চেক / EFT রোয়েদাদ (Award)' : 'Grand Total Award'}
                </td>
                <td style={{ textAlign: 'right', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                  ৳ {calculation.totalCompensationAmount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setShowClaimModal(true)}>
              <I.plus size={14} /> {lang === 'bn' ? 'দাবিপত্র তৈরি ও দাখিল' : 'Generate Formal Claim'}
            </button>
          </div>
        </div>
      </div>

      {/* Compensation Claims Lifecycle & Simulated Direct G2P Disbursement */}
      <div className="card">
        <div className="card__title">
          <h3><I.bank size={16} /> {lang === 'bn' ? 'অধিগ্রহণ ক্ষতিপূরণ দাবির তালিকা ও সরাসরি ব্যাংক বিতরণ (G2P EFT)' : 'Compensation Claims & Direct G2P Disbursement'}</h3>
          <span className="badge badge-success">{claims.length} {lang === 'bn' ? 'টি দাবি' : 'claims'}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: '0.88rem' }}>
            <thead>
              <tr>
                <th>{lang === 'bn' ? 'দাবি আইডি' : 'Claim ID'}</th>
                <th>{lang === 'bn' ? 'দাবিকর্তা ও এনআইডি' : 'Claimant & NID'}</th>
                <th>{lang === 'bn' ? 'দাগ ও জমি' : 'Dag & Area'}</th>
                <th>{lang === 'bn' ? 'মোট ক্ষতিপূরণ' : 'Award Amount'}</th>
                <th>{lang === 'bn' ? 'ব্যাংক একাউন্ট' : 'Bank Account'}</th>
                <th>{lang === 'bn' ? 'বর্তমান অবস্থা' : 'Status'}</th>
                <th style={{ textAlign: 'right' }}>{lang === 'bn' ? 'পদক্ষেপ' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.id}</strong></td>
                  <td>
                    <div><strong>{c.claimantName}</strong></div>
                    <div className="muted text-xs">NID: {c.claimantNid}</div>
                  </td>
                  <td>
                    <div>দাগ: {c.dagNo}</div>
                    <div className="muted text-xs">{c.areaAcquiredDecimal} {lang === 'bn' ? 'শতক' : 'decimals'}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                    ৳ {c.totalCompensationAmount.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{c.bankName}</div>
                    <div className="muted text-xs font-mono">{c.bankAccountNo}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{c.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {c.status !== 'approved' && c.status !== 'payment_confirmed' && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleApprove(c.id)}
                      >
                        <I.check size={14} /> {lang === 'bn' ? 'অনুমোদন' : 'Approve'}
                      </button>
                    )}

                    {c.status === 'approved' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDisburse(c.id)}
                      >
                        <I.send size={14} /> {lang === 'bn' ? 'G2P EFT বিতরণ' : 'Disburse EFT'}
                      </button>
                    )}

                    {c.status === 'payment_confirmed' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedClaimForPayment(c)}
                      >
                        <I.eye size={14} /> {lang === 'bn' ? 'ভাউচার' : 'Voucher'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Claim Modal */}
      {showClaimModal && (
        <div className="modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateClaim}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>{lang === 'bn' ? 'অধিগ্রহণ ক্ষতিপূরণ দাবিপত্র দাখিল' : 'Submit Compensation Claim'}</h3>
                <button type="button" className="icon-btn" onClick={() => setShowClaimModal(false)}><I.close size={18} /></button>
              </div>

              <div className="modal-body">
                <div className="mb-12">
                  <label className="label">{lang === 'bn' ? 'প্রকল্প' : 'Project'}</label>
                  <div style={{ fontWeight: 600 }}>{activeProject.nameBn}</div>
                </div>

                <div className="row gap-12 mb-12">
                  <div style={{ flex: 1 }}>
                    <label className="label">{lang === 'bn' ? 'দাবিকর্তার নাম' : 'Claimant Name'}</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={claimantName}
                      onChange={e => setClaimantName(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">{lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'Claimant NID'}</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={claimantNid}
                      onChange={e => setClaimantNid(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row gap-12 mb-12">
                  <div style={{ flex: 1 }}>
                    <label className="label">{lang === 'bn' ? 'প্লট আইডি' : 'Plot ID'}</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={plotId}
                      onChange={e => setPlotId(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">{lang === 'bn' ? 'জমির পরিমাণ (শতক)' : 'Area (Decimals)'}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      required
                      value={landAreaDecimal}
                      onChange={e => setLandAreaDecimal(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="row gap-12 mb-12">
                  <div style={{ flex: 1 }}>
                    <label className="label">{lang === 'bn' ? 'ব্যাংক একাউন্ট নম্বর' : 'Bank Account No'}</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={bankAccountNo}
                      onChange={e => setBankAccountNo(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">{lang === 'bn' ? 'ব্যাংক ও শাখার নাম' : 'Bank & Branch'}</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: '0.86rem' }}>
                  <div className="row justify-between">
                    <span>{lang === 'bn' ? 'প্রাক্কলিত মোট সংবিধিবদ্ধ ক্ষতিপূরণ:' : 'Calculated Award Amount:'}</span>
                    <strong style={{ color: 'var(--primary-700)', fontSize: '1.05rem' }}>
                      ৳ {calculation.totalCompensationAmount.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowClaimModal(false)}>
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {lang === 'bn' ? 'দাবি দাখিল করুন' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EFT Payment Voucher Modal */}
      {selectedClaimForPayment && (
        <div className="modal-overlay" onClick={() => setSelectedClaimForPayment(null)}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <I.checkCircle size={28} style={{ color: 'var(--success-600)' }} />
                <div>
                  <h3 style={{ margin: 0 }}>
                    {lang === 'bn' ? 'সরকারি জি২পি ডিরেক্ট EFT বিতরণ প্রমাণক' : 'Simulated G2P Direct EFT Voucher'}
                  </h3>
                  <small className="muted">{selectedClaimForPayment.paymentReference}</small>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedClaimForPayment(null)}><I.close size={18} /></button>
            </div>

            <div className="modal-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                <div className="row justify-between mb-4">
                  <span><strong>{lang === 'bn' ? 'বিতরণ রেফারেন্স:' : 'EFT Ref:'}</strong></span>
                  <span className="font-mono">{selectedClaimForPayment.paymentReference}</span>
                </div>
                <div className="row justify-between mb-4">
                  <span><strong>{lang === 'bn' ? 'গ্রাহকের নাম:' : 'Beneficiary:'}</strong></span>
                  <span>{selectedClaimForPayment.claimantName}</span>
                </div>
                <div className="row justify-between mb-4">
                  <span><strong>{lang === 'bn' ? 'এনআইডি:' : 'NID:'}</strong></span>
                  <span>{selectedClaimForPayment.claimantNid}</span>
                </div>
                <div className="row justify-between mb-4">
                  <span><strong>{lang === 'bn' ? 'ব্যাংক একাউন্ট:' : 'Bank Account:'}</strong></span>
                  <span className="font-mono">{selectedClaimForPayment.bankAccountNo} ({selectedClaimForPayment.bankName})</span>
                </div>
                <div className="row justify-between">
                  <span><strong>{lang === 'bn' ? 'বিতরণকৃত মোট অর্থ:' : 'Disbursed Award:'}</strong></span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--success-700)' }}>
                    ৳ {selectedClaimForPayment.totalCompensationAmount.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="muted text-xs" style={{ background: '#f0fdf4', padding: 8, borderRadius: 4, color: '#166534' }}>
                ✓ {lang === 'bn'
                  ? 'অর্থ সরাসরি বাংলাদেশ ব্যাংকের আরটিজিএস/বিইএফটিএন নেটওয়ার্কের মাধ্যমে গ্রাহকের একাউন্টে ক্রেডিট সম্পন্ন হয়েছে এবং অডিট লেজারে অপরিবর্তনীয় প্রমাণক সংরক্ষিত হয়েছে।'
                  : 'Fund credited directly to the beneficiary bank account via Bangladesh Bank EFT network and verified in SHA-256 Audit Ledger.'}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedClaimForPayment(null)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button className="btn btn-primary" onClick={() => { window.print(); }}>
                <I.print size={16} /> {lang === 'bn' ? 'ভাউচার প্রিন্ট' : 'Print Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
