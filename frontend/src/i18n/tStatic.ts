import { translations, type Language, type TranslationKey } from "./translations";

type Vars = Record<string, string | number>;

const STORAGE_KEY = "hms_language";

const interpolate = (template: string, vars?: Vars) =>
  template.replace(/\{\{(\w+)\}\}/g, (_match, key) => String(vars?.[key] ?? ""));

const resolveLanguage = (): Language => {
  const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (saved === "en" || saved === "fr") return saved;
  const navLang = typeof navigator !== "undefined" ? navigator.language : "";
  if (navLang?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
};

export const tStatic = (key: TranslationKey, vars?: Vars) => {
  const lang = resolveLanguage();
  const value = translations[lang][key] ?? translations.en[key] ?? key;
  return interpolate(value, vars);
};

