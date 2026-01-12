import React, { useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { AuthContext } from "./authContext";
import type { AuthContextValue, Role } from "./authTypes";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<AuthContextValue["user"]>(() => {
    const savedUser = localStorage.getItem("auth_user");
    if (savedUser) return JSON.parse(savedUser) as AuthContextValue["user"];
    const pending = localStorage.getItem("pending_user");
    return pending ? (JSON.parse(pending) as AuthContextValue["user"]) : null;
  });
  const [requires2fa, setRequires2fa] = useState(() => {
    const hasPending = !!localStorage.getItem("pending_user");
    const hasToken = !!localStorage.getItem("auth_token");
    return hasPending && !hasToken;
  });

  const roles = useMemo<Role[]>(() => {
    if (!user?.role) return [];
    // Normalize roles to uppercase and strip any ROLE_ prefix to align with guards
    const normalized = user.role.replace(/^ROLE_/i, "").toUpperCase();
    return [normalized as Role];
  }, [user]);

  const login = async (payload: Parameters<AuthContextValue["login"]>[0]) => {
    localStorage.removeItem("pending_2fa_code");
    const res = await authApi.login(payload);
    if (res.requires2fa) {
      setRequires2fa(true);
      setUser(res.user);
      localStorage.setItem("pending_user", JSON.stringify(res.user));
      if (res.token) {
        localStorage.setItem("pending_2fa_code", res.token);
      }
      return "2FA";
    }
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("auth_token", res.token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    localStorage.removeItem("pending_user");
    setRequires2fa(false);
    return "OK";
  };

  const verify2fa = async (code: string) => {
    const pendingUser = user || (() => {
      const stored = localStorage.getItem("pending_user");
      return stored ? JSON.parse(stored) : null;
    })();
    if (!pendingUser) throw new Error("No pending user");
    const res = await authApi.verify2faCode(pendingUser.username, code);
    setRequires2fa(false);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem("auth_token", res.token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    localStorage.removeItem("pending_user");
    localStorage.removeItem("pending_2fa_code");
  };

  const send2fa = async (username: string) => {
    await authApi.send2faCode(username);
  };

  const updateUser: AuthContextValue["updateUser"] = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("auth_user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRequires2fa(false);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("pending_user");
    localStorage.removeItem("pending_2fa_code");
  };

  const value: AuthContextValue = {
    user,
    token,
    roles,
    requires2fa,
    login,
    verify2fa,
    send2fa,
    updateUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
