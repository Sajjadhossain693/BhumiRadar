import React, { useMemo, useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { MapView } from '../components/ui/MapView';
import { StatusBadge, BilingualName } from '../components/ui/StatusBadge';
import { plots } from '../data/seed';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toaster';

const shikostiPlots = plots.filter(p => p.status === 'shikosti');
const poyostiPlots = plots.filter(p => p.status === 'poyosti');
const stablePlots = plots.filter(p => p.erosion > 0 && p.erosion < 20 && p.status === 'active');

export const ShikostiPoyosti: React.FC<{ onSelectPlot: (id: string | null) => void }> = ({ onSelectPlot }) => {
  const { t } = useI18n();
  const [tab, setTab] = useState<'shikosti' | 'poyosti' | 'stable'>('shikosti');
  const [showWarning, setShowWarning] = useState(false);
  const { show } = useToast();

  const stats = useMemo(() => ({
    shikosti: shikostiPlots.length,
    poyosti: poyostiPlots.length,
    affected: shikostiPlots.length + poyostiPlots.length,
    underSurvey: 4,
  }), []);

  const list = tab === 'shikosti' ? shikostiPlots : tab === 'poyosti' ? poyostiPlots : stablePlots;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><I.river size={14} /> {t('nav.modules')}</div>
          <h1>{t('shik.title')}</h1>
          <p className="muted" style={{ marginTop: -4 }}>{t('shik.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn-primary"><I.upload size={16} /> {t('shik.uploadEvidence')}</button>
          <button className="btn btn-outline"><I.send size={16} /> {t('shik.requestSurvey')}</button>
        </div>
      </div>

      {/* Critical warning banner — same wording as the sample report */}
      <div className="alert alert-danger mb-16">
        <span className="alert__icon"><I.warning /></span>
        <div>
          <div className="alert__title">{t('shik.warning.title')}</div>
          <div>{t('shik.warning.body')}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4 mb-16">
        <div className="kpi k-danger">
          <div className="kpi__label">{t('shik.stats.shikosti')}</div>
          <div className="kpi__value">{stats.shikosti}</div>
          <div className="kpi__delta up"><I.trendUp size={12} /> {t('kpi.delta.up')}</div>
        </div>
        <div className="kpi k-info">
          <div className="kpi__label">{t('shik.stats.poyosti')}</div>
          <div className="kpi__value">{stats.poyosti}</div>
          <div className="kpi__delta up"><I.trendUp size={12} /> {t('kpi.delta.up')}</div>
        </div>
        <div className="kpi k-warn">
          <div className="kpi__label">{t('shik.stats.affected')}</div>
          <div className="kpi__value">{stats.affected}</div>
        </div>
        <div className="kpi k-gold">
          <div className="kpi__label">{t('shik.stats.underSurvey')}</div>
          <div className="kpi__value">{stats.underSurvey}</div>
        </div>
      </div>

      <div className="grid mb-16" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="card__title">
            <h3>{t('temporal.legend')}</h3>
          </div>
          <MapView plots={[...shikostiPlots, ...poyostiPlots]} onSelect={onSelectPlot} height={420} highlightShikostiPoyosti />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('shik.appealTitle')}</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>{t('shik.appealBody')}</p>

          <div className="alert alert-warn mt-12">
            <span className="alert__icon"><I.info /></span>
            <div>{t('shik.warning.bodyEn')}</div>
          </div>

          <h4 className="mt-16">{t('common.actions')}</h4>
          <div className="row gap-8 wrap mt-8">
            <button className="btn btn-primary" onClick={() => setShowWarning(true)}>
              <I.lock size={16} /> {t('shik.suspendRegistration')}
            </button>
            <button className="btn btn-outline" onClick={() => show('success', t('toast.saved'), t('shik.requestSurvey'))}>
              <I.send size={16} /> {t('shik.requestSurvey')}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={tab === 'shikosti' ? 'is-active' : ''} onClick={() => setTab('shikosti')}>
            {t('shik.shikosti')}
          </button>
          <button className={tab === 'poyosti' ? 'is-active' : ''} onClick={() => setTab('poyosti')}>
            {t('shik.poyosti')}
          </button>
          <button className={tab === 'stable' ? 'is-active' : ''} onClick={() => setTab('stable')}>
            {t('common.status.stable')}
          </button>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.plotNo')}</th>
                <th>{t('common.district')}</th>
                <th>{t('common.upazila')}</th>
                <th>{t('common.owner')}</th>
                <th className="num">{t('shik.affectedArea')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id}>
                  <td className="mono">{p.id} · {p.dag}</td>
                  <td><BilingualName en={p.district} bn={p.districtBn} /></td>
                  <td><BilingualName en={p.upazila} bn={p.upazilaBn} /></td>
                  <td><BilingualName en={p.owner.name} bn={p.owner.nameBn} /></td>
                  <td className="num">{p.erosion}%</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => onSelectPlot(p.id)}>
                      <I.eye size={14} /> {t('common.view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showWarning}
        onClose={() => setShowWarning(false)}
        title={t('shik.warning.title')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowWarning(false)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={() => { show('success', t('toast.saved'), t('shik.suspendRegistration')); setShowWarning(false); }}>
              {t('shik.suspendRegistration')}
            </button>
          </>
        }
      >
        <p>{t('shik.warning.body')}</p>
        <p className="muted text-sm">{t('shik.appealBody')}</p>
      </Modal>
    </div>
  );
};
