import en from "./en";
import fr from "./fr";

export const translations = { en, fr } as const;
export type TranslationKey = keyof typeof translations.en;
export type Language = keyof typeof translations;

