import httpClient from "./httpClient";

export interface LoginPayload {
  username: string;
  password: string;
  role?: string; // optional role hint; backend will ignore if not required
}

export interface SignupPayload {
  username: string;
  password: string;
  role: string;
  patientId?: number;
  doctorId?: number;
  // Patient Registration
  fullName?: string;
  age?: number;
  gender?: string;
  phone?: string;
  locationId?: number;
  // Doctor Registration
  departmentId?: number;
  specialization?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  patientId?: number;
  doctorId?: number;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  requires2fa?: boolean;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await httpClient.post<LoginResponse>("/auth/login", payload);
    return data;
  },

  requestPasswordReset: async (email: string) => {
    const { data } = await httpClient.post<string>("/auth/forgot-password", { email });
    return data;
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    const { data } = await httpClient.post<string>("/auth/reset-password", {
      email,
      token,
      newPassword,
    });
    return data;
  },

  send2faCode: async (username: string) => {
    const { data } = await httpClient.post<string>("/auth/2fa/send", { username });
    return data;
  },

  verify2faCode: async (username: string, code: string): Promise<LoginResponse> => {
    const { data } = await httpClient.post<LoginResponse>("/auth/2fa/verify", {
      username,
      code,
    });
    return data;
  },

  signup: async (payload: SignupPayload) => {
    const { data } = await httpClient.post("/auth/signup", payload);
    return data;
  },
};
