import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { MapView } from '../components/ui/MapView';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { encroachmentAlerts, plots } from '../data/seed';
import { useToast } from '../components/ui/Toaster';

export const Encroachment: React.FC<{ onSelectPlot: (id: string | null) => void }> = ({ onSelectPlot }) => {
  const { t } = useI18n();
  const { show } = useToast();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const filtered = encroachmentAlerts.filter(a => {
    const inFilter = filter === 'all' || a.level === filter;
    return inFilter && !resolved.has(a.id);
  });
  const resolvedList = encroachmentAlerts.filter(a => resolved.has(a.id));

  const affectedPlots = plots.filter(p => p.status === 'encroached' || p.status === 'disputed');

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.alert size={14} /> {t('nav.modules')}</div>
          <h1>{t('enc.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('enc.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn-outline"><I.satellite size={16} /> {t('enc.evidence.satellite')}</button>
          <button className="btn btn-outline"><I.bell size={16} /> {t('enc.iotSensor')}</button>
        </div>
      </div>

      <div className="grid grid-4 mb-16">
        <div className="kpi k-danger">
          <div className="kpi__label">{t('kpi.encroachments')}</div>
          <div className="kpi__value">{encroachmentAlerts.length}</div>
        </div>
        <div className="kpi k-warn">
          <div className="kpi__label">{t('enc.level.high')}</div>
          <div className="kpi__value">{encroachmentAlerts.filter(a => a.level === 'high').length}</div>
        </div>
        <div className="kpi k-info">
          <div className="kpi__label">{t('enc.level.medium')}</div>
          <div className="kpi__value">{encroachmentAlerts.filter(a => a.level === 'medium').length}</div>
        </div>
        <div className="kpi k-gold">
          <div className="kpi__label">{t('enc.actionTaken')}</div>
          <div className="kpi__value">{resolvedList.length}</div>
        </div>
      </div>

      <div className="grid mb-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="card__title">
            <h3>{t('enc.title')}</h3>
            <div className="row gap-4">
              {(['all', 'high', 'medium', 'low'] as const).map(f => (
                <button key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}>
                  {f === 'all' ? t('common.all') : t(`enc.level.${f}`)}
                </button>
              ))}
            </div>
          </div>
          <MapView plots={plots} onSelect={onSelectPlot} height={420} />
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('enc.iotSensor')}</h3>
          <div className="muted text-sm mb-12">{t('enc.subtitle')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'SNS-DHK-001', status: 'online' },
              { id: 'SNS-RJS-014', status: 'online' },
              { id: 'SNS-MYM-007', status: 'online' },
              { id: 'SNS-SYL-019', status: 'offline' },
              { id: 'SNS-BAR-002', status: 'online' },
              { id: 'SNS-KHL-004', status: 'offline' },
            ].map(s => (
              <div key={s.id} className="row between" style={{ padding: '8px 12px', background: 'var(--ink-50)', borderRadius: 8 }}>
                <span className="mono text-sm">{s.id}</span>
                <span className={`chip ${s.status === 'online' ? 'success' : 'danger'}`}>
                  <I.dot size={8} /> {t(`enc.${s.status}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">
          <h3>{t('enc.activeAlerts')}</h3>
          <span className="badge red"><span className="dot" /> {filtered.length}</span>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('common.plotNo')}</th>
                <th>{t('enc.location')}</th>
                <th>{t('enc.alertLevel')}</th>
                <th>{t('enc.detectedOn')}</th>
                <th>{t('enc.evidence.satellite')}</th>
                <th>{t('enc.actionTaken')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const p = plots.find(x => x.id === a.plotId);
                return (
                  <tr key={a.id}>
                    <td className="mono">{a.id}</td>
                    <td className="mono">{a.plotId}</td>
                    <td>
                      <BilingualName en={p?.upazila} bn={p?.upazilaBn} /> · <BilingualName en={p?.mouza} bn={p?.mouzaBn} />
                    </td>
                    <td><StatusBadge status={a.level === 'high' ? 'high_risk' : a.level === 'medium' ? 'medium_risk' : 'low_risk'} size="sm" /></td>
                    <td className="mono">{a.detectedOn}</td>
                    <td>
                      {a.evidence.map(e => (
                        <span key={e} className="chip" style={{ marginRight: 4 }}>
                          {e === 'photo' && <I.camera size={10} />}
                          {e === 'satellite' && <I.satellite size={10} />}
                          {e === 'sensor' && <I.fingerprint size={10} />}
                          {' '}{t(`enc.evidence.${e}`)}
                        </span>
                      ))}
                    </td>
                    <td>
                      {a.actionTaken ? <StatusBadge status="in_progress" size="sm" /> :
                        resolved.has(a.id) ? <StatusBadge status="cleared" size="sm" /> :
                        <span className="muted text-xs">—</span>}
                    </td>
                    <td>
                      <div className="row gap-4">
                        <button className="btn btn-sm btn-outline" onClick={() => onSelectPlot(a.plotId)}>
                          <I.eye size={12} />
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={() => show('info', t('enc.investigate'), a.id)}>
                          {t('enc.investigate')}
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setResolved(prev => new Set([...prev, a.id])); show('success', t('common.save')); }}>
                          {t('enc.markResolved')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};