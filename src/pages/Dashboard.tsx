import React, { useMemo, useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { BilingualName, StatusBadge } from '../components/ui/StatusBadge';
import { computeStats, encroachmentAlerts, fraudAlerts, inspections, litigation, plots } from '../data/seed';
import type { PageKey } from '../App';
import { MapView } from '../components/ui/MapView';

type KpiCard = { key: string; labelKey: string; value: number | string; delta: number; kind: 'green' | 'red' | 'amber' | 'info' | 'gold' | 'brand' };

export const Dashboard: React.FC<{ onNavigate: (p: PageKey) => void; onSelectPlot: (id: string | null) => void }> = ({ onNavigate, onSelectPlot }) => {
  const { t, lang } = useI18n();
  const stats = useMemo(() => computeStats(), []);
  const [search, setSearch] = useState('');

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

  const filteredPlots = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plots;
    return plots.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.dag.toLowerCase().includes(q) ||
      p.owner.name.toLowerCase().includes(q) ||
      (p.owner.nameBn || '').includes(q) ||
      p.mouza.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.dashboard size={14} /> {t('nav.modules')} · {t('app.department')}</div>
          <h1>{t('dashboard.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('dashboard.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <div className="search-bar">
            <I.search size={16} />
            <input
              placeholder={t('common.search.placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-outline"><I.refresh size={16} /> {t('common.refresh')}</button>
        </div>
      </div>

      {/* KPI grid */}
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

      <div className="grid grid-3 mb-16" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
        {/* Map preview */}
        <div className="card" style={{ padding: 14 }}>
          <div className="card__title">
            <h3>{t('dashboard.riskMap')}</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('temporalGis')}>
              {t('common.view')} <I.arrowRight size={14} />
            </button>
          </div>
          <MapView plots={filteredPlots.slice(0, 6)} onSelect={id => onSelectPlot(id)} height={320} showLegend={false} />
        </div>

        {/* Active alerts */}
        <div className="card">
          <div className="card__title">
            <h3>{t('dashboard.alerts')}</h3>
            <span className="badge red"><span className="dot" />{recentAlerts.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentAlerts.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center',
                  background: a.kind === 'enc' ? 'var(--danger-50)' : a.kind === 'fraud' ? 'var(--warn-50)' : 'var(--info-50)',
                  color: a.kind === 'enc' ? 'var(--danger-700)' : a.kind === 'fraud' ? 'var(--warn-700)' : 'var(--info-700)',
                  flex: '0 0 32px',
                }}>
                  {a.kind === 'enc' ? <I.alert size={16} /> : a.kind === 'fraud' ? <I.shield size={16} /> : <I.lock size={16} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a.title}</div>
                  <div className="muted text-xs">
                    {a.plot} · {a.date}{a.severity ? ` · ${t(`enc.level.${a.severity}`)}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card__title">
            <h3>{t('dashboard.quickActions')}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => onNavigate('litigation')}>
              <I.lock size={16} /> {t('lit.newCase')}
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('fieldInspection')}>
              <I.search size={16} /> {t('fld.newInspection')}
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('reports')}>
              <I.report size={16} /> {t('rep.generateReport')}
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('encroachment')}>
              <I.alert size={16} /> {t('enc.title')}
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('ownershipChain')}>
              <I.chain size={16} /> {t('own.title')}
            </button>
          </div>

          <div className="mt-16" style={{ borderTop: '1px solid var(--ink-200)', paddingTop: 12 }}>
            <div className="muted text-xs">{t('dashboard.systemStatus')}</div>
            <div className="row gap-12 mt-8 wrap">
              <span className="chip success"><I.dot size={10} /> {t('dashboard.online')}</span>
              <span className="chip success"><I.shield size={12} /> {t('dashboard.secure')}</span>
              <span className="chip brand"><I.layers size={12} /> {t('dashboard.modulesActive')}: 12</span>
            </div>
            <div className="muted text-xs mt-8">{t('dashboard.lastSync')}: 2026-01-17 09:42</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Recent inspections */}
        <div className="card">
          <div className="card__title">
            <h3>{t('dashboard.recentInspections')}</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('fieldInspection')}>
              {t('common.view')} <I.arrowRight size={14} />
            </button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('fld.plotId')}</th>
                  <th>{t('fld.inspector')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('fld.completedOn')}</th>
                </tr>
              </thead>
              <tbody>
                {recentInspections.map(i => (
                  <tr key={i.id}>
                    <td className="mono">{i.plotId}</td>
                    <td>{i.inspector}</td>
                    <td><StatusBadge status={i.status} /></td>
                    <td className="mono">{i.completedOn || i.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* District breakdown */}
        <div className="card">
          <div className="card__title">
            <h3>{t('dashboard.byDistrict')}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(
              plots.reduce<Record<string, number>>((acc, p) => { acc[p.district] = (acc[p.district] || 0) + 1; return acc; }, {})
            ).map(([dist, count]) => {
              const pct = (count / plots.length) * 100;
              const plotSample = plots.find(p => p.district === dist);
              return (
                <div key={dist}>
                  <div className="row between" style={{ marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.88rem' }}>
                      <BilingualName en={dist} bn={plotSample?.districtBn} />
                    </strong>
                    <span className="muted text-xs">{count.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')} {t('common.records')}</span>
                  </div>
                  <div className="progress"><div className="progress__fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};