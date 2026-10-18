import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { liens, plots } from '../data/seed';
import { useToast } from '../components/ui/Toaster';
import { Modal } from '../components/ui/Modal';

export const BankLien: React.FC<{ onSelectPlot: (id: string | null) => void }> = ({ onSelectPlot }) => {
  const { t, lang } = useI18n();
  const { show } = useToast();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [data, setData] = useState(liens);

  const filtered = data.filter(l =>
    l.bank.toLowerCase().includes(search.toLowerCase()) ||
    l.borrower.toLowerCase().includes(search.toLowerCase()) ||
    l.encumbranceNo.toLowerCase().includes(search.toLowerCase()),
  );

  const release = (id: string) => {
    setData(prev => prev.map(l => l.id === id ? { ...l, status: 'released', endDate: '2026-01-17' } : l));
    show('success', t('lien.released'));
    setConfirm(null);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.bank size={14} /> {t('nav.modules')}</div>
          <h1>{t('lien.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('lien.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <div className="search-bar">
            <I.search size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('lien.searchPlaceholder')} />
          </div>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <I.plus size={16} /> {t('lien.addNew')}
          </button>
        </div>
      </div>

      <div className="grid grid-4 mb-16">
        <div className="kpi k-info">
          <div className="kpi__label">{t('kpi.bankLiens')}</div>
          <div className="kpi__value">{data.filter(d => d.status === 'active').length.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</div>
        </div>
        <div className="kpi k-gold">
          <div className="kpi__label">{t('common.status.pending')}</div>
          <div className="kpi__value">{data.filter(d => d.status === 'pending').length.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</div>
        </div>
        <div className="kpi k-brand">
          <div className="kpi__label">{t('lien.outstanding')}</div>
          <div className="kpi__value">{t('currency.bdt')} {data.reduce((s, d) => s + d.outstanding, 0).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</div>
        </div>
        <div className="kpi k-success">
          <div className="kpi__label">{t('common.status.released')}</div>
          <div className="kpi__value">{data.filter(d => d.status === 'released').length.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</div>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('lien.lienId')}</th>
                <th>{t('lien.bank')}</th>
                <th>{t('lien.borrower')}</th>
                <th>{t('common.plotNo')}</th>
                <th className="num">{t('lien.amount')}</th>
                <th className="num">{t('lien.outstanding')}</th>
                <th>{t('lien.encumbranceNo')}</th>
                <th>{t('lien.startDate')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const plot = plots.find(p => p.id === l.plotId);
                return (
                  <tr key={l.id}>
                    <td className="mono">{l.id}</td>
                    <td>{l.bank}<div className="muted text-xs">{l.branch}</div></td>
                    <td>{l.borrower}</td>
                    <td className="mono">{l.plotId}{plot && ` · ${plot.dag}`}</td>
                    <td className="num">{t('currency.bdt')} {l.amount.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</td>
                    <td className="num">{t('currency.bdt')} {l.outstanding.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</td>
                    <td className="mono">{l.encumbranceNo}</td>
                    <td className="mono">{l.startDate}{l.endDate ? ` → ${l.endDate}` : ''}</td>
                    <td><StatusBadge status={l.status} size="sm" /></td>
                    <td>
                      <div className="row gap-4">
                        <button className="btn btn-sm btn-outline" onClick={() => onSelectPlot(l.plotId)}>
                          <I.eye size={12} />
                        </button>
                        {l.status === 'active' && (
                          <button className="btn btn-sm btn-danger" onClick={() => setConfirm(l.id)}>
                            {t('lien.release')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('lien.addNew')} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={() => { setOpen(false); show('success', t('lien.added')); }}>{t('common.submit')}</button>
          </>
        }>
        <div className="grid grid-2">
          <div className="field"><label>{t('lien.bank')}</label><input className="input" /></div>
          <div className="field"><label>{t('lien.borrower')}</label><input className="input" /></div>
          <div className="field"><label>{t('lien.encumbranceNo')}</label><input className="input" placeholder="EC-2026-0001" /></div>
          <div className="field"><label>{t('common.plotNo')}</label><input className="input" placeholder="PLT-DHK-001" /></div>
          <div className="field"><label>{t('lien.amount')}</label><input className="input" type="number" /></div>
          <div className="field"><label>{t('lien.startDate')}</label><input className="input" type="date" /></div>
        </div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={t('lien.release')} size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={() => confirm && release(confirm)}>{t('common.confirm')}</button>
          </>
        }>
        <p>{t('lien.confirmRelease')}</p>
      </Modal>
    </div>
  );
};
