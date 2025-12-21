import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export interface Department {
  id?: number;
  name: string;
  consultationFee: number;
}

export const departmentApi = {
  listPage: async (params?: { page?: number; size?: number; sort?: string }) => {
    const { data } = await httpClient.get<PagedResult<Department>>("/departments/page", { params });
    return data;
  },
  listAll: async () => {
    const { data } = await httpClient.get<Department[]>("/departments");
    return data;
  },
  create: async (payload: Department) => {
    const { data } = await httpClient.post<Department>("/departments", payload);
    return data;
  },
  update: async (id: number, payload: Department) => {
    const { data } = await httpClient.put<Department>(`/departments/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    await httpClient.delete(`/departments/${id}`);
  },
};
