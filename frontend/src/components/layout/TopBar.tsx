import React from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../common/AppButton";
import { useAuth } from "../../context/useAuth";
import GlobalSearchBar from "../common/GlobalSearchBar";

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleGlobalSearch = (term: string, filters: { type: string, sort: string }) => {
    if (!term.trim()) return;
    const params = new URLSearchParams();
    params.set("q", term.trim());
    if (filters.type !== "all") params.set("type", filters.type);
    params.set("sort", filters.sort);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <header className="h-16 border-b bg-white/85 backdrop-blur flex items-center justify-between px-6">
      <GlobalSearchBar onSearch={handleGlobalSearch} />
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="text-sm text-slate-700 leading-tight">
          <div className="font-semibold text-slate-900">{user?.username || "Guest"}</div>
          <div className="text-xs text-slate-500">Secure session</div>
        </div>
        <AppButton variant="secondary" onClick={logout} className="ml-1">
          Logout
        </AppButton>
      </div>
    </header>
  );
};

export default TopBar;
