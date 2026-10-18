import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { litigation, plots } from '../data/seed';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toaster';

export const Litigation: React.FC<{ onSelectPlot: (id: string | null) => void }> = ({ onSelectPlot }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [data, setData] = useState(litigation);
  const { show } = useToast();

  const filtered = data.filter(c =>
    c.caseNo.toLowerCase().includes(search.toLowerCase()) ||
    c.plots.some(id => id.toLowerCase().includes(search.toLowerCase())),
  );

  const release = (id: string) => {
    setData(prev => prev.map(c => c.id === id ? { ...c, status: 'released', releaseDate: '2026-01-17' } : c));
    show('success', t('lit.lockReleased'));
    setConfirm(null);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.lock size={14} /> {t('nav.modules')}</div>
          <h1>{t('lit.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('lit.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <div className="search-bar">
            <I.search size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('lit.searchPlaceholder')} />
          </div>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <I.plus size={16} /> {t('lit.newCase')}
          </button>
        </div>
      </div>

      <div className="grid grid-3 mb-16">
        <div className="kpi k-danger">
          <div className="kpi__label">{t('kpi.activeLitigation')}</div>
          <div className="kpi__value">{data.filter(d => d.status === 'active').length}</div>
        </div>
        <div className="kpi k-info">
          <div className="kpi__label">{t('lit.history')}</div>
          <div className="kpi__value">{data.length}</div>
        </div>
        <div className="kpi k-gold">
          <div className="kpi__label">{t('lit.regOnHold')}</div>
          <div className="kpi__value">{[...new Set(data.filter(d => d.status === 'active').flatMap(d => d.plots))].length}</div>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('lit.caseNo')}</th>
                <th>{t('lit.court')}</th>
                <th>{t('lit.petitioner')}</th>
                <th>{t('lit.respondent')}</th>
                <th>{t('lit.orderType')}</th>
                <th>{t('lit.lockedPlots')}</th>
                <th>{t('lit.lockDate')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="mono">{c.caseNo}</td>
                  <td>{c.court}</td>
                  <td>{c.petitioner}</td>
                  <td>{c.respondent}</td>
                  <td><span className="badge gray"><span className="dot" /> {t(`lit.orderType.${c.orderType}`)}</span></td>
                  <td className="mono">{c.plots.join(', ')}</td>
                  <td className="mono">{c.lockDate}{c.releaseDate ? ` → ${c.releaseDate}` : ''}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    {c.status === 'active' ? (
                      <button className="btn btn-sm btn-danger" onClick={() => setConfirm(c.id)}>
                        <I.lock size={14} /> {t('lit.releaseLock')}
                      </button>
                    ) : (
                      <span className="muted text-xs">{t('lit.status.released')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.flatMap(c => c.plots.map(pid => ({ id: pid, caseNo: c.caseNo, remarks: c.remarks }))).slice(0, 6).map(({ id, caseNo, remarks }) => {
        const p = plots.find(x => x.id === id);
        if (!p) return null;
        return (
          <div key={`${caseNo}-${id}`} className="card mt-16" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <div>
              <div className="muted text-xs">{t('lit.lockedPlots')}</div>
              <h3 style={{ margin: 0 }}>{id} · {p.dag}</h3>
              <p className="muted text-sm">
                <BilingualName en={p.district} bn={p.districtBn} /> · <BilingualName en={p.upazila} bn={p.upazilaBn} /> · <BilingualName en={p.mouza} bn={p.mouzaBn} />
              </p>
              <p><strong>{t('common.owner')}:</strong> <BilingualName en={p.owner.name} bn={p.owner.nameBn} /></p>
              <StatusBadge status="locked" />
            </div>
            <div>
              <div className="muted text-xs">{t('lit.legalRef')}</div>
              <p>{t('lit.cause')}: {remarks}</p>
              <p className="muted text-sm">{t('lit.regOnHold')}: {caseNo}</p>
              <button className="btn btn-outline btn-sm" onClick={() => onSelectPlot(id)}>
                <I.eye size={14} /> {t('common.view')}
              </button>
            </div>
          </div>
        );
      })}

      {/* Add new case modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('lit.newCase')}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={() => { show('success', t('lit.lockAdded')); setOpen(false); }}>
              {t('common.submit')}
            </button>
          </>
        }
      >
        <div className="grid grid-2">
          <div className="field">
            <label>{t('lit.caseNo')}</label>
            <input className="input" placeholder="WP-4521/2024" />
          </div>
          <div className="field">
            <label>{t('lit.court')}</label>
            <input className="input" placeholder={t('lit.court')} />
          </div>
          <div className="field">
            <label>{t('lit.petitioner')}</label>
            <input className="input" />
          </div>
          <div className="field">
            <label>{t('lit.respondent')}</label>
            <input className="input" />
          </div>
          <div className="field">
            <label>{t('lit.orderType')}</label>
            <select className="select">
              <option>{t('lit.orderType.stay')}</option>
              <option>{t('lit.orderType.injunction')}</option>
              <option>{t('lit.orderType.attachment')}</option>
            </select>
          </div>
          <div className="field">
            <label>{t('lit.lockedPlots')}</label>
            <input className="input" placeholder="PLT-DHK-001" />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>{t('lit.remarks')}</label>
            <textarea className="textarea" rows={3} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>{t('lit.attachOrder')}</label>
            <input className="input" type="file" />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={t('lit.releaseLock')}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={() => confirm && release(confirm)}>{t('common.confirm')}</button>
          </>
        }
      >
        <p>{t('lit.confirmRelease')}</p>
      </Modal>
    </div>
  );
};