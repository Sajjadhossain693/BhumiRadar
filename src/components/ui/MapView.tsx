import React, { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/provider';
import { I } from './Icons';
import type { Plot } from '../../data/types';
import { BilingualName } from './StatusBadge';

type Layer = 'cadastral' | 'satellite' | 'erosion' | 'flood';

type Props = {
  plots: Plot[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showLegend?: boolean;
  highlightShikostiPoyosti?: boolean;
  height?: number;
};

// Project lat/lng to a local canvas using a simple equirectangular projection.
// (Geometry independent of language — only labels are translated.)
const project = (lat: number, lng: number, bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }, w: number, h: number) => {
  const x = ((lng - bbox.minLng) / (bbox.maxLng - bbox.minLng)) * w;
  const y = ((bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat)) * h;
  return { x, y };
};

const statusColor: Record<string, string> = {
  active:        '#1e8736',
  encroached:    '#dc2626',
  disputed:      '#d97706',
  locked:        '#7c3aed',
  shikosti:      '#b91c1c',
  poyosti:       '#0d9488',
  under_review:  '#2563eb',
};

export const MapView: React.FC<Props> = ({ plots, selectedId, onSelect, showLegend = true, highlightShikostiPoyosti, height = 460 }) => {
  const { t } = useI18n();
  const [layer, setLayer] = useState<Layer>('cadastral');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<null | { x: number; y: number; px: number; py: number }>(null);

  const w = 900, h = Math.round(height);

  // Compute bbox from plots
  const bbox = useMemo(() => {
    const lats = plots.flatMap(p => p.shape.map(s => s.lat));
    const lngs = plots.flatMap(p => p.shape.map(s => s.lng));
    const pad = 0.6;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [plots]);

  const proj = (lat: number, lng: number) => project(lat, lng, bbox, w, h);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPan({ x: dragging.px + (e.clientX - dragging.x), y: dragging.py + (e.clientY - dragging.y) });
  };
  const handlePointerUp = () => setDragging(null);

  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const selected = plots.find(p => p.id === selectedId) || null;

  return (
    <div className="map-canvas" style={{ height: h }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(15,42,23,0.05)" strokeWidth="1"/>
          </pattern>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a4d3e8" />
            <stop offset="100%" stopColor="#6fb6cf" />
          </linearGradient>
          <pattern id="satellite" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="#dbe7c8" />
            <circle cx="20" cy="22" r="3" fill="#a8c188" opacity="0.5" />
            <circle cx="80" cy="40" r="4" fill="#88a868" opacity="0.4" />
            <circle cx="50" cy="80" r="5" fill="#6c8c4d" opacity="0.4" />
            <circle cx="100" cy="100" r="2" fill="#a8c188" opacity="0.5" />
            <path d="M 0 60 Q 30 40 60 60 T 120 60" stroke="#88a868" strokeWidth="0.5" fill="none" opacity="0.4" />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {/* Background */}
          <rect x={-w} y={-h} width={w * 3} height={h * 3} fill={layer === 'satellite' ? 'url(#satellite)' : '#e8f1ea'} />
          <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="url(#grid)" />

          {/* Water bodies — illustrative rivers */}
          {(() => {
            // River lines based on real Bangladesh geography hints
            const padMap = { minLat: bbox.minLat, maxLat: bbox.maxLat, minLng: bbox.minLng, maxLng: bbox.maxLng };
            const a = proj(padMap.minLat + 0.5, padMap.minLng + 0.5);
            const b = proj(padMap.minLat + 1.5, padMap.minLng + 4.0);
            const c = proj(padMap.maxLat - 0.5, padMap.maxLng - 0.5);
            return (
              <g>
                <path d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${b.y - 20} ${b.x} ${b.y} T ${c.x} ${c.y}`}
                      fill="none" stroke="url(#waterGrad)" strokeWidth="22" strokeLinecap="round" opacity="0.85" />
                <path d={`M ${a.x + 60} ${a.y + 30} Q ${b.x - 40} ${b.y + 10} ${b.x + 30} ${b.y + 60}`}
                      fill="none" stroke="url(#waterGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.7" />
              </g>
            );
          })()}

          {/* Erosion overlay (if layer) */}
          {layer === 'erosion' && plots.filter(p => p.status === 'shikosti' || p.status === 'poyosti').map(p => {
            const center = p.shape[0];
            const cp = proj(center.lat, center.lng);
            return (
              <g key={`er-${p.id}`}>
                <circle cx={cp.x} cy={cp.y} r={50} fill={p.status === 'shikosti' ? 'rgba(220,38,38,0.18)' : 'rgba(13,148,136,0.18)'} />
                <circle cx={cp.x} cy={cp.y} r={32} fill="none" stroke={p.status === 'shikosti' ? '#dc2626' : '#0d9488'} strokeDasharray="3 3" />
              </g>
            );
          })}

          {/* Flood overlay */}
          {layer === 'flood' && plots.map(p => {
            const pts = p.shape.map(s => proj(s.lat, s.lng));
            const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';
            return <path key={`fl-${p.id}`} d={d} fill="rgba(96,165,250,0.18)" stroke="rgba(37,99,235,0.4)" />;
          })}

          {/* Cadastral plots */}
          {layer === 'cadastral' && plots.map(p => {
            const pts = p.shape.map(s => proj(s.lat, s.lng));
            const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';
            const isSelected = selectedId === p.id;
            const fill =
              p.status === 'shikosti' ? 'rgba(220,38,38,0.18)' :
              p.status === 'poyosti'  ? 'rgba(13,148,136,0.18)' :
              p.status === 'encroached'? 'rgba(220,38,38,0.10)' :
              p.status === 'disputed' ? 'rgba(217,119,6,0.10)' :
              p.status === 'locked'   ? 'rgba(124,58,237,0.10)' :
              'rgba(30,135,54,0.10)';
            const stroke = statusColor[p.status] || '#1e8736';
            return (
              <g key={p.id} onClick={() => onSelect?.(p.id)} style={{ cursor: 'pointer' }}>
                <path d={d} fill={fill} stroke={stroke}
                      strokeWidth={isSelected ? 3 : 1.6}
                      strokeDasharray={highlightShikostiPoyosti && (p.status === 'shikosti' || p.status === 'poyosti') ? '4 3' : undefined} />
                {/* Plot label */}
                {(() => {
                  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
                  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
                  return (
                    <g>
                      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700"
                            fill={stroke} style={{ fontFamily: 'var(--font-en)' }}>
                        {p.id.replace('PLT-', '')}
                      </text>
                      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9.5"
                            fill="#475569" style={{ fontFamily: 'var(--font-bn)' }}>
                        {p.dag}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Compass */}
          <g transform={`translate(${w - 60} 60)`}>
            <circle r="22" fill="rgba(255,255,255,0.85)" stroke="#94a3b8" />
            <text textAnchor="middle" y="-8" fontSize="9" fill="#0f172a" fontWeight="700">N</text>
            <line x1="0" y1="-3" x2="0" y2="10" stroke="#dc2626" strokeWidth="2" />
            <line x1="0" y1="-3" x2="0" y2="10" stroke="#0f172a" strokeWidth="0.5" />
          </g>

          {/* Scale bar */}
          <g transform={`translate(20 ${h - 30})`}>
            <line x1="0" y1="0" x2="100" y2="0" stroke="#0f172a" strokeWidth="2" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#0f172a" strokeWidth="2" />
            <line x1="50" y1="-3" x2="50" y2="3" stroke="#0f172a" strokeWidth="2" />
            <line x1="100" y1="-4" x2="100" y2="4" stroke="#0f172a" strokeWidth="2" />
            <text x="50" y="-8" textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight="600">~ 5 km</text>
          </g>
        </g>
      </svg>

      {/* Map controls */}
      <div className="map-controls">
        <button className="icon-btn" onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} aria-label={t('map.zoomIn')}><span style={{ fontWeight: 700 }}>+</span></button>
        <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} aria-label={t('map.zoomOut')}><span style={{ fontWeight: 700 }}>−</span></button>
        <button className="icon-btn" onClick={reset} aria-label={t('map.reset')}><I.refresh size={16} /></button>
      </div>

      {/* Layer switcher */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(255,255,255,0.95)', border: '1px solid var(--ink-200)',
        borderRadius: 10, padding: 6, display: 'flex', gap: 4, boxShadow: 'var(--shadow-sm)'
      }}>
        {(['cadastral', 'satellite', 'erosion', 'flood'] as Layer[]).map(l => (
          <button key={l}
            onClick={() => setLayer(l)}
            className={`btn btn-sm ${layer === l ? 'btn-primary' : 'btn-ghost'}`}>
            {t(`temporal.layer.${l}`)}
          </button>
        ))}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="map-legend" aria-label={t('temporal.legend')}>
          <strong style={{ fontSize: '0.78rem' }}>{t('temporal.legend')}</strong>
          <div className="map-legend__item"><span className="map-legend__swatch" style={{ background: 'rgba(30,135,54,0.4)', borderColor: '#1e8736' }} /> {t('temporal.legend.cadastral')}</div>
          <div className="map-legend__item"><span className="map-legend__swatch" style={{ background: 'rgba(220,38,38,0.4)', borderColor: '#dc2626' }} /> {t('temporal.legend.erosion')}</div>
          <div className="map-legend__item"><span className="map-legend__swatch" style={{ background: 'rgba(13,148,136,0.4)', borderColor: '#0d9488' }} /> {t('temporal.legend.formation')}</div>
          <div className="map-legend__item"><span className="map-legend__swatch" style={{ background: 'rgba(220,38,38,0.2)', borderColor: '#dc2626' }} /> {t('temporal.legend.encroach')}</div>
          <div className="map-legend__item"><span className="map-legend__swatch" style={{ background: '#a4d3e8', borderColor: '#6fb6cf' }} /> {t('temporal.legend.water')}</div>
        </div>
      )}

      {/* Plot popup */}
      {selected && (
        <div className="map-popup" role="status">
          <h4>{selected.id} · {selected.dag}</h4>
          <div className="row" style={{ gap: 6, marginBottom: 6 }}>
            <span className="chip brand">{selected.areaShotok} {t('units.shotok')}</span>
            <span className="chip">{selected.areaDecimal} {t('units.decimal')}</span>
          </div>
          <div className="row">
            <b>{t('common.owner')}:</b>
            <BilingualName en={selected.owner.name} bn={selected.owner.nameBn} />
          </div>
          <div className="row">
            <b>{t('common.mouza')}:</b>
            <BilingualName en={selected.mouza} bn={selected.mouzaBn} />
          </div>
          <div className="row">
            <b>{t('common.upazila')}:</b>
            <BilingualName en={selected.upazila} bn={selected.upazilaBn} />
          </div>
          <div className="row">
            <b>{t('common.district')}:</b>
            <BilingualName en={selected.district} bn={selected.districtBn} />
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <b>{t('common.status')}:</b>
            <span className="badge" style={{ background: statusColor[selected.status] + '22', color: statusColor[selected.status] }}>
              <span className="dot" /> {t(`common.status.${selected.status}`) || t(`status.${selected.status}`) || selected.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
