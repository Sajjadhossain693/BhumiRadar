import React, { useMemo, useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { OwnershipGraph } from '../components/ui/OwnershipGraph';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { deeds, fraudAlerts, plots } from '../data/seed';
import { useToast } from '../components/ui/Toaster';
import { Modal } from '../components/ui/Modal';

// Build a static ownership chain for a given plot from its deeds
const buildChain = (plotId: string) => {
  const d = deeds[plotId];
  if (!d || d.length === 0) return { nodes: [], edges: [] };

  const nodes = d.map((deed, i) => ({
    id: `G${i + 1}`,
    name: deed.from === '—' ? (plots.find(p => p.id === plotId)?.owner.name || '') : deed.from,
    nameBn: deed.from === '—' ? (plots.find(p => p.id === plotId)?.owner.nameBn || '') : deed.from,
    date: deed.date,
  }));
  // Add the final owner
  const lastDeed = d[d.length - 1];
  nodes.push({
    id: `G${d.length + 1}`,
    name: lastDeed.to === '—' ? (plots.find(p => p.id === plotId)?.owner.name || '') : lastDeed.to,
    nameBn: lastDeed.to === '—' ? (plots.find(p => p.id === plotId)?.owner.nameBn || '') : lastDeed.to,
    date: 'present',
  });

  const edges = d.map((deed, i) => ({
    from: `G${i + 1}`,
    to: `G${i + 2}`,
    type: deed.type === 'encroachment' ? 'mutation' : deed.type,
    deed: deed.no,
  }));

  return { nodes, edges };
};

export const OwnershipChain: React.FC<{ plotId: string | null; onSelectPlot: (id: string | null) => void }> = ({ plotId, onSelectPlot }) => {
  const { t } = useI18n();
  const { show } = useToast();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set(fraudAlerts.filter(f => f.dismissed).map(f => f.id)));
  const [confirm, setConfirm] = useState<string | null>(null);
  const [showDeedFor, setShowDeedFor] = useState<string | null>(null);

  const selectedId = plotId || plots[0].id;
  const selected = plots.find(p => p.id === selectedId)!;
  const chain = useMemo(() => buildChain(selectedId), [selectedId]);
  const plotDeeds = deeds[selectedId] || [];
  const plotFraud = fraudAlerts.filter(f => f.plotId === selectedId && !dismissed.has(f.id));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.chain size={14} /> {t('nav.modules')}</div>
          <h1>{t('own.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('own.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <select className="select" value={selectedId} onChange={e => onSelectPlot(e.target.value)} style={{ minWidth: 220 }}>
            {plots.map(p => <option key={p.id} value={p.id}>{p.id} · {p.dag}</option>)}
          </select>
          <button className="btn btn-outline"><I.fingerprint size={16} /> {t('own.flagForReview')}</button>
        </div>
      </div>

      <div className="grid grid-3 mb-16">
        <div className="kpi k-brand">
          <div className="kpi__label">{t('own.generations')}</div>
          <div className="kpi__value">{chain.nodes.length}</div>
        </div>
        <div className="kpi k-info">
          <div className="kpi__label">{t('rep.transactions')}</div>
          <div className="kpi__value">{plotDeeds.length}</div>
        </div>
        <div className="kpi k-danger">
          <div className="kpi__label">{t('own.fraudAlerts')}</div>
          <div className="kpi__value">{plotFraud.length}</div>
        </div>
      </div>

      <div className="card mb-16">
        <div className="card__title">
          <h3>{t('own.graph')}: {selected.id} · {selected.dag}</h3>
          <StatusBadge status={selected.status} />
        </div>
        {chain.nodes.length > 0 ? (
          <OwnershipGraph nodes={chain.nodes} edges={chain.edges} />
        ) : (
          <div className="empty-state">
            <I.document size={40} />
            <h4>{t('empty.records')}</h4>
            <p>{t('empty.plots.hint')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-2 mb-16">
        <div className="card">
          <div className="card__title">
            <h3>{t('rep.pastTransactions')}</h3>
            <span className="chip">{plotDeeds.length}</span>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plotDeeds.map((d, i) => (
                  <tr key={d.no}>
                    <td className="mono">{d.no}</td>
                    <td className="mono">{d.date}</td>
                    <td>{t(`own.relation.${d.type === 'encroachment' ? 'mutation' : d.type}`)}</td>
                    <td>{d.from}</td>
                    <td>{d.to}</td>
                    <td>
                      <span className={`chip ${d.status === 'flagged' ? 'danger' : d.status === 'under_review' ? 'warn' : 'success'}`}>
                        {d.status === 'cleared' ? <I.checkCircle size={10} /> : <I.warning size={10} />}
                        {' '}{t(`lit.status.${d.status === 'cleared' ? 'released' : d.status === 'under_review' ? 'active' : 'released'}`)}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={() => setShowDeedFor(d.no)}>
                        <I.eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {plotDeeds.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><h4>{t('empty.records')}</h4></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card__title">
            <h3>{t('own.fraudAlerts')}</h3>
            <span className={`chip ${plotFraud.length > 0 ? 'danger' : 'success'}`}>{plotFraud.length}</span>
          </div>
          {plotFraud.length === 0 ? (
            <div className="empty-state">
              <I.checkCircle size={36} />
              <h4>{t('common.noData')}</h4>
              <p className="muted text-sm">{t('own.subtitle')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plotFraud.map(f => (
                <div key={f.id} className={`alert ${f.severity === 'high' ? 'alert-danger' : 'alert-warn'}`} style={{ alignItems: 'flex-start' }}>
                  <span className="alert__icon"><I.shield /></span>
                  <div style={{ flex: 1 }}>
                    <div className="alert__title">{t(`own.fraud.${f.type}`)}</div>
                    <div>{f.description}</div>
                    <div className="muted text-xs mt-4">
                      {t('own.severity.' + f.severity)} · {f.createdOn}
                    </div>
                  </div>
                  <div className="col gap-4">
                    <button className="btn btn-sm btn-outline" onClick={() => setShowDeedFor(f.id)}>
                      <I.eye size={12} /> {t('own.viewDeed')}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(f.id)}>
                      {t('own.dismiss')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t('rep.presentOwner')}</h3>
        <div className="grid grid-4">
          <div><div className="muted text-xs">{t('common.name')}</div><strong><BilingualName en={selected.owner.name} bn={selected.owner.nameBn} /></strong></div>
          <div><div className="muted text-xs">{t('common.fatherName')}</div><strong>{selected.owner.fatherName}</strong></div>
          <div><div className="muted text-xs">{t('cit.citizenNid')}</div><strong className="mono">{selected.owner.nid}</strong></div>
          <div><div className="muted text-xs">{t('common.area')}</div><strong>{selected.areaShotok} {t('units.shotok')} · {selected.areaDecimal} {t('units.decimal')}</strong></div>
        </div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={t('own.dismiss')}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={() => { setDismissed(prev => new Set([...prev, confirm!])); setConfirm(null); show('success', t('toast.deleted')); }}>
              {t('common.confirm')}
            </button>
          </>
        }
      >
        <p>{t('own.confirmDismiss')}</p>
      </Modal>

      <Modal
        open={!!showDeedFor}
        onClose={() => setShowDeedFor(null)}
        title={`${t('rep.transactions')} · ${showDeedFor || ''}`}
        size="md"
      >
        <div className="alert alert-info">
          <span className="alert__icon"><I.info /></span>
          <div>
            <div className="alert__title">{t('rep.encumbranceCert')}</div>
            <div className="muted text-sm">{t('rep.qrExplain')}</div>
          </div>
        </div>
        <pre style={{
          background: 'var(--ink-50)', padding: 16, borderRadius: 10, fontSize: 12,
          fontFamily: 'var(--font-mono)', overflow: 'auto', maxHeight: 240
        }}>
{`Deed No: ${showDeedFor}
Plot:    ${selectedId} · Dag ${selected.dag}
District: ${selected.district} (${selected.districtBn})
Upazila:  ${selected.upazila} (${selected.upazilaBn})
Mouza:    ${selected.mouza} (${selected.mouzaBn})
Owner:    ${selected.owner.name} (${selected.owner.nameBn})
NID:      ${selected.owner.nid}
Area:     ${selected.areaShotok} shotok / ${selected.areaDecimal} decimal
QR:       https://bhumi-radar.gov.bd/v?id=${selectedId}&d=${showDeedFor}`}
        </pre>
      </Modal>
    </div>
  );
};