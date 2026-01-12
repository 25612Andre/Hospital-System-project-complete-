import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import type { Role } from "../../context/authTypes";
import { useI18n } from "../../i18n/I18nProvider";
import type { TranslationKey } from "../../i18n/translations";

const links: Array<{ to: string; labelKey: TranslationKey; roles?: Role[] }> = [
  { to: "/", labelKey: "nav.dashboard" },
  { to: "/profile", labelKey: "nav.profile" },
  { to: "/patients", labelKey: "nav.patients", roles: ["ADMIN", "DOCTOR"] },
  { to: "/doctors", labelKey: "nav.doctors", roles: ["ADMIN", "DOCTOR"] },
  { to: "/appointments", labelKey: "nav.appointments", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
  { to: "/messages", labelKey: "nav.messages" },
  { to: "/bills", labelKey: "nav.bills", roles: ["ADMIN", "PATIENT"] },
  { to: "/locations", labelKey: "nav.locations", roles: ["ADMIN"] },
  { to: "/users", labelKey: "nav.users", roles: ["ADMIN"] },
  { to: "/roles", labelKey: "nav.roles", roles: ["ADMIN"] },
  { to: "/notifications", labelKey: "nav.auditLogs", roles: ["ADMIN"] },
];

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const allowedLinks = links.filter((link) => !link.roles || (user && link.roles.includes(user.role as Role)));

  return (
    <aside className="w-64 bg-slate-950 dark:bg-slate-950 text-slate-100 h-full flex flex-col border-r border-slate-900 dark:border-slate-800 shadow-xl transition-colors">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200 dark:text-primary-300">{t("layout.hospital")}</div>
        <div className="mt-1 text-xl font-bold">{t("layout.managementSuite")}</div>
      </div>
      <div className="px-5 py-3 border-b border-white/10 text-xs uppercase tracking-wide text-slate-300">
        {t("layout.signedInAs")} <span className="font-semibold text-white">{user?.username || t("topbar.guest")}</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {allowedLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                "mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                "hover:bg-white/5 hover:text-white",
                isActive ? "bg-white/10 text-white border border-white/10 shadow-sm" : "text-slate-200",
              ].join(" ")
            }
          >
            <span className="h-2 w-2 rounded-full bg-primary-400 dark:bg-primary-500 opacity-70" />
            <span className="flex-1">{t(link.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10 text-xs text-slate-400">
        {t("layout.secureAudited")}
      </div>
    </aside>
  );
};

export default Sidebar;
