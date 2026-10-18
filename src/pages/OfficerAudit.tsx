import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { BilingualName, StatusBadge } from '../components/ui/StatusBadge';
import { districts, upazilasByDistrict, mouzasByUpazila, plots, litigation, liens, fraudAlerts, encroachmentAlerts, deeds } from '../data/seed';
import { getSectorZoning } from '../data/zoning';
import { useToast } from '../components/ui/Toaster';
import { MapView } from '../components/ui/MapView';
import type { PageKey } from '../App';
import type { Plot, Deed } from '../data/types';
import { recordAuditEvent } from '../services/auditLedger';

interface OfficerAuditProps {
  onSelectPlot: (id: string | null) => void;
  onNavigate?: (p: PageKey) => void;
}

export const OfficerAudit: React.FC<OfficerAuditProps> = ({ onSelectPlot, onNavigate }) => {
  const { t, lang } = useI18n();
  const { show } = useToast();

  const [district, setDistrict] = useState<string>('dhaka');
  const [upazila, setUpazila] = useState<string>('uttara');
  const [mouza, setMouza] = useState<string>('uttara-sector4');
  const [searchQuery, setSearchQuery] = useState('888881');
  const [searchType, setSearchType] = useState<'dag' | 'khatian' | 'deed' | 'case' | 'nid'>('dag');
  const [activeTab, setActiveTab] = useState<'khatian' | 'litigation' | 'satellite' | 'lien' | 'actions'>('khatian');
  
  // Officer action state for selected plot lock/unlock
  const [lockedPlots, setLockedPlots] = useState<Record<string, boolean>>({
    'PLT-DHK-001': true,
    'PLT-CXB-006': true,
    'PLT-DHK-888881': true,
  });

  const upazilas = district ? upazilasByDistrict[district] || [] : [];
  const mouzas = upazila ? mouzasByUpazila[upazila] || [] : [];

  // Filter or match plots
  const filteredPlots = plots.filter(p => {
    if (district && p.district !== districts.find(d => d.id === district)?.en) return false;
    if (upazila && p.upazila !== upazilas.find(u => u.id === upazila)?.en) return false;
    if (mouza && p.mouza !== mouzas.find(m => m.id === mouza)?.en) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      if (searchType === 'dag') {
        return p.dag.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (q === '888881' && p.dag.includes('88'));
      }
      if (searchType === 'khatian') {
        return p.khatian.toLowerCase().includes(q);
      }
      if (searchType === 'nid') {
        return p.owner.nid.includes(q);
      }
    }
    return true;
  });

  const selectedPlot: Plot = filteredPlots[0] || plots[0];
  const isLocked = lockedPlots[selectedPlot.id] ?? (selectedPlot.status === 'locked');
  const zoning = getSectorZoning(undefined, selectedPlot.district, selectedPlot.upazila, selectedPlot.mouza);
  const activeLitigations = litigation.filter(c => c.plots.includes(selectedPlot.id));
  const activeLiens = liens.filter(l => l.plotId === selectedPlot.id);
  const plotDeeds = deeds[selectedPlot.id] || [];
  const relatedFraud = fraudAlerts.filter(f => f.plotId === selectedPlot.id);
  const relatedEncroachment = encroachmentAlerts.filter(e => e.plotId === selectedPlot.id);

  const toggleLock = () => {
    const nextState = !isLocked;
    setLockedPlots(prev => ({ ...prev, [selectedPlot.id]: nextState }));

    // Record administrative action in Cryptographic Audit Ledger
    recordAuditEvent({
      eventType: nextState ? 'PLOT_REGISTRATION_LOCKED' : 'PLOT_REGISTRATION_UNLOCKED',
      resourceType: 'plot',
      resourceId: selectedPlot.id,
      actorId: 'OFFICER-ACL-01',
      actorRole: 'AC_LAND',
      actionSummaryBn: nextState
        ? `সহকারী কমিশনার (ভূমি) কর্তৃক দাগ নং ${selectedPlot.dag} (${selectedPlot.mouzaBn}) এ রেজিস্ট্রেশন লক কার্যকর`
        : `আদালতের আদেশ অনুযায়ী দাগ নং ${selectedPlot.dag} (${selectedPlot.mouzaBn}) এর রেজিস্ট্রেশন লক প্রত্যাহার`,
      actionSummaryEn: nextState
        ? `Imposed administrative registration lock on Dag ${selectedPlot.dag} (${selectedPlot.mouza})`
        : `Revoked registration lock on Dag ${selectedPlot.dag} (${selectedPlot.mouza}) under court order`,
      payload: { dag: selectedPlot.dag, mouza: selectedPlot.mouza, isLocked: nextState, officerRole: 'AC_LAND' },
    });

    if (nextState) {
      show('warn', lang === 'bn' 
        ? `দাগ নং ${selectedPlot.dag} এর ওপর সহকারী কমিশনার (ভূমি) এর অনলাইন সাব-রেজিস্ট্রি ও নামজারি লক সক্রিয় ও অডিট লেজারে রেকর্ড করা হয়েছে!`
        : `Online registration & mutation lock imposed on Dag ${selectedPlot.dag} and recorded in audit ledger!`);
    } else {
      show('success', lang === 'bn'
        ? `আদালতের আদেশ অনুযায়ী দাগ নং ${selectedPlot.dag} এর ওপর থেকে লক প্রত্যাহার ও অডিট লেজারে রেকর্ড করা হয়েছে।`
        : `Lock revoked on Dag ${selectedPlot.dag} and recorded in audit ledger.`);
    }
  };

  const dispatchInspection = () => {
    show('info', lang === 'bn' 
      ? `কানুনগো ও সার্ভেয়ারকে দাগ নং ${selectedPlot.dag} (${selectedPlot.mouzaBn}) এ জরুরি সরেজমিনে পরিদর্শনে নির্দেশ পাঠানো হয়েছে।`
      : `Dispatched Kanungo & Surveyor to inspect Dag ${selectedPlot.dag} on site.`);
  };

  const issueHearingNotice = () => {
    show('success', lang === 'bn'
      ? `এসি ল্যান্ড শুনানির সরকারি নোটিশ (স্মারক নং: বম/ঢাকা/২০২৬-৪১০২) পক্ষগণের এনআইডি ও ঠিকানায় জারি হয়েছে।`
      : `AC Land hearing notice (Memo: BM/DHK/2026-4102) issued to parties.`);
  };

  return (
    <div>
      {/* Top Officer Security Badge Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 20,
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 2px #38bdf8'
          }}>
            <img src="/assets/bd-govt-emblem.png" alt="Govt Emblem" width="36" height="36" style={{ objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#0284c7', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px' }}>
                🏛️ {t('officer.badge')}
              </span>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                অফিসিয়াল সেশন: ACL-DHAKA-2026-SECURE
              </span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
              {t('officer.title')}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              {t('officer.subtitle')}
            </div>
          </div>
        </div>

        {/* Quick Switch to Citizen View */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onNavigate && (
            <button
              onClick={() => onNavigate('citizen')}
              className="btn btn-sm"
              style={{
                background: '#f1f5f9',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '11.5px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <I.user size={14} />
              {t('cit.switchCitizen')}
            </button>
          )}
          <button
            onClick={() => onNavigate && onNavigate('reports')}
            className="btn btn-sm"
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '11.5px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <I.print size={14} />
            {lang === 'bn' ? 'অডিট সনদ মুদ্রণ' : 'Print Audit Cert'}
          </button>
        </div>
      </div>

      {/* Advanced Officer Query Filter Bar */}
      <div className="card mb-16" style={{ background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <I.search size={16} /> {t('officer.search.title')}
          </h3>
          {/* Query Mode Selector */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 8, gap: 4, fontSize: '0.76rem' }}>
            <button
              onClick={() => setSearchType('dag')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                background: searchType === 'dag' ? '#0f172a' : 'transparent',
                color: searchType === 'dag' ? '#ffffff' : '#475569'
              }}
            >
              দাগ নং (Dag)
            </button>
            <button
              onClick={() => setSearchType('khatian')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                background: searchType === 'khatian' ? '#0f172a' : 'transparent',
                color: searchType === 'khatian' ? '#ffffff' : '#475569'
              }}
            >
              খতিয়ান (CS/SA/RS/BS)
            </button>
            <button
              onClick={() => setSearchType('deed')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                background: searchType === 'deed' ? '#0f172a' : 'transparent',
                color: searchType === 'deed' ? '#ffffff' : '#475569'
              }}
            >
              দলিল নং
            </button>
            <button
              onClick={() => setSearchType('nid')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                background: searchType === 'nid' ? '#0f172a' : 'transparent',
                color: searchType === 'nid' ? '#ffffff' : '#475569'
              }}
            >
              মালিকের NID
            </button>
          </div>
        </div>

        <div className="grid grid-4" style={{ gap: 10 }}>
          <div className="field">
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('common.district')}</label>
            <select className="select" value={district} onChange={e => { setDistrict(e.target.value); setUpazila(''); setMouza(''); }}>
              <option value="">-- {t('common.allDistricts')} --</option>
              {districts.map(d => <option key={d.id} value={d.id}>{lang === 'en' ? d.en : d.bn}</option>)}
            </select>
          </div>

          <div className="field">
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('common.upazila')}</label>
            <select className="select" value={upazila} onChange={e => { setUpazila(e.target.value); setMouza(''); }} disabled={!district}>
              <option value="">-- {t('common.allUpazilas')} --</option>
              {upazilas.map(u => <option key={u.id} value={u.id}>{lang === 'en' ? u.en : u.bn}</option>)}
            </select>
          </div>

          <div className="field">
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('common.mouza')}</label>
            <select className="select" value={mouza} onChange={e => setMouza(e.target.value)} disabled={!upazila}>
              <option value="">-- {t('common.allMouzas')} --</option>
              {mouzas.map(m => <option key={m.id} value={m.id}>{lang === 'en' ? m.en : m.bn}</option>)}
            </select>
          </div>

          <div className="field">
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              {searchType === 'dag' ? t('officer.search.dag') :
               searchType === 'khatian' ? t('officer.search.khatian') :
               searchType === 'deed' ? t('officer.search.deed') : 'জাতীয় পরিচয়পত্র (NID)'}
            </label>
            <input
              className="input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="যেমন: 888881, 88/88, KH-1284..."
            />
          </div>
        </div>

        {/* Quick Demo Pre-sets for AC Land / Kanungo Testing */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap', fontSize: '0.76rem' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>{lang === 'bn' ? 'দ্রুত ফাইল লোড:' : 'Quick Presets:'}</span>
          <button
            onClick={() => { setDistrict('dhaka'); setUpazila('uttara'); setMouza('uttara-sector4'); setSearchQuery('888881'); }}
            className="chip"
            style={{ cursor: 'pointer', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 700 }}
          >
            ⚠️ দাগ ৮৮৮৮৮১ (উত্তরা সেক্টর ৪ - ৪টি অসঙ্গতি ও লক)
          </button>
          <button
            onClick={() => { setDistrict('dhaka'); setUpazila('dhamrai'); setMouza('balia'); setSearchQuery('88/88'); }}
            className="chip"
            style={{ cursor: 'pointer', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}
          >
            দাগ ৮৮/৮৮ (ধামরাই - খতিয়ান KH-1284)
          </button>
          <button
            onClick={() => { setDistrict('chattogram'); setUpazila('coxsbazar'); setMouza('coxsbazar-s'); setSearchQuery('64'); }}
            className="chip"
            style={{ cursor: 'pointer', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
          >
            দাগ ৬৪ (কক্সবাজার - বিচারাধীন মামলা ও ডাচ-বাংলা লিয়েন)
          </button>
          <button
            onClick={() => { setDistrict('rajshahi'); setUpazila('paba'); setMouza('paba-s'); setSearchQuery('44/B'); }}
            className="chip"
            style={{ cursor: 'pointer', background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }}
          >
            দাগ ৪৪/বি (পবা - সীমানা দখল চেষ্টা সেন্সর অ্যালার্ট)
          </button>
        </div>
      </div>

      {/* Selected Parcel Administrative Dossier */}
      <div className="card mb-16" style={{ padding: 0, overflow: 'hidden', border: '1.5px solid #0f172a', borderRadius: 16 }}>
        {/* Dossier Header */}
        <div style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="mono" style={{ background: '#334155', padding: '3px 8px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 700 }}>
                প্লট আইডি: {selectedPlot.id}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                দাগ নং: {selectedPlot.dag}
              </span>
              <span className="mono" style={{ background: '#1e293b', border: '1px solid #475569', padding: '3px 8px', borderRadius: 6, fontSize: '0.78rem' }}>
                খতিয়ান: {selectedPlot.khatian}
              </span>
              <span className="badge" style={{
                background: isLocked ? '#fee2e2' : '#dcfce7',
                color: isLocked ? '#991b1b' : '#166534',
                border: isLocked ? '1px solid #f87171' : '1px solid #86efac',
                fontWeight: 800,
                padding: '4px 10px',
                fontSize: '0.78rem'
              }}>
                {isLocked ? '🔒 সাব-রেজিস্ট্রি লক সক্রিয় (Prohibited)' : '🟢 অনলাইন নামজারি অনুমোদিত (Clear)'}
              </span>
            </div>
            <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#cbd5e1' }}>
              <BilingualName en={selectedPlot.district} bn={selectedPlot.districtBn} /> বিভাগীয় আওতাধীন •{' '}
              <BilingualName en={selectedPlot.upazila} bn={selectedPlot.upazilaBn} /> উপজেলা ভূমি অফিস •{' '}
              <BilingualName en={selectedPlot.mouza} bn={selectedPlot.mouzaBn} /> মৌজা (জে.এল নং-০৪)
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontWeight: 700, fontSize: '0.78rem' }}>
              🧭 জোনিং: {lang === 'bn' ? zoning.zoneTagBn : zoning.zoneTagEn}
            </span>
            <button
              onClick={toggleLock}
              className="btn btn-sm"
              style={{
                background: isLocked ? '#dc2626' : '#16a34a',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.78rem',
                border: 'none',
                padding: '6px 12px'
              }}
            >
              {isLocked ? '🔓 লক প্রত্যাহার করুন' : '🔒 সাব-রেজিস্ট্রি লক জারি করুন'}
            </button>
          </div>
        </div>

        {/* Dossier Tabs */}
        <div style={{
          display: 'flex',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 12px',
          gap: 4,
          overflowX: 'auto'
        }}>
          {[
            { id: 'khatian', labelBn: '📜 ৪-স্তরীয় খতিয়ান বংশলতিকা', labelEn: '4-Tier Khatian Lineage' },
            { id: 'litigation', labelBn: '⚖️ আইনি মামলা ও লক হিস্ট্রি', labelEn: 'Litigation & Injunctions' },
            { id: 'satellite', labelBn: '🛰️ স্যাটেলাইট অ্যানোমালি ও ড্রোন', labelEn: 'Satellite & Encroachment' },
            { id: 'lien', labelBn: '🏦 ব্যাংক মর্টগেজ ও সিআইবি', labelEn: 'Bank Liens & CIB' },
            { id: 'actions', labelBn: '⚡ কর্মকর্তা অ্যাকশন টুলকিট', labelEn: 'Officer Action Toolkit' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                fontWeight: activeTab === tab.id ? 800 : 500,
                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                borderBottom: activeTab === tab.id ? '3px solid #0f172a' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap'
              }}
            >
              {lang === 'bn' ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Tab 1: 4-Tier Khatian Archival Lineage */}
        {activeTab === 'khatian' && (
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#0f172a' }}>
                ৪-স্তরীয় খতিয়ানের ধারাবাহিক বিবর্তন ও উত্তরাধিকার ট্র্যাকিং (CS ➔ SA ➔ RS ➔ BS)
              </h4>
              <p className="muted text-xs" style={{ margin: 0 }}>
                ১৯০৮ সালের ক্যাডাস্ট্রাল সার্ভে (CS) হতে ২০২৬ সালের ডিজিটাল সিটি জরিপ পর্যন্ত দাগের আয়তন ও মালিকানার অডিট ট্রায়াল।
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
              {/* CS Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="badge" style={{ background: '#e2e8f0', color: '#334155', fontWeight: 800, fontSize: '0.7rem' }}>
                    ১. সি.এস খতিয়ান (CS - ১৯০৮)
                  </span>
                  <span className="mono text-xs">খতিয়ান নং ১০৪</span>
                </div>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <div><b>মূল রায়ত:</b> রামচরণ মজুমদার</div>
                  <div><b>রেকর্ডকৃত পরিমাণ:</b> ৩৩.০০ শতক</div>
                  <div><b>দাগ নং:</b> ৪১২ (মূল দাগ)</div>
                  <div style={{ marginTop: 6, color: '#059669', fontSize: '0.72rem', fontWeight: 600 }}>
                    ✓ কায়িমী রায়তি স্বত্ব সংরক্ষিত
                  </div>
                </div>
              </div>

              {/* SA Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="badge" style={{ background: '#e2e8f0', color: '#334155', fontWeight: 800, fontSize: '0.7rem' }}>
                    ২. এস.এ খতিয়ান (SA - ১৯৬২)
                  </span>
                  <span className="mono text-xs">খতিয়ান নং ৫১২</span>
                </div>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <div><b>স্বত্বাধিকারী:</b> হাজী মোসলেম উদ্দিন</div>
                  <div><b>রেকর্ডকৃত পরিমাণ:</b> ৩৩.০০ শতক</div>
                  <div><b>সূত্র:</b> সাফ-কবলা দলিল ১৮০২/১৯৫৮</div>
                  <div style={{ marginTop: 6, color: '#059669', fontSize: '0.72rem', fontWeight: 600 }}>
                    ✓ প্রজাস্বত্ব অধিগ্রহণ আইনানুগ
                  </div>
                </div>
              </div>

              {/* RS Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="badge" style={{ background: '#e2e8f0', color: '#334155', fontWeight: 800, fontSize: '0.7rem' }}>
                    ৩. আর.এস খতিয়ান (RS - ১৯৮৫)
                  </span>
                  <span className="mono text-xs">খতিয়ান নং ৭৪০</span>
                </div>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <div><b>ওয়ারিশ:</b> মফিজুল ইসলাম ও অন্যান্য</div>
                  <div><b>রেকর্ডকৃত পরিমাণ:</b> ৩৩.০০ শতক</div>
                  <div><b>বণ্টনসূত্র:</b> বণ্টননামা দলিল ৭৪০১/১৯৮২</div>
                  <div style={{ marginTop: 6, color: '#059669', fontSize: '0.72rem', fontWeight: 600 }}>
                    ✓ মাঠ জরিপে হিস্যা সঠিক
                  </div>
                </div>
              </div>

              {/* BS/City Box with Anomaly Alert */}
              <div style={{ background: '#fef2f2', border: '1.5px solid #f87171', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="badge" style={{ background: '#dc2626', color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>
                    ৪. বি.এস / সিটি খতিয়ান (২০২০)
                  </span>
                  <span className="mono text-xs">খতিয়ান নং {selectedPlot.khatian}</span>
                </div>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#7f1d1d' }}>
                  <div><b>বর্তমান রেকর্ড:</b> <BilingualName en={selectedPlot.owner.name} bn={selectedPlot.owner.nameBn} /></div>
                  <div><b>রেকর্ডকৃত পরিমাণ:</b> {selectedPlot.areaShotok} শতক</div>
                  <div><b>দাগ নং:</b> {selectedPlot.dag}</div>
                  <div style={{ marginTop: 6, color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>
                    ⚠️ সতর্কতা: আর.এস অপেক্ষা বি.এস রেকর্ডে ৪.৫ শতক অতিরিক্ত অন্তর্ভুক্ত হয়েছে।
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Registry Deeds Evolution Table */}
            <div style={{ marginTop: 18 }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#0f172a' }}>
                সাব-রেজিস্ট্রি দলিলের ধারাবাহিক রেজিস্ট্রি রেকর্ড (Archival Deeds)
              </h5>
              <div className="table-responsive">
                <table className="table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>দলিল নং</th>
                      <th>তারিখ</th>
                      <th>হস্তান্তরের ধরন</th>
                      <th>গ্রহীতা ও দাতা</th>
                      <th>অডিট স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plotDeeds.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="muted text-center" style={{ padding: 12 }}>
                          কোনো অতীত দলিল ফ্ল্যাগ পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      plotDeeds.map((d: Deed) => (
                        <tr key={d.no} style={{ background: d.status === 'flagged' ? '#fef2f2' : undefined }}>
                          <td className="mono"><b>{d.no}</b></td>
                          <td>{d.date}</td>
                          <td>{d.type === 'sale' ? 'সাফ-কবলা' : d.type === 'mutation' ? 'নামজারি' : d.type === 'partition' ? 'বণ্টননামা' : d.type}</td>
                          <td>{d.from} ➔ {d.to}</td>
                          <td>
                            {d.status === 'flagged' ? (
                              <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 700 }}>
                                ⚠️ অডিট অসঙ্গতি ফ্ল্যাগড
                              </span>
                            ) : (
                              <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                                ✓ ভেরিফাইড ক্লিয়ার
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Litigation & Injunction Controls */}
        {activeTab === 'litigation' && (
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#0f172a' }}>
                আদালতের নিষেধাজ্ঞা ও সাব-রেজিস্ট্রি লক হিস্ট্রি
              </h4>
              <p className="muted text-xs" style={{ margin: 0 }}>
                দেওয়ানি আদালত ও মহামান্য হাইকোর্টের স্থগিতাদেশ কার্যকরীকরণ প্যানেল।
              </p>
            </div>

            {activeLitigations.length === 0 && !isLocked ? (
              <div style={{ padding: 20, textAlign: 'center', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <h5 style={{ margin: '6px 0 2px 0', color: '#166534' }}>কোনো সক্রিয় আইনি মামলা বা স্থগিতাদেশ নেই</h5>
                <p className="muted text-xs">এই দাগটির ওপর কোনো আদালত বা এসি ল্যান্ড অফিসের নিষেধাজ্ঞা সক্রিয় নেই।</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeLitigations.map(lit => (
                  <div key={lit.id} style={{ background: '#fff1f2', border: '1.5px solid #fda4af', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <span className="badge" style={{ background: '#e11d48', color: '#fff', fontWeight: 800 }}>
                          মামলা নং: {lit.caseNo}
                        </span>
                        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: '0.85rem', color: '#881337' }}>
                          {lit.court}
                        </span>
                      </div>
                      <span className="chip" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: '0.72rem' }}>
                        ⛔ স্থগিতাদেশ জারি: {lit.lockDate}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#4c0519', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><b>বাদী (Petitioner):</b> {lit.petitioner}</div>
                      <div><b>বিবাদী (Respondent):</b> {lit.respondent}</div>
                      <div><b>আদেশের ধরন:</b> {lit.orderType === 'injunction' ? 'চিরস্থায়ী নিষেধাজ্ঞা (Injunction)' : 'স্থিতাবস্থা (Status Quo)'}</div>
                      <div><b>মন্তব্য:</b> {lit.remarks}</div>
                    </div>
                  </div>
                ))}

                {/* If marked locked manually */}
                {isLocked && activeLitigations.length === 0 && (
                  <div style={{ background: '#fff1f2', border: '1.5px solid #fda4af', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge" style={{ background: '#e11d48', color: '#fff', fontWeight: 800 }}>
                        প্রশাসনিক লক সক্রিয়
                      </span>
                      <span className="text-xs muted">সহকারী কমিশনার (ভূমি) এর কার্যালয়</span>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#881337' }}>
                      অনলাইন ভূমি সেবা পোর্টালে এই দাগের যেকোনো নামজারি আবেদন ও সাব-রেজিস্ট্রি অফিসে জমি হস্তান্তর সাময়িকভাবে স্থগিত করা হয়েছে।
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Registration Prohibition Memo Section */}
            <div style={{ marginTop: 16, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>
                🏛️ সাব-রেজিস্ট্রার বরাবর ডিজিটাল ইন্টিগ্রেশন নির্দেশনা
              </div>
              <div className="text-xs muted" style={{ lineHeight: 1.5 }}>
                সাব-রেজিস্ট্রি সফটওয়্যার ও ই-নামজারি ডাটাবেজের সাথে BhumiRadar API সরাসরি সংযুক্ত। এখানে লক সক্রিয় থাকলে সাব-রেজিস্ট্রারের ড্যাশবোর্ডে স্বয়ংক্রিয়ভাবে দলিল প্রস্তুতকরণ ব্লক থাকবে।
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Satellite Spectral Anomaly & Encroachment Radar */}
        {activeTab === 'satellite' && (
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#0f172a' }}>
                স্যাটেলাইট স্পেকট্রাল অ্যানোমালি, ড্রোন ও সীমানা দখল অডিট
              </h4>
              <p className="muted text-xs" style={{ margin: 0 }}>
                Sentinel-2 NDWI/NDVI স্পেকট্রাল ব্যান্ড ও আইওটি মোশন সেন্সর কর্তৃক শনাক্তকৃত ভৌগোলিক পরিবর্তন।
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>🛰️ রিমোট সেন্সিং স্পেকট্রাল সূচক</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>NDWI (জলাশয় সূচক):</span>
                    <b style={{ color: selectedPlot.status === 'shikosti' ? '#0284c7' : '#059669' }}>
                      {selectedPlot.status === 'shikosti' ? '+0.68 (জলমগ্ন নদীভাঙন)' : '-0.24 (শুষ্ক ভূমি)'}
                    </b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>NDVI (সবুজ বা কৃষি সূচক):</span>
                    <b>0.52 (গাছপালা ও কৃষিজমি)</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>দখলঝুঁকি সেন্সর:</span>
                    <b style={{ color: relatedEncroachment.length > 0 ? '#dc2626' : '#059669' }}>
                      {relatedEncroachment.length > 0 ? '⚠️ অবৈধ সীমানা প্রাচীর নির্মাণের অপচেষ্টা' : '✓ নিরাপদ'}
                    </b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ড্রোন সার্ভে স্থানাঙ্ক:</span>
                    <span className="mono text-xs">{selectedPlot.coords.lat.toFixed(4)}° N, {selectedPlot.coords.lng.toFixed(4)}° E</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>🚩 রিয়েলটাইম অ্যানোমালি ও সেন্সর লগ</h5>
                {relatedEncroachment.length === 0 ? (
                  <p className="text-xs muted">কোনো অবৈধ ভরাট বা সীমানা দখলের স্যাটেলাইট সতর্কতা নেই।</p>
                ) : (
                  relatedEncroachment.map(enc => (
                    <div key={enc.id} style={{ background: '#fee2e2', padding: 8, borderRadius: 6, fontSize: '0.78rem', color: '#991b1b', marginBottom: 6 }}>
                      <b>অ্যালার্ট আইডি {enc.id}:</b> {enc.location} ({enc.detectedOn})
                      <div className="text-xs">প্রমাণক: {enc.evidence.join(', ')} • সেন্সর: {enc.sensorId || 'সরাসরি উপগ্রহ'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Bank Liens & CIB */}
        {activeTab === 'lien' && (
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#0f172a' }}>
                ব্যাংক মর্টগেজ ও বাংলাদেশ ব্যাংক সিআইবি দায়ভার অডিট
              </h4>
              <p className="muted text-xs" style={{ margin: 0 }}>
                তফসিলি ব্যাংকে জমির মূল দলিল জমা বা লিয়েন সংক্রান্ত এনকামব্রান্স তথ্য।
              </p>
            </div>

            {activeLiens.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '1.4rem' }}>🏦</span>
                <h5 style={{ margin: '6px 0 2px 0', color: '#166534' }}>কোনো সক্রিয় ব্যাংক লিয়েন বা বন্ধক নেই</h5>
                <p className="muted text-xs">বাংলাদেশ ব্যাংকের CIB ডাটাবেজ অনুযায়ী এই প্লটটির ওপর কোনো বকেয়া মর্টগেজ দায় নেই।</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeLiens.map(lien => (
                  <div key={lien.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#92400e', fontSize: '0.85rem' }}>
                        🏛️ {lien.bank} ({lien.branch} শাখা)
                      </span>
                      <span className="chip" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.72rem' }}>
                        লিয়েন নং: {lien.encumbranceNo}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 8, fontSize: '0.78rem' }}>
                      <div><b>ঋণগ্রহীতা:</b> {lien.borrower}</div>
                      <div><b>অনুমোদিত ঋণ:</b> ৳ {(lien.amount).toLocaleString('bn-BD')}</div>
                      <div><b>বকেয়া দায়:</b> ৳ {(lien.outstanding).toLocaleString('bn-BD')}</div>
                      <div><b>মেয়াদ:</b> {lien.startDate} হতে {lien.endDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Officer Action Toolkit */}
        {activeTab === 'actions' && (
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#0f172a' }}>
                সহকারী কমিশনার (ভূমি) ও কানুনগো প্রশাসনিক অ্যাকশন প্যানেল
              </h4>
              <p className="muted text-xs" style={{ margin: 0 }}>
                দাগ নং {selectedPlot.dag} এর তদন্ত সাপেক্ষে তাৎক্ষণিক আইনি আদেশ বা মাঠ তদন্ত জারি করুন।
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {/* Action 1 */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 6px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <I.search size={16} /> মাঠপর্যায়ে সরেজমিনে পরিদর্শন
                </h5>
                <p className="text-xs muted" style={{ marginBottom: 12 }}>
                  উপজেলা কানুনগো ও সার্ভেয়ারকে সরেজমিনে সীমানা ও দখলের প্রকৃত অবস্থা রিপোর্ট করার নির্দেশ জারি করুন।
                </p>
                <button onClick={dispatchInspection} className="btn btn-sm btn-primary" style={{ width: '100%', fontSize: '0.78rem' }}>
                  🚀 কানুনগো ও সার্ভেয়ার প্রেরণ করুন
                </button>
              </div>

              {/* Action 2 */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 6px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <I.scale size={16} /> এসি ল্যান্ড শুনানির নোটিশ
                </h5>
                <p className="text-xs muted" style={{ marginBottom: 12 }}>
                  মালিক ও আবেদনকারী পক্ষগণকে মূল দলিল ও পর্চাসহ এসি ল্যান্ড এজলাসে হাজির হওয়ার সরকারি সমন পাঠান।
                </p>
                <button onClick={issueHearingNotice} className="btn btn-sm btn-outline" style={{ width: '100%', fontSize: '0.78rem' }}>
                  📜 শুনানির নোটিশ জারি করুন
                </button>
              </div>

              {/* Action 3 */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 6px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <I.lock size={16} /> সাব-রেজিস্ট্রি লক ও মিউটেশন ব্লক
                </h5>
                <p className="text-xs muted" style={{ marginBottom: 12 }}>
                  জমিটির হস্তান্তর ও নামজারি সাময়িক বা স্থায়ীভাবে ব্লক করে সাব-রেজিস্ট্রার অফিসে ডিজিটাল সতর্কবার্তা পাঠান।
                </p>
                <button
                  onClick={toggleLock}
                  className="btn btn-sm"
                  style={{
                    width: '100%',
                    fontSize: '0.78rem',
                    background: isLocked ? '#dc2626' : '#0f172a',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  {isLocked ? '🔓 লক প্রত্যাহার' : '⛔ অনলাইন রেজিস্ট্রি লক প্রয়োগ'}
                </button>
              </div>

              {/* Action 4 */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 6px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <I.print size={16} /> অফিসিয়াল অডিট প্রত্যয়নপত্র
                </h5>
                <p className="text-xs muted" style={{ marginBottom: 12 }}>
                  সহকারী কমিশনার (ভূমি) এর ডিজিটাল সিলমোহর ও কিউআর কোডসহ সমন্বিত অডিট রিপোর্ট ডাউনলোড করুন।
                </p>
                <button
                  onClick={() => onNavigate && onNavigate('reports')}
                  className="btn btn-sm btn-secondary"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                >
                  🖨️ অডিট প্রত্যয়নপত্র তৈরি করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cadastral GIS Spatial Inspector */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>
            🗺️ ক্যাডাস্ট্রাল মৌজা ম্যাপ ও সীমানা ওভারলে (Cadastral Cadastre GIS)
          </h3>
          <span className="text-xs muted">
            দাগ নং {selectedPlot.dag} • স্থানাঙ্ক: {selectedPlot.coords.lat.toFixed(4)}, {selectedPlot.coords.lng.toFixed(4)}
          </span>
        </div>
        <MapView plots={[selectedPlot, ...plots.filter(p => p.id !== selectedPlot.id).slice(0, 5)]} onSelect={onSelectPlot} height={380} showLegend />
      </div>
    </div>
  );
};
