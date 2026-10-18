import React from 'react';
import { useI18n } from '../../i18n/provider';
import { I } from './Icons';

type Node = { id: string; name: string; nameBn?: string; date: string };
type Edge = { from: string; to: string; type: 'sale' | 'gift' | 'inheritance' | 'mutation' | 'partition'; deed: string };

type Props = {
  nodes: Node[];
  edges: Edge[];
};

const relColor: Record<Edge['type'], string> = {
  sale: '#1e8736',
  gift: '#0d9488',
  inheritance: '#7c3aed',
  mutation: '#2563eb',
  partition: '#d97706',
};

export const OwnershipGraph: React.FC<Props> = ({ nodes, edges }) => {
  const { t, lang } = useI18n();

  // Layout: positions spaced evenly horizontally
  const W = 920, H = 260, marginX = 90, marginY = 60;
  const xs = nodes.map((_, i) => marginX + (i * (W - marginX * 2)) / Math.max(1, nodes.length - 1));
  const ys = nodes.map((_, i) => marginY + (i % 2 === 0 ? 30 : 90) + (Math.floor(i / 2) % 2 === 0 ? 0 : 30));

  const findIdx = (id: string) => nodes.findIndex(n => n.id === id);

  return (
    <div className="ownership-graph" role="figure" aria-label={t('own.graph')}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 720 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 Z" fill="#64748b" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 Z" fill="#dc2626" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const fi = findIdx(e.from);
          const ti = findIdx(e.to);
          if (fi < 0 || ti < 0) return null;
          const x1 = xs[fi], y1 = ys[fi];
          const x2 = xs[ti], y2 = ys[ti];
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2 - 24;
          const c = relColor[e.type];
          return (
            <g key={`e-${i}`}>
              <path d={`M ${x1 + 22} ${y1} C ${midX} ${y1} ${midX} ${y2} ${x2 - 22} ${y2}`}
                    fill="none" stroke={c} strokeWidth="2" markerEnd="url(#arrow)" />
              <text x={midX} y={midY} textAnchor="middle" fontSize="11" fontWeight="600" fill={c}>
                {t(`own.relation.${e.type}`)} · {e.deed}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n, i) => {
          const x = xs[i], y = ys[i];
          const name = lang === 'en' ? n.name : (n.nameBn || n.name);
          return (
            <g key={n.id} transform={`translate(${x} ${y})`}>
              <rect x={-70} y={-26} width={140} height={52} rx={10}
                    fill="#fff" stroke="#1e8736" strokeWidth="1.5" />
              <text x={0} y={-6} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
                {name}
              </text>
              <text x={0} y={12} textAnchor="middle" fontSize="10.5" fill="#475569">
                {n.date === 'present' ? (lang === 'bn' ? 'বর্তমান' : 'Present') : n.date}
              </text>
              <text x={0} y={-36} textAnchor="middle" fontSize="9.5" fill="#64748b">
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--ink-600)', marginTop: 10 }}>
        {(['sale', 'gift', 'inheritance', 'mutation', 'partition'] as Edge['type'][]).map(r => (
          <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 4, background: relColor[r], borderRadius: 4 }} />
            {t(`own.relation.${r}`)}
          </span>
        ))}
      </div>
    </div>
  );
};