'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, t as translate, TranslationKey } from './i18n';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
}

const LangContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  dir: 'ltr',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sf_lang') as Lang | null;
    if (stored === 'ar' || stored === 'en') setLangState(stored);
  }, []);

  // Apply dir + lang to <html> and persist
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('sf_lang', lang);

    // Persist to DB (fire-and-forget)
    fetch('/api/user/language', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang }),
    }).catch(() => {});
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
  }

  const value: LangCtx = {
    lang,
    setLang,
    t: (key: TranslationKey) => translate(lang, key),
    dir: lang === 'ar' ? 'rtl' : 'ltr',
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
