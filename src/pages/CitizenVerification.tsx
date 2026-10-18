import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { BilingualName, StatusBadge } from '../components/ui/StatusBadge';
import { districts, upazilasByDistrict, mouzasByUpazila, plots } from '../data/seed';
import { useToast } from '../components/ui/Toaster';
import { MapView } from '../components/ui/MapView';

export const CitizenVerification: React.FC<{ onSelectPlot: (id: string | null) => void }> = ({ onSelectPlot }) => {
  const { t, lang } = useI18n();
  const { show } = useToast();
  const [district, setDistrict] = useState<string>('');
  const [upazila, setUpazila] = useState<string>('');
  const [mouza, setMouza] = useState<string>('');
  const [search, setSearch] = useState('');
  const [citizen, setCitizen] = useState({ name: '', nid: '', phone: '' });

  const upazilas = district ? upazilasByDistrict[district] || [] : [];
  const mouzas = upazila ? mouzasByUpazila[upazila] || [] : [];

  const results = plots.filter(p => {
    if (district && p.district !== districts.find(d => d.id === district)?.en) return false;
    if (upazila && p.upazila !== upazilas.find(u => u.id === upazila)?.en) return false;
    if (mouza && p.mouza !== mouzas.find(m => m.id === mouza)?.en) return false;
    if (search && !(p.id.toLowerCase().includes(search.toLowerCase()) || p.dag.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.user size={14} /> {t('nav.modules')}</div>
          <h1>{t('cit.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('cit.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <span className="chip brand"><I.shield size={12} /> {t('cit.publicAccess')}</span>
        </div>
      </div>

      <div className="card mb-16">
        <h3 style={{ marginTop: 0 }}>{t('cit.search.title')}</h3>
        <div className="grid grid-4">
          <div className="field">
            <label>{t('cit.district')}</label>
            <select className="select" value={district} onChange={e => { setDistrict(e.target.value); setUpazila(''); setMouza(''); }}>
              <option value="">-- {t('common.all')} --</option>
              {districts.map(d => <option key={d.id} value={d.id}>{lang === 'en' ? d.en : d.bn}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('cit.upazila')}</label>
            <select className="select" value={upazila} onChange={e => { setUpazila(e.target.value); setMouza(''); }} disabled={!district}>
              <option value="">-- {t('common.all')} --</option>
              {upazilas.map(u => <option key={u.id} value={u.id}>{lang === 'en' ? u.en : u.bn}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('cit.mouza')}</label>
            <select className="select" value={mouza} onChange={e => setMouza(e.target.value)} disabled={!upazila}>
              <option value="">-- {t('common.all')} --</option>
              {mouzas.map(m => <option key={m.id} value={m.id}>{lang === 'en' ? m.en : m.bn}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('cit.search.placeholder')}</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="PLT-DHK-001" />
          </div>
        </div>
        <div className="row gap-8">
          <button className="btn btn-primary"><I.search size={16} /> {t('cit.search')}</button>
          <button className="btn btn-secondary" onClick={() => { setDistrict(''); setUpazila(''); setMouza(''); setSearch(''); }}>{t('common.reset')}</button>
        </div>
      </div>

      <div className="grid mb-16" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="card__title">
            <h3>{t('cit.results')}</h3>
            <span className="chip">{results.length}</span>
          </div>
          {results.length === 0 ? (
            <div className="empty-state">
              <I.search size={40} />
              <h4>{t('empty.plots')}</h4>
              <p>{t('empty.plots.hint')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflow: 'auto' }}>
              {results.map(p => (
                <button key={p.id}
                  onClick={() => onSelectPlot(p.id)}
                  className="card"
                  style={{ textAlign: 'left', cursor: 'pointer', padding: 12 }}>
                  <div className="row between mb-4">
                    <strong className="mono">{p.id} · {p.dag}</strong>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                  <div className="muted text-xs">
                    <BilingualName en={p.district} bn={p.districtBn} /> · <BilingualName en={p.upazila} bn={p.upazilaBn} /> · <BilingualName en={p.mouza} bn={p.mouzaBn} />
                  </div>
                  <div className="row between mt-8">
                    <span className="text-sm"><BilingualName en={p.owner.name} bn={p.owner.nameBn} /></span>
                    <span className="chip brand">{p.areaShotok} {t('units.shotok')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>{t('cit.qrCode')}</h3>
          <p className="muted text-sm">{t('cit.printable')}</p>
          <div style={{ display: 'grid', placeItems: 'center', padding: 16, background: 'var(--ink-50)', borderRadius: 12, marginBottom: 12 }}>
            <QrPreview text={`https://bhumi-radar.gov.bd/verify?plot=${results[0]?.id || 'PLT-DHK-001'}`} />
          </div>
          <div className="row gap-8 wrap">
            <button className="btn btn-primary"><I.send size={16} /> {t('cit.shareWith')}</button>
            <button className="btn btn-outline"><I.print size={16} /> {t('rep.print')}</button>
          </div>
          <div className="mt-16">
            <h4 style={{ marginBottom: 8 }}>{t('cit.requestVerification')}</h4>
            <div className="grid grid-2">
              <div className="field"><label>{t('cit.citizenName')}</label><input className="input" value={citizen.name} onChange={e => setCitizen({ ...citizen, name: e.target.value })} /></div>
              <div className="field"><label>{t('cit.citizenNid')}</label><input className="input" value={citizen.nid} onChange={e => setCitizen({ ...citizen, nid: e.target.value })} /></div>
              <div className="field" style={{ gridColumn: '1/-1' }}><label>{t('cit.citizenPhone')}</label><input className="input" value={citizen.phone} onChange={e => setCitizen({ ...citizen, phone: e.target.value })} /></div>
            </div>
            <button className="btn btn-primary" onClick={() => show('success', t('cit.requestSent'))}>
              <I.send size={16} /> {t('cit.requestVerification')}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>{t('map.layers')}</h3>
        <MapView plots={results.length ? results : plots.slice(0, 4)} onSelect={onSelectPlot} height={360} showLegend />
      </div>
    </div>
  );
};

// Inline QR-like preview (a 2D barcode visual; real QR is generated by Reports page using `qrcode` lib)
const QrPreview: React.FC<{ text: string }> = ({ text }) => {
  // Simple deterministic pattern from the text
  const grid: boolean[][] = [];
  const size = 21;
  for (let i = 0; i < size; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < size; j++) {
      let h = 0;
      for (let k = 0; k < text.length; k++) h = (h * 31 + text.charCodeAt(k)) >>> 0;
      row.push(((h ^ (i * size + j)) & 1) === 0);
    }
    grid.push(row);
  }
  // Force the three corner markers to look like a real QR
  const marker = (cx: number, cy: number) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const onBorder = i === 0 || i === 6 || j === 0 || j === 6;
      const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      grid[cy + i][cx + j] = onBorder || inner;
    }
  };
  marker(0, 0); marker(size - 7, 0); marker(0, size - 7);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="200" height="200" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      {grid.map((row, i) => row.map((on, j) => on ? <rect key={`${i}-${j}`} x={j} y={i} width="1" height="1" fill="#0f172a" /> : null))}
    </svg>
  );
};
