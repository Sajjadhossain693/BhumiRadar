import React, { useMemo, useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { ScoreRing } from '../components/ui/ScoreRing';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { deeds, plots } from '../data/seed';

export const PlotHealth: React.FC<{ plotId: string | null; onSelectPlot: (id: string | null) => void }> = ({ plotId, onSelectPlot }) => {
  const { t } = useI18n();
  const selectedId = plotId || plots[0].id;
  const selected = plots.find(p => p.id === selectedId)!;

  const band = useMemo(() => {
    if (selected.riskScore < 34) return { key: 'low', color: '#10b981' };
    if (selected.riskScore < 67) return { key: 'medium', color: '#d97706' };
    return { key: 'high', color: '#dc2626' };
  }, [selected]);

  const recommendation = useMemo(() => {
    const r: string[] = [];
    if (selected.healthFactors.legal > 20) r.push(t('hlt.rec.legal'));
    if (selected.healthFactors.physical > 20) r.push(t('hlt.rec.physical'));
    if (selected.healthFactors.environmental > 20) r.push(t('hlt.rec.environmental'));
    if (selected.healthFactors.fraud > 20) r.push(t('hlt.rec.fraud'));
    return r;
  }, [selected, t]);

  const plotDeeds = deeds[selectedId] || [];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.shield size={14} /> {t('nav.modules')}</div>
          <h1>{t('hlt.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('hlt.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <select className="select" value={selectedId} onChange={e => onSelectPlot(e.target.value)} style={{ minWidth: 220 }}>
            {plots.map(p => <option key={p.id} value={p.id}>{p.id} · {p.dag}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-3 mb-16" style={{ gridTemplateColumns: '320px 1fr 1fr' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 }}>
          <h3 style={{ marginTop: 0, alignSelf: 'flex-start' }}>{t('hlt.overall')}</h3>
          <ScoreRing value={selected.riskScore} size={170} label={t('hlt.scoreRange')} />
          <div className="mt-8" style={{ textAlign: 'center' }}>
            <span className="chip" style={{ background: band.color + '22', color: band.color, fontSize: '0.85rem', padding: '4px 12px' }}>
              {t(`hlt.riskBand.${band.key}`)}
            </span>
          </div>
          <div className="muted text-xs">{t('hlt.lastUpdated')}: 2026-01-15</div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('hlt.factors')}</h3>
          <FactorBar label={t('hlt.legal')}         value={selected.healthFactors.legal}         explain={t('hlt.explain.legal')} />
          <FactorBar label={t('hlt.physical')}      value={selected.healthFactors.physical}      explain={t('hlt.explain.physical')} />
          <FactorBar label={t('hlt.environmental')} value={selected.healthFactors.environmental} explain={t('hlt.explain.environmental')} />
          <FactorBar label={t('hlt.fraud')}         value={selected.healthFactors.fraud}         explain={t('hlt.explain.fraud')} />
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('hlt.recommendation')}</h3>
          {recommendation.length === 0 ? (
            <div className="empty-state">
              <I.checkCircle size={36} />
              <h4>{t('hlt.riskBand.low')}</h4>
            </div>
          ) : (
            <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: '0.92rem' }}>
              {recommendation.map((r, i) => <li key={i}>{r}</li>)}
              <li style={{ marginTop: 10, color: 'var(--ink-600)' }}>{t('shik.appealBody')}</li>
            </ul>
          )}

          <div className="mt-16">
            <div className="muted text-xs">{t('common.owner')}</div>
            <strong><BilingualName en={selected.owner.name} bn={selected.owner.nameBn} /></strong>
            <div className="muted text-xs mt-8">
              {t('common.district')}: <BilingualName en={selected.district} bn={selected.districtBn} /> · {t('common.upazila')}: <BilingualName en={selected.upazila} bn={selected.upazilaBn} />
            </div>
            <div className="muted text-xs">
              {t('common.mouza')}: <BilingualName en={selected.mouza} bn={selected.mouzaBn} /> · {t('common.plotNo')}: {selected.dag}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">
          <h3>{t('hlt.history')}</h3>
          <span className="chip brand">{plotDeeds.length} {t('common.records')}</span>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.deedNo')}</th>
                <th>{t('common.date')}</th>
                <th>{t('rep.deedType')}</th>
                <th>{t('rep.previousOwner')}</th>
                <th>{t('rep.presentOwner')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {plotDeeds.map(d => (
                <tr key={d.no}>
                  <td className="mono">{d.no}</td>
                  <td className="mono">{d.date}</td>
                  <td>{t(`own.relation.${d.type === 'encroachment' ? 'mutation' : d.type}`)}</td>
                  <td>{d.from}</td>
                  <td>{d.to}</td>
                  <td>
                    <span className={`chip ${d.status === 'flagged' ? 'danger' : d.status === 'under_review' ? 'warn' : 'success'}`}>
                      {d.status === 'cleared' ? t('lit.status.released') : d.status === 'under_review' ? t('lit.status.active') : d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {plotDeeds.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><h4>{t('empty.records')}</h4></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FactorBar: React.FC<{ label: string; value: number; explain: string }> = ({ label, value, explain }) => {
  const color = value < 20 ? '#10b981' : value < 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="row between">
        <strong style={{ fontSize: '0.9rem' }}>{label}</strong>
        <span className="mono text-sm" style={{ color }}>{value}</span>
      </div>
      <div className="progress" style={{ marginTop: 4 }}>
        <div className="progress__fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <div className="muted text-xs mt-4">{explain}</div>
    </div>
  );
};
