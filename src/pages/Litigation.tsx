import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { litigation, plots } from '../data/seed';
import type { LitigationCase } from '../data/types';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toaster';
import { MapView } from '../components/ui/MapView';

export const Litigation: React.FC<{ onSelectPlot: (id: string | null) => void }> = ({ onSelectPlot }) => {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [dossierCase, setDossierCase] = useState<LitigationCase | null>(null);
  const [data, setData] = useState(litigation);
  const { show } = useToast();

  const filtered = data.filter(c =>
    c.caseNo.toLowerCase().includes(search.toLowerCase()) ||
    c.court.toLowerCase().includes(search.toLowerCase()) ||
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

      {/* Map showing all plots with Litigation Lock demarcation */}
      <div className="card mb-16" style={{ padding: 14 }}>
        <div className="card__title" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <I.map size={18} /> {t('lit.title')} — {t('map.layers')}
          </h3>
          <span className="badge" style={{ background: '#7c3aed22', color: '#7c3aed', fontWeight: 700 }}>
            🔒 {data.filter(d => d.status === 'active').length} {t('lit.lockedPlots')}
          </span>
        </div>
        <MapView plots={plots} onSelect={onSelectPlot} height={400} />
      </div>

      {/* Litigation Cases Table */}
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
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)' }}>{c.caseNo}</td>
                  <td>{c.court}</td>
                  <td>{c.petitioner}</td>
                  <td>{c.respondent}</td>
                  <td>
                    <span className="badge" style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#c4b5fd' }}>
                      <span className="dot" /> {t(`lit.orderType.${c.orderType}`)}
                    </span>
                  </td>
                  <td className="mono">
                    {c.plots.map(pid => (
                      <span
                        key={pid}
                        onClick={() => onSelectPlot(pid)}
                        className="chip"
                        style={{ background: '#ede9fe', color: '#5b21b6', cursor: 'pointer', margin: '2px' }}
                      >
                        🔒 {pid}
                      </span>
                    ))}
                  </td>
                  <td className="mono">{c.lockDate}{c.releaseDate ? ` → ${c.releaseDate}` : ''}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setDossierCase(c)}
                        title={t('lit.viewDetails')}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <I.eye size={13} /> {t('lit.viewDetails')}
                      </button>
                      {c.status === 'active' ? (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setConfirm(c.id)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          <I.lock size={13} /> {t('lit.releaseLock')}
                        </button>
                      ) : (
                        <span className="muted text-xs" style={{ alignSelf: 'center' }}>{t('lit.status.released')}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Locked Plot Cards */}
      <div className="grid grid-2 mt-16" style={{ gap: 16 }}>
        {filtered.flatMap(c => c.plots.map(pid => ({ id: pid, caseNo: c.caseNo, court: c.court, orderType: c.orderType, lockDate: c.lockDate, remarks: c.remarks }))).map(({ id, caseNo, court, orderType, lockDate, remarks }) => {
          const p = plots.find(x => x.id === id);
          if (!p) return null;
          return (
            <div key={`${caseNo}-${id}`} className="card" style={{ borderLeft: '4px solid #7c3aed', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.75rem', fontWeight: 700 }}>
                    🔒 {t('lit.lockActiveNotice')}
                  </span>
                  <h3 style={{ margin: '6px 0 2px 0' }}>{id} · {t('rep.dagLbl')} {p.dag}</h3>
                  <div className="muted text-xs">
                    <BilingualName en={p.district} bn={p.districtBn} /> · <BilingualName en={p.upazila} bn={p.upazilaBn} /> · <BilingualName en={p.mouza} bn={p.mouzaBn} />
                  </div>
                </div>
                <span className="chip brand">{p.areaShotok} {t('units.shotok')}</span>
              </div>

              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: '0.82rem', marginBottom: 10, border: '1px solid var(--ink-200)' }}>
                <div><b>{t('lit.caseNo')}:</b> <span className="mono" style={{ color: '#7c3aed', fontWeight: 700 }}>{caseNo}</span></div>
                <div><b>{t('lit.court')}:</b> {court}</div>
                <div><b>{t('lit.orderType')}:</b> {t(`lit.orderType.${orderType}`)} • {lockDate}</div>
                <div><b>{t('lit.cause')}:</b> {remarks}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#b91c1c', fontSize: '0.75rem', fontWeight: 600 }}>
                  ⛔ {t('lit.transferProhibited')}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => onSelectPlot(id)}>
                  <I.pin size={14} /> {t('map.fullLandView')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lock Details Dossier Modal */}
      {dossierCase && (
        <Modal
          open={!!dossierCase}
          onClose={() => setDossierCase(null)}
          title={`${t('lit.dossierTitle')} — ${dossierCase.caseNo}`}
          size="md"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDossierCase(null)}>{t('common.close')}</button>
              {dossierCase.status === 'active' && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    const cid = dossierCase.id;
                    setDossierCase(null);
                    setConfirm(cid);
                  }}
                >
                  <I.lock size={14} /> {t('lit.releaseLock')}
                </button>
              )}
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: '#f5f3ff',
              border: '1.5px solid #7c3aed',
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0, color: '#5b21b6' }}>🔒 {dossierCase.caseNo}</h3>
                <span className="badge" style={{ background: '#7c3aed', color: '#fff' }}>
                  {t(`lit.orderType.${dossierCase.orderType}`)}
                </span>
              </div>
              <div className="grid grid-2" style={{ gap: 8, fontSize: '0.85rem' }}>
                <div><b>{t('lit.court')}:</b> {dossierCase.court}</div>
                <div><b>{t('lit.lockDate')}:</b> {dossierCase.lockDate}</div>
                <div><b>{t('lit.petitioner')}:</b> {dossierCase.petitioner}</div>
                <div><b>{t('lit.respondent')}:</b> {dossierCase.respondent}</div>
              </div>
              <div style={{ marginTop: 8, fontSize: '0.85rem' }}>
                <b>{t('lit.cause')}:</b> {dossierCase.remarks}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0' }}>{t('lit.lockedPlots')} ({dossierCase.plots.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dossierCase.plots.map(pid => {
                  const p = plots.find(x => x.id === pid);
                  return (
                    <div
                      key={pid}
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        border: '1px solid var(--ink-200)',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>{pid} · {p ? `${t('rep.dagLbl')} ${p.dag}` : ''}</strong>
                        {p && (
                          <div className="muted text-xs">
                            <BilingualName en={p.district} bn={p.districtBn} /> · <BilingualName en={p.upazila} bn={p.upazilaBn} /> · <BilingualName en={p.mouza} bn={p.mouzaBn} />
                          </div>
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setDossierCase(null);
                          onSelectPlot(pid);
                        }}
                      >
                        <I.pin size={12} /> {t('map.fullLandView')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              background: '#fee2e2',
              border: '1px solid #f87171',
              borderRadius: 8,
              padding: 10,
              color: '#991b1b',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}>
              🚨 {t('lit.transferProhibited')} — সাব-রেজিস্ট্রার ও সহকারী কমিশনার (ভূমি) কার্যালয়ে এই দাগের নিবন্ধন স্থগিত করা হয়েছে।
            </div>
          </div>
        </Modal>
      )}

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