import React, { useState } from 'react';
import { plots } from '../data/seed';
import { ReportPDF } from '../components/reports/ReportPDF';
import { OwnershipChainReport } from '../components/reports/OwnershipChainReport';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';

type TabKey = 'fullLand' | 'ownershipChain';

export const Reports: React.FC<{ plotId: string | null; onSelectPlot: (id: string | null) => void }> = ({ plotId, onSelectPlot }) => {
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('fullLand');

  const selected = plots.find(p => p.id === plotId) || plots[0];

  return (
    <div>
      {/* Top Report Tab Switcher */}
      <div className="no-print mb-16" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '2px solid var(--ink-200)',
        paddingBottom: 8,
      }}>
        <button
          onClick={() => setActiveTab('fullLand')}
          className={`btn ${activeTab === 'fullLand' ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <I.report size={16} />
          {t('rep.tab.fullLand')}
        </button>
        <button
          onClick={() => setActiveTab('ownershipChain')}
          className={`btn ${activeTab === 'ownershipChain' ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <I.chain size={16} />
          {t('rep.tab.ownershipChain')}
        </button>

        <span className="muted text-xs" style={{ marginLeft: 'auto' }}>
          {lang === 'bn' ? 'সরকারি সনদ ও ডিজিটাল সিলমোহর সম্বলিত' : 'Official Certificate with Digital Seal'}
        </span>
      </div>

      {/* Tab Content */}
      {activeTab === 'fullLand' ? (
        <ReportPDF plot={selected} onSelectPlot={onSelectPlot} />
      ) : (
        <OwnershipChainReport plot={selected} onSelectPlot={onSelectPlot} />
      )}
    </div>
  );
};
