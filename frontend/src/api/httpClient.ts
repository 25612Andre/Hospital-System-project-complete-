import axios from "axios";
import { toast } from "react-toastify";

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
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Request failed. Please check backend availability.";
    if (status === 401 || status === 403) {
      toast.error("Session expired or unauthorized. Please sign in again.");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("pending_user");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }, 500);
    } else {
      toast.error(typeof message === "string" ? message : "Request failed");
    }
    return Promise.reject(error);
  }
);

export default httpClient;
