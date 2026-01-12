import React from "react";
import { useI18n } from "../../i18n/I18nProvider";

const Footer: React.FC = () => {
  const { t } = useI18n();
  return (
    <footer className="h-12 border-t bg-white flex items-center justify-center text-xs text-slate-600">
      (c) {new Date().getFullYear()} {t("footer.appName")}
    </footer>
  );
};

export default Footer;
