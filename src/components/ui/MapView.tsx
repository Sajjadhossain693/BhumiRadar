import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/provider';
import { I } from './Icons';
import type { Plot, UnusualActivity } from '../../data/types';
import { BilingualName } from './StatusBadge';

type Layer = 'cadastral' | 'osm' | 'satellite' | 'erosion';
type OwnershipFilter = 'all' | 'khas' | 'malikana' | 'unusual';

type Props = {
  plots: Plot[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showLegend?: boolean;
  highlightShikostiPoyosti?: boolean;
  height?: number;
};

// Project lat/lng to a local canvas using an equirectangular projection
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
  allocated:     '#0284c7',
};

export const MapView: React.FC<Props> = ({ plots, selectedId, onSelect, showLegend = true, highlightShikostiPoyosti, height = 480 }) => {
  const { t, lang } = useI18n();
  const [layer, setLayer] = useState<Layer>('osm');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<null | { x: number; y: number; px: number; py: number }>(null);
  const [simulatedAlert, setSimulatedAlert] = useState<UnusualActivity | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('10:45:12');

  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const w = 900, h = Math.round(height);

  // Filter plots based on ownership / anomaly filter
  const filteredPlots = useMemo(() => {
    return plots.filter(p => {
      if (ownershipFilter === 'khas') return p.ownershipType === 'khas';
      if (ownershipFilter === 'malikana') return p.ownershipType === 'malikana';
      if (ownershipFilter === 'unusual') return Boolean(p.unusualActivity || (simulatedAlert && simulatedAlert.plotId === p.id));
      return true;
    });
  }, [plots, ownershipFilter, simulatedAlert]);

  // Compute bbox from all plots
  const bbox = useMemo(() => {
    const lats = plots.flatMap(p => p.shape.map(s => s.lat));
    const lngs = plots.flatMap(p => p.shape.map(s => s.lng));
    const pad = 0.55;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [plots]);

  const proj = (lat: number, lng: number) => project(lat, lng, bbox, w, h);

  // Initialize or update Leaflet map when in 'osm' or 'satellite' mode
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      try {
        const centerLat = (bbox.minLat + bbox.maxLat) / 2;
        const centerLng = (bbox.minLng + bbox.maxLng) / 2;
        const map = L.map(leafletContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView([centerLat, centerLng], 7);

        // OpenStreetMap Tile Layer
        const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });

        // Satellite Layer (Esri World Imagery)
        const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        });

        if (layer === 'satellite') {
          satLayer.addTo(map);
        } else {
          osmLayer.addTo(map);
        }

        leafletMapRef.current = { map, osmLayer, satLayer, plotLayers: L.layerGroup().addTo(map) };
        setLeafletReady(true);
      } catch {
        // Fallback to SVG renderer gracefully
      }
    } else {
      const { map, osmLayer, satLayer } = leafletMapRef.current;
      if (layer === 'satellite') {
        if (map.hasLayer(osmLayer)) map.removeLayer(osmLayer);
        if (!map.hasLayer(satLayer)) satLayer.addTo(map);
      } else {
        if (map.hasLayer(satLayer)) map.removeLayer(satLayer);
        if (!map.hasLayer(osmLayer)) osmLayer.addTo(map);
      }
    }
  }, [layer, bbox]);

  // Update Leaflet Polygons when filtered plots or selection change
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !leafletMapRef.current) return;
    const { plotLayers } = leafletMapRef.current;
    plotLayers.clearLayers();

    filteredPlots.forEach(p => {
      const latlngs = p.shape.map(s => [s.lat, s.lng]);
      const isKhas = p.ownershipType === 'khas';
      const hasAnomaly = Boolean(p.unusualActivity || (simulatedAlert && simulatedAlert.plotId === p.id));
      const isSelected = p.id === selectedId;

      const color = hasAnomaly ? '#dc2626' : isKhas ? '#d97706' : '#059669';
      const fillColor = hasAnomaly ? '#f87171' : isKhas ? '#f59e0b' : '#10b981';

      const polygon = L.polygon(latlngs, {
        color: color,
        weight: isSelected ? 4 : 2,
        fillColor: fillColor,
        fillOpacity: hasAnomaly ? 0.45 : isKhas ? 0.35 : 0.25,
        dashArray: isKhas ? '6, 6' : undefined,
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.5; min-width: 180px;">
          <div style="font-weight: 700; color: ${color}; font-size: 14px; margin-bottom: 4px;">
            ${isKhas ? '🏛️ ' + t('map.ownership.khas') : '👤 ' + t('map.ownership.malikana')}
          </div>
          <div><b>${t('rep.dagLbl')}:</b> ${p.dag} (${p.id})</div>
          <div><b>${t('rep.khatianLbl')}:</b> ${p.khatian}</div>
          <div><b>${t('common.mouza')}:</b> ${lang === 'bn' ? p.mouzaBn : p.mouza}</div>
          <div><b>${t('common.area')}:</b> ${p.areaShotok} ${t('units.shotok')}</div>
          ${hasAnomaly ? `<div style="margin-top: 6px; padding: 4px 6px; background: #fee2e2; color: #b91c1c; border-radius: 4px; font-weight: 600;">⚠️ ${t('map.live.anomalyDetected')}</div>` : ''}
        </div>
      `;
      polygon.bindPopup(popupContent);
      polygon.on('click', () => onSelect?.(p.id));
      plotLayers.addLayer(polygon);

      // Add pulsating marker for anomalies
      if (hasAnomaly) {
        const center = [p.coords.lat, p.coords.lng];
        const pulseIcon = L.divIcon({
          className: 'leaflet-radar-pulse',
          html: `<div class="live-beacon danger" style="width: 16px; height: 16px;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const marker = L.marker(center, { icon: pulseIcon });
        marker.on('click', () => onSelect?.(p.id));
        plotLayers.addLayer(marker);
      }
    });
  }, [filteredPlots, selectedId, simulatedAlert, t, lang, onSelect]);

  // Handle pointer interactions on SVG canvas
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

  // Simulation Trigger for Live Anomaly
  const handleSimulate = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour12: false });
    setLiveTimestamp(timeStr);
    setAlertDismissed(false);

    // Toggle between khas and malikana anomaly simulation
    const targetPlot = simulatedAlert?.plotId === 'PLT-KHS-DHK'
      ? plots.find(p => p.id === 'PLT-RJS-031') || plots[1]
      : plots.find(p => p.id === 'PLT-KHS-DHK') || plots[0];

    const isKhas = targetPlot.ownershipType === 'khas';
    const newAlert: UnusualActivity = {
      id: `SIM-${Date.now()}`,
      plotId: targetPlot.id,
      type: isKhas ? 'sand_filling' : 'encroachment_attempt',
      title: isKhas ? 'Illegal Sand Filling on Govt Khas Canal' : 'Unauthorized Boundary Encroachment Detected',
      titleBn: isKhas ? 'সরকারি খাস খাল ও জলাশয়ে অবৈধ বালু ভরাট শনাক্ত' : 'ব্যক্তি মালিকানা সীমানায় অবৈধ দেয়াল নির্মাণ শনাক্ত',
      description: isKhas
        ? 'Real-time satellite NDWI and IoT depth sensors indicate unpermitted dredging & filling on government waterbody.'
        : 'IoT boundary sensor triggered: unpermitted masonry wall erection detected along plot perimeter.',
      descriptionBn: isKhas
        ? 'লাইভ উপগ্রহ বর্ণালি ও আইওটি ডেপথ সেন্সরে সরকারি খাস খালে অবৈধ ড্রেজিং ও ভরাট কার্যক্রম ধরা পড়েছে।'
        : 'আইওটি বর্ডার সেন্সর সক্রিয়: ব্যক্তিগত সীমানায় অনুমোদনহীন ইট দিয়ে দেয়াল নির্মাণের অবৈধ তৎপরতা শনাক্ত।',
      severity: 'critical',
      timestamp: timeStr,
      source: isKhas ? 'satellite' : 'iot_sensor',
    };

    setSimulatedAlert(newAlert);
    onSelect?.(targetPlot.id);
  };

  const selected = plots.find(p => p.id === selectedId) || null;
  const activeAlert = simulatedAlert || selected?.unusualActivity || plots.find(p => p.unusualActivity)?.unusualActivity;

  return (
    <div className="map-container-enhanced">
      {/* 1. Filter Pills: Khas vs Malikana vs Unusual */}
      <div className="map-filter-bar">
        <div className="map-filter-group">
          <button
            onClick={() => setOwnershipFilter('all')}
            className={`map-pill ${ownershipFilter === 'all' ? 'active' : ''}`}
          >
            {t('map.filter.all')} ({plots.length})
          </button>
          <button
            onClick={() => setOwnershipFilter('khas')}
            className={`map-pill khas-pill ${ownershipFilter === 'khas' ? 'active' : ''}`}
          >
            {t('map.filter.khas')} ({plots.filter(p => p.ownershipType === 'khas').length})
          </button>
          <button
            onClick={() => setOwnershipFilter('malikana')}
            className={`map-pill malikana-pill ${ownershipFilter === 'malikana' ? 'active' : ''}`}
          >
            {t('map.filter.malikana')} ({plots.filter(p => p.ownershipType === 'malikana').length})
          </button>
          <button
            onClick={() => setOwnershipFilter('unusual')}
            className={`map-pill unusual-pill ${ownershipFilter === 'unusual' ? 'active' : ''}`}
          >
            {t('map.filter.unusual')} ({plots.filter(p => p.unusualActivity).length})
          </button>
        </div>

        {/* Layer Switcher */}
        <div className="map-filter-group">
          {(['osm', 'satellite', 'cadastral', 'erosion'] as Layer[]).map(l => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`btn btn-sm ${layer === l ? 'btn-primary' : 'btn-ghost'}`}
            >
              {l === 'osm' ? t('map.layer.osm') :
               l === 'satellite' ? t('map.layer.satellite') :
               l === 'cadastral' ? t('map.layer.cadastral') :
               t('temporal.layer.erosion')}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Live Anomaly Radar Status Banner */}
      <div className="live-radar-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`live-beacon ${activeAlert ? 'danger' : ''}`} />
          <span style={{ fontWeight: 600 }}>{t('map.live.title')}</span>
          <span style={{ opacity: 0.8, fontSize: '0.78rem' }}>• {t('map.live.radarActive')}</span>
        </div>

        {activeAlert && !alertDismissed && (
          <div className="radar-signal-alert">
            <span>⚠️</span>
            <span>
              <b>[{lang === 'bn' ? activeAlert.timestamp : activeAlert.timestamp}]</b>{' '}
              {lang === 'bn' ? activeAlert.titleBn : activeAlert.title} ({activeAlert.plotId})
            </span>
            <button
              onClick={() => onSelect?.(activeAlert.plotId)}
              className="btn btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.75rem', background: '#dc2626', color: '#fff' }}
            >
              {t('map.live.locate')}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
            {t('map.live.latestSignal')}: {liveTimestamp}
          </span>
          <button
            onClick={handleSimulate}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(225, 29, 72, 0.4)',
            }}
          >
            ⚡ {t('map.live.simulate')}
          </button>
        </div>
      </div>

      {/* 3. OpenSource Map Viewport (Dual Engine: Leaflet OSM + High-precision Vector Fallback) */}
      <div className="map-canvas" style={{ height: h, position: 'relative' }}>
        {/* Leaflet OpenStreetMap Container */}
        {(layer === 'osm' || layer === 'satellite') && (
          <div
            ref={leafletContainerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              borderRadius: 'inherit',
            }}
          />
        )}

        {/* SVG Cadastral & Temporal Radar Map (Active in cadastral/erosion layers OR fallback) */}
        {(layer === 'cadastral' || layer === 'erosion' || !leafletReady) && (
          <svg
            viewBox={`0 0 ${w} ${h}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(15,42,23,0.06)" strokeWidth="1"/>
              </pattern>
              {/* Khas Land Amber Diagonal Hatching */}
              <pattern id="khasHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#d97706" strokeWidth="2.5" opacity="0.35" />
              </pattern>
              {/* Malikana Emerald Dot Grid */}
              <pattern id="malikanaHatch" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="6" cy="6" r="1.5" fill="#059669" opacity="0.25" />
              </pattern>
              {/* River gradient */}
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              {/* Canvas Base */}
              <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="#f1f5f9" />
              <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="url(#grid)" />

              {/* Natural Waterways / Rivers */}
              {(() => {
                const padMap = { minLat: bbox.minLat, maxLat: bbox.maxLat, minLng: bbox.minLng, maxLng: bbox.maxLng };
                const a = proj(padMap.minLat + 0.4, padMap.minLng + 0.4);
                const b = proj(padMap.minLat + 1.4, padMap.minLng + 3.8);
                const c = proj(padMap.maxLat - 0.4, padMap.maxLng - 0.4);
                return (
                  <g>
                    <path
                      d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${b.y - 20} ${b.x} ${b.y} T ${c.x} ${c.y}`}
                      fill="none" stroke="url(#waterGrad)" strokeWidth="24" strokeLinecap="round" opacity="0.65"
                    />
                    <path
                      d={`M ${a.x + 60} ${a.y + 30} Q ${b.x - 40} ${b.y + 10} ${b.x + 30} ${b.y + 60}`}
                      fill="none" stroke="url(#waterGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.5"
                    />
                  </g>
                );
              })()}

              {/* Cadastral Plots */}
              {filteredPlots.map(p => {
                const pts = p.shape.map(s => proj(s.lat, s.lng));
                const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';
                const isSelected = selectedId === p.id;
                const isKhas = p.ownershipType === 'khas';
                const hasAnomaly = Boolean(p.unusualActivity || (simulatedAlert && simulatedAlert.plotId === p.id));

                const stroke = hasAnomaly ? '#dc2626' : isKhas ? '#b45309' : '#059669';
                const strokeWidth = isSelected ? 3.5 : isKhas ? 2.5 : 1.8;

                const cx = pts.reduce((s, pt) => s + pt.x, 0) / pts.length;
                const cy = pts.reduce((s, pt) => s + pt.y, 0) / pts.length;

                return (
                  <g key={p.id} onClick={() => onSelect?.(p.id)} style={{ cursor: 'pointer' }}>
                    {/* Base Color Fill */}
                    <path
                      d={d}
                      fill={hasAnomaly ? 'rgba(239, 68, 68, 0.22)' : isKhas ? 'rgba(245, 158, 11, 0.16)' : 'rgba(16, 185, 129, 0.14)'}
                    />
                    {/* Pattern Overlay */}
                    <path
                      d={d}
                      fill={isKhas ? 'url(#khasHatch)' : 'url(#malikanaHatch)'}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeDasharray={isKhas ? '5 3' : undefined}
                    />

                    {/* Live Anomaly Pulsing Beacon Ring */}
                    {hasAnomaly && (
                      <g transform={`translate(${cx} ${cy})`}>
                        <circle r="28" fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.65">
                          <animate attributeName="r" from="14" to="42" dur="1.8s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                        <circle r="12" fill="#dc2626" />
                        <circle r="5" fill="#ffffff" />
                      </g>
                    )}

                    {/* Plot Label & Ownership Pill */}
                    <g>
                      <rect
                        x={cx - 36}
                        y={cy - 18}
                        width="72"
                        height="18"
                        rx="4"
                        fill="rgba(255,255,255,0.92)"
                        stroke={stroke}
                        strokeWidth="1"
                      />
                      <text
                        x={cx}
                        y={cy - 5}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        fill={stroke}
                        style={{ fontFamily: 'var(--font-bn)' }}
                      >
                        {isKhas ? '🏛️ খাস' : '👤 মালিকানা'}
                      </text>
                      <text
                        x={cx}
                        y={cy + 13}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#0f172a"
                        style={{ fontFamily: 'var(--font-en)' }}
                      >
                        {p.dag}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Compass */}
              <g transform={`translate(${w - 55} 55)`}>
                <circle r="20" fill="rgba(255,255,255,0.9)" stroke="#94a3b8" />
                <text textAnchor="middle" y="-6" fontSize="9" fill="#0f172a" fontWeight="700">N</text>
                <line x1="0" y1="-2" x2="0" y2="9" stroke="#dc2626" strokeWidth="2" />
              </g>

              {/* Scale bar */}
              <g transform={`translate(20 ${h - 26})`}>
                <line x1="0" y1="0" x2="80" y2="0" stroke="#0f172a" strokeWidth="2" />
                <line x1="0" y1="-4" x2="0" y2="4" stroke="#0f172a" strokeWidth="2" />
                <line x1="80" y1="-4" x2="80" y2="4" stroke="#0f172a" strokeWidth="2" />
                <text x="40" y="-6" textAnchor="middle" fontSize="9.5" fill="#0f172a" fontWeight="600">~ 2.5 km</text>
              </g>
            </g>
          </svg>
        )}

        {/* Map Zoom Controls */}
        <div className="map-controls" style={{ zIndex: 10 }}>
          <button className="icon-btn" onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} aria-label={t('map.zoomIn')}>
            <span style={{ fontWeight: 700 }}>+</span>
          </button>
          <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} aria-label={t('map.zoomOut')}>
            <span style={{ fontWeight: 700 }}>−</span>
          </button>
          <button className="icon-btn" onClick={reset} aria-label={t('map.reset')}>
            <I.refresh size={16} />
          </button>
        </div>

        {/* Legend: Khas vs Malikana vs Anomaly */}
        {showLegend && (
          <div className="map-legend" style={{ zIndex: 10 }} aria-label={t('temporal.legend')}>
            <strong style={{ fontSize: '0.8rem', color: 'var(--ink-900)' }}>{t('temporal.legend')}</strong>
            <div className="map-legend__item">
              <span className="map-legend__swatch" style={{ background: '#f59e0b', borderColor: '#d97706', borderStyle: 'dashed' }} />
              <span>🏛️ {t('map.legend.khas')}</span>
            </div>
            <div className="map-legend__item">
              <span className="map-legend__swatch" style={{ background: '#10b981', borderColor: '#059669' }} />
              <span>👤 {t('map.legend.malikana')}</span>
            </div>
            <div className="map-legend__item">
              <span className="map-legend__swatch" style={{ background: '#ef4444', borderColor: '#dc2626' }} />
              <span>⚠️ {t('map.legend.unusual')}</span>
            </div>
          </div>
        )}

        {/* Plot Inspector Popup */}
        {selected && (
          <div className="map-popup" style={{ zIndex: 10 }} role="status">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{selected.id} · {t('rep.dagLbl')} {selected.dag}</h4>
              <span
                className="chip"
                style={{
                  background: selected.ownershipType === 'khas' ? '#fef3c7' : '#d1fae5',
                  color: selected.ownershipType === 'khas' ? '#92400e' : '#065f46',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              >
                {selected.ownershipType === 'khas' ? `🏛️ ${t('map.ownership.khas')}` : `👤 ${t('map.ownership.malikana')}`}
              </span>
            </div>

            <div className="row" style={{ gap: 6, marginBottom: 6 }}>
              <span className="chip brand">{selected.areaShotok} {t('units.shotok')}</span>
              <span className="chip">{selected.areaDecimal} {t('units.decimal')}</span>
              <span className="chip" style={{ background: 'var(--ink-100)' }}>
                {t('rep.khatianLbl')} {selected.khatian}
              </span>
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

            {selected.khasClassification && (
              <div className="row" style={{ marginTop: 4 }}>
                <b>{t('govkhas.class')}:</b>
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                  {t(`map.khasClass.${selected.khasClassification}`)}
                </span>
              </div>
            )}

            {/* If Selected plot has active unusual activity */}
            {selected.unusualActivity && (
              <div style={{
                marginTop: 8,
                padding: '8px 10px',
                background: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: 6,
                fontSize: '0.78rem',
              }}>
                <div style={{ color: '#b91c1c', fontWeight: 700, marginBottom: 2 }}>
                  🚨 {lang === 'bn' ? selected.unusualActivity.titleBn : selected.unusualActivity.title}
                </div>
                <div style={{ color: '#7f1d1d', marginBottom: 4 }}>
                  {lang === 'bn' ? selected.unusualActivity.descriptionBn : selected.unusualActivity.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#991b1b' }}>
                    📡 {t(`map.source.${selected.unusualActivity.source}`)} • {selected.unusualActivity.timestamp}
                  </span>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#b91c1c', color: '#fff', padding: '2px 8px', fontSize: '0.72rem' }}
                    onClick={() => alert(t('map.live.action') + ': ' + selected.id)}
                  >
                    {t('map.live.action')}
                  </button>
                </div>
              </div>
            )}

            <div className="row" style={{ marginTop: 6 }}>
              <b>{t('common.status')}:</b>
              <span className="badge" style={{ background: (statusColor[selected.status] || '#1e8736') + '22', color: statusColor[selected.status] || '#1e8736' }}>
                <span className="dot" /> {t(`common.status.${selected.status}`) || selected.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
