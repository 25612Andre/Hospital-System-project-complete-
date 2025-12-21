import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export interface Role {
  id: number;
  name: string;
}

const defaultRoles: Role[] = [
  { id: 1, name: "ADMIN" },
  { id: 2, name: "DOCTOR" },
  { id: 3, name: "PATIENT" },
  { id: 4, name: "RECEPTIONIST" },
];

const fallbackPage = (page = 0, size = defaultRoles.length): PagedResult<Role> => {
  const safeSize = size > 0 ? size : defaultRoles.length || 1;
  const start = page * safeSize;
  const content = defaultRoles.slice(start, start + safeSize);
  const totalElements = defaultRoles.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / safeSize || 1));
  return {
    content,
    totalElements,
    totalPages,
    number: page,
    size: safeSize,
  };
};

export const roleApi = {
  list: async () => {
    try {
      const { data } = await httpClient.get<Role[]>("/roles");
      return data && data.length > 0 ? data : defaultRoles;
    } catch {
      return defaultRoles;
    }
  },
  listPage: async (params?: { page?: number; size?: number }) => {
    const page = params?.page ?? 0;
    const size = params?.size && params.size > 0 ? params.size : defaultRoles.length;
    try {
      const { data } = await httpClient.get<PagedResult<Role>>("/roles/page", {
        params: { page, size },
      });
      if (data?.content) {
        return data;
      }
    } catch {
      // fall back to static roles so the page still works during demos
    }
    return fallbackPage(page, size);
  },
};
