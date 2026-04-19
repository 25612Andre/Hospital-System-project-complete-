import React from "react";
import AppButton from "../common/AppButton";
import { useAuth } from "../../context/useAuth";
import GlobalSearchBarEnhanced from "../common/GlobalSearchBarEnhanced";
import ThemeToggle from "../common/ThemeToggle";
import resolveBackendAssetUrl from "../../api/assetUrl";
import LanguageSelect from "../common/LanguageSelect";
import { useI18n } from "../../i18n/I18nProvider";

interface TopBarProps {
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const avatarUrl = resolveBackendAssetUrl(user?.profilePictureUrl);
  const [avatarLoadFailed, setAvatarLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  return (
    <header className="border-b bg-white/85 dark:bg-slate-900/85 backdrop-blur px-3 sm:px-6 py-3 relative z-50 transition-colors">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="order-2 md:order-1 w-full md:max-w-xl flex items-center gap-4">
          <GlobalSearchBarEnhanced />
          <div className="hidden lg:flex shrink-0">
             <a href="tel:0790802083" className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full border border-red-100 transition-all hover:scale-105">
                <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="whitespace-nowrap">{t("common.emergency")}: 0790802083</span>
             </a>
          </div>
        </div>
        <div className="order-1 md:order-2 flex items-center justify-between md:justify-end gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-700 dark:text-slate-200 dark:border-slate-700"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <ThemeToggle />
          <LanguageSelect />
          <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold overflow-hidden">
            {avatarUrl && !avatarLoadFailed ? (
              <img
                src={avatarUrl}
                alt={t("topbar.profilePictureAlt")}
                className="h-full w-full object-cover"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              user?.username?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="hidden sm:block text-sm text-slate-700 dark:text-slate-300 leading-tight">
            <div className="font-semibold text-slate-900 dark:text-white max-w-[220px] truncate">{user?.username || t("topbar.guest")}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t("topbar.secureSession")}</div>
          </div>
          <AppButton variant="secondary" onClick={logout} className="ml-1 hidden sm:inline-flex">
            {t("topbar.logout")}
          </AppButton>
          <button
            type="button"
            onClick={logout}
            className="sm:hidden inline-flex items-center justify-center h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 dark:border-slate-700"
          >
            {t("topbar.logout")}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
