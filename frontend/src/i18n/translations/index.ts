import en from "./en";
import fr from "./fr";

export type TranslationKey = keyof typeof en;

type TranslationDictionary = Record<TranslationKey, string>;
type PartialTranslationDictionary = Partial<TranslationDictionary>;

export const translations: {
  en: TranslationDictionary;
  fr: PartialTranslationDictionary;
} = { en, fr };

export type Language = keyof typeof translations;
