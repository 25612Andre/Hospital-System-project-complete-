import React from "react";
import AppButton from "../common/AppButton";
import { useAuth } from "../../context/useAuth";
import GlobalSearchBarEnhanced from "../common/GlobalSearchBarEnhanced";
import ThemeToggle from "../common/ThemeToggle";

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b bg-white/85 dark:bg-slate-900/85 backdrop-blur flex items-center justify-between px-6 relative z-50 transition-colors">
      <GlobalSearchBarEnhanced />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold">
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-tight">
          <div className="font-semibold text-slate-900 dark:text-white">{user?.username || "Guest"}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Secure session</div>
        </div>
        <AppButton variant="secondary" onClick={logout} className="ml-1">
          Logout
        </AppButton>
      </div>
    </header>
  );
};

export default TopBar;
