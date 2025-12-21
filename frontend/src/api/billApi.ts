import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export interface Bill {
  id: number;
  amount: number;
  issuedDate: string;
  status: string;
  appointment?: {
    id: number;
    patient?: { id: number; fullName?: string; email?: string; phone?: string };
    doctor?: { id: number; name?: string; specialization?: string; contact?: string; department?: { name: string } };
    appointmentDate?: string;
    notes?: string;
  };
  paymentMethod?: string;
}

export type BillUpdatePayload = {
  amount?: number;
  status?: string;
  paymentMethod?: string;
};

export const billApi = {
  listPage: async (params?: { page?: number; size?: number; sort?: string; q?: string }) => {
    const { data } = await httpClient.get<PagedResult<Bill>>(params?.q ? "/bills/search" : "/bills/page", {
      params: params?.q ? { q: params.q, page: params.page, size: params.size, sort: params.sort } : params,
    });
    return data;
  },
  listAll: async () => {
    const { data } = await httpClient.get<Bill[]>("/bills");
    return data;
  },
  generate: async (appointmentId: number) => {
    const { data } = await httpClient.post<Bill>(`/bills/generate/${appointmentId}`);
    return data;
  },
  update: async (id: number, payload: BillUpdatePayload) => {
    const { data } = await httpClient.put<Bill>(`/bills/${id}`, payload);
    return data;
  },
};
