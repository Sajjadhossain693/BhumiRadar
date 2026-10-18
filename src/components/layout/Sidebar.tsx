import React from 'react';
import { I } from '../ui/Icons';
import { useI18n } from '../../i18n/provider';
import type { PageKey } from '../../App';
import { encroachmentAlerts, fraudAlerts, litigation } from '../../data/seed';

type NavItem = { key: PageKey; labelKey: string; icon: React.FC<{ size?: number }>; badge?: number };

const navModules: NavItem[] = [
  { key: 'dashboard',         labelKey: 'nav.dashboard',         icon: I.dashboard },
  { key: 'temporalGis',       labelKey: 'nav.temporalGis',       icon: I.map },
  { key: 'shikostiPoyosti',   labelKey: 'nav.shikostiPoyosti',   icon: I.river },
  { key: 'litigation',        labelKey: 'nav.litigation',        icon: I.lock, badge: litigation.filter(l => l.status === 'active').length },
  { key: 'encroachment',      labelKey: 'nav.encroachment',      icon: I.alert, badge: encroachmentAlerts.length },
  { key: 'ownershipChain',    labelKey: 'nav.ownershipChain',    icon: I.chain, badge: fraudAlerts.filter(f => !f.dismissed).length },
  { key: 'khas',              labelKey: 'nav.khas',              icon: I.land },
  { key: 'lien',              labelKey: 'nav.lien',              icon: I.bank },
  { key: 'citizen',           labelKey: 'nav.citizen',           icon: I.user },
  { key: 'officerAudit',      labelKey: 'nav.officerAudit',      icon: I.shield, badge: 3 },
  { key: 'mouzaValuation',    labelKey: 'nav.mouzaValuation',    icon: I.scale },
  { key: 'laCompensation',    labelKey: 'nav.laCompensation',    icon: I.trendUp },
  { key: 'poaSentinel',       labelKey: 'nav.poaSentinel',       icon: I.lock },
  { key: 'auditLedger',       labelKey: 'nav.auditLedger',       icon: I.fingerprint },
  { key: 'health',            labelKey: 'nav.health',            icon: I.shield },
  { key: 'fieldInspection',   labelKey: 'nav.fieldInspection',   icon: I.search },
  { key: 'reports',           labelKey: 'nav.reports',           icon: I.report },
];

export const Sidebar: React.FC<{ current: PageKey; onNavigate: (p: PageKey) => void }> = ({ current, onNavigate }) => {
  const { t } = useI18n();
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden style={{ background: '#ffffff', padding: 2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/assets/bd-govt-emblem.png" alt="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার" width="32" height="32" style={{ objectFit: 'contain' }} />
        </div>
        <div className="sidebar__title">
          <strong>{t('app.name')}</strong>
          <span>{t('app.tagline')}</span>
        </div>
      </div>

      <div className="sidebar__section">{t('nav.main')}</div>
      <nav className="sidebar__nav" aria-label="Modules">
        {navModules.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`nav-item ${current === item.key ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.key)}
              aria-current={current === item.key ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{t(item.labelKey)}</span>
              {item.badge ? <span className="badge">{item.badge}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <I.emblem size={16} />
          <span style={{ fontWeight: 600, color: '#a7d6ad' }}>{t('app.ministry')}</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#7ec78a' }}>
          {t('app.copyright.short')}
        </div>
      </div>
    </aside>
  );
};
