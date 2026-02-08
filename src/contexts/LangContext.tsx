import React, { createContext, useContext, useState, useCallback } from 'react';
import { Lang, t as translate, TranslationKey, isRTL } from '@/lib/i18n';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl' | 'ltr';
}

const LangContext = createContext<LangContextValue>({
  lang: 'ar',
  setLang: () => {},
  t: (key) => translate(key, 'ar'),
  dir: 'rtl',
});

export const useLang = () => useContext(LangContext);

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('ar');

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.dir = isRTL(l) ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  }, []);

  const tFn = useCallback((key: TranslationKey) => translate(key, lang), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: tFn, dir: isRTL(lang) ? 'rtl' : 'ltr' }}>
      {children}
    </LangContext.Provider>
  );
};
