import React from "react";
import AppButton from "../common/AppButton";
import { useAuth } from "../../context/useAuth";
import GlobalSearchBarEnhanced from "../common/GlobalSearchBarEnhanced";
import ThemeToggle from "../common/ThemeToggle";
import resolveBackendAssetUrl from "../../api/assetUrl";
import LanguageSelect from "../common/LanguageSelect";
import { useI18n } from "../../i18n/I18nProvider";

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const avatarUrl = resolveBackendAssetUrl(user?.profilePictureUrl);
  const [avatarLoadFailed, setAvatarLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  return (
    <header className="h-16 border-b bg-white/85 dark:bg-slate-900/85 backdrop-blur flex items-center justify-between px-6 relative z-50 transition-colors">
      <GlobalSearchBarEnhanced />
        <div className="flex items-center gap-4">
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
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-tight">
          <div className="font-semibold text-slate-900 dark:text-white">{user?.username || t("topbar.guest")}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t("topbar.secureSession")}</div>
        </div>
        <AppButton variant="secondary" onClick={logout} className="ml-1">
          {t("topbar.logout")}
        </AppButton>
      </div>
    </header>
  );
};

export default TopBar;
