import React, { useState } from 'react';
import { I } from '../ui/Icons';
import { useI18n } from '../../i18n/provider';
import type { PageKey } from '../../App';

const pageMeta: Record<PageKey, { titleKey: string; subKey: string }> = {
  dashboard:        { titleKey: 'dashboard.title',        subKey: 'dashboard.subtitle' },
  temporalGis:      { titleKey: 'temporal.title',         subKey: 'temporal.subtitle' },
  shikostiPoyosti:  { titleKey: 'shik.title',             subKey: 'shik.subtitle' },
  litigation:       { titleKey: 'lit.title',              subKey: 'lit.subtitle' },
  encroachment:     { titleKey: 'enc.title',              subKey: 'enc.subtitle' },
  ownershipChain:   { titleKey: 'own.title',              subKey: 'own.subtitle' },
  khas:             { titleKey: 'khas.title',             subKey: 'khas.subtitle' },
  lien:             { titleKey: 'lien.title',             subKey: 'lien.subtitle' },
  citizen:          { titleKey: 'cit.title',              subKey: 'cit.subtitle' },
  health:           { titleKey: 'hlt.title',              subKey: 'hlt.subtitle' },
  fieldInspection:  { titleKey: 'fld.title',              subKey: 'fld.subtitle' },
  reports:          { titleKey: 'rep.title',              subKey: 'rep.subtitle' },
};

export const Topbar: React.FC<{ page: PageKey; onNavigate: (p: PageKey) => void }> = ({ page }) => {
  const { t, lang, setLang } = useI18n();
  const meta = pageMeta[page];
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="topbar" role="banner">
      <div className="topbar__title">
        <small>{t('app.ministry')} · {t('app.department')}</small>
        <strong>{t(meta.titleKey)}</strong>
      </div>

      <div className="topbar__spacer" />

      {/* Language toggle — "বাংলা | English" */}
      <div className="lang-toggle" role="group" aria-label={t('lang.label')}>
        <button
          className={lang === 'bn' ? 'is-active' : ''}
          onClick={() => setLang('bn')}
          aria-pressed={lang === 'bn'}
          title={t('lang.bn')}
        >
          {t('lang.bn')}
        </button>
        <span className="lang-divider" aria-hidden style={{ color: 'var(--ink-400)', padding: '0 2px', userSelect: 'none', fontWeight: 400 }}>|</span>
        <button
          className={`en-opt ${lang === 'en' ? 'is-active' : ''}`}
          onClick={() => setLang('en')}
          aria-pressed={lang === 'en'}
          title={t('lang.en')}
        >
          {t('lang.en')}
        </button>
      </div>

      {/* Notifications */}
      <button
        className="icon-btn"
        aria-label={t('topbar.notifications')}
        onClick={() => setNotifOpen(v => !v)}
        style={{ position: 'relative' }}
      >
        <I.bell />
        <span style={{
          position: 'absolute', top: 4, right: 4, width: 8, height: 8,
          background: 'var(--accent-500)', borderRadius: '50%', border: '2px solid #fff'
        }} />
      </button>

      {/* Profile */}
      <button className="topbar__user" onClick={() => setUserOpen(v => !v)}>
        <div className="avatar" aria-hidden>{lang === 'bn' ? 'তা' : 'T'}</div>
        <span className="who">
          <strong style={{ display: 'block' }}>{lang === 'bn' ? 'এস. এম. তানভীর' : 'S. M. Tanvir'}</strong>
          <small>{t('sidebar.user.role')} · {t('sidebar.user.district')}</small>
        </span>
      </button>

      {notifOpen && (
        <div role="dialog" aria-label={t('topbar.notifications')}
             style={popoverStyle}>
          <strong style={{ display: 'block', marginBottom: 8 }}>{t('topbar.notifications')}</strong>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <li>• {t('notif.encroachment_new', { n: 3 })}</li>
            <li>• {t('notif.litigation_updated', { n: 2 })}</li>
            <li>• {t('notif.fraud_suspicion', { n: 1 })}</li>
          </ul>
        </div>
      )}


      {userOpen && (
        <div role="menu" style={popoverStyle}>
          <strong style={{ display: 'block', marginBottom: 6 }}>{t('topbar.profile')}</strong>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-600)' }}>{t('topbar.settings')}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-600)', marginTop: 6 }}>{t('topbar.logout')}</div>
        </div>
      )}
    </header>
  );
};

const popoverStyle: React.CSSProperties = {
  position: 'absolute',
  top: 56,
  right: 90,
  background: '#fff',
  border: '1px solid var(--ink-200)',
  borderRadius: 12,
  padding: 14,
  boxShadow: 'var(--shadow-lg)',
  minWidth: 240,
  zIndex: 50,
};
