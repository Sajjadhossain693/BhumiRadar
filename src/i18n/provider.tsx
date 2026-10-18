import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { bn } from './bn';
import { en } from './en';
import type { Lang } from './types';

const STORAGE_KEY = 'bhumi-radar:lang';

const dictionaries: Record<Lang, Record<string, string>> = { bn, en };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

const initialLang = (): Lang => {
  if (typeof window === 'undefined') return 'bn';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'bn') return v;
  } catch {
    /* ignore */
  }
  return 'bn';
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Apply to <html> for typography / font and CSS hooks
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    document.documentElement.dir = 'ltr';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState(prev => {
      const next: Lang = prev === 'bn' ? 'en' : 'bn';
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const dict = dictionaries[lang] || dictionaries.bn;
    let value = dict[key];
    if (value === undefined) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing translation key: "${key}" (lang=${lang})`);
      }
      value = dictionaries.bn[key] ?? dictionaries.en[key] ?? key;
    }
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return value;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): Ctx => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

// Translate a status enum to a localized label using the same i18n t() function.
export const useStatusLabel = () => {
  const { t } = useI18n();
  return (status: string) => t(`common.status.${status}`) || t(`status.${status}`) || status;
};
