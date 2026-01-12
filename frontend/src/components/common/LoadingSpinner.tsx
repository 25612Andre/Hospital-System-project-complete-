import React from "react";
import { useI18n } from "../../i18n/I18nProvider";

const LoadingSpinner: React.FC<{ label?: string }> = ({ label }) => {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("common.loading");

  return (
    <div className="w-full flex items-center justify-center py-8 text-blue-600">
      <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      {resolvedLabel}
    </div>
  );
};

export default LoadingSpinner;
