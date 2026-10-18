import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/provider';
import { I } from './Icons';

type Props = {
  years: number[];
  value: number;
  onChange: (v: number) => void;
  onPlayToggle?: (playing: boolean) => void;
  playing?: boolean;
};

export const Timeline: React.FC<Props> = ({ years, value, onChange, onPlayToggle, playing }) => {
  const { t, lang } = useI18n();
  const min = years[0];
  const max = years[years.length - 1];
  const pct = ((value - min) / (max - min)) * 100;
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const newPct = x / rect.width;
      const newYear = Math.round(min + newPct * (max - min));
      onChange(newYear);
    };
    const up = () => setDragging(false);
    if (dragging) {
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    }
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dragging, min, max, onChange]);

  return (
    <div className="timeline" role="slider" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-label={t('temporal.timeline')}>
      <div className="timeline__play">
        <button
          className="icon-btn"
          onClick={() => onPlayToggle?.(!playing)}
          aria-label={playing ? t('temporal.pause') : t('temporal.play')}
        >
          {playing ? <I.pause /> : <I.play />}
        </button>
        <strong>{t('temporal.year')}: {lang === 'bn' ? value.toLocaleString('bn-BD', { useGrouping: false }) : value}</strong>
      </div>
      <div
        ref={trackRef}
        className="timeline__track"
        onPointerDown={e => { (e.target as Element).setPointerCapture?.(e.pointerId); setDragging(true); const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left)); onChange(Math.round(min + (x / rect.width) * (max - min))); }}
      >
        <div className="timeline__fill" style={{ width: `${pct}%` }} />
        <div className="timeline__thumb" style={{ left: `${pct}%` }} />
      </div>
      <div className="timeline__ticks">
        {years.map(y => <span key={y}>{lang === 'bn' ? y.toLocaleString('bn-BD', { useGrouping: false }) : y}</span>)}
      </div>
    </div>
  );
};