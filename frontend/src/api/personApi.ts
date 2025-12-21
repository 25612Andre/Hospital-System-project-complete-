import type { AxiosResponse } from "axios";
import httpClient from "./httpClient";
import type { LocationType } from "./locationApi";

export interface Person {
  id?: number;
  fullName: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  location?: {
    id?: number;
    name?: string;
    type?: LocationType;
    parentId?: number | null;
    path?: string;
  };
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PatientFilters {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
}

const hasFilters = (filters?: PatientFilters) =>
  !!filters && Object.values(filters).some((value) => value !== undefined && value !== "");

export const personApi = {
  list: async (params?: { page?: number; size?: number; sort?: string; q?: string; filters?: PatientFilters }) => {
    if (params?.q) {
      const { data } = await httpClient.get<PagedResult<Person>>("/patients/search", {
        params: { q: params.q, page: params.page, size: params.size, sort: params.sort },
      });
      return data;
    }
    if (hasFilters(params?.filters)) {
      const { data } = await httpClient.get<PagedResult<Person>>("/patients/filter", {
        params: {
          ...params?.filters,
          page: params?.page,
          size: params?.size,
          sort: params?.sort,
        },
      });
      return data;
    }
    const { data } = await httpClient.get<PagedResult<Person>>("/patients/page", {
      params,
    });
    return data;
  },

  listAll: async () => {
    const { data } = await httpClient.get<Person[]>("/patients");
    return data;
  },

  getById: async (id: number) => {
    const { data } = await httpClient.get<Person>(`/patients/${id}`);
    return data;
  },

  create: async (payload: Person) => {
    const { data } = await httpClient.post<Person>("/patients", payload);
    return data;
  },

  update: async (id: number, payload: Person) => {
    const { data } = await httpClient.put<Person>(`/patients/${id}`, payload);
    return data;
  },

  remove: async (id: number) => {
    const res: AxiosResponse<void> = await httpClient.delete(`/patients/${id}`);
    return res.data;
  },
};
