import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Lang, Localized } from '@/types/content';

const STORAGE_KEY = 'hithuc.lang';
const DEFAULT_LANG: Lang = 'vi';

function isLang(value: string | null): value is Lang {
  return value === 'vi' || value === 'en';
}

function resolveInitialLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const fromQuery = new URLSearchParams(window.location.search).get('lang');
  if (isLang(fromQuery)) return fromQuery;
  const fromStorage = window.localStorage.getItem(STORAGE_KEY);
  if (isLang(fromStorage)) return fromStorage;
  return DEFAULT_LANG;
}

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  /** Pick the current-language string from a localized field. */
  t: (value: Localized) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(resolveInitialLang);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggle = useCallback(() => setLangState((prev) => (prev === 'vi' ? 'en' : 'vi')), []);
  const t = useCallback((value: Localized) => value?.[lang] ?? value?.en ?? '', [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/** Convenience hook returning just the translator function. */
export function useT() {
  return useLanguage().t;
}
