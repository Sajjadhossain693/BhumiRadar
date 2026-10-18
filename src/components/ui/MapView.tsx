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
  const [layer, setLayer] = useState<Layer>('satellite');
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

  // Focus on a plot to display the full land view
  const focusPlot = (plotId: string) => {
    onSelect?.(plotId);
    const plot = plots.find(p => p.id === plotId);
    if (!plot) return;

    if (leafletMapRef.current?.map) {
      const map = leafletMapRef.current.map;
      const L = (window as any).L;
      if (L) {
        const latlngs = plot.shape.map(s => [s.lat, s.lng]);
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { maxZoom: 16, padding: [60, 60], animate: true });
      }
    } else {
      // In SVG mode: calculate center and zoom
      const pts = plot.shape.map(s => proj(s.lat, s.lng));
      const cx = pts.reduce((s, pt) => s + pt.x, 0) / pts.length;
      const cy = pts.reduce((s, pt) => s + pt.y, 0) / pts.length;
      setZoom(2.4);
      setPan({ x: w / 2 - cx * 2.4, y: h / 2 - cy * 2.4 });
    }
  };

  // Reset to national overview
  const resetToFullView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (leafletMapRef.current?.map) {
      const map = leafletMapRef.current.map;
      map.setView([(bbox.minLat + bbox.maxLat) / 2, (bbox.minLng + bbox.maxLng) / 2], 7);
      map.invalidateSize();
    }
  };

  // Initialize Leaflet map
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
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });

        // Satellite Layer (High-Resolution Google Hybrid Satellite - never gives blue/yellow placeholder errors)
        const satLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Satellite / Maxar Imagery',
        });

        if (layer === 'satellite') {
          satLayer.addTo(map);
        } else {
          osmLayer.addTo(map);
        }

        leafletMapRef.current = { map, osmLayer, satLayer, plotLayers: L.layerGroup().addTo(map) };
        setLeafletReady(true);

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      } catch {
        // Fallback to SVG renderer gracefully
      }
    } else {
      const { map, osmLayer, satLayer } = leafletMapRef.current;
      if (layer === 'satellite') {
        if (map.hasLayer(osmLayer)) map.removeLayer(osmLayer);
        if (!map.hasLayer(satLayer)) satLayer.addTo(map);
      } else if (layer === 'osm') {
        if (map.hasLayer(satLayer)) map.removeLayer(satLayer);
        if (!map.hasLayer(osmLayer)) osmLayer.addTo(map);
      }
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [layer, bbox]);

  // Update Leaflet Polygons when filtered plots, selection, or alerts change
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

      // Color scheme:
      // Anomaly: Bright Red pulse
      // Khas: Golden Amber
      // Malikana: Emerald Green
      const color = hasAnomaly ? '#dc2626' : isKhas ? '#d97706' : '#059669';
      const fillColor = hasAnomaly ? '#ef4444' : isKhas ? '#f59e0b' : '#10b981';

      const polygon = L.polygon(latlngs, {
        color: color,
        weight: hasAnomaly ? 4 : isSelected ? 3.5 : 2,
        fillColor: fillColor,
        fillOpacity: hasAnomaly ? 0.5 : isKhas ? 0.35 : 0.25,
        dashArray: hasAnomaly ? '6, 4' : isKhas ? '5, 5' : undefined,
      });

      // Mark the land with permanent tooltip when anomaly or selected
      if (hasAnomaly) {
        polygon.bindTooltip(
          `<div style="font-weight:700; color:#b91c1c; font-size:11.5px; padding:2px;">🚨 ${lang === 'bn' ? 'অস্বাভাবিক দাগ' : 'Alert Dag'} ${p.dag} (${p.areaShotok} ${t('units.shotok')})</div>`,
          { permanent: true, direction: 'top', className: 'anomaly-tooltip' }
        );
      } else {
        polygon.bindTooltip(
          `<div style="font-weight:600; font-size:11px;">${isKhas ? '🏛️' : '👤'} ${p.dag}</div>`,
          { permanent: false, direction: 'center' }
        );
      }

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.5; min-width: 200px;">
          <div style="font-weight: 700; color: ${color}; font-size: 14px; margin-bottom: 4px;">
            ${hasAnomaly ? '🚨 ' + t('map.live.anomalyDetected') : isKhas ? '🏛️ ' + t('map.ownership.khas') : '👤 ' + t('map.ownership.malikana')}
          </div>
          <div><b>${t('rep.dagLbl')}:</b> ${p.dag} (${p.id})</div>
          <div><b>${t('rep.khatianLbl')}:</b> ${p.khatian}</div>
          <div><b>${t('common.mouza')}:</b> ${lang === 'bn' ? p.mouzaBn : p.mouza}</div>
          <div><b>${t('common.area')}:</b> ${p.areaShotok} ${t('units.shotok')} (${p.areaDecimal} ${t('units.decimal')})</div>
          ${hasAnomaly ? `<div style="margin-top: 6px; padding: 6px 8px; background: #fee2e2; border-left: 3px solid #dc2626; color: #991b1b; font-size: 12px; font-weight: 600;">⚠️ ${lang === 'bn' ? (p.unusualActivity?.titleBn || simulatedAlert?.titleBn) : (p.unusualActivity?.title || simulatedAlert?.title)}</div>` : ''}
        </div>
      `;
      polygon.bindPopup(popupContent);
      polygon.on('click', () => onSelect?.(p.id));
      plotLayers.addLayer(polygon);

      // Centroid pulsating marker for anomalies
      if (hasAnomaly) {
        const center = [p.coords.lat, p.coords.lng];
        const pulseIcon = L.divIcon({
          className: 'leaflet-radar-pulse',
          html: `
            <div class="live-beacon danger" style="width: 18px; height: 18px; cursor: pointer; position: relative;">
              <span style="position: absolute; top: -22px; left: -45px; background: #dc2626; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.35);">
                ⚠️ ${lang === 'bn' ? 'দাগ' : 'Dag'} ${p.dag}
              </span>
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = L.marker(center, { icon: pulseIcon });
        marker.on('click', () => focusPlot(p.id));
        plotLayers.addLayer(marker);
      }
    });
  }, [filteredPlots, selectedId, simulatedAlert, t, lang, onSelect, leafletReady]);

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

  // Simulation Trigger for Live Anomaly
  const handleSimulate = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour12: false });
    setLiveTimestamp(timeStr);
    setAlertDismissed(false);

    // Toggle between khas and malikana anomaly simulation
    const targetPlot = simulatedAlert?.plotId === 'PLT-KHS-DHK'
      ? plots.find(p => p.id === 'PLT-DHK-002') || plots[1]
      : plots.find(p => p.id === 'PLT-KHS-DHK') || plots[0];

    const isKhas = targetPlot.ownershipType === 'khas';
    const newAlert: UnusualActivity = {
      id: `SIM-${Date.now()}`,
      plotId: targetPlot.id,
      type: isKhas ? 'sand_filling' : 'boundary_shift',
      title: isKhas ? 'Illegal Sand Filling on Govt Khas Canal' : 'Boundary Deviation & Wall Construction',
      titleBn: isKhas ? 'সরকারি খাস খাল ও জলাশয়ে অবৈধ বালু ভরাট শনাক্ত' : 'ক্যাডাস্ট্রাল সীমানা বিচ্যুতি ও অবৈধ প্রাচীর শনাক্ত',
      description: isKhas
        ? 'Real-time satellite NDWI and IoT depth sensors indicate unpermitted dredging & filling on government waterbody.'
        : 'IoT boundary sensor detected unpermitted masonry wall erection along plot perimeter.',
      descriptionBn: isKhas
        ? 'লাইভ উপগ্রহ বর্ণালি ও আইওটি ডেপথ সেন্সরে সরকারি খাস খালে অবৈধ ড্রেজিং ও ভরাট কার্যক্রম ধরা পড়েছে।'
        : 'আইওটি বর্ডার সেন্সর সক্রিয়: ব্যক্তিগত সীমানায় ১৪% বিচ্যুতি ও অবৈধ দেয়াল নির্মাণের অপচেষ্টা শনাক্ত।',
      severity: 'critical',
      timestamp: timeStr,
      source: isKhas ? 'satellite' : 'iot_sensor',
    };

    setSimulatedAlert(newAlert);
    focusPlot(targetPlot.id);
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
          {(['satellite', 'osm', 'cadastral', 'erosion'] as Layer[]).map(l => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`btn btn-sm ${layer === l ? 'btn-primary' : 'btn-ghost'}`}
            >
              {l === 'satellite' ? `🛰️ ${t('map.layer.satellite')}` :
               l === 'osm' ? `🗺️ ${t('map.layer.osm')}` :
               l === 'cadastral' ? `📐 ${t('map.layer.cadastral')}` :
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
            <span>🚨</span>
            <span>
              <b>[{activeAlert.timestamp}]</b>{' '}
              {lang === 'bn' ? activeAlert.titleBn : activeAlert.title} ({activeAlert.plotId})
            </span>
            <button
              onClick={() => focusPlot(activeAlert.plotId)}
              className="btn btn-sm"
              style={{
                padding: '3px 10px',
                fontSize: '0.75rem',
                background: '#dc2626',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              🔍 {t('map.live.locate')}
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

      {/* 3. OpenSource Map Viewport (Leaflet Satellite & OSM + Crisp Cadastral Overlay) */}
      <div className="map-canvas" style={{ height: h, position: 'relative' }}>
        {/* Leaflet OpenStreetMap & Satellite Container */}
        <div
          ref={leafletContainerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: layer === 'osm' || layer === 'satellite' ? 1 : 0,
            visibility: layer === 'osm' || layer === 'satellite' ? 'visible' : 'hidden',
          }}
        />

        {/* SVG Cadastral Map (Active in cadastral/erosion layers OR fallback) */}
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
                <line x1="0" y1="0" x2="0" y2="10" stroke="#d97706" strokeWidth="2.5" opacity="0.4" />
              </pattern>
              {/* Malikana Emerald Dot Grid */}
              <pattern id="malikanaHatch" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="6" cy="6" r="1.5" fill="#059669" opacity="0.3" />
              </pattern>
              {/* Unusual Activity Red Cross-Hatch */}
              <pattern id="unusualHatch" width="10" height="10" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#dc2626" strokeWidth="3" opacity="0.45" />
              </pattern>
              {/* River gradient */}
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              {/* Canvas Base */}
              <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="#f8fafc" />
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

              {/* Cadastral Plots Full Land View */}
              {filteredPlots.map(p => {
                const pts = p.shape.map(s => proj(s.lat, s.lng));
                const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';
                const isSelected = selectedId === p.id;
                const isKhas = p.ownershipType === 'khas';
                const hasAnomaly = Boolean(p.unusualActivity || (simulatedAlert && simulatedAlert.plotId === p.id));

                const stroke = hasAnomaly ? '#dc2626' : isKhas ? '#b45309' : '#059669';
                const strokeWidth = hasAnomaly ? 4 : isSelected ? 3.5 : isKhas ? 2.5 : 1.8;

                const cx = pts.reduce((s, pt) => s + pt.x, 0) / pts.length;
                const cy = pts.reduce((s, pt) => s + pt.y, 0) / pts.length;

                return (
                  <g key={p.id} onClick={() => focusPlot(p.id)} style={{ cursor: 'pointer' }}>
                    {/* Base Color Fill */}
                    <path
                      d={d}
                      fill={hasAnomaly ? 'rgba(239, 68, 68, 0.3)' : isKhas ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.15)'}
                    />
                    {/* Pattern Overlay */}
                    <path
                      d={d}
                      fill={hasAnomaly ? 'url(#unusualHatch)' : isKhas ? 'url(#khasHatch)' : 'url(#malikanaHatch)'}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeDasharray={hasAnomaly ? '6 3' : isKhas ? '5 3' : undefined}
                    />

                    {/* Live Anomaly Pulsing Beacon Ring */}
                    {hasAnomaly && (
                      <g transform={`translate(${cx} ${cy})`}>
                        <circle r="32" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.75">
                          <animate attributeName="r" from="14" to="46" dur="1.8s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                        <circle r="14" fill="#dc2626" />
                        <circle r="6" fill="#ffffff" />
                      </g>
                    )}

                    {/* Plot Label & Full Land Tag */}
                    <g>
                      <rect
                        x={cx - 44}
                        y={cy - 20}
                        width="88"
                        height="20"
                        rx="4"
                        fill={hasAnomaly ? '#dc2626' : 'rgba(255,255,255,0.95)'}
                        stroke={stroke}
                        strokeWidth="1.2"
                      />
                      <text
                        x={cx}
                        y={cy - 6}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="700"
                        fill={hasAnomaly ? '#ffffff' : stroke}
                        style={{ fontFamily: 'var(--font-bn)' }}
                      >
                        {hasAnomaly ? `🚨 ${lang === 'bn' ? 'অস্বাভাবিক' : 'Alert'}` : isKhas ? '🏛️ খাস' : '👤 মালিকানা'}
                      </text>
                      <text
                        x={cx}
                        y={cy + 14}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="700"
                        fill={hasAnomaly ? '#dc2626' : '#0f172a'}
                        style={{ fontFamily: 'var(--font-en)' }}
                      >
                        {p.dag} ({p.areaShotok} শতক)
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Compass */}
              <g transform={`translate(${w - 55} 55)`}>
                <circle r="20" fill="rgba(255,255,255,0.9)" stroke="#94a3b8" />
                <text textAnchor="middle" y="-6" fontSize="9" fill="#0f172a" fontWeight="700">{lang === 'bn' ? 'উ' : 'N'}</text>
                <line x1="0" y1="-2" x2="0" y2="9" stroke="#dc2626" strokeWidth="2" />
              </g>

              {/* Scale bar */}
              <g transform={`translate(20 ${h - 26})`}>
                <line x1="0" y1="0" x2="80" y2="0" stroke="#0f172a" strokeWidth="2" />
                <line x1="0" y1="-4" x2="0" y2="4" stroke="#0f172a" strokeWidth="2" />
                <line x1="80" y1="-4" x2="80" y2="4" stroke="#0f172a" strokeWidth="2" />
                <text x="40" y="-6" textAnchor="middle" fontSize="9.5" fill="#0f172a" fontWeight="600">~ 2.5 {lang === 'bn' ? 'কিমি' : 'km'}</text>
              </g>
            </g>
          </svg>
        )}

        {/* Map Zoom & Full Land View Controls */}
        <div className="map-controls" style={{ zIndex: 10 }}>
          <button
            className="icon-btn"
            onClick={() => {
              if (leafletMapRef.current?.map) leafletMapRef.current.map.zoomIn();
              else setZoom(z => Math.min(3, z + 0.3));
            }}
            aria-label={t('map.zoomIn')}
          >
            <span style={{ fontWeight: 700 }}>+</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              if (leafletMapRef.current?.map) leafletMapRef.current.map.zoomOut();
              else setZoom(z => Math.max(0.6, z - 0.3));
            }}
            aria-label={t('map.zoomOut')}
          >
            <span style={{ fontWeight: 700 }}>−</span>
          </button>
          <button className="icon-btn" onClick={resetToFullView} title={t('map.nationalView')} aria-label={t('map.reset')}>
            <I.refresh size={16} />
          </button>
          {selectedId && (
            <button
              className="icon-btn"
              onClick={() => focusPlot(selectedId)}
              title={t('map.fullLandView')}
              style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <I.pin size={16} />
            </button>
          )}
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
              <span>🚨 {t('map.legend.unusual')}</span>
            </div>
          </div>
        )}

        {/* Selected Plot Full Land Inspector Popup */}
        {selected && (
          <div className="map-popup" style={{ zIndex: 10, maxWidth: 340 }} role="status">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{selected.id} · {t('rep.dagLbl')} {selected.dag}</h4>
              <span
                className="chip"
                style={{
                  background: selected.unusualActivity ? '#fee2e2' : selected.ownershipType === 'khas' ? '#fef3c7' : '#d1fae5',
                  color: selected.unusualActivity ? '#b91c1c' : selected.ownershipType === 'khas' ? '#92400e' : '#065f46',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              >
                {selected.unusualActivity ? `🚨 ${lang === 'bn' ? 'অস্বাভাবিক' : 'Anomaly'}` : selected.ownershipType === 'khas' ? `🏛️ ${t('map.ownership.khas')}` : `👤 ${t('map.ownership.malikana')}`}
              </span>
            </div>

            <div className="row" style={{ gap: 6, marginBottom: 6 }}>
              <span className="chip brand">{selected.areaShotok} {t('units.shotok')}</span>
              <span className="chip">{selected.areaDecimal} {t('units.decimal')}</span>
              <span className="chip" style={{ background: 'var(--ink-100)' }}>
                {t('rep.khatianLbl')} {selected.khatian}
              </span>
              <button
                onClick={() => focusPlot(selected.id)}
                className="btn btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.72rem', background: '#0a4d24', color: '#fff', marginLeft: 'auto' }}
              >
                🔍 {t('map.fullLandView')}
              </button>
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
                border: '1.5px solid #ef4444',
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
                  <span style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 600 }}>
                    📡 {t(`map.source.${selected.unusualActivity.source}`)} • {selected.unusualActivity.timestamp}
                  </span>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#b91c1c', color: '#fff', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}
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
