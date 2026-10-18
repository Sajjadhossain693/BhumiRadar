import React, { createContext, useCallback, useContext, useState } from 'react';
import { I } from './Icons';

export type ToastKind = 'success' | 'error' | 'info' | 'warn';

type Toast = { id: number; kind: ToastKind; title: string; body?: string };

type Ctx = { show: (kind: ToastKind, title: string, body?: string) => void };

const ToastContext = createContext<Ctx | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((kind: ToastKind, title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, kind, title, body }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind}`} role="status">
            <span style={{ marginTop: 2 }}>
              {t.kind === 'success' ? <I.checkCircle size={18} /> :
               t.kind === 'error' ? <I.xCircle size={18} /> :
               t.kind === 'warn' ? <I.warning size={18} /> : <I.info size={18} />}
            </span>
            <div>
              <strong style={{ display: 'block', marginBottom: 2 }}>{t.title}</strong>
              {t.body && <span style={{ color: 'var(--ink-600)' }}>{t.body}</span>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): Ctx => {
  const c = useContext(ToastContext);
  if (!c) throw new Error('useToast must be used within ToastProvider');
  return c;
};

export const Toaster: React.FC = () => null; // re-export placeholder
