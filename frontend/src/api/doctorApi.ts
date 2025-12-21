import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export interface Doctor {
  id?: number;
  name: string;
  contact: string;
  specialization: string;
  department?: {
    id: number;
    name?: string;
    consultationFee?: number;
  };
  location?: {
    id: number;
    name?: string;
    path?: string;
  };
}

export const doctorApi = {
  listPage: async (params?: { page?: number; size?: number; sort?: string; q?: string }) => {
    const { data } = await httpClient.get<PagedResult<Doctor>>(params?.q ? "/doctors/search" : "/doctors/page", {
      params: params?.q ? { q: params.q, page: params.page, size: params.size, sort: params.sort } : params,
    });
    return data;
  },
  listAll: async () => {
    const { data } = await httpClient.get<Doctor[]>("/doctors");
    return data;
  },
  get: async (id: number) => {
    const { data } = await httpClient.get<Doctor>(`/doctors/${id}`);
    return data;
  },
  create: async (payload: Doctor) => {
    const { data } = await httpClient.post<Doctor>("/doctors", payload);
    return data;
  },
  update: async (id: number, payload: Doctor) => {
    const { data } = await httpClient.put<Doctor>(`/doctors/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    await httpClient.delete(`/doctors/${id}`);
  },
};
