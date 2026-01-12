import React from "react";
import { useI18n } from "../../i18n/I18nProvider";
import type { Language } from "../../i18n/translations";

const LanguageSelect: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className={["inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300", className].filter(Boolean).join(" ")}>
      <span className="font-semibold">{t("common.language")}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        aria-label={t("common.language")}
      >
        <option value="en">{t("common.english")}</option>
        <option value="fr">{t("common.french")}</option>
      </select>
    </label>
  );
};

export default LanguageSelect;

