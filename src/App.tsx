import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Toaster } from './components/ui/Toaster';
import { ToastProvider } from './components/ui/Toaster';
import { Dashboard } from './pages/Dashboard';
import { TemporalGis } from './pages/TemporalGis';
import { ShikostiPoyosti } from './pages/ShikostiPoyosti';
import { Litigation } from './pages/Litigation';
import { Encroachment } from './pages/Encroachment';
import { OwnershipChain } from './pages/OwnershipChain';
import { GovernmentKhas } from './pages/GovernmentKhas';
import { BankLien } from './pages/BankLien';
import { CitizenVerification } from './pages/CitizenVerification';
import { PlotHealth } from './pages/PlotHealth';
import { FieldInspection } from './pages/FieldInspection';
import { Reports } from './pages/Reports';

export type PageKey =
  | 'dashboard'
  | 'temporalGis'
  | 'shikostiPoyosti'
  | 'litigation'
  | 'encroachment'
  | 'ownershipChain'
  | 'khas'
  | 'lien'
  | 'citizen'
  | 'health'
  | 'fieldInspection'
  | 'reports';

export const App: React.FC = () => {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  // Allow URL hash deep-linking like #temporalGis (no reload)
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace('#', '') as PageKey;
      const allowed: PageKey[] = [
        'dashboard', 'temporalGis', 'shikostiPoyosti', 'litigation',
        'encroachment', 'ownershipChain', 'khas', 'lien',
        'citizen', 'health', 'fieldInspection', 'reports',
      ];
      if (allowed.includes(h)) setPage(h);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const navigate = (p: PageKey) => {
    setPage(p);
    window.location.hash = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSelectPlot = (id: string | null) => {
    setSelectedPlotId(id);
  };

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar current={page} onNavigate={navigate} />
        <main className="app-main">
          <Topbar page={page} onNavigate={navigate} />
          <div className="app-content">
            {page === 'dashboard' && <Dashboard onNavigate={navigate} onSelectPlot={onSelectPlot} />}
            {page === 'temporalGis' && <TemporalGis onSelectPlot={onSelectPlot} selectedPlotId={selectedPlotId} />}
            {page === 'shikostiPoyosti' && <ShikostiPoyosti onSelectPlot={onSelectPlot} />}
            {page === 'litigation' && <Litigation onSelectPlot={onSelectPlot} />}
            {page === 'encroachment' && <Encroachment onSelectPlot={onSelectPlot} />}
            {page === 'ownershipChain' && <OwnershipChain plotId={selectedPlotId} onSelectPlot={onSelectPlot} />}
            {page === 'khas' && <GovernmentKhas />}
            {page === 'lien' && <BankLien onSelectPlot={onSelectPlot} />}
            {page === 'citizen' && <CitizenVerification onSelectPlot={onSelectPlot} />}
            {page === 'health' && <PlotHealth plotId={selectedPlotId} onSelectPlot={onSelectPlot} />}
            {page === 'fieldInspection' && <FieldInspection onSelectPlot={onSelectPlot} />}
            {page === 'reports' && <Reports plotId={selectedPlotId} onSelectPlot={onSelectPlot} />}
          </div>
        </main>
        <Toaster />
      </div>
    </ToastProvider>
  );
};
