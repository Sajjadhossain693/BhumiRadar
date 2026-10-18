import React from 'react';
import { useI18n } from '../../i18n/provider';
import { isLang } from '../../i18n/types';

type StatusKind = string;

// Map an internal status enum to a colored badge using a label from the dictionary.
export const StatusBadge: React.FC<{ status: StatusKind; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const { t, lang } = useI18n();
  const label = t(`common.status.${status}`) || t(`status.${status}`) || status;
  // Pick a color band based on status semantics
  const green = ['active', 'approved', 'released', 'cleared', 'paid', 'low_risk', 'stable'];
  const red = ['rejected', 'overdue', 'high_risk', 'encroached', 'shikosti', 'eroded', 'disputed'];
  const amber = ['pending', 'under_review', 'medium_risk', 'locked', 'poyosti', 'newly_formed', 'in_progress', 'scheduled'];
  const blue = ['submitted', 'completed', 'allocated'];
  const cls =
    green.includes(status) ? 'green' :
    red.includes(status) ? 'red' :
    amber.includes(status) ? 'amber' :
    blue.includes(status) ? 'blue' : 'gray';

  const sizeStyle = size === 'sm' ? { fontSize: '0.66rem', padding: '2px 7px' } : undefined;

  return (
    <span className={`badge ${cls}`} style={sizeStyle}>
      <span className="dot" />
      {label}
    </span>
  );
};

// Owner / place name with optional Bengali form. Picks the right script for current lang.
export const BilingualName: React.FC<{ en?: string; bn?: string; fallback?: string }> = ({ en, bn, fallback }) => {
  const { lang } = useI18n();
  const current = isLang(lang) ? lang : 'bn';
  return <>{current === 'en' ? (en || bn || fallback || '') : (bn || en || fallback || '')}</>;
};
