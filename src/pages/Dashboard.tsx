import React, { useMemo, useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { BilingualName, StatusBadge } from '../components/ui/StatusBadge';
import { computeStats, encroachmentAlerts, fraudAlerts, inspections, litigation, plots } from '../data/seed';
import type { PageKey } from '../App';
import { MapView } from '../components/ui/MapView';
import { Modal } from '../components/ui/Modal';
import {
  divisions,
  districtsByDivision,
  upazilasByDistrict,
  mouzasByUpazila,
  getSectorZoning,
} from '../data/zoning';

type DesignVariation = 1 | 2 | 3 | 4 | 5;
type KpiCard = { key: string; labelKey: string; value: number | string; delta: number; kind: 'green' | 'red' | 'amber' | 'info' | 'gold' | 'brand' };

export const Dashboard: React.FC<{ onNavigate: (p: PageKey) => void; onSelectPlot: (id: string | null) => void }> = ({ onNavigate, onSelectPlot }) => {
  const { t, lang } = useI18n();
  const stats = useMemo(() => computeStats(), []);
  
  // Showcase controller state
  const [designVariation, setDesignVariation] = useState<DesignVariation>(1);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showZoningQuickModal, setShowZoningQuickModal] = useState(false);
  const [temporalYear, setTemporalYear] = useState<2022 | 2024 | 2026>(2026);
  const [searchRole, setSearchRole] = useState<'citizen' | 'officer'>('citizen');

  // Cascading quick search inputs
  const [selDiv, setSelDiv] = useState('chattogram');
  const [selDist, setSelDist] = useState('chandpur');
  const [selUpazila, setSelUpazila] = useState('chandpur-sadar');
  const [selMouza, setSelMouza] = useState('chirarchar');
  const [plotInput, setPlotInput] = useState('888881');

  const availableQuickDists = useMemo(() => districtsByDivision[selDiv] || [], [selDiv]);
  const availableQuickUpazilas = useMemo(() => upazilasByDistrict[selDist] || [], [selDist]);
  const availableQuickMouzas = useMemo(() => mouzasByUpazila[selUpazila] || [], [selUpazila]);

  const quickZoning = useMemo(() => {
    return getSectorZoning(selDiv, selDist, selUpazila, selMouza);
  }, [selDiv, selDist, selUpazila, selMouza]);

  const handleQuickDivChange = (divId: string) => {
    setSelDiv(divId);
    const dists = districtsByDivision[divId] || [];
    const firstDist = dists[0]?.id || '';
    setSelDist(firstDist);
    const upazilas = upazilasByDistrict[firstDist] || [];
    const firstUp = upazilas[0]?.id || '';
    setSelUpazila(firstUp);
    const mouzas = mouzasByUpazila[firstUp] || [];
    const firstMou = mouzas[0]?.id || '';
    setSelMouza(firstMou);
  };

  const handleQuickDistChange = (distId: string) => {
    setSelDist(distId);
    const upazilas = upazilasByDistrict[distId] || [];
    const firstUp = upazilas[0]?.id || '';
    setSelUpazila(firstUp);
    const mouzas = mouzasByUpazila[firstUp] || [];
    const firstMou = mouzas[0]?.id || '';
    setSelMouza(firstMou);
  };

  const handleQuickUpazilaChange = (upId: string) => {
    setSelUpazila(upId);
    const mouzas = mouzasByUpazila[upId] || [];
    const firstMou = mouzas[0]?.id || '';
    setSelMouza(firstMou);
  };

  const kpis: KpiCard[] = [
    { key: 'plots',  labelKey: 'kpi.totalPlots',       value: stats.totalPlots,        delta: 4,   kind: 'green' },
    { key: 'lit',    labelKey: 'kpi.activeLitigation',  value: stats.activeLitigation,  delta: -1,  kind: 'red' },
    { key: 'enc',    labelKey: 'kpi.encroachments',     value: stats.encroachments,     delta: 12,  kind: 'amber' },
    { key: 'lien',   labelKey: 'kpi.bankLiens',         value: stats.bankLiens,         delta: 2,   kind: 'info' },
    { key: 'hlt',    labelKey: 'kpi.healthAvg',         value: stats.healthAvg,         delta: -3,  kind: 'gold' },
    { key: 'shik',   labelKey: 'kpi.shikostiPoyosti',   value: stats.shikostiPoyosti,   delta: 5,   kind: 'amber' },
    { key: 'fld',    labelKey: 'kpi.fieldInspections',  value: stats.fieldInspections,  delta: 0,   kind: 'green' },
    { key: 'cit',    labelKey: 'kpi.citizenSearches',   value: stats.citizenSearches,   delta: 8,   kind: 'green' },
    { key: 'khs',    labelKey: 'kpi.govKhas',           value: stats.govKhas,           delta: 0,   kind: 'info' },
    { key: 'frd',    labelKey: 'kpi.fraudAlerts',       value: stats.fraudAlerts,       delta: -1,  kind: 'red' },
  ];

  const recentAlerts = useMemo(() => {
    const items: Array<{ id: string; kind: 'enc' | 'fraud' | 'lit'; title: string; date: string; plot: string; severity?: 'high' | 'medium' | 'low' }> = [];
    encroachmentAlerts.forEach(a => items.push({ id: a.id, kind: 'enc', title: t('enc.title'), date: a.detectedOn, plot: a.plotId, severity: a.level }));
    fraudAlerts.filter(f => !f.dismissed).forEach(f => items.push({ id: f.id, kind: 'fraud', title: t(`own.fraud.${f.type}`), date: f.createdOn, plot: f.plotId, severity: f.severity }));
    litigation.filter(l => l.status === 'active').forEach(l => items.push({ id: l.id, kind: 'lit', title: `${t('lit.caseNo')}: ${l.caseNo}`, date: l.lockDate, plot: l.plots[0], severity: 'high' }));
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [t]);

  const recentInspections = useMemo(() => {
    return [...inspections].sort((a, b) => (b.completedOn || b.dueDate).localeCompare(a.completedOn || a.dueDate)).slice(0, 5);
  }, []);

  const handleQuickSearchSubmit = () => {
    setShowQuickSearch(false);
    if (searchRole === 'officer') {
      onNavigate('officerAudit');
    } else {
      onNavigate('citizen');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ============================================================== */}
      {/* 1. TOP APP & SHOWCASE CONTROLLER BAR                           */}
      {/* ============================================================== */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--ink-200)',
        borderRadius: 16,
        padding: '10px 18px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        {/* Brand & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#ffffff',
            border: '1.5px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            boxShadow: '0 2px 6px rgba(10, 77, 36, 0.08)',
          }}>
            <img
              src="/assets/bd-govt-emblem.png"
              alt="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                ভূমি<span style={{ color: '#0a4d24' }}>রাডার</span>
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                borderRadius: 4,
              }}>
                {lang === 'bn' ? 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার' : 'Govt of Bangladesh'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ink-500)', fontWeight: 600 }}>
              {lang === 'bn' ? 'ভূমি মন্ত্রণালয় • স্মার্ট ল্যান্ড ইন্টেলিজেন্স ও ডিজিটাল জোনিং' : 'Ministry of Land • Unified Land Intelligence & Zoning'}
            </div>
          </div>
        </div>

        {/* 5 UI Showcase Switcher Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: '#f1f5f9',
          padding: 4,
          borderRadius: 12,
          border: '1px solid var(--ink-200)',
          flexWrap: 'wrap',
        }}>
          {[
            { id: 1, labelBn: '১. প্যানোরামিক ডেক', labelEn: '1. Panoramic Deck' },
            { id: 2, labelBn: '২. স্প্লিট জিআইএস', labelEn: '2. Split GIS' },
            { id: 3, labelBn: '৩. মিনিমাল সিভিক গ্রিড', labelEn: '3. Civic Grid' },
            { id: 4, labelBn: '৪. শিকস্তি-পয়স্তি ও চর', labelEn: '4. Riverine & Char' },
            { id: 5, labelBn: '৫. সিটিজেন ট্রাস্ট স্কোর', labelEn: '5. Citizen Trust' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDesignVariation(tab.id as DesignVariation)}
              className={`showcase-tab ${designVariation === tab.id ? 'active' : ''}`}
            >
              {lang === 'bn' ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowZoningQuickModal(true)}
            className="btn btn-sm"
            style={{
              background: '#fffbeb',
              color: '#b45309',
              border: '1.5px solid #f59e0b',
              fontWeight: 700,
              fontSize: '11.5px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 1px 3px rgba(245, 158, 11, 0.2)',
            }}
          >
            🧭 {lang === 'bn' ? 'ভূমি জোনিং সারাংশ' : 'Zoning Summary'}
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="btn btn-sm"
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              fontWeight: 700,
              fontSize: '11.5px',
              padding: '6px 12px',
            }}
          >
            <I.document size={13} /> {lang === 'bn' ? 'প্লট ৮৮৮৮৮১ রিপোর্ট' : 'Plot 888881 Report'}
          </button>
          <button
            onClick={() => setShowQuickSearch(true)}
            className="btn btn-sm btn-outline"
            style={{ padding: '6px 10px', fontSize: '11.5px' }}
            title={lang === 'bn' ? 'মৌজা ও প্লট অনুসন্ধান' : 'Cadastral Search'}
          >
            <I.search size={14} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DYNAMIC SHOWCASE HERO SECTION (Variations 1 to 5)          */}
      {/* ============================================================== */}

      {/* --- DESIGN VARIATION 1: PANORAMIC BENGAL HERO & 5-FEATURE DECK --- */}
      {designVariation === 1 && (
        <section style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          {/* Panoramic Bengal Green Drone Paddy Field Image */}
          <div style={{ position: 'relative', minHeight: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80"
              alt="বাংলার চিরসবুজ ফসলি মাঠ"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.85) saturate(1.2)',
              }}
            />
            {/* Gradients */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.45) 60%, rgba(15,23,42,0.2) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 50, 22, 0.25)', mixBlendMode: 'multiply' }} />

            {/* Holographic Cadastral Grid Vector Overlay */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.22, pointerEvents: 'none' }}>
              <defs>
                <pattern id="cadastral-grid-p1" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="4 2" />
                  <circle cx="50" cy="50" r="1.5" fill="#f87171" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cadastral-grid-p1)" />
            </svg>

            {/* Hero Center Content */}
            <div style={{ position: 'relative', zIndex: 10, maxWidth: 860, padding: '40px 20px', textAlign: 'center', color: '#ffffff' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 14px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                fontSize: '11.5px',
                fontWeight: 600,
                marginBottom: 16,
              }}>
                <span className="live-beacon" style={{ width: 8, height: 8 }} />
                {lang === 'bn' ? 'স্যাটেলাইট ক্যাডাস্ট্রাল রাডার • গণপ্রজাতন্ত্রী বাংলাদেশ সরকার' : 'Satellite Cadastral Radar • Government of Bangladesh'}
              </div>

              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.25, margin: '0 0 14px 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {lang === 'bn' ? 'বাংলাদেশের জমির স্বচ্ছতা ও সুরক্ষা' : 'Bangladesh Land Transparency & Security'} <br />
                <span style={{ color: '#86efac' }}>{lang === 'bn' ? 'এখন এক প্ল্যাটফর্মে' : 'Unified in One Platform'}</span>
              </h1>

              <p style={{ maxWidth: 650, margin: '0 auto 24px auto', fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.6 }}>
                {lang === 'bn'
                  ? 'উপগ্রহের মাধ্যমে নদীভাঙন ও শিকস্তি-পয়স্তি ট্র্যাক, সাব-রেজিস্ট্রি লিটিগেশন লক, খতিয়ানের ধারাবাহিক অডিট এবং অবৈধ খাসজমি দখল প্রতিরোধের আধুনিক সিভিক-টেক ব্যবস্থা।'
                  : 'Satellite-tracked river erosion, sub-registrar litigation locks, chain-of-title audits, and government khas encroachment monitoring.'}
              </p>

              {/* Floating Integrated Search Bar */}
              <div className="glass-panel" style={{
                maxWidth: 720,
                margin: '0 auto',
                padding: 10,
                borderRadius: 18,
                border: '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
                textAlign: 'left',
                color: '#0f172a',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 160px', gap: 10, alignItems: 'center' }}>
                  <div style={{ padding: '4px 10px', borderRight: '1px solid var(--ink-200)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>মৌজা নির্বাচন</span>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>চিরারচর (জে.এল ৪২)</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRight: '1px solid var(--ink-200)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>উপজেলা ও জেলা</span>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>চাঁদপুর সদর, চাঁদপুর</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRight: '1px solid var(--ink-200)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>ক্যাডাস্ট্রাল দাগ নং</span>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626' }}>প্লট ৮৮৮৮৮১ ⚠️</div>
                  </div>
                  <div>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="btn"
                      style={{
                        width: '100%',
                        background: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: 'none',
                      }}
                    >
                      <I.shield size={14} /> {lang === 'bn' ? 'যাচাই রিপোর্ট দেখুন' : 'View Report'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust Badges Under Search */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 20, fontSize: '12px', opacity: 0.85 }}>
                <span>✅ ৬৪ জেলা কভারেজ</span>
                <span>📐 ৪২,০০০+ ডিজিটাল মৌজা</span>
                <span>🔒 রিয়েল-টাইম সাব-রেজিস্ট্রি লক</span>
              </div>
            </div>
          </div>

          {/* 5 Key Floating Feature Cards */}
          <div style={{
            maxWidth: 1200,
            margin: '-45px auto 25px auto',
            padding: '0 16px',
            position: 'relative',
            zIndex: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 14,
          }}>
            {[
              {
                icon: <I.satellite size={20} />,
                badge: 'শিকস্তি শনাক্ত',
                badgeColor: '#d97706',
                badgeBg: '#fef3c7',
                title: 'টেম্পোরাল স্যাটেলাইট ও নদীভাঙন',
                desc: '২০২২–২০২৬ নদীভাঙন বিশ্লেষণ ও উপগ্রহের NDWI ইনডেক্সে নিমজ্জিত জমি ও পয়স্তি চর পর্যবেক্ষণ।',
                meta: 'প্লট ৮৮৮৮৮১: ৬৪.২% নিমজ্জিত',
                page: 'temporalGis' as PageKey,
              },
              {
                icon: <I.lock size={20} />,
                badge: 'লকড সক্রিয়',
                badgeColor: '#dc2626',
                badgeBg: '#fee2e2',
                title: 'স্মার্ট লিটিগেশন ও সাব-রেজিস্ট্রি লক',
                desc: 'আদালতের নিষেধাজ্ঞাপ্রাপ্ত জমি তাৎক্ষণিক সাব-রেজিস্ট্রিতে লক করা, যাতে বিরোধপূর্ণ জমি বিক্রি বন্ধ থাকে।',
                meta: 'দেওয়ানি মামলা ৪০২/২০২৬',
                page: 'litigation' as PageKey,
                ring: true,
              },
              {
                icon: <I.chain size={20} />,
                badge: 'CS-SA-RS-BS',
                badgeColor: '#4f46e5',
                badgeBg: '#eef2ff',
                title: 'খতিয়ান ও চেইন-অব-টাইটেল গ্রাফ',
                desc: 'সিএস থেকে বিএস পর্যন্ত দলিলের ধারাবাহিক সংযোগ অডিট; গ্যাপ ও অতিরিক্ত অংশ বিক্রি চিহ্নিতকরণ।',
                meta: 'দলিল ৪১০২ এ অমিল সনাক্ত',
                page: 'ownershipChain' as PageKey,
              },
              {
                icon: <I.land size={20} />,
                badge: 'খাসজমি প্রটেক্ট',
                badgeColor: '#059669',
                badgeBg: '#d1fae5',
                title: 'খাসজমি ও এনক্রোচমেন্ট শিল্ড',
                desc: 'নদী তীরবর্তী ১-নং খাস খতিয়ান ও সংরক্ষিত সরকারি জলমহালের সীমানা লঙ্ঘন প্রতিরোধ।',
                meta: '৪০ একর নতুন চর মনিটরিং',
                page: 'khas' as PageKey,
              },
              {
                icon: <I.bank size={20} />,
                badge: 'স্কোর: ৩৮/১০০',
                badgeColor: '#dc2626',
                badgeBg: '#fef2f2',
                title: 'স্মার্ট ব্যাংক লিয়েন ও হেলথ স্কোর',
                desc: 'অঘোষিত ব্যাংক বন্ধকী ঋণ যাচাই এবং সাধারণ নাগরিকের জন্য জমি কেনার আগে তাৎক্ষণিক ঝুঁকি স্কোর।',
                meta: 'অগ্রণী ব্যাংক লিয়েন: ২৫ লাখ',
                page: 'health' as PageKey,
              },
            ].map((card, i) => (
              <div
                key={i}
                onClick={() => onNavigate(card.page)}
                className={`showcase-card ${card.ring ? 'danger-ring' : ''}`}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f8fafc', border: '1px solid var(--ink-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.badgeColor }}>
                      {card.icon}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: card.badgeBg, color: card.badgeColor }}>
                      {card.badge}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                    {card.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-500)', lineHeight: 1.5 }}>
                    {card.desc}
                  </p>
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--ink-100)', fontSize: '11px', fontWeight: 700, color: card.badgeColor, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{card.meta}</span>
                  <I.chevron size={13} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- DESIGN VARIATION 2: SPLIT-SCREEN GEOSPATIAL & FEATURE FOCUS --- */}
      {designVariation === 2 && (
        <section style={{ background: '#ffffff', borderRadius: 24, border: '1px solid var(--ink-200)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, alignItems: 'center' }}>
            {/* Left 50%: Lush Green Drone Photo with Animated Rotating Radar Cone */}
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '2px solid #ffffff', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', background: '#064e3b', minHeight: 380 }}>
              <img
                src="https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=1200&q=80"
                alt="ড্রোন ক্যাডাস্ট্রাল ভিউ"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.2)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,78,59,0.85) 0%, transparent 60%)' }} />

              {/* Animated Radar Scanning Cone */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ position: 'relative', width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
                  <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', border: '1px dashed rgba(52, 211, 153, 0.5)' }} />
                  <div className="radar-cone animate-radar-sweep" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
                  {/* Blip for Plot 888881 */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#dc2626' }} className="live-beacon danger" />
                  </div>
                </div>
              </div>

              {/* Cadastral Polygon Graphics */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 400 300">
                <polygon points="40,180 120,160 140,240 50,260" fill="rgba(34, 197, 94, 0.25)" stroke="#22c55e" strokeWidth="1.5" />
                <text x="50" y="210" fill="#ffffff" fontSize="9" fontWeight="bold">দাগ ৮৮৮৮৮০ (নিরাপদ)</text>

                <polygon points="160,110 270,90 290,190 170,220" fill="rgba(220, 38, 38, 0.4)" stroke="#dc2626" strokeWidth="2.5" />
                <text x="175" y="145" fill="#fecaca" fontSize="10" fontWeight="bold">দাগ ৮৮৮৮৮১</text>
                <text x="175" y="162" fill="#ffffff" fontSize="8" fontWeight="bold">🔴 সাব-রেজিস্ট্রি লকড</text>
                <text x="175" y="176" fill="#fef08a" fontSize="7.5">৬৪.২% নদীগর্ভে বিলীন</text>

                <polygon points="260,30 380,20 370,80 250,70" fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="270" y="52" fill="#a7f3d0" fontSize="8" fontWeight="bold">পয়স্তি চর (৪০ একর)</text>
              </svg>

              {/* Map Badges */}
              <div className="glass-panel" style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 10, fontSize: '11px', fontWeight: 700 }}>
                🛰️ চাঁদপুর সদর • চিরারচর মৌজা (লাইভ স্ক্যান)
              </div>
              <div style={{ position: 'absolute', bottom: 12, right: 12, background: '#dc2626', color: '#fff', padding: '6px 12px', borderRadius: 10, fontSize: '11px', fontWeight: 800 }}>
                ⚠️ ইনজাংশন: দেওয়ানি মামলা ৪০২/২০২৬
              </div>
            </div>

            {/* Right 50%: 5 Interactive Feature Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: '#dcfce7', color: '#166534', fontSize: '11.5px', fontWeight: 700, width: 'fit-content' }}>
                <I.radar size={14} /> স্বয়ংক্রিয় ল্যান্ড ইন্টেলিজেন্স ফ্রেমওয়ার্ক
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                জমি কেনা বা হস্তান্তরের আগে <br />
                <span style={{ color: '#dc2626' }}>৫টি অপরিহার্য ঝুঁকি নিরূপণ</span>
              </h2>

              {[
                { title: '১. টেম্পোরাল স্যাটেলাইট ও শিকস্তি-পয়স্তি', badge: 'NDWI ওয়াটার ইনডেক্স', desc: 'জমি নদীগর্ভে গেছে কি না (শিকস্তি) বা নতুন চর জেগেছে কি না (পয়স্তি) উপগ্রহ চিত্রে তুলনা।', page: 'temporalGis' as PageKey },
                { title: '২. স্মার্ট লিটিগেশন ও সাব-রেজিস্ট্রি লক', badge: 'তাৎক্ষণিক দলিল ব্লকিং', desc: 'আদালত নিষেধাজ্ঞা জারি করা মাত্রই সাব-রেজিস্ট্রারের সফটওয়্যারে দাগ নম্বর স্বয়ংক্রিয় লক।', page: 'litigation' as PageKey, danger: true },
                { title: '৩. খতিয়ান ও চেইন-অব-টাইটেল অডিট গ্রাফ', badge: 'মালিকানা ধারাবাহিকতা', desc: 'CS, SA, RS থেকে BS জরিপ পর্যন্ত বংশপরম্পরা দলিলের সংযোগ ও অতিরিক্ত অংশ বিক্রি পরীক্ষা।', page: 'ownershipChain' as PageKey },
                { title: '৪. খাসজমি ও এনক্রোচমেন্ট শিল্ড', badge: 'নদী করিডোর ও চর', desc: 'সরকারি খাসজমি ও নদী অববাহিকার বাফার জোনে অবৈধ দখল ও স্থাপনা নির্মাণ প্রতিরোধ।', page: 'khas' as PageKey },
                { title: '৫. ব্যাংক মর্টগেজ লিয়েন ও নাগরিক ভেরিফিকেশন', badge: '০-১০০ স্কোর', desc: 'ব্যাংকে বন্ধক রাখা গোপন ঋণ শনাক্তকরণ ও কিউআর-কোডযুক্ত ভেরিফাইড অফিশিয়াল সার্টিফিকেট।', page: 'reports' as PageKey },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate(item.page)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: item.danger ? '#fef2f2' : '#f8fafc',
                    border: `1px solid ${item.danger ? '#fecaca' : 'var(--ink-200)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: item.danger ? '#991b1b' : '#0f172a' }}>{item.title}</strong>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: item.danger ? '#dc2626' : '#e2e8f0', color: item.danger ? '#fff' : '#334155' }}>
                      {item.badge}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.76rem', color: 'var(--ink-500)' }}>{item.desc}</p>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowReportModal(true)} className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}>
                  <I.document size={14} /> দাগ ৮৮৮৮৮১ লাইভ ডেমো
                </button>
                <button onClick={() => setDesignVariation(4)} className="btn btn-outline" style={{ fontWeight: 700 }}>
                  <I.satellite size={14} /> টাইমলাইন টেস্ট করুন
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- DESIGN VARIATION 3: MINIMALIST CIVIC-TECH PORTAL --- */}
      {designVariation === 3 && (
        <section style={{ background: '#ffffff', borderRadius: 24, border: '1px solid var(--ink-200)', padding: '36px 20px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            {/* Official Crest */}
            <div style={{ width: 68, height: 68, margin: '0 auto 8px auto' }}>
              <img src="/assets/bd-govt-emblem.png" alt="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: 1 }}>
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • ভূমি প্রশাসন
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 10px 0', color: '#0f172a' }}>
              জাতীয় ক্যাডাস্ট্রাল উপগ্রহ ও রেকর্ড বাতায়ন
            </h2>
            <div style={{ width: 60, height: 3, background: '#dc2626', margin: '0 auto 16px auto', borderRadius: 2 }} />
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-600)', maxWidth: 600, margin: '0 auto 28px auto', lineHeight: 1.6 }}>
              মৌজা ম্যাপের ডিজিটাল দাগ, নদীগর্ভের ভাঙন পরিমাপ, আদালতের স্বত্ব মামলার স্থিতি এবং খতিয়ানের নির্ভুলতা যাচাইয়ের জন্য একটি সমন্বিত নাগরিক তথ্যপ্রযুক্তি নেটওয়ার্ক।
            </p>

            {/* Circular Radar Scope */}
            <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 30px auto', borderRadius: '50%', padding: 6, background: 'linear-gradient(135deg, #15803d 0%, #3b82f6 50%, #dc2626 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '3px solid #fff' }}>
                <img src="https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=600&q=80" alt="বাঙালি পলল" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(220, 38, 38, 0.7)' }} />
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(220, 38, 38, 0.7)' }} />
              </div>
            </div>

            {/* 5 Structured Module Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, textAlign: 'left' }}>
              {[
                { mod: 'মডিউল ০১', title: 'উপগ্রহ শিকস্তি-পয়স্তি', desc: 'নদীগর্ভে নিমজ্জিত ভূমির পরিমাপ ও নতুন চর জেগে ওঠার উপগ্রহিক হিসেব।', stat: '৬৪.২০ শতক নদীগর্ভে', page: 'shikostiPoyosti' as PageKey },
                { mod: 'মডিউল ০২', title: 'সাব-রেজিস্ট্রি লক', desc: 'আদালতি স্থগিতাদেশ থাকায় জমি রেজিস্ট্রি সফটওয়্যার থেকে স্থায়ী প্রত্যাখ্যান।', stat: 'মামলা: সিভিল স্যুট ৪০২/২৬', page: 'litigation' as PageKey, danger: true },
                { mod: 'মডিউল ০৩', title: 'চেইন-অব-টাইটেল', desc: 'সিএস, এসএ, আরএস ও বিএস খতিয়ানের যোগফল ও হস্তান্তর সামঞ্জস্য।', stat: 'অডিট: অতিরিক্ত বিক্রয় চেষ্টা', page: 'ownershipChain' as PageKey },
                { mod: 'মডিউল ০৪', title: 'খাসজমি শিল্ড', desc: 'নদী অববাহিকার বাফার বা খাস সম্পত্তিতে মাটি ভরাট ও অবৈধ দখল নজরদারি।', stat: 'স্ট্যাটাস: ১-নং খাস খতিয়ান', page: 'khas' as PageKey },
                { mod: 'মডিউল ০৫', title: 'স্মার্ট ব্যাংক লিয়েন', desc: 'ব্যাংক মর্টগেজ দায় ও সাধারণ ক্রেতার জন্য ১০০ পয়েন্টের ঝুঁকি সূচক।', stat: 'দায়: অগ্রণী ব্যাংক ২৫ লাখ', page: 'lien' as PageKey },
              ].map((m, i) => (
                <div
                  key={i}
                  onClick={() => onNavigate(m.page)}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    background: m.danger ? '#fef2f2' : '#f8fafc',
                    border: `1px solid ${m.danger ? '#fecaca' : 'var(--ink-200)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 800, color: m.danger ? '#dc2626' : '#15803d' }}>{m.mod}</span>
                  <h4 style={{ margin: '4px 0 6px 0', fontSize: '0.85rem', fontWeight: 700 }}>{m.title}</h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.74rem', color: 'var(--ink-500)' }}>{m.desc}</p>
                  <div style={{ background: '#ffffff', padding: '4px 8px', borderRadius: 6, fontSize: '10px', fontWeight: 700, border: '1px solid var(--ink-200)', color: m.danger ? '#dc2626' : '#0f172a' }}>
                    {m.stat}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- DESIGN VARIATION 4: RIVERINE LAND & SHIKOSTI-POYOSTI SPECIALIZED HERO --- */}
      {designVariation === 4 && (
        <section style={{ background: '#ffffff', borderRadius: 24, border: '1px solid var(--ink-200)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          {/* Header & Year Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--ink-200)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                <I.river size={14} /> মডিউল ০১: টেম্পোরাল স্যাটেলাইট ও নদীভাঙন রাডার
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 2px 0' }}>
                মেঘনা নদী অববাহিকা ও চিরারচর মৌজার <span style={{ color: '#dc2626' }}>শিকস্তি-পয়স্তি অ্যানালাইসিস</span>
              </h2>
              <div className="muted text-xs">২০২২ সাল থেকে ২০২৬ সাল পর্যন্ত দাগ ৮৮৮৮৮১-এর পরিবর্তনশীল অবস্থা স্লাইডার দিয়ে যাচাই করুন।</div>
            </div>

            {/* Slider Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-600)', paddingLeft: 6 }}>উপগ্রহ সময়কাল:</span>
              {[2022, 2024, 2026].map(yr => (
                <button
                  key={yr}
                  onClick={() => setTemporalYear(yr as any)}
                  className={`btn btn-sm ${temporalYear === yr ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700, background: temporalYear === yr ? '#dc2626' : undefined, borderColor: temporalYear === yr ? '#dc2626' : undefined }}
                >
                  {yr === 2022 ? '২০২২ (শুষ্ক)' : yr === 2024 ? '২০২৪ (ভাঙন)' : '২০২৬ (চর ও শিকস্তি)'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {/* Left: River Cadastral SVG Simulation */}
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--ink-200)', background: '#0f172a', position: 'relative', height: 320 }}>
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80" alt="নদী ও চর" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 50, 22, 0.45)', mixBlendMode: 'multiply' }} />

              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 20 }} viewBox="0 0 600 350">
                <path d="M 0,60 Q 200,120 400,70 T 600,110 L 600,0 L 0,0 Z" fill="rgba(14, 165, 233, 0.5)" stroke="#38bdf8" strokeWidth="2" />
                <text x="30" y="45" fill="#bae6fd" fontSize="12" fontWeight="bold">মেঘনা নদীর সক্রিয় চ্যানেল</text>

                <polygon points="50,140 160,130 150,260 40,250" fill="rgba(34, 197, 94, 0.35)" stroke="#22c55e" strokeWidth="2" />
                <text x="65" y="195" fill="#ffffff" fontSize="11" fontWeight="bold">দাগ ৮৮৮৮৮০ (স্থায়ী)</text>

                {/* Plot 888881 */}
                <polygon points="180,180 320,170 310,290 170,280" fill="rgba(220, 38, 38, 0.55)" stroke="#dc2626" strokeWidth="3" />
                <text x="195" y="235" fill="#ffffff" fontSize="11" fontWeight="bold">
                  দাগ ৮৮৮৮৮১: {temporalYear === 2022 ? '১০০.০০ শতক শুষ্ক' : '৩৫.৮০ শতক শুষ্ক'}
                </text>

                {/* Submerged Shikosti Area (visible in 2024 & 2026) */}
                {temporalYear !== 2022 && (
                  <>
                    <polygon points="190,95 330,85 320,170 180,180" fill="rgba(239, 68, 68, 0.8)" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                    <text x="200" y="135" fill="#fef2f2" fontSize="10" fontWeight="bold">৬৪.২ শতক শিকস্তি (নদীগর্ভে)</text>
                  </>
                )}

                {/* Emerging Poyosti Char (visible in 2026) */}
                {temporalYear === 2026 && (
                  <g>
                    <polygon points="360,60 560,40 550,130 350,120" fill="rgba(16, 185, 129, 0.6)" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
                    <text x="380" y="85" fill="#ffffff" fontSize="11" fontWeight="bold">নতুন পয়স্তি চর • ৪০ একর</text>
                    <text x="380" y="102" fill="#d1fae5" fontSize="9">প্রস্তাবিত ১-নং খাস খতিয়ানভুক্ত</text>
                  </g>
                )}
              </svg>

              <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.92)', padding: '4px 10px', borderRadius: 8, fontSize: '10px', fontWeight: 700 }}>
                {temporalYear === 2022 ? '২০২২: ১০০% অক্ষত কৃষি জমি' : temporalYear === 2024 ? '২০২৪: ৬৫% নদীগর্ভে বিলীন' : '২০২৬: শিকস্তি + ৪০ একর পয়স্তি চর'}
              </div>
            </div>

            {/* Right: Riverine Explanation & Action */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: 14 }}>
                <div style={{ color: '#991b1b', fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
                  ⚠️ শিকস্তি-পয়স্তি আইন ১৯৫০ বিশ্লেষণ
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#7f1d1d', lineHeight: 1.5 }}>
                  দাগ ৮৮৮৮৮১-এর মোট ১০০ শতকের মধ্যে ৬৪.২০ শতক জমি বর্তমানে নদীগর্ভে নিমজ্জিত থাকায় সাব-রেজিস্ট্রিতে এটি হস্তান্তর অযোগ্য। একই সাথে উত্তর-পূর্বে জেগে ওঠা ৪০ একর চরের ১-নং খাস খতিয়ানভুক্তির প্রশাসনিক প্রস্তাবনা প্রক্রিয়াধীন।
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '11px' }}>
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid var(--ink-200)' }}>
                  <b>NDWI সূচক:</b> -০.৪২ (জলমগ্নতা নিশ্চিত)
                </div>
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid var(--ink-200)' }}>
                  <b>স্বত্ব সংরক্ষণ:</b> ৩০ বছর অগ্রাধিকার বহাল
                </div>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="btn btn-primary"
                style={{ width: '100%', background: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
              >
                <I.document size={14} /> অফিশিয়াল নদীভাঙন সনদ প্রিভিউ
              </button>
            </div>
          </div>
        </section>
      )}

      {/* --- DESIGN VARIATION 5: CITIZEN VERIFICATION & TRUST DASHBOARD --- */}
      {designVariation === 5 && (
        <section style={{ background: '#ffffff', borderRadius: 24, border: '1px solid var(--ink-200)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          {/* Header Banner */}
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '24px 28px', color: '#ffffff', marginBottom: 20 }}>
            <img
              src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1600&q=80"
              alt="বাংলার কৃষিজমি"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.2)' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6,78,59,0.92) 0%, rgba(6,78,59,0.6) 60%, transparent 100%)' }} />
            <div style={{ position: 'relative', zIndex: 10 }}>
              <span className="badge" style={{ background: '#dc2626', color: '#fff', fontWeight: 700, marginBottom: 6 }}>
                🛡️ সিটিজেন পোর্টাল: জমি কেনার আগে যাচাই করুন
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0' }}>
                দাগ নম্বর ৮৮৮৮৮১: <span style={{ color: '#fca5a5' }}>নিরাপত্তা ও দায়মুক্তি ফলাফল</span>
              </h2>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>চিরারচর মৌজা, চাঁদপুর সদর। এই জমির ওপর সক্রিয় দেওয়ানি নিষেধাজ্ঞা এবং নদীভাঙন বিদ্যমান।</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>
            {/* Plot Health Score Gauge (38/100) */}
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 18, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase' }}>প্লট হেলথ স্কোর (Health Score)</div>
              <div style={{ position: 'relative', width: 140, height: 140, margin: '14px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#fee2e2" strokeWidth="12" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#dc2626" strokeWidth="12" strokeDasharray="264" strokeDashoffset="163" strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626' }}>৩৮</div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-500)' }}>১০০ এর মধ্যে</div>
                </div>
              </div>
              <span className="chip" style={{ background: '#dc2626', color: '#fff', fontWeight: 700 }}>
                উচ্চ ঝুঁকি • রেজিস্ট্রেশন ব্লকড
              </span>
              <p style={{ margin: '10px 0 0 0', fontSize: '0.78rem', color: 'var(--ink-600)' }}>
                মামলা, অঘোষিত বন্ধকী ঋণ এবং নদীভাঙনের কারণে এই প্লটে লেনদেন করা ঝুঁকিপূর্ণ।
              </p>
            </div>

            {/* 5-Point Deductive Breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid var(--ink-200)', borderRadius: 18, padding: 18 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800 }}>ঝুঁকি নিরূপণের বিস্তারিত মানদণ্ড</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div><b>আদালতের নিষেধাজ্ঞা (Litigation):</b> <span className="muted">দেওয়ানি মামলা ৪০২/২০২৬</span></div>
                  <b style={{ color: '#dc2626' }}>০ / ২৫</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div><b>উপগ্রহ নদীভাঙন (Temporal GIS):</b> <span className="muted">৬৪.২% জমি মেঘনা নদীগর্ভে</span></div>
                  <b style={{ color: '#dc2626' }}>৬ / ২০</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div><b>মালিকানা ধারাবাহিকতা (Chain):</b> <span className="muted">দলিল ৪১০২ এ অংশের গড়মিল</span></div>
                  <b style={{ color: '#d97706' }}>১৮ / ৩০</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div><b>ব্যাংক বন্ধক (Mortgage Lien):</b> <span className="muted">অগ্রণী ব্যাংকে ২৫ লাখ দায়বদ্ধ</span></div>
                  <b style={{ color: '#dc2626' }}>৫ / ১৫</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div><b>সরকারি খাসজমি কনফ্লিক্ট:</b> <span className="muted">মূল দাগে সরাসরি দখল নেই</span></div>
                  <b style={{ color: '#15803d' }}>৯ / ১০</b>
                </div>
              </div>
            </div>

            {/* Certificate Snapshot Card */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--ink-200)', borderRadius: 18, padding: 18, textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 8px auto' }}>
                <img src="/assets/bd-govt-emblem.png" alt="জাতীয় প্রতীক" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800 }}>দায়মুক্তি ও স্বত্ব যাচাই প্রতিবেদন</div>
              <div className="muted text-xs">রেফারেন্স: ২০২৬/৮৮৮৮৮১/ENC</div>
              <div style={{ width: 90, height: 90, margin: '12px auto', background: '#fff', border: '1px solid var(--ink-300)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.qr size={60} />
              </div>
              <button onClick={() => setShowReportModal(true)} className="btn btn-primary" style={{ width: '100%', background: '#0f172a', fontWeight: 700 }}>
                <I.download size={14} /> সম্পূর্ণ PDF প্রিভিউ দেখুন
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 3. OPERATIONAL KPI INDICATORS & TELEMETRY                      */}
      {/* ============================================================== */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
            {lang === 'bn' ? 'সারাদেশের লাইভ অপারেশনাল পরিসংখ্যান' : 'Live National Operational Metrics'}
          </h3>
          <span className="muted text-xs">{lang === 'bn' ? '৬৪টি জেলা থেকে লাইভ ডেটা ফিড' : 'Live data feeds from 64 districts'}</span>
        </div>

        <div className="grid grid-5 mb-16">
          {kpis.map(k => (
            <div key={k.key} className={`kpi k-${k.kind}`}>
              <div className="kpi__label">{t(k.labelKey)}</div>
              <div className="kpi__value">{k.value.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</div>
              <div className={`kpi__delta ${k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : ''}`}>
                {k.delta > 0 ? <I.trendUp size={12} /> : k.delta < 0 ? <I.trendDown size={12} /> : <I.dot size={12} />}
                {k.delta > 0 ? '+' : ''}{k.delta}% {k.delta === 0 ? t('kpi.delta.same') : k.delta > 0 ? t('kpi.delta.up') : t('kpi.delta.down')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. REAL-TIME MAP & RECENT INCIDENTS                           */}
      {/* ============================================================== */}
      <div className="grid grid-3 mb-16" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
        {/* Map preview */}
        <div className="card" style={{ padding: 14 }}>
          <div className="card__title">
            <h3>{t('dashboard.riskMap')}</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('temporalGis')}>
              {t('common.view')} <I.arrowRight size={14} />
            </button>
          </div>
          <MapView plots={plots} onSelect={id => onSelectPlot(id)} height={340} showLegend={true} />
        </div>

        {/* Active alerts */}
        <div className="card">
          <div className="card__title">
            <h3>{t('dashboard.recentAlerts')}</h3>
            <span className="badge red"><span className="dot" /> {recentAlerts.length}</span>
          </div>
          <div className="flow-list">
            {recentAlerts.map(a => (
              <div
                key={a.id}
                onClick={() => { onSelectPlot(a.plot); onNavigate('encroachment'); }}
                className="flow-item"
                style={{ cursor: 'pointer' }}
              >
                <div className="flow-icon" style={{ background: a.kind === 'lit' ? '#7c3aed22' : a.kind === 'fraud' ? '#ef444422' : '#f59e0b22', color: a.kind === 'lit' ? '#7c3aed' : a.kind === 'fraud' ? '#dc2626' : '#d97706' }}>
                  {a.kind === 'lit' ? <I.lock size={14} /> : a.kind === 'fraud' ? <I.fingerprint size={14} /> : <I.alert size={14} />}
                </div>
                <div className="flow-body">
                  <div className="flow-title">{a.title}</div>
                  <div className="flow-meta">
                    <span className="mono">{a.plot}</span> • <span>{a.date}</span>
                  </div>
                </div>
                <span className={`chip ${a.severity === 'high' ? 'danger' : 'warn'}`}>
                  {a.severity ? t(`enc.level.${a.severity}`) : t('enc.level.high')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Field inspections */}
        <div className="card">
          <div className="card__title">
            <h3>{t('dashboard.inspections')}</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('fieldInspection')}>
              {t('common.view')} <I.arrowRight size={14} />
            </button>
          </div>
          <div className="flow-list">
            {recentInspections.map(ins => (
              <div
                key={ins.id}
                onClick={() => { onSelectPlot(ins.plotId); onNavigate('fieldInspection'); }}
                className="flow-item"
                style={{ cursor: 'pointer' }}
              >
                <div className="flow-icon" style={{ background: ins.status === 'completed' ? '#10b98122' : '#f59e0b22', color: ins.status === 'completed' ? '#059669' : '#d97706' }}>
                  {ins.status === 'completed' ? <I.check size={14} /> : <I.pin size={14} />}
                </div>
                <div className="flow-body">
                  <div className="flow-title">{ins.inspector}</div>
                  <div className="flow-meta">
                    <span className="mono">{ins.plotId}</span> • <span>{ins.completedOn || ins.dueDate}</span>
                  </div>
                </div>
                <StatusBadge status={ins.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ADVANCED LAND GOVERNANCE MODULES (PROD-READY SUITE)             */}
      {/* ============================================================== */}
      <div className="card mb-16" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #cbd5e1' }}>
        <div className="card__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <I.shield size={22} style={{ color: 'var(--primary-700)' }} />
            <div>
              <h3 style={{ margin: 0 }}>
                {lang === 'bn' ? 'উন্নত ভূমি সুশাসন ও ডিজিটাল নিরাপত্তা ফ্রেমওয়ার্ক' : 'Advanced Land Governance & Transparency Modules'}
              </h3>
              <small className="muted">
                {lang === 'bn' ? 'আইনসম্মত রাজস্ব স্বচ্ছতা, খাসজমি রক্ষা ও ক্রিপ্টোগ্রাফিক সুরক্ষা স্যুট' : 'Statutory revenue transparency, public asset defense & SHA-256 cryptographic audit'}
              </small>
            </div>
          </div>
          <span className="badge badge-purple">{lang === 'bn' ? 'নতুন সংযুক্ত ৫টি মডিউল' : '5 New Modules'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
          {/* Module 1 */}
          <div
            onClick={() => onNavigate('mouzaValuation')}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: 14,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div className="row justify-between mb-4">
              <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>মডিউল ০১</span>
              <I.scale size={16} style={{ color: 'var(--primary-700)' }} />
            </div>
            <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: 4 }}>
              {lang === 'bn' ? 'স্মার্ট মৌজা রেট ইঞ্জিন' : 'Smart Mouza Valuation'}
            </strong>
            <p className="muted text-xs" style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
              {lang === 'bn' ? 'সরকারি সর্বনিম্ন মৌজা রেট যাচাই, রাজস্ব ফাঁকি সনাক্তকরণ ও দলিলের পূর্ণাঙ্গ ফি প্রাক্কলন।' : 'Statutory minimum rate validation & fee estimation.'}
            </p>
            <span className="text-xs" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
              {lang === 'bn' ? 'ক্যালকুলেটর খুলুন →' : 'Launch Engine →'}
            </span>
          </div>

          {/* Module 2 */}
          <div
            onClick={() => onNavigate('encroachment')}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: 14,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div className="row justify-between mb-4">
              <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>মডিউল ০২</span>
              <I.camera size={16} style={{ color: 'var(--danger-600)' }} />
            </div>
            <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: 4 }}>
              {lang === 'bn' ? 'খাসজমি রক্ষা ও রিপোর্ট' : 'Encroachment Alert'}
            </strong>
            <p className="muted text-xs" style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
              {lang === 'bn' ? 'নাগরিকদের জিপিএস ও ছবি সহ বেনামী অভিযোগ দাখিল এবং সরকারি সীমানা স্থানিক যাচাই।' : 'Crowdsourced reporting & spatial screening.'}
            </p>
            <span className="text-xs" style={{ color: 'var(--danger-700)', fontWeight: 600 }}>
              {lang === 'bn' ? 'নাগরিক পোর্টাল →' : 'Citizen Portal →'}
            </span>
          </div>

          {/* Module 3 */}
          <div
            onClick={() => onNavigate('auditLedger')}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: 14,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div className="row justify-between mb-4">
              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>মডিউল ০৩</span>
              <I.fingerprint size={16} style={{ color: 'var(--success-700)' }} />
            </div>
            <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: 4 }}>
              {lang === 'bn' ? 'ক্রিপ্টোগ্রাফিক অডিট লেজার' : 'Cryptographic Ledger'}
            </strong>
            <p className="muted text-xs" style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
              {lang === 'bn' ? 'কর্মকর্তাদের সকল সিদ্ধান্তের অপরিবর্তনীয় SHA-256 হ্যাশ-চেইন ও লাইভ টেম্পার ডিটেকশন।' : 'Tamper-evident SHA-256 action chain.'}
            </p>
            <span className="text-xs" style={{ color: 'var(--success-700)', fontWeight: 600 }}>
              {lang === 'bn' ? 'ব্লক চেইন এক্সপ্লোরার →' : 'Block Explorer →'}
            </span>
          </div>

          {/* Module 4 */}
          <div
            onClick={() => onNavigate('laCompensation')}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: 14,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div className="row justify-between mb-4">
              <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>মডিউল ০৪</span>
              <I.trendUp size={16} style={{ color: '#7c3aed' }} />
            </div>
            <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: 4 }}>
              {lang === 'bn' ? 'অধিগ্রহণ ক্ষতিপূরণ (LA)' : 'LA Compensation'}
            </strong>
            <p className="muted text-xs" style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
              {lang === 'bn' ? 'আইন ২০১৭ অনুযায়ী ২০০%/৩০০% সংবিধিবদ্ধ গুণক ও সরাসরি ব্যাংক EFT বিতরণ।' : '2017 Act statutory 200%/300% & G2P EFT.'}
            </p>
            <span className="text-xs" style={{ color: '#7c3aed', fontWeight: 600 }}>
              {lang === 'bn' ? 'রোয়েদাদ হিসাব →' : 'Award Calculator →'}
            </span>
          </div>

          {/* Module 5 */}
          <div
            onClick={() => onNavigate('poaSentinel')}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: 14,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div className="row justify-between mb-4">
              <span className="badge badge-warn" style={{ fontSize: '0.72rem' }}>মডিউল ০৫</span>
              <I.lock size={16} style={{ color: 'var(--warn-700)' }} />
            </div>
            <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: 4 }}>
              {lang === 'bn' ? 'আমমোক্তারনামা সেন্টিনেল' : 'PoA Sentinel'}
            </strong>
            <p className="muted text-xs" style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
              {lang === 'bn' ? 'আমমোক্তারনামা আইন ২০১২ রেজিস্ট্রি, লেনদেন বৈধতা গেট ও তাৎক্ষণিক প্রত্যাহার।' : 'The Power of Attorney Act 2012 gate.'}
            </p>
            <span className="text-xs" style={{ color: 'var(--warn-700)', fontWeight: 600 }}>
              {lang === 'bn' ? 'রেজিস্ট্রি ও গেট →' : 'Registry & Gate →'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: CASCADING QUICK SEARCH MODAL (Image & HTML Feature)   */}
      {/* ============================================================== */}
      {showQuickSearch && (
        <Modal
          open={showQuickSearch}
          onClose={() => setShowQuickSearch(false)}
          title={`📍 ${lang === 'bn' ? 'ক্যাডাস্ট্রাল মৌজা ও প্লট অনুসন্ধান' : 'Cadastral Mouza & Plot Search'}`}
          size="md"
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowQuickSearch(false)}>
                {t('common.close')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleQuickSearchSubmit}
                style={{
                  background: searchRole === 'officer' ? '#0f172a' : '#047857',
                  borderColor: searchRole === 'officer' ? '#0f172a' : '#047857',
                  fontWeight: 700
                }}
              >
                <I.search size={14} /> {searchRole === 'officer' ? (lang === 'bn' ? 'কর্মকর্তা অডিটে যান' : 'Go to Officer Audit') : (lang === 'bn' ? 'নাগরিক যাচাই শুরু করুন' : 'Start Citizen Verification')}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Dedicated Role Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10, gap: 6 }}>
              <button
                type="button"
                onClick={() => setSearchRole('citizen')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: searchRole === 'citizen' ? '#047857' : 'transparent',
                  color: searchRole === 'citizen' ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: '0.82rem',
                }}
              >
                <I.user size={14} />
                {lang === 'bn' ? 'সাধারণ নাগরিক অনুসন্ধান' : 'Citizen Search'}
              </button>
              <button
                type="button"
                onClick={() => setSearchRole('officer')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: searchRole === 'officer' ? '#0f172a' : 'transparent',
                  color: searchRole === 'officer' ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: '0.82rem',
                }}
              >
                <I.shield size={14} />
                {lang === 'bn' ? 'ভূমি কর্মকর্তা অডিট' : 'Land Officer Audit'}
              </button>
            </div>

            <p className="muted" style={{ fontSize: '0.82rem', margin: 0 }}>
              {searchRole === 'officer'
                ? (lang === 'bn' ? 'সহকারী কমিশনার (ভূমি) ও কানুনগোদের জন্য গভীর আইনি অডিট, ৪-স্তরীয় খতিয়ান বংশলতিকা ও সাব-রেজিস্ট্রি লক প্যানেল।' : 'Deep investigation, 4-tier khatian archival lineage & litigation lock controls for AC Land & Kanungos.')
                : (lang === 'bn' ? 'সাধারণ নাগরিকদের জন্য জমি ক্রয়যোগ্যতা ও আইনি ঝুঁকিমুক্ত কিনা তা সরাসরি যাচাই করার সহজ পোর্টাল।' : 'Check if land is safe and eligible for purchase before buying.')}
            </p>

            <div className="grid grid-2" style={{ gap: 10, fontSize: '0.8rem' }}>
              <div>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>বিভাগ (Division)</label>
                <select value={selDiv} onChange={e => handleQuickDivChange(e.target.value)} className="select" style={{ width: '100%' }}>
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>{lang === 'bn' ? d.bn : d.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>জেলা (District)</label>
                <select value={selDist} onChange={e => handleQuickDistChange(e.target.value)} className="select" style={{ width: '100%' }}>
                  {availableQuickDists.map(d => (
                    <option key={d.id} value={d.id}>{lang === 'bn' ? d.bn : d.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>উপজেলা (Upazila)</label>
                <select value={selUpazila} onChange={e => handleQuickUpazilaChange(e.target.value)} className="select" style={{ width: '100%' }}>
                  {availableQuickUpazilas.map(u => (
                    <option key={u.id} value={u.id}>{lang === 'bn' ? u.bn : u.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>মৌজা ও জে.এল (Mouza)</label>
                <select value={selMouza} onChange={e => setSelMouza(e.target.value)} className="select" style={{ width: '100%' }}>
                  {availableQuickMouzas.map(m => (
                    <option key={m.id} value={m.id}>{lang === 'bn' ? m.bn : m.en}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Sector Zoning Summary Card */}
              <div style={{ gridColumn: 'span 2', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: '0.8rem' }}>
                <div style={{ color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🧭</span>
                  <span>{lang === 'bn' ? 'ভূমি জোনিং শ্রেণি' : 'Land Zoning Category'}: <strong>{lang === 'bn' ? quickZoning.zoningCategoryBn : quickZoning.zoningCategoryEn}</strong></span>
                </div>
                <div style={{ color: '#15803d', fontSize: '0.74rem', marginTop: 3, lineHeight: 1.4 }}>
                  {lang === 'bn' ? quickZoning.descriptionBn : quickZoning.descriptionEn}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>দাগ / প্লট নম্বর (Plot Number)</label>
                <input
                  type="text"
                  value={plotInput}
                  onChange={e => setPlotInput(e.target.value)}
                  className="input"
                  style={{ width: '100%', borderColor: '#dc2626', color: '#dc2626', fontWeight: 800 }}
                  placeholder="দাগ নম্বর দিন"
                />
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10, fontSize: '0.78rem', color: '#78350f' }}>
              💡 <b>ডেমো নোট:</b> দাগ <strong>৮৮৮৮৮১</strong> নির্বাচন করলে সক্রিয় আদালত ইনজাংশন, নদীভাঙন (৬৪.২% শিকস্তি), এবং ব্যাংক মর্টগেজ লিয়েন সম্বলিত লাইভ লক ফলাফল প্রদর্শিত হবে।
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: OFFICIAL LAND ENCUMBRANCE REPORT (Image & HTML Match) */}
      {/* ============================================================== */}
      {showReportModal && (
        <Modal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={`📄 ${lang === 'bn' ? 'ভূমি মালিকানা ও দায়মুক্তি যাচাইকরণ প্রতিবেদন' : 'Official Land Encumbrance Report'}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
                {t('common.close')}
              </button>
              <button className="btn btn-primary" onClick={() => window.print()} style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}>
                <I.print size={14} /> {lang === 'bn' ? 'প্রিন্ট / সেভ PDF' : 'Print / Save PDF'}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header with Official Given Emblem Logo */}
            <div style={{ textAlign: 'center', paddingBottom: 12, borderBottom: '1px solid var(--ink-200)' }}>
              <div style={{ width: 72, height: 72, margin: '0 auto 6px auto' }}>
                <img src="/assets/bd-govt-emblem.png" alt="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: 800 }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h3>
              <div style={{ fontSize: '0.85rem', color: '#0a4d24', fontWeight: 800 }}>ভূমি মন্ত্রণালয় • উপজেলা ভূমি অফিস ও সাব-রেজিস্ট্রি কার্যালয়</div>
              <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800, marginTop: 6 }}>
                ভূমি মালিকানা ও দায়মুক্ত যাচাইকরণ প্রতিবেদন (অফিশিয়াল সার্টিফিকেট)
              </span>
            </div>

            {/* Metadata Rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.82rem', padding: '10px 0', borderBottom: '1px solid var(--ink-200)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><b>প্রতিবেদন নং:</b> ২০২৬/৮৮৮৮৮১/ENC</div>
                <div><b>মৌজা ও জে.এল:</b> মৌজা চিরারচর (জে.এল নং ৪২)</div>
                <div><b>উপজেলা ও জেলা:</b> চাঁদপুর সদর, চাঁদপুর</div>
                <div><b>রেকর্ডীয় মালিক:</b> মোঃ রফিকুল হাসান</div>
                <div><b>ভূমি জোনিং শ্রেণি:</b> <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.72rem', fontWeight: 600 }}>🧭 মেঘনা মোহনা ও নদীভাঙন সক্রিয় অঞ্চল</span></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><b>দাগ নম্বর:</b> <span style={{ color: '#dc2626', fontWeight: 800 }}>৮৮৮৮৮১</span></div>
                <div><b>রেকর্ডীয় জমি:</b> ১০০.০০ শতক (বর্তমান শুষ্ক: ৩৫.৮০ শতক)</div>
                <div><b>শিকস্তি ভাঙন:</b> ৬৪.২০ শতক (নদীগর্ভে বিলীন)</div>
                <div><b>সাব-রেজিস্ট্রি স্ট্যাটাস:</b> <span style={{ color: '#dc2626', fontWeight: 800 }}>🔒 লকড / হস্তান্তর নিষিদ্ধ</span></div>
                <div><b>মাস্টারপ্ল্যান কোড:</b> <span className="mono" style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>BWDB-MEGHNA-2024-CP-42</span></div>
              </div>
            </div>

            {/* Transactions & Audit Table */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 800 }}>হস্তান্তর ও দায়মুক্তি বিবরণী (Audit Summary)</h4>
              <div className="tbl-wrap">
                <table className="tbl" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>ক্র.</th>
                      <th>রেকর্ড / দলিল</th>
                      <th>তারিখ</th>
                      <th>বিবরণ ও পক্ষসমূহ</th>
                      <th>স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>১</td>
                      <td><b>বি.এস. খতিয়ান ৯০৪২</b></td>
                      <td>১২/০৪/২০১৬</td>
                      <td>স্বত্বাধিকারী: মোঃ রফিকুল হাসান</td>
                      <td><span className="report-chip green">বৈধ রেকর্ড</span></td>
                    </tr>
                    <tr style={{ background: '#fef2f2' }}>
                      <td>২</td>
                      <td><b style={{ color: '#dc2626' }}>সাফ-কবলা ৪১০২</b></td>
                      <td>১৪/০৫/২০০৪</td>
                      <td>মফিজুল ইসলাম হতে রফিকুল হাসান</td>
                      <td><span className="report-chip red">চেইন অসঙ্গতি (Broken)</span></td>
                    </tr>
                    <tr style={{ background: '#fef2f2' }}>
                      <td>৩</td>
                      <td><b style={{ color: '#dc2626' }}>মর্টগেজ দলিল ৮৮২১</b></td>
                      <td>১০/১১/২০২১</td>
                      <td>অগ্রণী ব্যাংক পিএলসি (২৫ লক্ষ টাকা দায়)</td>
                      <td><span className="report-chip red">সক্রিয় ব্যাংক লিয়েন</span></td>
                    </tr>
                    <tr style={{ background: '#fef2f2' }}>
                      <td>৪</td>
                      <td><b style={{ color: '#dc2626' }}>দেওয়ানি মামলা ৪০২/২৬</b></td>
                      <td>১২/০২/২০২৬</td>
                      <td>সিনিয়র সহকারী জজ আদালত (বণ্টন মোকদ্দমা)</td>
                      <td><span className="report-chip red">সাব-রেজিস্ট্রি লকড</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seal & QR Verification */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTop: '1px solid var(--ink-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid #1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a' }}>
                  <I.emblem size={26} />
                </div>
                <div style={{ fontSize: '0.78rem' }}>
                  <b>সহকারী কমিশনার (ভূমি) এর ডিজিটাল সিলমোহর</b>
                  <div className="muted text-xs">ভ্যালিডেশন আইডি: 2026-10-18:888881</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 44, height: 44, background: '#0f172a', color: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I.qr size={26} />
                </div>
                <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 800 }}>
                  ভেরিফাইড ডিজিটাল রেকর্ড
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: LAND ZONING SUMMARY (Direct Top-Level Access)         */}
      {/* ============================================================== */}
      {showZoningQuickModal && (
        <Modal
          open={showZoningQuickModal}
          onClose={() => setShowZoningQuickModal(false)}
          title={`🧭 ${t('cadastral.zoningTitle')} — ${lang === 'bn' ? quickZoning.mouzaBn : quickZoning.mouzaEn}`}
          size="md"
          footer={
            <button className="btn btn-primary" onClick={() => setShowZoningQuickModal(false)}>
              {t('common.close')}
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.72rem', color: '#64748b' }}>{t('common.division')}</label>
                <select value={selDiv} onChange={e => handleQuickDivChange(e.target.value)} className="select" style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}>
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>{lang === 'bn' ? d.bn : d.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.72rem', color: '#64748b' }}>{t('common.district')}</label>
                <select value={selDist} onChange={e => handleQuickDistChange(e.target.value)} className="select" style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}>
                  {availableQuickDists.map(d => (
                    <option key={d.id} value={d.id}>{lang === 'bn' ? d.bn : d.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.72rem', color: '#64748b' }}>{t('common.thana')}</label>
                <select value={selUpazila} onChange={e => handleQuickUpazilaChange(e.target.value)} className="select" style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}>
                  {availableQuickUpazilas.map(u => (
                    <option key={u.id} value={u.id}>{lang === 'bn' ? u.bn : u.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.72rem', color: '#64748b' }}>{t('common.mouza')}</label>
                <select value={selMouza} onChange={e => setSelMouza(e.target.value)} className="select" style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}>
                  {availableQuickMouzas.map(m => (
                    <option key={m.id} value={m.id}>{lang === 'bn' ? m.bn : m.en}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ borderLeft: '4px solid #d97706', background: '#fffbeb', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: '0.74rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                {lang === 'bn' ? 'ভূমি জোনিং শ্রেণি (Official Land Zoning Category)' : 'Official Land Zoning Category'}
              </div>
              <h4 style={{ margin: '0 0 6px 0', color: '#b45309', fontSize: '1.05rem' }}>
                🧭 {lang === 'bn' ? quickZoning.zoningCategoryBn : quickZoning.zoningCategoryEn}
              </h4>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#78350f', lineHeight: 1.5 }}>
                {lang === 'bn' ? quickZoning.descriptionBn : quickZoning.descriptionEn}
              </p>
            </div>

            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <b>🛡️ {lang === 'bn' ? 'পরিবেশগত সংবেদনশীলতা' : 'Eco Sensitivity'}:</b>{' '}
                <span className="chip" style={{
                  background: quickZoning.ecoSensitivityLevel === 'critical' ? '#fee2e2' : quickZoning.ecoSensitivityLevel === 'high' ? '#ffedd5' : '#e0f2fe',
                  color: quickZoning.ecoSensitivityLevel === 'critical' ? '#b91c1c' : quickZoning.ecoSensitivityLevel === 'high' ? '#c2410c' : '#0369a1',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}>
                  {lang === 'bn' ? quickZoning.ecoSensitivityBn : quickZoning.ecoSensitivityEn}
                </span>
              </div>
              <div>
                <b>🌊 {lang === 'bn' ? 'প্লাবনভূমি সতর্কতা' : 'Floodplain Warning'}:</b>{' '}
                <span className="chip" style={{
                  background: quickZoning.floodWarningLevel === 'critical' ? '#fee2e2' : quickZoning.floodWarningLevel === 'high' ? '#ffedd5' : '#f1f5f9',
                  color: quickZoning.floodWarningLevel === 'critical' ? '#b91c1c' : quickZoning.floodWarningLevel === 'high' ? '#c2410c' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}>
                  {lang === 'bn' ? quickZoning.floodWarningBn : quickZoning.floodWarningEn}
                </span>
              </div>
              <div>
                <b>📜 {lang === 'bn' ? 'মাস্টারপ্ল্যান কোড' : 'Masterplan Code'}:</b>{' '}
                <span className="mono" style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  {quickZoning.masterplanCode}
                </span>
              </div>
              <div>
                <b>⚖️ {lang === 'bn' ? 'ব্যবহার বিধিনিষেধ ও আইন' : 'Zoning Regulations'}:</b>{' '}
                <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                  {lang === 'bn' ? quickZoning.regulationsBn : quickZoning.regulationsEn}
                </span>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.82rem', marginBottom: 4 }}>
                📊 {lang === 'bn' ? `${quickZoning.mouzaBn} মৌজার ভূমি ব্যবহারের সামগ্রিক অনুপাত` : `${quickZoning.mouzaEn} Land Classification Ratio`}
              </div>
              <div className="grid grid-2" style={{ gap: 8, fontSize: '0.78rem' }}>
                <div>🌾 {lang === 'bn' ? 'কৃষি জমি' : 'Agricultural'}: <b>{quickZoning.landUse.agriculturalPct}%</b> ({quickZoning.landUse.agriculturalPlots}টি দাগ)</div>
                <div>🏡 {lang === 'bn' ? 'আবাসিক' : 'Residential'}: <b>{quickZoning.landUse.residentialPct}%</b> ({quickZoning.landUse.residentialPlots}টি দাগ)</div>
                <div>🏛️ {lang === 'bn' ? 'খাস জমি/খাল' : 'Khas/Canal'}: <b>{quickZoning.landUse.khasCanalPct}%</b> ({quickZoning.landUse.khasCanalPlots}টি দাগ)</div>
                <div>🌊 {lang === 'bn' ? 'নদীভাঙন (শিকস্তি)' : 'Erosion'}: <b>{quickZoning.landUse.erosionWaterPct}%</b> ({quickZoning.landUse.erosionWaterPlots}টি দাগ)</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};