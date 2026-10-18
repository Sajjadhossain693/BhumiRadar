import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '../../i18n/provider';
import { BilingualName } from '../ui/StatusBadge';
import { I } from '../ui/Icons';
import { deeds, plots, litigation } from '../../data/seed';
import type { Plot } from '../../data/types';
import { useToast } from '../ui/Toaster';

type Props = {
  plot: Plot;
  onSelectPlot: (id: string | null) => void;
};

// The BhumiRadar Land Title Report — mirrors the official sample image.
// Generates a print-ready HTML preview + downloadable PDF using the browser's print engine.
export const ReportPDF: React.FC<Props> = ({ plot, onSelectPlot }) => {
  const { t, lang } = useI18n();
  const { show } = useToast();
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const today = new Date();
  // Keep record identifiers untouched, but present generated dates in the
  // selected report language and numeral system.
  const reportLocale = lang === 'bn' ? 'bn-BD' : 'en-GB';
  const dateStr = today.toLocaleDateString(reportLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = today.toLocaleTimeString(reportLocale, { hour: '2-digit', minute: '2-digit', hour12: false });
  const reportId = `2026/888881/${plot.id.split('-')[1] || 'ENC'}`;
  const appId = `00000000`;
  const khatian = plot.khatian;
  const dag = plot.dag;
  const presentOwner = lang === 'en' ? plot.owner.name : (plot.owner.nameBn || plot.owner.name);
  const previousOwner = lang === 'en' ? 'Md. Abul Hossain' : 'মোঃ আবুল হোসেন';

  const plotDeeds = deeds[plot.id] || [];
  const encumbrance = plot.encumbrance;

  // Generate QR
  useEffect(() => {
    const url = `https://bhumi-radar.gov.bd/verify?r=${reportId}&p=${plot.id}&t=${Date.now()}`;
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

  const isShikosti = plot.status === 'shikosti' || plot.erosion > 30;

  return (
    <div>
      <div className="page-head no-print">
        <div>
          <div className="crumb"><I.report size={14} /> {t('nav.modules')}</div>
          <h1>{t('rep.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('rep.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <select className="select" value={plot.id} onChange={e => onSelectPlot(e.target.value)} style={{ minWidth: 240 }}>
            {plots.map(p => <option key={p.id} value={p.id}>{p.id} · {p.dag} · <BilingualName en={p.owner.name} bn={p.owner.nameBn} /></option>)}
          </select>
          <button className="btn btn-outline" onClick={() => window.print()}><I.print size={16} /> {t('rep.print')}</button>
          <button className="btn btn-primary" onClick={downloadPdf}><I.download size={16} /> {t('rep.downloadPdf')}</button>
        </div>
      </div>

      {/* A4 sheet */}
      <div className="report-sheet" id="report-sheet">
        {/* Government emblem header */}
        <div className="report-header">
          <div className="report-emblem">
            {/* Stylized national emblem (4 stars + water lily + rice sheaves) */}
            <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden>
              <defs>
                <radialGradient id="eg" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#dbe7c8" />
                  <stop offset="100%" stopColor="#9ed7a4" />
                </radialGradient>
              </defs>
              <circle cx="40" cy="40" r="38" fill="#fff" stroke="#0a4d24" strokeWidth="1.5" />
              <circle cx="40" cy="40" r="32" fill="url(#eg)" />
              {/* Water lily */}
              <ellipse cx="40" cy="48" rx="14" ry="6" fill="#e7c1c1" stroke="#a04848" strokeWidth="0.6" />
              <path d="M40 36 q-10 6 -14 14 M40 36 q10 6 14 14 M40 36 q-6 8 -8 16 M40 36 q6 8 8 16 M40 36 v18" stroke="#a04848" strokeWidth="0.8" fill="none" />
              {/* Rice sheaves */}
              <path d="M22 50 q4 -16 8 -22 M28 50 q-2 -14 0 -22 M22 50 q-1 4 1 8" stroke="#b07d10" strokeWidth="1.2" fill="none" />
              <path d="M58 50 q-4 -16 -8 -22 M52 50 q2 -14 0 -22 M58 50 q1 4 -1 8" stroke="#b07d10" strokeWidth="1.2" fill="none" />
              {/* 4 stars */}
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
            <div className="report-dept">{t('rep.certificateTitle')}</div>
          </div>
        </div>

        {/* Application & Date row */}
        <div className="report-row-2">
          <div><strong>{t('rep.appId')}:</strong> <span className="mono">{reportId}</span></div>
          <div><strong>{t('rep.appRightTitle')}:</strong> <span className="mono">{appId}</span></div>
        </div>

        <div className="report-row-3">
          <div><strong>{t('rep.districtLbl')}:</strong> <BilingualName en={plot.district} bn={plot.districtBn} /></div>
          <div><strong>{t('rep.upazilaLbl')}:</strong> <BilingualName en={plot.upazila} bn={plot.upazilaBn} /></div>
          <div><strong>{t('rep.mouzaLbl')}:</strong> <BilingualName en={plot.mouza} bn={plot.mouzaBn} /></div>
        </div>

        <div className="report-row-3">
          <div><strong>{t('rep.khatianLbl')}:</strong> <span className="mono">{khatian}</span></div>
          <div><strong>{t('rep.dagLbl')}:</strong> <span className="mono">{dag}</span></div>
          <div><strong>{t('rep.encNo')}:</strong> <span className="mono">EC-2026-{plot.id.slice(-3)}</span></div>
        </div>

        <div className="report-row-2">
          <div><strong>{t('rep.presentOwnerLbl')}:</strong> {presentOwner}</div>
          <div><strong>{t('common.date')}:</strong> <span className="mono">{dateStr}</span></div>
        </div>

        {/* Section title */}
        <h3 className="report-section-title">{t('rep.pastTransactions')}</h3>
        <table className="report-tbl">
          <thead>
            <tr>
              <th style={{ width: 44 }}>{t('common.serialNo')}</th>
              <th>{t('common.deedNo')} / {t('common.khatian')}</th>
              <th>{t('common.date')}</th>
              <th>{t('rep.previousOwner')} / {t('rep.presentOwner')}</th>
              <th>{t('common.status')} &amp; {t('common.note')}</th>
            </tr>
          </thead>
          <tbody>
            {plotDeeds.length > 0 ? plotDeeds.map((d, i) => (
              <tr key={d.no}>
                <td className="report-td-c">{i + 1}</td>
                <td>
                  <div>{t(`own.relation.${d.type === 'encroachment' ? 'mutation' : d.type}`)}</div>
                  <div className="report-td-mono">{d.no}</div>
                </td>
                <td className="report-td-mono">{d.date}</td>
                <td>
                  <div>{d.from}</div>
                  <div>{d.to}</div>
                </td>
                <td>
                  {d.status === 'flagged' ? (
                    <span className="report-chip red">{lang === 'bn' ? 'দায়বদ্ধ / এনক্রোচমেন্ট' : 'Encumbered / Encroachment'}</span>
                  ) : d.status === 'under_review' ? (
                    <span className="report-chip amber">{lang === 'bn' ? 'যাচায়াধীন / তদন্ত চলছে' : 'Under Review'}</span>
                  ) : i === 1 ? (
                    <span className="report-chip green">{lang === 'bn' ? 'বৈধ / হস্তান্তরিত' : 'Valid / Transferred'}</span>
                  ) : (
                    <span className="report-chip green">{lang === 'bn' ? 'বৈধ / অনুমোদিত' : 'Valid / Approved'}</span>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="report-empty">{t('empty.records')}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Government Khas Land Warning if khas */}
        {plot.ownershipType === 'khas' && (
          <div style={{
            background: '#fffbeb',
            border: '2px solid #d97706',
            borderRadius: 6,
            padding: '10px 14px',
            margin: '10px 0',
            fontSize: '9.5pt',
          }}>
            <div style={{ color: '#92400e', fontWeight: 800, marginBottom: 2 }}>
              🏛️ {lang === 'bn' ? 'সরকারি খাস জমি সতর্কবার্তা — শ্রেণি:' : 'Government Khas Land Notice — Class:'} {plot.khasClassification || 'agricultural'}
            </div>
            <div style={{ color: '#b45309', fontSize: '9pt' }}>
              {lang === 'bn'
                ? 'এই জমি গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের খাস খতিয়ানভুক্ত। কোনো প্রকার বেআইনি দখল, বালু ভরাট বা জাল দলিল সৃষ্টি রাষ্ট্রীয় দণ্ডবিধিতে শাস্তিযোগ্য অপরাধ।'
                : 'This plot is recorded as state khas land. Unauthorized occupancy or boundary alternation is strictly prohibited.'}
            </div>
          </div>
        )}

        {/* River Erosion / Shikosti Notice if eroded */}
        {isShikosti && (
          <div style={{
            background: '#f0f9ff',
            border: '2px solid #0284c7',
            borderRadius: 6,
            padding: '10px 14px',
            margin: '10px 0',
            fontSize: '9.5pt',
          }}>
            <div style={{ color: '#0369a1', fontWeight: 800, marginBottom: 2 }}>
              🌊 {lang === 'bn' ? 'নদী ভাঙন (শিকস্তি) জমি — সিকস্তি-পয়স্তি আইন ১৯৫০' : 'River Erosion (Shikosti) Notice — Act 1950'}
            </div>
            <div style={{ color: '#0284c7', fontSize: '9pt' }}>
              {lang === 'bn'
                ? `উপগ্রহ রাডার বিশ্লেষণে এই দাগের ${plot.erosion}% ভূমি নদীগর্ভে বিলীন চিহ্নিত। ৩০ বছরের মধ্যে পয়স্তি (পুনরায় জেগে উঠলে) মূল মালিক বা ওয়ারিশগণ অগ্রাধিকার ভিত্তিতে স্বত্ব দাবি করিতে পারিবেন।`
                : `Satellite radar records ${plot.erosion}% erosion into riverbed. Original titleholders retain preferential claims if char accretes within 30 years.`}
            </div>
          </div>
        )}

        {/* Litigation Lock Notice if locked */}
        {(() => {
          const activeLock = litigation.find(c => c.status === 'active' && c.plots.includes(plot.id)) || (plot.status === 'locked' ? litigation[0] : null);
          if (!activeLock && plot.status !== 'locked') return null;
          return (
            <div style={{
              background: '#f5f3ff',
              border: '1.5px solid #7c3aed',
              borderRadius: 6,
              padding: '8px 12px',
              margin: '10px 0',
              fontSize: '9.5pt',
            }}>
              <div style={{ color: '#5b21b6', fontWeight: 700, marginBottom: 2 }}>
                🔒 {t('lit.lockActiveNotice')} — {t('lit.caseNo')}: {activeLock?.caseNo || 'WP-4521/2024'} ({activeLock?.court || 'High Court Division'})
              </div>
              <div style={{ color: '#4c1d95', fontSize: '9pt' }}>
                {t('lit.orderType')}: {activeLock ? t(`lit.orderType.${activeLock.orderType}`) : t('lit.orderType.injunction')} • {t('lit.lockDate')}: {activeLock?.lockDate} • {activeLock?.remarks}
              </div>
              <div style={{ color: '#b91c1c', fontWeight: 700, fontSize: '9pt', marginTop: 3 }}>
                ⛔ {t('lit.transferProhibited')}
              </div>
            </div>
          );
        })()}

        {/* Warning */}
        <div className="report-warning">
          <strong>{t('rep.warningLabel')}: </strong>
          {t('rep.warningBody')}
        </div>

        {/* Instructions */}
        <div className="report-instructions">
          <strong>{t('rep.instruction')}</strong>
          <ol>
            <li>{t('rep.instruction1')}</li>
          </ol>
        </div>

        {/* Signature + QR */}
        <div className="report-foot">
          <div className="report-sig">
            <div className="muted text-xs">{t('rep.citizenGreeting')}</div>
            <div className="muted text-xs">{t('rep.responsibleOfficer')}:</div>
            <div className="report-sig-name">{t('rep.landTitle')}</div>
            <div className="report-seal" aria-hidden>
              <svg viewBox="0 0 120 120" width="120" height="120">
                <defs>
                  <radialGradient id="seal-g" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.18" />
                  </radialGradient>
                </defs>
                <circle cx="60" cy="60" r="55" fill="url(#seal-g)" stroke="#1e3a8a" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="#1e3a8a" strokeWidth="0.8" strokeDasharray="2 2" />
                <text x="60" y="38" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e3a8a">{t('rep.assistantLandOfficer')}</text>
                <text x="60" y="65" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1e3a8a">{t('rep.digitalSignature')}</text>
                <text x="60" y="77" textAnchor="middle" fontSize="6.5" fill="#1e3a8a">{reportId}</text>
                <text x="60" y="87" textAnchor="middle" fontSize="6.5" fill="#1e3a8a">{dateStr} {timeStr}</text>
                <text x="60" y="99" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="#1e3a8a">{t('app.ministry')}</text>
              </svg>
            </div>
            <div className="report-sig-line">{t('rep.signedBy')}</div>
            <div className="muted text-xs">{t('rep.validation')}: 2026-01-15 09:42</div>
            <div className="muted text-xs">{t('rep.validation')}: 2026-01-15 11:23</div>
          </div>

          <div className="report-qr">
            {qrDataUrl && <img src={qrDataUrl} alt={t('rep.qrCode')} width="160" height="160" />}
            <div className="muted text-xs text-center" style={{ maxWidth: 200 }}>{t('rep.qrExplain')}</div>
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
