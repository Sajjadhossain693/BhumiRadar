import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { inspections, plots } from '../data/seed';
import { useToast } from '../components/ui/Toaster';
import { Modal } from '../components/ui/Modal';

export const FieldInspection: React.FC<{ onSelectPlot: (id: string | null) => void }> = ({ onSelectPlot }) => {
  const { t } = useI18n();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    plotId: plots[0].id,
    inspector: 'Md. Monir Hossain',
    dueDate: '2026-01-25',
    finding: '',
    notes: '',
    evidenceType: 'photo' as 'photo' | 'satellite' | 'sensor',
  });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  const captureGps = () => {
    // In production, this would use navigator.geolocation.
    const p = plots.find(x => x.id === form.plotId);
    setGps(p ? { lat: p.coords.lat, lng: p.coords.lng } : { lat: 23.81, lng: 90.41 });
    show('success', t('fld.gpsCaptured'));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.search size={14} /> {t('nav.modules')}</div>
          <h1>{t('fld.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('fld.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <I.plus size={16} /> {t('fld.newInspection')}
          </button>
        </div>
      </div>

      <div className="grid grid-4 mb-16">
        {(['scheduled', 'in_progress', 'completed', 'cancelled'] as const).map(s => {
          const n = inspections.filter(i => i.status === s).length;
          const kind = s === 'completed' ? 'success' : s === 'in_progress' ? 'info' : s === 'scheduled' ? 'gold' : 'danger';
          return (
            <div key={s} className={`kpi k-${kind}`}>
              <div className="kpi__label">{t(`fld.status.${s}`)}</div>
              <div className="kpi__value">{n}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card__title">
          <h3>{t('fld.inspectionsList')}</h3>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('fld.plotId')}</th>
                <th>{t('fld.inspector')}</th>
                <th>{t('fld.dueDate')}</th>
                <th>{t('fld.completedOn')}</th>
                <th>{t('common.status')}</th>
                <th>{t('fld.findings')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(i => {
                const p = plots.find(x => x.id === i.plotId);
                return (
                  <tr key={i.id}>
                    <td className="mono">{i.id}</td>
                    <td className="mono">{i.plotId}{p && ` · ${p.dag}`}</td>
                    <td>{i.inspector}</td>
                    <td className="mono">{i.dueDate}</td>
                    <td className="mono">{i.completedOn || '—'}</td>
                    <td><StatusBadge status={i.status} size="sm" /></td>
                    <td>{i.finding || <span className="muted text-xs">—</span>}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => onSelectPlot(i.plotId)}>
                        <I.eye size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('fld.newInspection')}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { show('info', t('toast.saved')); setOpen(false); }}>{t('fld.saveDraft')}</button>
            <button className="btn btn-primary" onClick={() => { show('success', t('fld.submitted')); setOpen(false); }}>{t('fld.submitReport')}</button>
          </>
        }
      >
        <div className="grid grid-2">
          <div className="field">
            <label>{t('fld.plotId')}</label>
            <select className="select" value={form.plotId} onChange={e => setForm({ ...form, plotId: e.target.value })}>
              {plots.map(p => <option key={p.id} value={p.id}>{p.id} · {p.dag}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('fld.inspector')}</label>
            <input className="input" value={form.inspector} onChange={e => setForm({ ...form, inspector: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('fld.dueDate')}</label>
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('fld.evidenceType')}</label>
            <select className="select" value={form.evidenceType} onChange={e => setForm({ ...form, evidenceType: e.target.value as 'photo' | 'satellite' | 'sensor' })}>
              <option value="photo">{t('enc.evidence.photo')}</option>
              <option value="satellite">{t('enc.evidence.satellite')}</option>
              <option value="sensor">{t('enc.evidence.sensor')}</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: '1/-1' }}>
            <label>{t('fld.gps')}</label>
            <div className="row gap-8">
              <button className="btn btn-secondary" onClick={captureGps}><I.pin size={14} /> {t('fld.captureGps')}</button>
              {gps && <span className="chip brand mono">{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</span>}
            </div>
          </div>
          <div className="field" style={{ gridColumn: '1/-1' }}>
            <label>{t('fld.findings')}</label>
            <textarea className="textarea" rows={3} value={form.finding} onChange={e => setForm({ ...form, finding: e.target.value })} />
          </div>
          <div className="field" style={{ gridColumn: '1/-1' }}>
            <label>{t('fld.notes')}</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
