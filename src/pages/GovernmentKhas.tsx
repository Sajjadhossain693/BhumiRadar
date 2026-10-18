import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { khasRecords } from '../data/seed';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toaster';

export const GovernmentKhas: React.FC = () => {
  const { t } = useI18n();
  const { show } = useToast();
  const [open, setOpen] = useState(false);

  const total = khasRecords.reduce((s, r) => s + r.areaShotok, 0);
  const allocated = khasRecords.filter(r => r.status === 'allocated').reduce((s, r) => s + r.areaShotok, 0);
  const vacant = khasRecords.filter(r => r.status === 'vacant').reduce((s, r) => s + r.areaShotok, 0);
  const encr = khasRecords.filter(r => r.status === 'encroached').reduce((s, r) => s + r.areaShotok, 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.land size={14} /> {t('nav.modules')}</div>
          <h1>{t('khas.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('khas.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <I.plus size={16} /> {t('khas.allocate')}
          </button>
        </div>
      </div>

      <div className="grid grid-4 mb-16">
        <div className="kpi k-brand">
          <div className="kpi__label">{t('khas.totalArea')}</div>
          <div className="kpi__value">{total.toLocaleString()}</div>
          <div className="kpi__delta">{t('units.shotok')}</div>
        </div>
        <div className="kpi k-info">
          <div className="kpi__label">{t('khas.allocated')}</div>
          <div className="kpi__value">{allocated.toLocaleString()}</div>
          <div className="kpi__delta">{t('units.shotok')}</div>
        </div>
        <div className="kpi k-gold">
          <div className="kpi__label">{t('khas.vacant')}</div>
          <div className="kpi__value">{vacant.toLocaleString()}</div>
          <div className="kpi__delta">{t('units.shotok')}</div>
        </div>
        <div className="kpi k-danger">
          <div className="kpi__label">{t('khas.encroached')}</div>
          <div className="kpi__value">{encr.toLocaleString()}</div>
          <div className="kpi__delta">{t('units.shotok')}</div>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('khas.khasId')}</th>
                <th>{t('khas.classification')}</th>
                <th>{t('common.district')}</th>
                <th>{t('common.upazila')}</th>
                <th>{t('common.mouza')}</th>
                <th className="num">{t('common.area')}</th>
                <th>{t('khas.allocTo')}</th>
                <th>{t('khas.leaseNo')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {khasRecords.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td><span className="chip brand">{t(`khas.classification.${r.classification}`) || r.classification}</span></td>
                  <td>{r.district}</td>
                  <td>{r.upazila}</td>
                  <td>{r.mouza}</td>
                  <td className="num">{r.areaShotok} {t('units.shotok')}</td>
                  <td>{r.allocatedTo || '—'}</td>
                  <td className="mono">{r.leaseNo || '—'}</td>
                  <td>
                    <span className={`chip ${r.status === 'allocated' ? 'success' : r.status === 'encroached' ? 'danger' : 'warn'}`}>
                      {t(`common.status.${r.status}`) || r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'encroached' ? (
                      <button className="btn btn-sm btn-danger" onClick={() => show('success', t('khas.recover'), r.id)}>
                        {t('khas.recover')}
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-outline"><I.edit size={12} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('khas.allocate')} size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={() => { setOpen(false); show('success', t('toast.saved')); }}>{t('common.submit')}</button>
          </>
        }>
        <div className="grid grid-2">
          <div className="field">
            <label>{t('khas.classification')}</label>
            <select className="select">
              <option value="urban">{t('khas.classification.urban')}</option>
              <option value="rural">{t('khas.classification.rural')}</option>
              <option value="aquatic">{t('khas.classification.aquatic')}</option>
              <option value="agricultural">{t('khas.classification.agricultural')}</option>
            </select>
          </div>
          <div className="field">
            <label>{t('khas.landClass')}</label>
            <input className="input" />
          </div>
          <div className="field" style={{ gridColumn: '1/-1' }}>
            <label>{t('khas.allocTo')}</label>
            <input className="input" />
          </div>
          <div className="field">
            <label>{t('khas.allocDate')}</label>
            <input className="input" type="date" />
          </div>
          <div className="field">
            <label>{t('khas.leaseNo')}</label>
            <input className="input" placeholder="LS-2026-0001" />
          </div>
        </div>
      </Modal>
    </div>
  );
};
