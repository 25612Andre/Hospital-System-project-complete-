import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

interface Props {
  allowed: string[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<Props> = ({ allowed, children }) => {
  const { user, roles } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const allowedRole = roles.some((r: string) => allowed.includes(r));
  if (!allowedRole) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RoleGuard;
