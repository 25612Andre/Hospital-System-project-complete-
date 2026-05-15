import axios from "axios";
import { toast } from "react-toastify";
import { tStatic } from "../i18n/tStatic";

// Prefer explicit env; otherwise fall back to current origin (works for dev proxy and prod) or localhost:8899.
const fallbackOrigin =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "http://localhost:8899";
const rawBase = import.meta.env.VITE_API_BASE_URL || fallbackOrigin;
// Ensure we always hit the backend /api prefix even if the env var is missing it.
const baseURL = rawBase.endsWith("/api") ? rawBase : `${rawBase.replace(/\/$/, "")}/api`;

const httpClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

const toUserFriendlyError = (raw: unknown): string => {
  if (typeof raw !== "string") return tStatic("errors.backendUnavailable");
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("code: not_found") ||
    lower.includes("404: not_found") ||
    lower.includes("<!doctype html") ||
    lower.includes("<html")
  ) {
    return tStatic("errors.backendUnavailable");
  }
  return trimmed;
};

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const isAuthFlowRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/2fa/verify") ||
      requestUrl.includes("/auth/2fa/send") ||
      requestUrl.includes("/auth/2fa/setup");
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      tStatic("errors.backendUnavailable");
    if ((status === 401 || status === 403) && !isAuthFlowRequest) {
      toast.error(tStatic("errors.sessionExpired"));
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("pending_user");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }, 500);
    } else if (!error.config?.skipToast) {
      const displayMsg = toUserFriendlyError(message);
      toast.error(displayMsg);
    }
    return Promise.reject(error);
  }
);

export default httpClient;
