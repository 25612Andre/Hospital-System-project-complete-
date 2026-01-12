const fallbackOrigin =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "http://localhost:8899";

const rawBase = import.meta.env.VITE_API_BASE_URL || fallbackOrigin;
const backendOrigin = rawBase.endsWith("/api") ? rawBase.slice(0, -4) : rawBase.replace(/\/$/, "");

export const resolveBackendAssetUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${backendOrigin}${normalized}`;
};

export default resolveBackendAssetUrl;

