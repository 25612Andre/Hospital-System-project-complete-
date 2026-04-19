import type { LoginPayload, AuthUser } from "../api/authApi";

export type Role = "ADMIN" | "DOCTOR" | "PATIENT";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  roles: Role[];
  requires2fa: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<"OK" | "2FA">;
  verify2fa: (code: string) => Promise<void>;
  send2fa: (username: string) => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}
