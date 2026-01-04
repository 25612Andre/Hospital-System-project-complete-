import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import type { Role } from "../../context/authTypes";

const links: Array<{ to: string; label: string; roles?: Role[] }> = [
  { to: "/", label: "Dashboard" },
  { to: "/profile", label: "My Profile" },
  { to: "/patients", label: "Patients", roles: ["ADMIN", "DOCTOR"] },
  { to: "/doctors", label: "Doctors", roles: ["ADMIN", "DOCTOR"] },
  { to: "/appointments", label: "Appointments", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
  { to: "/bills", label: "Bills", roles: ["ADMIN", "PATIENT"] },
  { to: "/locations", label: "Locations", roles: ["ADMIN"] },
  { to: "/users", label: "Users", roles: ["ADMIN"] },
  { to: "/roles", label: "Roles", roles: ["ADMIN"] },
  { to: "/notifications", label: "Audit Logs", roles: ["ADMIN"] },
];

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const allowedLinks = links.filter((link) => !link.roles || (user && link.roles.includes(user.role as Role)));

  return (
    <aside className="w-64 bg-slate-950 dark:bg-slate-950 text-slate-100 h-full flex flex-col border-r border-slate-900 dark:border-slate-800 shadow-xl transition-colors">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200 dark:text-primary-300">Hospital</div>
        <div className="mt-1 text-xl font-bold">Management Suite</div>
      </div>
      <div className="px-5 py-3 border-b border-white/10 text-xs uppercase tracking-wide text-slate-300">
        Signed in as <span className="font-semibold text-white">{user?.username || "Guest"}</span>
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
            <span className="flex-1">{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10 text-xs text-slate-400">
        Secure • Audited • v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
