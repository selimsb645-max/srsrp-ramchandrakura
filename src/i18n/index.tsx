import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@/types';
import { bn, en, type Dict } from './dictionary';

const dictionaries: Record<Locale, Dict> = { bn, en };
const STORAGE_KEY = 'srsrp.lang';

interface I18nValue {
  lang: Locale;
  setLang: (lang: Locale) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  /** Picks the right value from a pair of fields coming from Firestore. */
  pick: (bnValue?: string | null, enValue?: string | null) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readInitialLang(): Locale {
  if (typeof window === 'undefined') return 'bn';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'bn';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(readInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((next: Locale) => setLangState(next), []);
  const toggleLang = useCallback(() => setLangState((prev) => (prev === 'bn' ? 'en' : 'bn')), []);

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[lang];
    return {
      lang,
      setLang,
      toggleLang,
      t: (key: string) => dict[key] ?? dictionaries.bn[key] ?? key,
      pick: (bnValue?: string | null, enValue?: string | null) => {
        const primary = lang === 'bn' ? bnValue : enValue;
        const fallback = lang === 'bn' ? enValue : bnValue;
        return primary || fallback || '';
      },
    };
  }, [lang, setLang, toggleLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
