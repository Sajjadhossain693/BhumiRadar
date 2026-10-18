import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { BilingualName, StatusBadge } from '../components/ui/StatusBadge';
import { districts, upazilasByDistrict, mouzasByUpazila, plots, litigation, liens } from '../data/seed';
import { getSectorZoning } from '../data/zoning';
import { useToast } from '../components/ui/Toaster';
import { MapView } from '../components/ui/MapView';
import type { PageKey } from '../App';
import type { Plot } from '../data/types';

interface CitizenVerificationProps {
  onSelectPlot: (id: string | null) => void;
  onNavigate?: (p: PageKey) => void;
}

export const CitizenVerification: React.FC<CitizenVerificationProps> = ({ onSelectPlot, onNavigate }) => {
  const { t, lang } = useI18n();
  const { show } = useToast();
  const [district, setDistrict] = useState<string>('');
  const [upazila, setUpazila] = useState<string>('');
  const [mouza, setMouza] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedPlotId, setSelectedPlotId] = useState<string>('PLT-DHK-001');
  const [citizen, setCitizen] = useState({ name: '', nid: '', phone: '' });

  const upazilas = district ? upazilasByDistrict[district] || [] : [];
  const mouzas = upazila ? mouzasByUpazila[upazila] || [] : [];

  const results = plots.filter(p => {
    if (district && p.district !== districts.find(d => d.id === district)?.en) return false;
    if (upazila && p.upazila !== upazilas.find(u => u.id === upazila)?.en) return false;
    if (mouza && p.mouza !== mouzas.find(m => m.id === mouza)?.en) return false;
    if (search) {
      const q = search.toLowerCase().trim();
      const matchId = p.id.toLowerCase().includes(q);
      const matchDag = p.dag.toLowerCase().includes(q);
      const matchOwner = p.owner.name.toLowerCase().includes(q) || (p.owner.nameBn && p.owner.nameBn.includes(q));
      const matchDemo = q === '888881' && p.dag.includes('88');
      if (!matchId && !matchDag && !matchOwner && !matchDemo) return false;
    }
    return true;
  });

  const activePlot: Plot = plots.find(p => p.id === selectedPlotId) || results[0] || plots[0];
  const activeLitigation = litigation.find(c => c.status === 'active' && c.plots.includes(activePlot.id)) || (activePlot.status === 'locked' ? litigation[0] : null);
  const activeLien = liens.find(l => l.plotId === activePlot.id && l.status === 'active');
  const isKhas = activePlot.ownershipType === 'khas' || activePlot.status === 'allocated';
  const zoning = getSectorZoning(undefined, activePlot.district, activePlot.upazila, activePlot.mouza);

  // Safety verdict calculation
  let verdictType: 'safe' | 'locked' | 'encumbered' | 'khas' = 'safe';
  if (activePlot.status === 'locked' || activeLitigation) {
    verdictType = 'locked';
  } else if (isKhas) {
    verdictType = 'khas';
  } else if (activeLien || activePlot.encumbrance) {
    verdictType = 'encumbered';
  } else {
    verdictType = 'safe';
  }

  const handleSelectPlot = (id: string) => {
    setSelectedPlotId(id);
    onSelectPlot(id);
  };

  return (
    <div>
      {/* Citizen Top Banner with Officer Switcher */}
      <div style={{
        background: 'linear-gradient(90deg, #047857 0%, #065f46 100%)',
        color: '#ffffff',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 20,
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        border: '1px solid #10b981'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 2px #34d399'
          }}>
            <I.user size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#059669', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px' }}>
                👤 {t('cit.publicAccess')}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                {t('cit.hotlineHelp')}
              </span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', color: '#ffffff', fontWeight: 800 }}>
              {t('cit.title')}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#d1fae5' }}>
              {t('cit.subtitle')}
            </div>
          </div>
        </div>

        {/* Prominent Officer Portal Link */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('officerAudit')}
            className="btn btn-sm"
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: '1.5px solid #38bdf8',
              fontWeight: 700,
              fontSize: '11.5px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            }}
          >
            <I.shield size={15} />
            {t('cit.switchOfficer')}
          </button>
        )}
      </div>

      {/* Citizen Search Filters */}
      <div className="card mb-16" style={{ background: '#ffffff', border: '1px solid var(--ink-200)' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#0f172a' }}>
          🔍 {t('cit.search.title')}
        </h3>
        <div className="grid grid-4" style={{ gap: 10 }}>
          <div className="field">
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('cit.district')}</label>
            <select className="select" value={district} onChange={e => { setDistrict(e.target.value); setUpazila(''); setMouza(''); }}>
              <option value="">-- {t('common.allDistricts')} --</option>
              {districts.map(d => <option key={d.id} value={d.id}>{lang === 'en' ? d.en : d.bn}</option>)}
            </select>
          </div>
          <div className="field">
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('cit.upazila')}</label>
            <select className="select" value={upazila} onChange={e => { setUpazila(e.target.value); setMouza(''); }} disabled={!district}>
              <option value="">-- {t('common.allUpazilas')} --</option>
              {upazilas.map(u => <option key={u.id} value={u.id}>{lang === 'en' ? u.en : u.bn}</option>)}
            </select>
          </div>
          <div className="field">
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('cit.mouza')}</label>
            <select className="select" value={mouza} onChange={e => setMouza(e.target.value)} disabled={!upazila}>
              <option value="">-- {t('common.allMouzas')} --</option>
              {mouzas.map(m => <option key={m.id} value={m.id}>{lang === 'en' ? m.en : m.bn}</option>)}
            </select>
          </div>
          <div className="field">
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('common.plotNo')}</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('cit.search.placeholder')} />
          </div>
        </div>

        {/* Quick Citizen Suggestions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap', fontSize: '0.76rem' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>{lang === 'bn' ? 'উদাহরণ দাগ যাচাই:' : 'Sample Verifications:'}</span>
          <button
            onClick={() => { setDistrict('dhaka'); setUpazila('dhamrai'); setMouza('balia'); setSearch('88/88'); }}
            className="chip"
            style={{ cursor: 'pointer', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontWeight: 700 }}
          >
            🟢 দাগ ৮৮/৮৮ (ধামরাই - ক্রয়যোগ্য ও নিরাপদ)
          </button>
          <button
            onClick={() => { setDistrict('dhaka'); setUpazila('uttara'); setMouza('uttara-sector4'); setSearch('888881'); }}
            className="chip"
            style={{ cursor: 'pointer', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: 700 }}
          >
            🔴 দাগ ৮৮৮৮৮১ (উত্তরা - সাবধান! ক্রয় নিষিদ্ধ ও মামলা লক)
          </button>
          <button
            onClick={() => { setDistrict('chattogram'); setUpazila('coxsbazar'); setMouza('coxsbazar-s'); setSearch('64'); }}
            className="chip"
            style={{ cursor: 'pointer', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
          >
            🟠 দাগ ৬৪ (কক্সবাজার - ব্যাংক মর্টগেজ)
          </button>
          <button
            onClick={() => { setDistrict('rangpur'); setUpazila('kaunia'); setMouza('kaunia-s'); setSearch('275'); }}
            className="chip"
            style={{ cursor: 'pointer', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}
          >
            🔵 দাগ ২৭৫ (কাউনিয়া - সরকারি খাসজমি)
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setDistrict(''); setUpazila(''); setMouza(''); setSearch(''); }}>
            {t('common.reset')}
          </button>
        </div>
      </div>

      {/* Main Verification Verdict & Details */}
      <div className="grid mb-16" style={{ gridTemplateColumns: '1.2fr 1.6fr', gap: 16 }}>
        {/* Left Column: Search Results List */}
        <div className="card" style={{ padding: 14 }}>
          <div className="card__title mb-8">
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{t('cit.results')}</h3>
            <span className="chip brand">{results.length} টি দাগ</span>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <I.search size={36} />
              <h4>{t('empty.plots')}</h4>
              <p>{t('empty.plots.hint')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflow: 'auto' }}>
              {results.map(p => {
                const isSelected = p.id === activePlot.id;
                const hasLock = litigation.some(c => c.status === 'active' && c.plots.includes(p.id)) || p.status === 'locked';
                const hasLien = liens.some(l => l.plotId === p.id && l.status === 'active') || !!p.encumbrance;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlot(p.id)}
                    className="card"
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      padding: 12,
                      border: isSelected ? '2px solid #059669' : '1px solid var(--ink-200)',
                      background: isSelected ? '#f0fdf4' : '#ffffff'
                    }}
                  >
                    <div className="row between mb-4">
                      <strong className="mono" style={{ color: '#0f172a' }}>{p.id} · দাগ {p.dag}</strong>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                    <div className="muted text-xs">
                      <BilingualName en={p.district} bn={p.districtBn} /> · <BilingualName en={p.upazila} bn={p.upazilaBn} /> · <BilingualName en={p.mouza} bn={p.mouzaBn} />
                    </div>
                    <div className="row between mt-8">
                      <span className="text-sm font-semibold">
                        <BilingualName en={p.owner.name} bn={p.owner.nameBn} />
                      </span>
                      <span className="chip brand" style={{ fontSize: '0.72rem' }}>
                        {p.areaShotok} {t('units.shotok')}
                      </span>
                    </div>

                    {/* Quick Citizen Warning Flags */}
                    {hasLock && (
                      <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ⛔ সাব-রেজিস্ট্রি লক সক্রিয় (মামলা বিচারাধীন)
                      </div>
                    )}
                    {hasLien && !hasLock && (
                      <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#c2410c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        🏦 ব্যাংকে বন্ধক রয়েছে
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Citizen Purchase Safety Card & QR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Prominent Safety Verdict Card */}
          <div className="card" style={{
            padding: 16,
            borderRadius: 14,
            border: verdictType === 'safe' ? '2px solid #22c55e' :
                    verdictType === 'locked' ? '2px solid #ef4444' :
                    verdictType === 'encumbered' ? '2px solid #f59e0b' : '2px solid #3b82f6',
            background: verdictType === 'safe' ? '#f0fdf4' :
                        verdictType === 'locked' ? '#fef2f2' :
                        verdictType === 'encumbered' ? '#fffbeb' : '#eff6ff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                fontSize: '2rem',
                lineHeight: 1,
                padding: 10,
                borderRadius: '50%',
                background: verdictType === 'safe' ? '#dcfce7' :
                            verdictType === 'locked' ? '#fee2e2' :
                            verdictType === 'encumbered' ? '#fef3c7' : '#dbeafe'
              }}>
                {verdictType === 'safe' ? '✅' :
                 verdictType === 'locked' ? '⛔' :
                 verdictType === 'encumbered' ? '⚠️' : '🏛️'}
              </div>
              <div>
                <span className="badge" style={{
                  background: verdictType === 'safe' ? '#166534' :
                              verdictType === 'locked' ? '#991b1b' :
                              verdictType === 'encumbered' ? '#92400e' : '#1e40af',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}>
                  {t('cit.safetyVerdict')}
                </span>
                <h3 style={{
                  margin: '4px 0 2px 0',
                  fontSize: '1.15rem',
                  color: verdictType === 'safe' ? '#166534' :
                         verdictType === 'locked' ? '#991b1b' :
                         verdictType === 'encumbered' ? '#92400e' : '#1e40af'
                }}>
                  {verdictType === 'safe' ? t('cit.safe') :
                   verdictType === 'locked' ? t('cit.locked') :
                   verdictType === 'encumbered' ? t('cit.encumbered') : t('cit.khasNotice')}
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                  {verdictType === 'safe' ? t('cit.safeDesc') :
                   verdictType === 'locked' ? t('cit.lockedDesc') :
                   verdictType === 'encumbered' ? t('cit.encumberedDesc') : t('cit.khasNoticeDesc')}
                </p>
              </div>
            </div>

            {/* Crucial Parcel Specs for Citizen */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 8,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(0,0,0,0.08)',
              fontSize: '0.8rem'
            }}>
              <div>
                <span className="text-xs muted block">দাগ নং:</span>
                <b>{activePlot.dag}</b>
              </div>
              <div>
                <span className="text-xs muted block">খতিয়ান নং:</span>
                <b className="mono">{activePlot.khatian}</b>
              </div>
              <div>
                <span className="text-xs muted block">জমির পরিমাণ:</span>
                <b>{activePlot.areaShotok} শতক</b>
              </div>
              <div>
                <span className="text-xs muted block">মৌজা ও জে.এল:</span>
                <b>{activePlot.mouzaBn}</b>
              </div>
              <div>
                <span className="text-xs muted block">ভূমি জোনিং শ্রেণি:</span>
                <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.68rem', fontWeight: 700 }}>
                  🧭 {lang === 'bn' ? zoning.zoneTagBn : zoning.zoneTagEn}
                </span>
              </div>
              <div>
                <span className="text-xs muted block">মালিকের নাম:</span>
                <b>{activePlot.owner.nameBn || activePlot.owner.name}</b>
              </div>
            </div>
          </div>

          {/* QR Code Verification Slip & Print */}
          <div className="card" style={{ padding: 14 }}>
            <div className="row between mb-8">
              <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{t('cit.qrCode')}</h4>
              <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                অনলাইন ডাটাবেজে যাচাইকৃত
              </span>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <QrPreview text={`https://bhumi-radar.gov.bd/verify?plot=${activePlot.id}&dag=${activePlot.dag}`} />
              <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                <b>ভেরিফিকেশন আইডি: BR-2026-{activePlot.dag}</b>
                <div className="text-xs muted" style={{ marginTop: 2 }}>
                  যে কোনো কিউআর স্ক্যানার বা ভূমি সেবা অ্যাপ দিয়ে স্ক্যান করে এই প্লটের সরকারি সত্যতা নিশ্চিত হতে পারবেন।
                </div>
                <div className="row gap-8 mt-8 wrap">
                  <button className="btn btn-sm btn-primary" onClick={() => show('info', 'যাচাই লিংক ক্লিপবোর্ডে কপি করা হয়েছে')}>
                    <I.send size={13} /> {t('cit.shareWith')}
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => window.print()}>
                    <I.print size={13} /> {t('rep.print')}
                  </button>
                </div>
              </div>
            </div>

            {/* Citizen Field Inspection Request Form */}
            <div className="mt-12" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem' }}>{t('cit.requestVerification')}</h4>
              <p className="text-xs muted" style={{ margin: '0 0 8px 0' }}>
                জমির সীমানা নিয়ে সন্দেহ থাকলে উপজেলা ভূমি অফিসের সার্ভেয়ার দ্বারা সরজমিনে মাপজোখের আবেদন করুন।
              </p>
              <div className="grid grid-3" style={{ gap: 8 }}>
                <div className="field">
                  <label style={{ fontSize: '0.72rem' }}>{t('cit.citizenName')}</label>
                  <input className="input" style={{ fontSize: '0.78rem', padding: '4px 8px' }} value={citizen.name} onChange={e => setCitizen({ ...citizen, name: e.target.value })} placeholder="আপনার নাম" />
                </div>
                <div className="field">
                  <label style={{ fontSize: '0.72rem' }}>{t('cit.citizenNid')}</label>
                  <input className="input" style={{ fontSize: '0.78rem', padding: '4px 8px' }} value={citizen.nid} onChange={e => setCitizen({ ...citizen, nid: e.target.value })} placeholder="NID নম্বর" />
                </div>
                <div className="field">
                  <label style={{ fontSize: '0.72rem' }}>{t('cit.citizenPhone')}</label>
                  <input className="input" style={{ fontSize: '0.78rem', padding: '4px 8px' }} value={citizen.phone} onChange={e => setCitizen({ ...citizen, phone: e.target.value })} placeholder="০১৭১XXXXXXX" />
                </div>
              </div>
              <button
                className="btn btn-sm btn-primary mt-8"
                style={{ fontSize: '0.78rem' }}
                onClick={() => {
                  if (!citizen.phone) {
                    show('error', 'অনুগ্রহ করে মোবাইল নম্বর প্রদান করুন');
                    return;
                  }
                  show('success', t('cit.requestSent'));
                  setCitizen({ name: '', nid: '', phone: '' });
                }}
              >
                <I.send size={13} /> {t('cit.requestVerification')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cadastral Interactive Map */}
      <div className="card" style={{ padding: 14 }}>
        <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>
          🗺️ স্যাটেলাইট মানচিত্রে নির্বাচিত দাগের অবস্থান ({activePlot.dag})
        </h3>
        <MapView plots={[activePlot, ...plots.filter(p => p.id !== activePlot.id).slice(0, 4)]} onSelect={onSelectPlot} height={340} showLegend />
      </div>
    </div>
  );
};

// Inline QR Preview Component
const QrPreview: React.FC<{ text: string }> = ({ text }) => {
  const size = 21;
  const grid: boolean[][] = [];
  for (let i = 0; i < size; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < size; j++) {
      let h = 0;
      for (let k = 0; k < text.length; k++) h = (h * 31 + text.charCodeAt(k)) >>> 0;
      row.push(((h ^ (i * size + j)) & 1) === 0);
    }
    grid.push(row);
  }
  const marker = (cx: number, cy: number) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const onBorder = i === 0 || i === 6 || j === 0 || j === 6;
      const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      grid[cy + i][cx + j] = onBorder || inner;
    }
  };
  marker(0, 0); marker(size - 7, 0); marker(0, size - 7);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="120" height="120" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, flexShrink: 0 }}>
      {grid.map((row, i) => row.map((on, j) => on ? <rect key={`${i}-${j}`} x={j} y={i} width="1" height="1" fill="#0f172a" /> : null))}
    </svg>
  );
};
