import React, { useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { AuthContext } from "./authContext";
import type { AuthContextValue, Role } from "./authTypes";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<AuthContextValue["user"]>(() => {
    const savedUser = localStorage.getItem("auth_user");
    return savedUser ? (JSON.parse(savedUser) as AuthContextValue["user"]) : null;
  });
  const [requires2fa, setRequires2fa] = useState(false);

  const roles = useMemo<Role[]>(() => {
    if (!user?.role) return [];
    // Normalize roles to uppercase and strip any ROLE_ prefix to align with guards
    const normalized = user.role.replace(/^ROLE_/i, "").toUpperCase();
    return [normalized as Role];
  }, [user]);

  const login = async (
    payload: Parameters<AuthContextValue["login"]>[0]
  ): Promise<"OK"> => {
    const res = await authApi.login(payload);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("auth_token", res.token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    setRequires2fa(false);
    return "OK" as const;
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
    void authApi.logout().catch(() => undefined);
    setUser(null);
    setToken(null);
    setRequires2fa(false);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
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
