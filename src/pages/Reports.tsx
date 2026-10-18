import React from 'react';
import { plots } from '../data/seed';
import { ReportPDF } from '../components/reports/ReportPDF';

export const Reports: React.FC<{ plotId: string | null; onSelectPlot: (id: string | null) => void }> = ({ plotId, onSelectPlot }) => {
  const selected = plots.find(p => p.id === plotId) || plots[0];
  return <ReportPDF plot={selected} onSelectPlot={onSelectPlot} />;
};
