import React, { useState, useMemo } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { useToast } from '../components/ui/Toaster';
import {
  MOUZA_VALUATION_SCHEDULES,
  calculateLandValuation,
  convertToDecimal,
  convertFromDecimal,
  LandClassification,
  RoadFrontage,
  AreaUnit,
  ValuationResult,
} from '../services/valuation';
import { recordAuditEvent } from '../services/auditLedger';

export const MouzaValuation: React.FC = () => {
  const { t, lang } = useI18n();
  const { show } = useToast();

  const [selectedMouzaId, setSelectedMouzaId] = useState<string>(MOUZA_VALUATION_SCHEDULES[0].mouzaId);
  const [selectedClassification, setSelectedClassification] = useState<LandClassification>('residential');
  const [roadFrontage, setRoadFrontage] = useState<RoadFrontage>('paved_secondary');
  const [areaAmount, setAreaAmount] = useState<number>(5);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('katha');
  const [declaredValue, setDeclaredValue] = useState<number>(6500000);
  const [dagNumber, setDagNumber] = useState<string>('১২০৫');
  const [inCityCorporation, setInCityCorporation] = useState<boolean>(true);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  const activeSchedule = useMemo(() => {
    return MOUZA_VALUATION_SCHEDULES.find(s => s.mouzaId === selectedMouzaId) || MOUZA_VALUATION_SCHEDULES[0];
  }, [selectedMouzaId]);

  const valuationResult: ValuationResult = useMemo(() => {
    return calculateLandValuation({
      mouzaId: selectedMouzaId,
      landClass: selectedClassification,
      frontage: roadFrontage,
      area: areaAmount,
      unit: areaUnit,
      declaredPrice: declaredValue,
      inCityCorporation,
    });
  }, [selectedMouzaId, selectedClassification, roadFrontage, areaAmount, areaUnit, declaredValue, inCityCorporation]);

  const handlePrint = () => {
    // Record audit event for official valuation assessment
    recordAuditEvent({
      eventType: 'VALUATION_SCHEDULE_APPLIED',
      resourceType: 'valuation_schedule',
      resourceId: valuationResult.scheduleUsed.id,
      actorId: 'CITIZEN-VAL-01',
      actorRole: 'CITIZEN',
      actionSummaryBn: `${valuationResult.scheduleUsed.mouzaBn} মৌজা রেট প্রাক্কলন: ঘোষিত ৳${valuationResult.declaredPrice.toLocaleString()} বনাম সর্বনিম্ন ৳${valuationResult.officialMinimumValuation.toLocaleString()}`,
      actionSummaryEn: `Valuation estimate for ${valuationResult.scheduleUsed.mouzaEn}: Declared ৳${valuationResult.declaredPrice.toLocaleString()} vs Min ৳${valuationResult.officialMinimumValuation.toLocaleString()}`,
      payload: {
        declaredPrice: valuationResult.declaredPrice,
        officialMinimumValuation: valuationResult.officialMinimumValuation,
        isUndervalued: valuationResult.isUndervalued,
        totalFees: valuationResult.fees.totalStatutoryFees,
      },
    });

    show('success', lang === 'bn' ? 'প্রাক্কলন রসিদ প্রস্তুত ও অডিট লেজারে রেকর্ড করা হয়েছে' : 'Valuation statement recorded in Audit Ledger');
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <div className="crumb"><I.scale size={14} /> {lang === 'bn' ? 'ভূমি রাজস্ব ও নিবন্ধন' : 'Land Revenue & Registration'}</div>
          <h1>{lang === 'bn' ? 'স্মার্ট মৌজা রেট ও রাজস্ব মূল্যায়ন ইঞ্জিন' : 'Smart Mouza Valuation & Revenue Engine'}</h1>
          <p className="muted" style={{ marginTop: -4 }}>
            {lang === 'bn'
              ? 'সরকারি সর্বনিম্ন মৌজা রেট যাচাই, রাজস্ব ফাঁকি সনাক্তকরণ ও দলিলের বৈজ্ঞানিক ফি প্রাক্কলন'
              : 'Official government minimum mouza rate verification, undervaluation detection and statutory registration fee calculator'}
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn-primary" onClick={() => setShowReceiptModal(true)}>
            <I.document size={16} /> {lang === 'bn' ? 'পূর্ণাঙ্গ রসিদ দেখুন' : 'View Statement Receipt'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4 mb-16">
        <div className="kpi k-info">
          <div className="kpi__label">{lang === 'bn' ? 'সরকারি সর্বনিম্ন মূল্য' : 'Statutory Minimum Value'}</div>
          <div className="kpi__value" style={{ fontSize: '1.45rem' }}>৳ {valuationResult.officialMinimumValuation.toLocaleString()}</div>
          <small className="muted">{valuationResult.totalDecimal.toFixed(2)} {lang === 'bn' ? 'শতক' : 'Decimals'}</small>
        </div>

        <div className={`kpi ${valuationResult.isUndervalued ? 'k-danger' : 'k-success'}`}>
          <div className="kpi__label">{lang === 'bn' ? 'ঘোষিত লেনদেন মূল্য' : 'Declared Transaction Value'}</div>
          <div className="kpi__value" style={{ fontSize: '1.45rem' }}>৳ {valuationResult.declaredPrice.toLocaleString()}</div>
          <small style={{ color: valuationResult.isUndervalued ? 'var(--danger-600)' : 'var(--success-600)', fontWeight: 600 }}>
            {valuationResult.isUndervalued
              ? (lang === 'bn' ? '⚠️ সরকারি মূল্যের চেয়ে কম' : '⚠️ Below Minimum Rate')
              : (lang === 'bn' ? '✓ বৈধ মূল্য সীমা' : '✓ Above Minimum Rate')}
          </small>
        </div>

        <div className="kpi k-gold">
          <div className="kpi__label">{lang === 'bn' ? 'মোট সরকারি ফি ও কর' : 'Total Statutory Fees & Tax'}</div>
          <div className="kpi__value" style={{ fontSize: '1.45rem' }}>৳ {valuationResult.fees.totalStatutoryFees.toLocaleString()}</div>
          <small className="muted">{lang === 'bn' ? 'স্ট্যাম্প, নিবন্ধন ও উৎস কর' : 'Stamp, Reg & AIT'}</small>
        </div>

        <div className="kpi k-purple">
          <div className="kpi__label">{lang === 'bn' ? 'বাজার মূল্য প্রাক্কলন (এআই)' : 'Indicative Market Value (AI)'}</div>
          <div className="kpi__value" style={{ fontSize: '1.45rem' }}>৳ {valuationResult.indicativeMarketPriceEstimate.toLocaleString()}</div>
          <small className="muted">{lang === 'bn' ? `নির্ভরযোগ্যতা: ${valuationResult.marketModelConfidence}` : `Confidence: ${valuationResult.marketModelConfidence}`}</small>
        </div>
      </div>

      {/* Revenue Alert Banner if Undervalued */}
      {valuationResult.isUndervalued && (
        <div className="card mb-16" style={{ background: '#fff1f2', borderColor: '#fecdd3', borderLeft: '5px solid #e11d48' }}>
          <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
            <I.alert size={24} style={{ color: '#e11d48', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#9f1239', fontSize: '1.05rem', display: 'block', marginBottom: 4 }}>
                {lang === 'bn' ? 'সতর্কতা: রাজস্ব অবমূল্যায়ন সনাক্ত হয়েছে (Registration Block Alert)' : 'Warning: Revenue Undervaluation Detected'}
              </strong>
              <div style={{ color: '#881337', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? `ঘোষিত লেনদেন মূল্য (৳${valuationResult.declaredPrice.toLocaleString()}) সরকারি নির্ধারিত সর্বনিম্ন মূল্যের (৳${valuationResult.officialMinimumValuation.toLocaleString()}) চেয়ে ৳${Math.abs(valuationResult.priceDifference).toLocaleString()} কম। রেজিস্ট্রেশন আইন ও রাজস্ব নির্দেশনা অনুযায়ী সর্বনিম্ন মূল্যের চেয়ে কমে দলিল নিবন্ধন করা যাবে না। ফি হিসাবের জন্য সরকারি সর্বনিম্ন মূল্য ভিত্তি ধরা হয়েছে।`
                  : `Declared price (৳${valuationResult.declaredPrice.toLocaleString()}) is ৳${Math.abs(valuationResult.priceDifference).toLocaleString()} below the government minimum rate (৳${valuationResult.officialMinimumValuation.toLocaleString()}). Deed registration is blocked at below-minimum values under Sub-Registry statutory rules.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Grid */}
      <div className="grid mb-16" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        {/* Left Form Panel */}
        <div className="card">
          <div className="card__title">
            <h3><I.edit size={16} /> {lang === 'bn' ? 'জমির বিবরণ ও ঘোষিত মূল্য' : 'Plot Information & Transaction Value'}</h3>
            <span className="badge badge-outline">{activeSchedule.jlNumber}</span>
          </div>

          <div className="row gap-12 mb-12">
            <div style={{ flex: 1 }}>
              <label className="label">{lang === 'bn' ? 'মৌজা তফসিল নির্বাচন' : 'Mouza Schedule'}</label>
              <select
                className="select"
                value={selectedMouzaId}
                onChange={e => setSelectedMouzaId(e.target.value)}
              >
                {MOUZA_VALUATION_SCHEDULES.map(sch => (
                  <option key={sch.id} value={sch.mouzaId}>
                    {lang === 'bn'
                      ? `${sch.mouzaBn} (${sch.upazilaId}, ${sch.districtId}) — ${sch.jlNumber}`
                      : `${sch.mouzaEn} (${sch.upazilaId}, ${sch.districtId}) — ${sch.jlNumber}`}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label className="label">{lang === 'bn' ? 'দাগ নং' : 'Dag No'}</label>
              <input
                type="text"
                className="input"
                value={dagNumber}
                onChange={e => setDagNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="row gap-12 mb-12">
            <div style={{ flex: 1 }}>
              <label className="label">{lang === 'bn' ? 'জমির শ্রেণি (সরকারি রেকর্ড অনুযায়ী)' : 'Land Classification'}</label>
              <select
                className="select"
                value={selectedClassification}
                onChange={e => setSelectedClassification(e.target.value as LandClassification)}
              >
                <option value="residential">{lang === 'bn' ? 'আবাসিক / ভিটি' : 'Residential'}</option>
                <option value="commercial">{lang === 'bn' ? 'বাণিজ্যিক / দোকান' : 'Commercial'}</option>
                <option value="agricultural">{lang === 'bn' ? 'কৃষি / নাল' : 'Agricultural'}</option>
                <option value="homestead">{lang === 'bn' ? 'বাড়ি / বাস্তুভিটা' : 'Homestead'}</option>
                <option value="waterbody">{lang === 'bn' ? 'ডোবা / জলাশয়' : 'Wetland / Waterbody'}</option>
                <option value="fallow">{lang === 'bn' ? 'পতিত / অনাবাদি' : 'Fallow Land'}</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label className="label">{lang === 'bn' ? 'রাস্তার অবস্থান ও প্রবেশাধিকার' : 'Road Frontage'}</label>
              <select
                className="select"
                value={roadFrontage}
                onChange={e => setRoadFrontage(e.target.value as RoadFrontage)}
              >
                <option value="highway_main">{lang === 'bn' ? 'মহাসড়ক / প্রধান সড়ক (+২৫% রেট)' : 'Highway / Main Road (+25%)'}</option>
                <option value="paved_secondary">{lang === 'bn' ? 'পাকা পৌরসভা সড়ক (+১০% রেট)' : 'Paved Municipal Road (+10%)'}</option>
                <option value="rural_earthen">{lang === 'bn' ? 'কাঁচা / সাধারণ চলাচলের পথ' : 'Rural Earthen Road'}</option>
                <option value="no_access_interior">{lang === 'bn' ? 'রাস্তাহীন অভ্যন্তরীণ দাগ (-১০% রেট)' : 'No Road Access (-10%)'}</option>
              </select>
            </div>
          </div>

          <div className="row gap-12 mb-12">
            <div style={{ flex: 1 }}>
              <label className="label">{lang === 'bn' ? 'জমির পরিমাণ' : 'Land Area'}</label>
              <input
                type="number"
                min="0.01"
                step="0.1"
                className="input"
                value={areaAmount}
                onChange={e => setAreaAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div style={{ width: 140 }}>
              <label className="label">{lang === 'bn' ? 'পরিমাপ একক' : 'Unit'}</label>
              <select
                className="select"
                value={areaUnit}
                onChange={e => setAreaUnit(e.target.value as AreaUnit)}
              >
                <option value="katha">{lang === 'bn' ? 'কাঠা' : 'Katha'}</option>
                <option value="decimal">{lang === 'bn' ? 'শতক / ডেসিমাল' : 'Decimal'}</option>
                <option value="bigha">{lang === 'bn' ? 'বিঘা' : 'Bigha'}</option>
                <option value="acre">{lang === 'bn' ? 'একর' : 'Acre'}</option>
                <option value="sqft">{lang === 'bn' ? 'বর্গফুট' : 'Sq. Ft.'}</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">{lang === 'bn' ? 'ঘোষিত লেনদেন মূল্য (৳)' : 'Declared Price (৳)'}</label>
              <input
                type="number"
                step="50000"
                className="input"
                value={declaredValue}
                onChange={e => setDeclaredValue(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="row gap-12 mb-16">
            <div style={{ flex: 1 }}>
              <label className="label">{lang === 'bn' ? 'এলাকার এখতিয়ার' : 'Jurisdiction'}</label>
              <select
                className="select"
                value={inCityCorporation ? 'city' : 'union'}
                onChange={e => setInCityCorporation(e.target.value === 'city')}
              >
                <option value="city">{lang === 'bn' ? 'সিটি কর্পোরেশন / পৌরসভা এলাকা' : 'City Corporation / Paurashava'}</option>
                <option value="union">{lang === 'bn' ? 'ইউনিয়ন পরিষদ / গ্রামীণ এলাকা' : 'Union Parishad / Rural'}</option>
              </select>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
              <div className="muted text-sm" style={{ paddingBottom: 8 }}>
                {lang === 'bn'
                  ? `কার্যকর বছর: ${activeSchedule.effectiveYear} (${activeSchedule.sourceGazette})`
                  : `Schedule valid year ${activeSchedule.effectiveYear}`}
              </div>
            </div>
          </div>

          {/* Unit Conversion Reference */}
          <div style={{ padding: 12, background: 'var(--ink-50)', borderRadius: 6, fontSize: '0.82rem' }}>
            <strong>{lang === 'bn' ? 'একক রূপান্তর সারসংক্ষেপ:' : 'Unit Conversion:'}</strong>{' '}
            {areaAmount} {areaUnit} = {valuationResult.totalDecimal.toFixed(3)} {lang === 'bn' ? 'শতক' : 'Decimals'} ({convertFromDecimal(valuationResult.totalDecimal, 'sqft').toFixed(0)} {lang === 'bn' ? 'বর্গফুট' : 'sq.ft.'})
          </div>
        </div>

        {/* Right Fee Breakdown Panel */}
        <div className="card">
          <div className="card__title">
            <h3><I.bank size={16} /> {lang === 'bn' ? 'সরকারি ফি ও রাজস্বের পূর্ণাঙ্গ বিবরণ' : 'Statutory Fee Breakdown'}</h3>
            <span className="badge badge-info">
              {lang === 'bn' ? 'ভিত্তি মূল্য: ' : 'Basis: '}
              ৳ {valuationResult.fees.taxableValue.toLocaleString()}
            </span>
          </div>

          <table className="table" style={{ fontSize: '0.88rem' }}>
            <tbody>
              <tr>
                <td>
                  <strong>{lang === 'bn' ? 'স্ট্যাম্প শুল্ক (Stamp Duty)' : 'Stamp Duty'}</strong>
                  <div className="muted text-xs">{valuationResult.fees.stampDutyPct}% {lang === 'bn' ? '(অর্থ আইন অনুচ্ছেদ ৮)' : '(Finance Act)'}</div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {valuationResult.fees.stampDutyAmount.toLocaleString()}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === 'bn' ? 'রেজিস্ট্রেশন ফি (Registration Fee)' : 'Registration Fee'}</strong>
                  <div className="muted text-xs">{valuationResult.fees.registrationFeePct}% {lang === 'bn' ? '(রেজিস্ট্রেশন বিধিমালা)' : '(Registration Rules)'}</div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {valuationResult.fees.registrationFeeAmount.toLocaleString()}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === 'bn' ? 'স্থানীয় সরকার কর (Local Govt Tax)' : 'Local Govt Tax'}</strong>
                  <div className="muted text-xs">{valuationResult.fees.localGovtTaxPct}% {lang === 'bn' ? '(পৌরসভা/সিটি কর্পোরেশন)' : '(Paurashava/City Corp)'}</div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {valuationResult.fees.localGovtTaxAmount.toLocaleString()}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === 'bn' ? 'উৎস কর (AIT - Sec 53H)' : 'Advance Income Tax (Sec 53H)'}</strong>
                  <div className="muted text-xs">{valuationResult.fees.aitPct}% {lang === 'bn' ? '(আয়কর আইন ২০২৩)' : '(Income Tax Act 2023)'}</div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {valuationResult.fees.aitAmount.toLocaleString()}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === 'bn' ? 'হলফনামা ও উপ-রেজিস্ট্রার ফি' : 'Sub-Registry Statutory Fees'}</strong>
                  <div className="muted text-xs">{lang === 'bn' ? 'স্ট্যাম্প ও কোর্ট ফি' : 'Fixed Stamping'}</div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ৳ {valuationResult.fees.subRegistryAdminFee.toLocaleString()}
                </td>
              </tr>

              <tr style={{ background: 'var(--ink-50)', borderTop: '2px solid var(--border-color)' }}>
                <td style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink-900)' }}>
                  {lang === 'bn' ? 'মোট সরকারি খরচ (Total)' : 'Total Statutory Payable'}
                </td>
                <td style={{ textAlign: 'right', fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                  ৳ {valuationResult.fees.totalStatutoryFees.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}>
              <I.print size={14} /> {lang === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Assessment'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowReceiptModal(true)}>
              <I.document size={14} /> {lang === 'bn' ? 'বিস্তারিত চালান বিবরণ' : 'Challan View'}
            </button>
          </div>
        </div>
      </div>

      {/* Advisory AI Market Comparison Section */}
      <div className="card">
        <div className="card__title">
          <h3><I.trendUp size={16} /> {lang === 'bn' ? 'তুলনামূলক বাজার দর বিশ্লেষণ (Advisory Statistical Estimate)' : 'Comparative Market Rate Analysis'}</h3>
          <span className="badge badge-purple">{lang === 'bn' ? 'পরামর্শমূলক পরিসংখ্যান' : 'Advisory Only'}</span>
        </div>

        <div className="grid grid-3" style={{ gap: 12 }}>
          <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 6 }}>
            <div className="muted text-xs">{lang === 'bn' ? 'মৌজা সরকারি সর্বনিম্ন রেট (তফসিল)' : 'Govt Minimum Schedule Rate'}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 4 }}>
              ৳ {valuationResult.effectiveRatePerDecimal.toLocaleString()}
            </div>
            <div className="muted text-xs">{lang === 'bn' ? 'প্রতি শতক (শতক প্রতি রেট)' : 'Per decimal'}</div>
          </div>

          <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 6 }}>
            <div className="muted text-xs">{lang === 'bn' ? 'ঘোষিত কার্যকর প্রতি শতক রেট' : 'Declared Rate Per Decimal'}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 4, color: valuationResult.isUndervalued ? 'var(--danger-600)' : 'var(--ink-900)' }}>
              ৳ {Math.round(valuationResult.declaredPrice / valuationResult.totalDecimal).toLocaleString()}
            </div>
            <div className="muted text-xs">{lang === 'bn' ? 'প্রতি শতকে ঘোষিত মূল্য' : 'Declared unit price'}</div>
          </div>

          <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 6 }}>
            <div className="muted text-xs">{lang === 'bn' ? 'পরিসংখ্যানিক বাজার প্রাক্কলন' : 'Estimated Market Price'}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 4, color: 'var(--primary-700)' }}>
              ৳ {Math.round(valuationResult.indicativeMarketPriceEstimate / valuationResult.totalDecimal).toLocaleString()}
            </div>
            <div className="muted text-xs">{lang === 'bn' ? 'বাজার দরের আনুমানিক প্রাক্কলন' : 'Indicative statistical estimate'}</div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {showReceiptModal && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-card" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/assets/bd-govt-emblem.png" alt="Govt Emblem" width="36" height="36" />
                <div>
                  <h3 style={{ margin: 0 }}>
                    {lang === 'bn' ? 'ভূমি নিবন্ধন ফি ও রাজস্ব প্রাক্কলন চালান' : 'Land Registration Fee Estimate Challan'}
                  </h3>
                  <small className="muted">{lang === 'bn' ? 'রেজিস্ট্রেশন সেবা ও রাজস্ব স্বচ্ছতা পোর্টাল' : 'Registration Transparency Portal'}</small>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowReceiptModal(false)}><I.close size={18} /></button>
            </div>

            <div className="modal-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ border: '1px dashed var(--border-color)', padding: 12, borderRadius: 6, marginBottom: 14 }}>
                <div className="row justify-between mb-4">
                  <span><strong>{lang === 'bn' ? 'চালান সার্টিফিকেট:' : 'Certificate ID:'}</strong> {valuationResult.valuationCertificateId}</span>
                  <span><strong>{lang === 'bn' ? 'তারিখ:' : 'Date:'}</strong> {new Date().toLocaleDateString('bn-BD')}</span>
                </div>
                <div className="row justify-between">
                  <span><strong>{lang === 'bn' ? 'মৌজা ও জেএল:' : 'Mouza & JL:'}</strong> {activeSchedule.mouzaBn} ({activeSchedule.jlNumber})</span>
                  <span><strong>{lang === 'bn' ? 'দাগ নং:' : 'Dag No:'}</strong> {dagNumber}</span>
                </div>
                <div className="row justify-between mt-4">
                  <span><strong>{lang === 'bn' ? 'জমির পরিমাণ:' : 'Land Area:'}</strong> {areaAmount} {areaUnit} ({valuationResult.totalDecimal.toFixed(2)} শতক)</span>
                  <span><strong>{lang === 'bn' ? 'শ্রেণি:' : 'Classification:'}</strong> {selectedClassification}</span>
                </div>
              </div>

              <table className="table" style={{ marginBottom: 14 }}>
                <thead>
                  <tr>
                    <th>{lang === 'bn' ? 'খাত / বর্ণনা' : 'Head / Description'}</th>
                    <th style={{ textAlign: 'right' }}>{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount (BDT)'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{lang === 'bn' ? 'ঘোষিত লেনদেন মূল্য' : 'Declared Value'}</td>
                    <td style={{ textAlign: 'right' }}>৳ {valuationResult.declaredPrice.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>{lang === 'bn' ? 'সরকারি সর্বনিম্ন মৌজা মূল্য' : 'Official Govt Minimum'}</td>
                    <td style={{ textAlign: 'right' }}>৳ {valuationResult.officialMinimumValuation.toLocaleString()}</td>
                  </tr>
                  <tr style={{ fontWeight: 600, color: valuationResult.isUndervalued ? 'var(--danger-700)' : 'var(--success-700)' }}>
                    <td>{lang === 'bn' ? 'মূল্য যাচাই অবস্থা' : 'Valuation Status'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {valuationResult.isUndervalued
                        ? (lang === 'bn' ? 'অবমূল্যায়িত (অতিরিক্ত রাজস্ব প্রদেয়)' : 'Undervalued')
                        : (lang === 'bn' ? 'অনুমোদিত মূল্য' : 'Compliant')}
                    </td>
                  </tr>
                  <tr>
                    <td>{lang === 'bn' ? 'স্ট্যাম্প শুল্ক' : 'Stamp Duty'}</td>
                    <td style={{ textAlign: 'right' }}>৳ {valuationResult.fees.stampDutyAmount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>{lang === 'bn' ? 'রেজিস্ট্রেশন ফি' : 'Registration Fee'}</td>
                    <td style={{ textAlign: 'right' }}>৳ {valuationResult.fees.registrationFeeAmount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>{lang === 'bn' ? 'স্থানীয় সরকার কর' : 'Local Govt Tax'}</td>
                    <td style={{ textAlign: 'right' }}>৳ {valuationResult.fees.localGovtTaxAmount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>{lang === 'bn' ? 'উৎস কর (Sec 53H)' : 'AIT (Sec 53H)'}</td>
                    <td style={{ textAlign: 'right' }}>৳ {valuationResult.fees.aitAmount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>{lang === 'bn' ? 'হলফনামা ও অন্যান্য ফি' : 'Admin Statutory Fees'}</td>
                    <td style={{ textAlign: 'right' }}>৳ {valuationResult.fees.subRegistryAdminFee.toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: 'var(--ink-50)', fontWeight: 700 }}>
                    <td>{lang === 'bn' ? 'সর্বমোট প্রদেয় রাজস্ব ও ফি' : 'Total Payable'}</td>
                    <td style={{ textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary-700)' }}>
                      ৳ {valuationResult.fees.totalStatutoryFees.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="muted text-xs" style={{ background: '#fef3c7', padding: 8, borderRadius: 4, color: '#92400e' }}>
                {lang === 'bn'
                  ? 'ঘোষণাপত্র: এই প্রাক্কলনটি ভূমি ও রেজিস্ট্রেশন আইনের বিধিসমূহ অনুযায়ী সিমুলেশন ভিত্তিক। কোনো উপ-রেজিস্ট্রার কার্যালয়ের চূড়ান্ত দলিলের পূর্বে এটি দাপ্তরিক যাচাইয়ের অধীন।'
                  : 'Disclaimer: This calculation is an indicative statutory estimate. Official deed stamping is subject to formal Sub-Registry verification.'}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowReceiptModal(false)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <I.print size={16} /> {lang === 'bn' ? 'প্রিন্ট / ডাউনলোড' : 'Print / Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
