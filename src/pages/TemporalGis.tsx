import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { MapView } from '../components/ui/MapView';
import { Timeline } from '../components/ui/Timeline';
import { plots, temporalEvents } from '../data/seed';
import { BilingualName } from '../components/ui/StatusBadge';

export const TemporalGis: React.FC<{ onSelectPlot: (id: string | null) => void; selectedPlotId: string | null }> = ({ onSelectPlot, selectedPlotId }) => {
  const { t } = useI18n();
  const years = useMemo(() => temporalEvents.map(e => e.year), []);
  const [year, setYear] = useState<number>(years[years.length - 1]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setYear(prev => {
        const idx = years.indexOf(prev);
        if (idx === -1) return years[0];
        return years[(idx + 1) % years.length];
      });
    }, 1100);
    return () => window.clearInterval(id);
  }, [playing, years]);

  const current = temporalEvents.find(e => e.year === year) || temporalEvents[temporalEvents.length - 1];

  // For the temporal view, fade plots based on year (purely visual — geometry unchanged)
  const visiblePlots = useMemo(() => {
    return plots.map(p => {
      // Older plots are dimmer
      const factor = (year - 2016) / (2026 - 2016);
      return { ...p };
    });
  }, [year]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.map size={14} /> {t('nav.modules')}</div>
          <h1>{t('temporal.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('temporal.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn-outline"><I.layers size={16} /> {t('temporal.compare')}</button>
          <button className="btn btn-outline"><I.camera size={16} /> {t('temporal.snapshot')}</button>
        </div>
      </div>

      <div className="grid mb-16" style={{ gridTemplateColumns: '1fr 320px' }}>
        <div>
          <MapView
            plots={visiblePlots}
            selectedId={selectedPlotId}
            onSelect={id => onSelectPlot(id)}
            height={500}
            highlightShikostiPoyosti
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Index cards */}
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{t('temporal.satellite')}</h3>
            <div className="grid" style={{ gap: 10 }}>
              <IndexRow label={t('temporal.ndvi')}     value={current.ndvi} color="#10b981" max={1} hint={t('temporal.explain.ndvi')} />
              <IndexRow label={t('temporal.waterIndex')}value={current.ndwi} color="#2563eb" max={1} hint={t('temporal.explain.ndwi')} />
              <IndexRow label={t('temporal.builtup')}   value={current.ndbi} color="#d97706" max={1} hint={t('temporal.explain.ndbi')} />
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>{t('temporal.year')}: {year}</h3>
            <div className="grid grid-2" style={{ gap: 8 }}>
              <Stat label={t('shik.affectedArea')} value={`${current.erosion}%`} kind="warn" />
              <Stat label={t('shik.poyosti')} value={`+${current.formation}`} kind="success" />
              <Stat label={t('temporal.legend.settlement')} value={current.settlements} kind="info" />
              <Stat label={t('common.area')} value={`${current.area} ${t('units.shotok')}`} kind="brand" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <Timeline years={years} value={year} onChange={setYear} playing={playing} onPlayToggle={setPlaying} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card__title">
            <h3>{t('temporal.explain.ndvi')}</h3>
            <span className="badge green"><span className="dot" /> NDVI {current.ndvi.toFixed(2)}</span>
          </div>
          <BarChart
            data={temporalEvents.map(e => ({ label: String(e.year), value: e.ndvi, color: '#10b981' }))}
            activeYear={year}
          />
        </div>
        <div className="card">
          <div className="card__title">
            <h3>{t('temporal.explain.ndwi')}</h3>
            <span className="badge blue"><span className="dot" /> NDWI {current.ndwi.toFixed(2)}</span>
          </div>
          <BarChart
            data={temporalEvents.map(e => ({ label: String(e.year), value: e.ndwi, color: '#2563eb' }))}
            activeYear={year}
          />
        </div>
      </div>

      {selectedPlotId && (() => {
        const p = plots.find(p => p.id === selectedPlotId);
        if (!p) return null;
        return (
          <div className="card mt-16">
            <div className="card__title">
              <h3>{t('common.details')}: {p.id} · {p.dag}</h3>
              <span className="badge brand"><BilingualName en={p.district} bn={p.districtBn} /> · <BilingualName en={p.upazila} bn={p.upazilaBn} /> · <BilingualName en={p.mouza} bn={p.mouzaBn} /></span>
            </div>
            <div className="grid grid-4">
              <div><div className="muted text-xs">{t('common.owner')}</div><strong><BilingualName en={p.owner.name} bn={p.owner.nameBn} /></strong></div>
              <div><div className="muted text-xs">{t('common.area')}</div><strong>{p.areaShotok} {t('units.shotok')} · {p.areaDecimal} {t('units.decimal')}</strong></div>
              <div><div className="muted text-xs">{t('common.khatian')}</div><strong className="mono">{p.khatian}</strong></div>
              <div><div className="muted text-xs">{t('common.plotNo')}</div><strong className="mono">{p.dag}</strong></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const IndexRow: React.FC<{ label: string; value: number; max?: number; color: string; hint: string }> = ({ label, value, max = 1, color, hint }) => {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="row between"><strong style={{ fontSize: '0.88rem' }}>{label}</strong>
        <span className="mono text-sm">{value.toFixed(2)}</span>
      </div>
      <div className="progress" style={{ marginTop: 4 }}>
        <div className="progress__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="muted text-xs mt-4">{hint}</div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode; kind?: 'success' | 'warn' | 'info' | 'brand' }> = ({ label, value, kind = 'info' }) => (
  <div className={`kpi k-${kind}`} style={{ padding: 12 }}>
    <div className="kpi__label" style={{ fontSize: '0.7rem' }}>{label}</div>
    <div className="kpi__value" style={{ fontSize: '1.2rem' }}>{value}</div>
  </div>
);

const BarChart: React.FC<{ data: Array<{ label: string; value: number; color: string }>; activeYear: number }> = ({ data, activeYear }) => {
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  return (
    <svg viewBox="0 0 600 200" style={{ width: '100%', height: 200 }}>
      {data.map((d, i) => {
        const x = 30 + i * 50;
        const h = (d.value / max) * 150;
        const y = 170 - h;
        const isActive = Number(d.label) === activeYear;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={32} height={h} fill={d.color} opacity={isActive ? 1 : 0.55} rx={4} />
            {isActive && <rect x={x - 2} y={y - 2} width={36} height={h + 4} fill="none" stroke="#0f172a" strokeWidth="1.5" rx={6} />}
            <text x={x + 16} y={185} textAnchor="middle" fontSize="10" fill="#475569" fontFamily="var(--font-mono)">{d.label}</text>
            <text x={x + 16} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill={d.color}>{d.value.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
};
