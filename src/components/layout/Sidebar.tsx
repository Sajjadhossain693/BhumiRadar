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
  { key: 'health',            labelKey: 'nav.health',            icon: I.shield },
  { key: 'fieldInspection',   labelKey: 'nav.fieldInspection',   icon: I.search },
  { key: 'reports',           labelKey: 'nav.reports',           icon: I.report },
];

export const Sidebar: React.FC<{ current: PageKey; onNavigate: (p: PageKey) => void }> = ({ current, onNavigate }) => {
  const { t } = useI18n();
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden>
          {/* Stylized radar on map */}
          <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden>
            <defs>
              <radialGradient id="lg" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#6cbf76" />
                <stop offset="60%" stopColor="#1e8736" />
                <stop offset="100%" stopColor="#0a4d24" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#lg)" />
            {/* Map outlines (Bangladesh-ish) */}
            <path d="M22 18 q5 -3 9 0 q6 -2 11 4 q3 6 1 12 q-2 6 -8 8 q-7 3 -12 0 q-6 -3 -7 -10 q-1 -8 6 -14 z"
                  fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            {/* Radar rings */}
            <circle cx="32" cy="32" r="14" fill="none" stroke="rgba(255,255,255,0.35)" strokeDasharray="2 3" />
            <circle cx="32" cy="32" r="8"  fill="none" stroke="rgba(255,255,255,0.55)" />
            <line x1="32" y1="32" x2="44" y2="22" stroke="#fff" strokeWidth="1.6" />
            <circle cx="32" cy="32" r="2.6" fill="#e83a3a" />
          </svg>
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
