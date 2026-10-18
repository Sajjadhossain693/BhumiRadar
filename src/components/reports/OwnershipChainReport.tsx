import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '../../i18n/provider';
import { BilingualName } from '../ui/StatusBadge';
import { I } from '../ui/Icons';
import { deeds, plots, litigation, fraudAlerts, liens } from '../../data/seed';
import type { Plot } from '../../data/types';
import { useToast } from '../ui/Toaster';

type Props = {
  plot: Plot;
  onSelectPlot: (id: string | null) => void;
};

export const OwnershipChainReport: React.FC<Props> = ({ plot, onSelectPlot }) => {
  const { t, lang } = useI18n();
  const { show } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const today = new Date();
  const reportLocale = lang === 'bn' ? 'bn-BD' : 'en-GB';
  const dateStr = today.toLocaleDateString(reportLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = today.toLocaleTimeString(reportLocale, { hour: '2-digit', minute: '2-digit', hour12: false });
  const reportId = `CHN-2026/994412/${plot.id}`;
  const appId = `APP-8849201`;

  const plotDeeds = deeds[plot.id] || [];
  const plotFraud = fraudAlerts.filter(f => f.plotId === plot.id);
  const activeLock = litigation.find(c => c.status === 'active' && c.plots.includes(plot.id)) || (plot.status === 'locked' ? litigation[0] : null);
  const activeLien = liens.find(l => l.plotId === plot.id && l.status === 'active');

  useEffect(() => {
    const url = `https://bhumi-radar.gov.bd/ownership-chain?r=${reportId}&p=${plot.id}&ts=${Date.now()}`;
    QRCode.toDataURL(url, { width: 160, margin: 1, color: { dark: '#0a4d24', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [plot.id, reportId]);

  const downloadPdf = () => {
    show('info', t('common.processing'));
    window.setTimeout(() => {
      window.print();
      show('success', t('rep.downloadPdf'));
    }, 200);
  };

  return (
    <div>
      <div className="page-head no-print">
        <div>
          <div className="crumb"><I.chain size={14} /> {t('nav.ownershipChain')} · {t('nav.reports')}</div>
          <h1>{t('rep.chainTitle')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>
            {lang === 'bn'
              ? 'সিএস, এসএ, আরএস ও বিএস খতিয়ানের কালানুক্রমিক ধারাবাহিকতা এবং পিট-বায়া দলিলের আইনি যাচাই প্রতিবেদন'
              : 'CS, SA, RS and BS khatian chronological heritage and parent deed verification dossier'}
          </p>
        </div>
        <div className="page-head__actions">
          <select className="select" value={plot.id} onChange={e => onSelectPlot(e.target.value)} style={{ minWidth: 260 }}>
            {plots.map(p => (
              <option key={p.id} value={p.id}>
                {p.id} · {lang === 'bn' ? 'দাগ' : 'Dag'} {p.dag} · <BilingualName en={p.owner.name} bn={p.owner.nameBn} />
              </option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <I.print size={16} /> {t('rep.print')}
          </button>
          <button className="btn btn-primary" onClick={downloadPdf}>
            <I.download size={16} /> {t('rep.downloadPdf')}
          </button>
        </div>
      </div>

      {/* Official Printed Certificate Sheet */}
      <div className="report-sheet" id="ownership-chain-sheet">
        {/* Emblem & Header */}
        <div className="report-header">
          <div className="report-emblem">
            <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden>
              <circle cx="40" cy="40" r="38" fill="#fff" stroke="#0a4d24" strokeWidth="1.5" />
              <circle cx="40" cy="40" r="32" fill="#e8f5e9" />
              <ellipse cx="40" cy="48" rx="14" ry="6" fill="#c8e6c9" stroke="#2e7d32" strokeWidth="0.8" />
              <path d="M40 36 q-10 6 -14 14 M40 36 q10 6 14 14 M40 36 q-6 8 -8 16 M40 36 q6 8 8 16 M40 36 v18" stroke="#1b5e20" strokeWidth="1" fill="none" />
              <g fill="#c62727">
                <polygon points="40,16 41.5,19.5 45,20 42.5,22.5 43,26 40,24 37,26 37.5,22.5 35,20 38.5,19.5" />
                <polygon points="28,22 29,24 31,24.2 29.5,25.7 29.8,27.6 28,26.6 26.2,27.6 26.5,25.7 25,24.2 27,24" />
                <polygon points="52,22 53,24 55,24.2 53.5,25.7 53.8,27.6 52,26.6 50.2,27.6 50.5,25.7 49,24.2 51,24" />
                <polygon points="40,60 41,62 43,62.2 41.5,63.7 41.8,65.6 40,64.6 38.2,65.6 38.5,63.7 37,62.2 39,62" />
              </g>
            </svg>
          </div>
          <div className="report-title">
            <div className="report-govt">{t('app.government')}</div>
            <div className="report-ministry">{t('app.ministry')}</div>
            <div className="report-dept">
              {lang === 'bn' ? 'ভূমি রেকর্ড ও জরিপ অধিদপ্তর — স্বত্বের ধারাবাহিকতা ও খতিয়ান চেইন সনদ' : 'Department of Land Records & Survey — Ownership Chain Verification Certificate'}
            </div>
          </div>
        </div>

        {/* Identification Row */}
        <div className="report-row-2">
          <div><strong>{lang === 'bn' ? 'সনদ নম্বর' : 'Certificate ID'}:</strong> <span className="mono">{reportId}</span></div>
          <div><strong>{t('rep.appRightTitle')}:</strong> <span className="mono">{appId}</span></div>
        </div>

        {/* Location Row */}
        <div className="report-row-3">
          <div><strong>{t('rep.districtLbl')}:</strong> <BilingualName en={plot.district} bn={plot.districtBn} /></div>
          <div><strong>{t('rep.upazilaLbl')}:</strong> <BilingualName en={plot.upazila} bn={plot.upazilaBn} /></div>
          <div><strong>{t('rep.mouzaLbl')}:</strong> <BilingualName en={plot.mouza} bn={plot.mouzaBn} /></div>
        </div>

        <div className="report-row-3">
          <div><strong>{t('rep.khatianLbl')}:</strong> <span className="mono">{plot.khatian}</span></div>
          <div><strong>{t('rep.dagLbl')}:</strong> <span className="mono">{plot.dag}</span></div>
          <div><strong>{t('common.area')}:</strong> {plot.areaShotok} {t('units.shotok')} ({plot.areaDecimal} {t('units.decimal')})</div>
        </div>

        <div className="report-row-2">
          <div><strong>{lang === 'bn' ? 'রেকর্ডীয় বর্তমান মালিক' : 'Present Recorded Owner'}:</strong> <BilingualName en={plot.owner.name} bn={plot.owner.nameBn} /> (পিতা: {plot.owner.fatherName || 'মোহাম্মদ ওসমান'})</div>
          <div><strong>{t('common.date')}:</strong> <span className="mono">{dateStr} {timeStr}</span></div>
        </div>

        {/* SECTION 1: Khatian Evolution (CS -> SA -> RS -> BS) */}
        <h3 className="report-section-title" style={{ marginTop: 14 }}>
          {lang === 'bn' ? '১. জরিপ ও খতিয়ান ধারাবাহিকতা কালানুক্রম (CS → SA → RS → BS)' : '1. Historical Survey & Khatian Evolution'}
        </h3>
        <table className="report-tbl">
          <thead>
            <tr>
              <th style={{ width: 120 }}>{lang === 'bn' ? 'জরিপের নাম ও বছর' : 'Survey & Year'}</th>
              <th>{lang === 'bn' ? 'রেকর্ডীয় জোতদার / প্রজা' : 'Recorded Tenant / Owner'}</th>
              <th>{lang === 'bn' ? 'খতিয়ান ও দাগ নং' : 'Khatian & Dag'}</th>
              <th>{lang === 'bn' ? 'মালিকানা প্রাপ্তির সূত্র' : 'Title Source'}</th>
              <th>{lang === 'bn' ? 'আইনি স্ট্যাটাস' : 'Legal Status'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>{t('rep.csKhatian')}</b></td>
              <td>মৌলভী রহিম বখশ ভূঁইয়া</td>
              <td>খতিয়ান: CS-৪৪ · দাগ: ৫৪</td>
              <td>মূল রায়তি জোতদার সত্যলিপি</td>
              <td><span className="report-chip green">মূল ভিত্তি রেকর্ড (অক্ষত)</span></td>
            </tr>
            <tr>
              <td><b>{t('rep.saKhatian')}</b></td>
              <td>আব্দুল হামিদ ভূঁইয়া (পুত্র)</td>
              <td>খতিয়ান: SA-৮৮ · দাগ: ৬৮</td>
              <td>ফারায়েজ ওয়ারিশান সনদ নং ১২/১৯৫২</td>
              <td><span className="report-chip green">বৈধ ওয়ারিশান স্বত্ব</span></td>
            </tr>
            <tr>
              <td><b>{t('rep.rsKhatian')}</b></td>
              <td>আব্দুল করিম ও মোহাম্মদ আলী</td>
              <td>খতিয়ান: RS-৪১২ · দাগ: ৮৮/১</td>
              <td>সাব-কবলা দলিল নং ৫৬১১/১৯৮৪</td>
              <td><span className="report-chip green">রেজিস্ট্রিকৃত বায়া দলিল</span></td>
            </tr>
            <tr>
              <td><b>{t('rep.bsKhatian')}</b></td>
              <td><BilingualName en={plot.owner.name} bn={plot.owner.nameBn} /></td>
              <td>খতিয়ান: {plot.khatian} · দাগ: {plot.dag}</td>
              <td>নামজারি জমাখারিজ ও ডিসিআর</td>
              <td>
                <span className={`report-chip ${plot.status === 'encroached' || plot.status === 'disputed' ? 'red' : plot.status === 'locked' ? 'purple' : 'green'}`}>
                  {plot.status === 'encroached' ? 'বেদখল ও বিরোধপূর্ণ' : plot.status === 'locked' ? 'আদালতের নিষেধাজ্ঞায় লক' : 'হাল রেকর্ডীয় স্বত্ব বহাল'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* SECTION 2: Deed & Title Transfer Chain */}
        <h3 className="report-section-title" style={{ marginTop: 14 }}>
          {lang === 'bn' ? '২. পিট ও বায়া দলিলের আইনি ধারাবাহিকতা (Parent Deeds & Mutation Verification)' : '2. Parent Deeds & Title Transfer Chain'}
        </h3>
        <table className="report-tbl">
          <thead>
            <tr>
              <th style={{ width: 40 }}>{t('common.serialNo')}</th>
              <th>{lang === 'bn' ? 'দলিলের শ্রেণি' : 'Deed Type'}</th>
              <th>{t('common.deedNo')}</th>
              <th>{t('common.date')}</th>
              <th>{lang === 'bn' ? 'হস্তান্তরকারী (দাতা) → গ্রহীতা' : 'From → To'}</th>
              <th>{lang === 'bn' ? 'বায়া লিঙ্ক যাচাই' : 'Link Verification'}</th>
            </tr>
          </thead>
          <tbody>
            {plotDeeds.length > 0 ? (
              plotDeeds.map((d, idx) => (
                <tr key={d.no}>
                  <td className="report-td-c">{idx + 1}</td>
                  <td>
                    <b>{idx === 0 ? t('rep.parentDeed') : idx === 1 ? t('rep.viaDeed') : t('rep.mutationDcr')}</b>
                    <div className="muted text-xs">{t(`own.relation.${d.type === 'encroachment' ? 'mutation' : d.type}`)}</div>
                  </td>
                  <td className="report-td-mono">{d.no}</td>
                  <td className="report-td-mono">{d.date}</td>
                  <td>
                    <div><b>{d.from}</b></div>
                    <div style={{ color: '#0a4d24' }}>↓ {d.to}</div>
                  </td>
                  <td>
                    {d.status === 'flagged' ? (
                      <span className="report-chip red">⚠️ বায়া চেইনে অমিল / জালিয়াতি সতর্কতা</span>
                    ) : d.status === 'under_review' ? (
                      <span className="report-chip amber">⏳ নামজারি রেকর্ড যাচায়াধীন</span>
                    ) : (
                      <span className="report-chip green">✅ বালাম বহির সাথে শতভাগ মিল</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="report-empty">{t('empty.records')}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Active Litigation Lock Box */}
        {activeLock && (
          <div style={{
            background: '#f5f3ff',
            border: '2px solid #7c3aed',
            borderRadius: 6,
            padding: '10px 14px',
            margin: '12px 0',
          }}>
            <div style={{ color: '#5b21b6', fontWeight: 800, fontSize: '10pt', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔒</span>
              <span>{lang === 'bn' ? 'মামলা-সংক্রান্ত রেজিস্ট্রেশন লক কার্যকর' : 'Litigation Registration Lock Enforced'}</span>
            </div>
            <div style={{ color: '#4c1d95', fontSize: '9pt', marginTop: 4 }}>
              <b>{t('lit.caseNo')}:</b> {activeLock.caseNo} ({activeLock.court}) • <b>{t('lit.orderType')}:</b> {t(`lit.orderType.${activeLock.orderType}`)} • <b>{t('lit.lockDate')}:</b> {activeLock.lockDate}
            </div>
            <div style={{ color: '#b91c1c', fontWeight: 700, fontSize: '9pt', marginTop: 4 }}>
              ⛔ {t('lit.transferProhibited')} — {lang === 'bn' ? 'আদালতের চূড়ান্ত নিষ্পত্তি ব্যতীত কোনো প্রকার দলিলের সাব-রেজিস্ট্রি বা নামজারি করা যাবে না।' : 'Registration and mutation strictly locked pending court decree.'}
            </div>
          </div>
        )}

        {/* Bank Lien Box */}
        {activeLien && (
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #d97706',
            borderRadius: 6,
            padding: '8px 12px',
            margin: '10px 0',
            fontSize: '9pt',
            color: '#78350f',
          }}>
            <b>🏦 {lang === 'bn' ? 'ব্যাংক দায়বদ্ধতা / লিয়েন বহাল' : 'Active Bank Lien'}:</b> {activeLien.bank} ({activeLien.branch}) • ঋণ স্থিতি: ৳ {activeLien.outstanding.toLocaleString()} • ইসি নং: {activeLien.encumbranceNo}
          </div>
        )}

        {/* SECTION 3: Fraud & Overlap Risk Matrix */}
        <h3 className="report-section-title" style={{ marginTop: 14 }}>
          {lang === 'bn' ? '৩. জালিয়াতি, খাস জমি দখল ও আইনি বিরোধ মূল্যায়ন' : '3. Fraud, Khas Encroachment & Dispute Evaluation'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '8px 0 14px 0', fontSize: '8.5pt' }}>
          <div style={{ border: '1px solid #cbd5e1', padding: 8, borderRadius: 6, background: '#f8fafc' }}>
            <div className="muted">{lang === 'bn' ? 'পিট দলিল বিচ্ছেদ' : 'Deed Break Risk'}</div>
            <div style={{ fontWeight: 700, color: '#166534', marginTop: 2 }}>{plotDeeds.some(d => d.status === 'flagged') ? '⚠️ অসঙ্গতি শনাক্ত' : '✅ ধারাবাহিকতা অক্ষত'}</div>
          </div>
          <div style={{ border: '1px solid #cbd5e1', padding: 8, borderRadius: 6, background: '#f8fafc' }}>
            <div className="muted">{lang === 'bn' ? 'সরকারি খাস জমি ওভারল্যাপ' : 'Khas Land Overlap'}</div>
            <div style={{ fontWeight: 700, color: plot.ownershipType === 'khas' ? '#b45309' : '#166534', marginTop: 2 }}>
              {plot.ownershipType === 'khas' ? '🏛️ সরকারি খাসজমি' : '✅ খাসজমি মুক্ত'}
            </div>
          </div>
          <div style={{ border: '1px solid #cbd5e1', padding: 8, borderRadius: 6, background: '#f8fafc' }}>
            <div className="muted">{lang === 'bn' ? 'দ্বৈত দলিল বা জালিয়াতি' : 'Dual Deed / Forgery'}</div>
            <div style={{ fontWeight: 700, color: plotFraud.length > 0 ? '#b91c1c' : '#166534', marginTop: 2 }}>
              {plotFraud.length > 0 ? `🚨 ${plotFraud[0].type}` : '✅ জালিয়াতি মুক্ত'}
            </div>
          </div>
          <div style={{ border: '1px solid #cbd5e1', padding: 8, borderRadius: 6, background: '#f8fafc' }}>
            <div className="muted">{lang === 'bn' ? 'সামগ্রিক ঝুঁকি স্কোর' : 'Overall Risk Score'}</div>
            <div style={{ fontWeight: 800, color: plot.riskScore > 60 ? '#b91c1c' : plot.riskScore > 30 ? '#d97706' : '#15803d', marginTop: 2 }}>
              {plot.riskScore} / ১০০ ({plot.riskScore > 60 ? 'উচ্চ ঝুঁকি' : plot.riskScore > 30 ? 'মাঝারি' : 'নির্ভেজাল'})
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="report-warning" style={{ fontSize: '8.5pt' }}>
          <strong>{t('rep.warningLabel')}: </strong>
          {lang === 'bn'
            ? 'এই স্বত্বের ধারাবাহিকতা সনদটি ভূমি মন্ত্রণালয়ের ডিজিটাল খতিয়ান ও সাব-রেজিস্ট্রি ডেটাবেজ দ্বারা স্বয়ংক্রিয়ভাবে সংকলিত। আদালতে বিচারাধীন মোকদ্দমার ক্ষেত্রে আদালতের চূড়ান্ত রায় চূড়ান্ত বলে গণ্য হইবে।'
            : 'This ownership heritage certificate is compiled from the digital land registry database. Final court rulings take precedence in disputed titles.'}
        </div>

        {/* Digital Signature Seal and QR Code */}
        <div className="report-foot" style={{ marginTop: 16 }}>
          <div className="report-sig">
            <div className="muted text-xs">{t('rep.citizenGreeting')}</div>
            <div className="muted text-xs">{t('rep.responsibleOfficer')}:</div>
            <div className="report-sig-name">{lang === 'bn' ? 'সহকারী কমিশনার (ভূমি) ও সাব-রেজিস্ট্রার' : 'Assistant Commissioner (Land) & Sub-Registrar'}</div>

            {/* Official Digital Stamp Seal */}
            <div className="report-seal" aria-hidden>
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="55" fill="#f0fdf4" stroke="#0a4d24" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="#0a4d24" strokeWidth="0.8" strokeDasharray="2 2" />
                <text x="60" y="36" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#0a4d24">
                  {lang === 'bn' ? 'ভূমি সহকারী কর্মকর্তা' : 'Assistant Land Officer'}
                </text>
                <text x="60" y="62" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0a4d24">
                  {t('rep.digitalSignature')}
                </text>
                <text x="60" y="75" textAnchor="middle" fontSize="6.5" fill="#0a4d24">{reportId}</text>
                <text x="60" y="85" textAnchor="middle" fontSize="6.5" fill="#0a4d24">{dateStr} {timeStr}</text>
                <text x="60" y="98" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="#0a4d24">{t('app.ministry')}</text>
              </svg>
            </div>
            <div className="report-sig-line">{t('rep.signedBy')}</div>
            <div className="muted text-xs">{t('rep.validation')}: 2026-01-17 10:14</div>
          </div>

          <div className="report-qr">
            {qrDataUrl && <img src={qrDataUrl} alt={t('rep.qrCode')} width="150" height="150" />}
            <div className="muted text-xs text-center" style={{ maxWidth: 200, marginTop: 4 }}>
              {lang === 'bn' ? 'কিউআর কোড স্ক্যান করে অনলাইন ডাটাবেজে স্বত্বের ধারাবাহিকতা যাচাই করুন' : 'Scan QR code to verify ownership chain authenticity'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="report-bottom">
          <div>{t('rep.footer')}</div>
          <div className="muted text-xs">{t('rep.footerAddress')}</div>
        </div>
      </div>
    </div>
  );
};
