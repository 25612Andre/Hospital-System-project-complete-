import React from "react";
import { translations, type Language, type TranslationKey } from "./translations";

type Vars = Record<string, string | number>;

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "hms_language";

const interpolate = (template: string, vars?: Vars) =>
  template.replace(/\{\{(\w+)\}\}/g, (_match, key) => String(vars?.[key] ?? ""));

const resolveInitialLanguage = (): Language => {
  const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (saved === "en" || saved === "fr") return saved;
  const navLang = typeof navigator !== "undefined" ? navigator.language : "";
  if (navLang?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = React.useState<Language>(resolveInitialLanguage);

  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, []);

  const t = React.useCallback((key: TranslationKey, vars?: Vars) => {
    const value = translations[language][key] ?? translations.en[key] ?? key;
    return interpolate(value, vars);
  }, [language]);

  const value = React.useMemo<I18nContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
};

