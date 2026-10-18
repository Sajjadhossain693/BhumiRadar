import React from 'react';
import { useI18n } from '../../i18n/provider';

type Props = { value: number; max?: number; size?: number; label?: string };

export const ScoreRing: React.FC<Props> = ({ value, max = 100, size = 140, label }) => {
  const { t } = useI18n();
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = circ * pct;
  const color =
    pct < 0.34 ? '#10b981' :
    pct < 0.67 ? '#d97706' :
    '#dc2626';

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="var(--ink-200)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
              fontSize={size * 0.28} fontWeight={800} fill="var(--ink-900)">
          {Math.round(value)}
        </text>
        <text x="50%" y={size * 0.78} textAnchor="middle" fontSize={size * 0.09} fill="var(--ink-500)" fontWeight={600}>
          /{max}
        </text>
      </svg>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginTop: 4 }}>{label}</div>}
      <div style={{ display: 'none' }}>{t('hlt.scoreRange')}</div>
    </div>
  );
};