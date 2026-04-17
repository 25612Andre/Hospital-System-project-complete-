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
        <div className="order-2 md:order-1 w-full md:max-w-xl">
          <GlobalSearchBarEnhanced />
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
