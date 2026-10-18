import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { MapView } from '../components/ui/MapView';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { encroachmentAlerts, plots } from '../data/seed';
import { useToast } from '../components/ui/Toaster';
import { Modal } from '../components/ui/Modal';
import type { EncroachmentAlert } from '../data/types';

export const Encroachment: React.FC<{ onSelectPlot: (id: string | null) => void }> = ({ onSelectPlot }) => {
  const { t, lang } = useI18n();
  const { show } = useToast();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [selectedAlert, setSelectedAlert] = useState<EncroachmentAlert | null>(null);

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
                        <button
                          className="btn btn-sm btn-outline"
                          title={lang === 'bn' ? 'সতর্কতার বিস্তারিত দেখুন' : 'View alert details'}
                          onClick={() => {
                            setSelectedAlert(a);
                            onSelectPlot(a.plotId);
                          }}
                        >
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

      {/* Encroachment Alert Detail Modal */}
      {selectedAlert && (() => {
        const p = plots.find(x => x.id === selectedAlert.plotId);
        const isAlertResolved = resolved.has(selectedAlert.id);
        return (
          <Modal
            open={!!selectedAlert}
            onClose={() => setSelectedAlert(null)}
            title={`🚨 ${lang === 'bn' ? 'বেদখল সতর্কতার পূর্ণাঙ্গ বিবরণ' : 'Encroachment Alert Details'} — ${selectedAlert.id}`}
            size="lg"
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      show('info', t('enc.investigate'), selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                  >
                    <I.search size={14} /> {t('enc.investigate')}
                  </button>
                  {!isAlertResolved ? (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setResolved(prev => new Set([...prev, selectedAlert.id]));
                        show('success', t('common.save'));
                        setSelectedAlert(null);
                      }}
                    >
                      ✓ {t('enc.markResolved')}
                    </button>
                  ) : (
                    <span className="badge" style={{ background: '#dcfce7', color: '#166534', padding: '6px 10px' }}>
                      ✓ সমাধানকৃত
                    </span>
                  )}
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => setSelectedAlert(null)}>
                  {t('common.close')}
                </button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Alert Level & Status Banner */}
              <div style={{
                background: selectedAlert.level === 'high' ? '#fef2f2' : selectedAlert.level === 'medium' ? '#fffbeb' : '#f0fdf4',
                border: selectedAlert.level === 'high' ? '1px solid #fca5a5' : selectedAlert.level === 'medium' ? '1px solid #fde68a' : '1px solid #86efac',
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBadge status={selectedAlert.level === 'high' ? 'high_risk' : selectedAlert.level === 'medium' ? 'medium_risk' : 'low_risk'} size="sm" />
                    <span className="mono" style={{ fontWeight: 800, fontSize: '0.85rem' }}>কেস রেফারেন্স: {selectedAlert.caseRef || selectedAlert.id}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: 4, color: '#334155' }}>
                    <b>শনাক্তকরণের সময়:</b> {selectedAlert.detectedOn} • <b>অবস্থান:</b> {selectedAlert.location}
                  </div>
                </div>

                <div>
                  {isAlertResolved ? (
                    <span className="badge" style={{ background: '#16a34a', color: '#fff', fontWeight: 700 }}>
                      ✓ নিষ্পত্তিকৃত (Resolved)
                    </span>
                  ) : (
                    <span className="badge" style={{ background: '#dc2626', color: '#fff', fontWeight: 700 }}>
                      ⚠️ সক্রিয় বেদখল হুমকি (Active Alert)
                    </span>
                  )}
                </div>
              </div>

              {/* Plot Specifications Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📍 {lang === 'bn' ? 'আক্রান্ত জমির তপশিল ও মালিকানার বিবরণ' : 'Affected Plot Specifications'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, fontSize: '0.8rem' }}>
                  <div>
                    <span className="text-xs muted block">প্লট আইডি:</span>
                    <b className="mono">{selectedAlert.plotId}</b>
                  </div>
                  <div>
                    <span className="text-xs muted block">দাগ নম্বর:</span>
                    <b>{p?.dag || '—'}</b>
                  </div>
                  <div>
                    <span className="text-xs muted block">খতিয়ান নম্বর:</span>
                    <b className="mono">{p?.khatian || '—'}</b>
                  </div>
                  <div>
                    <span className="text-xs muted block">মৌজা ও উপজেলা:</span>
                    <b><BilingualName en={p?.upazila} bn={p?.upazilaBn} />, <BilingualName en={p?.mouza} bn={p?.mouzaBn} /></b>
                  </div>
                  <div>
                    <span className="text-xs muted block">রেকর্ডীয় মালিক:</span>
                    <b><BilingualName en={p?.owner.name} bn={p?.owner.nameBn} /></b>
                  </div>
                  <div>
                    <span className="text-xs muted block">মালিকের NID:</span>
                    <span className="mono">{p?.owner.nid || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs muted block">জমির পরিমাণ:</span>
                    <b>{p?.areaShotok || '—'} শতক</b>
                  </div>
                  <div>
                    <span className="text-xs muted block">জমির স্থিতি:</span>
                    {p && <StatusBadge status={p.status} size="sm" />}
                  </div>
                </div>
              </div>

              {/* Evidence & Telemetry Findings */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: 14 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🛰️ {lang === 'bn' ? 'শনাক্তকরণ প্রমাণক ও সেন্সর টেলিমেট্রি' : 'Evidence & Telemetry Findings'}
                </h4>
                
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {selectedAlert.evidence.map(e => (
                    <span key={e} className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 8px', fontSize: '0.78rem' }}>
                      {e === 'photo' && '📷 ড্রোন/স্থিরচিত্র (Aerial Photo)'}
                      {e === 'satellite' && '🛰️ সেন্টিনেল-২ উপগ্রহ চিত্র (Satellite Multispectral)'}
                      {e === 'sensor' && '📡 আইওটি মোশন সেন্সর (IoT Boundary Sensor)'}
                    </span>
                  ))}
                  {selectedAlert.sensorId && (
                    <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '4px 8px', fontSize: '0.78rem' }}>
                      আইওটি সেন্সর ট্যাগ: {selectedAlert.sensorId}
                    </span>
                  )}
                </div>

                {/* Unusual Activity / Detailed Violation Log */}
                {p?.unusualActivity ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 10, fontSize: '0.82rem', color: '#7f1d1d' }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>
                      ⚠️ {lang === 'bn' ? p.unusualActivity.titleBn : p.unusualActivity.title}
                    </div>
                    <div style={{ lineHeight: 1.4 }}>
                      {lang === 'bn' ? p.unusualActivity.descriptionBn : p.unusualActivity.description}
                    </div>
                    <div className="text-xs muted" style={{ marginTop: 4 }}>
                      উৎস: {p.unusualActivity.source} • সময়: {p.unusualActivity.timestamp}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                    {lang === 'bn'
                      ? `স্যাটেলাইট সেন্টিনেল-২ স্পেকট্রাল বিশ্লেষণে এবং ড্রোন ফুটেজে দাগ নং ${p?.dag || ''} এর সীমানা রেখায় অননুমোদিত খনন, মাটি ভরাট কিংবা সীমানা প্রাচীর নির্মাণের মতো বেদখলের তৎপরতা নিশ্চিত করা হয়েছে।`
                      : `Satellite multispectral analysis detected unauthorized boundary shifting, ground excavation or landfilling on Dag ${p?.dag || ''}.`}
                  </div>
                )}

                {/* GPS Coordinates */}
                {p?.coords && (
                  <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <I.map size={13} />
                    <span><b>জিআইএস স্থানাঙ্ক:</b> {p.coords.lat.toFixed(5)}° N, {p.coords.lng.toFixed(5)}° E</span>
                  </div>
                )}
              </div>

              {/* Action Taken Record */}
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                <b>গৃহীত প্রশাসনিক ব্যবস্থা:</b>{' '}
                <span>{selectedAlert.actionTaken || (isAlertResolved ? 'মাঠপর্যায়ে উচ্ছেদ ও নিষ্পত্তি সম্পন্ন' : 'সহকারী কমিশনার (ভূমি) এর কার্যালয়ে তদন্তের অপেক্ষায়')}</span>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};