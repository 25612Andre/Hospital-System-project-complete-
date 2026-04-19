import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export interface AppointmentPayload {
  doctorId: number;
  patientId: number;
  appointmentDate: string;
  status?: string;
  consultationFee?: number;
  notes?: string;
}

export interface Appointment {
  id: number;
  appointmentDate: string;
  status: string;
  consultationFee: number;
  notes?: string;
  doctor?: { id: number; name: string; specialization?: string };
  patient?: { id: number; fullName?: string };
}

export const appointmentApi = {
  listPage: async (params?: { page?: number; size?: number; sort?: string; q?: string; patientId?: number; doctorId?: number }) => {
    const { data } = await httpClient.get<PagedResult<Appointment>>(params?.q ? "/appointments/search" : "/appointments/page", {
      params: params?.q ? { q: params.q, page: params.page, size: params.size, sort: params.sort } : params,
    });
    return data;
  },
  listAll: async (unbilledOnly?: boolean) => {
    const { data } = await httpClient.get<Appointment[]>("/appointments", {
      params: unbilledOnly ? { unbilled: true } : undefined,
    });
    return data;
  },
  create: async (payload: AppointmentPayload) => {
    const { data } = await httpClient.post<Appointment>("/appointments", payload);
    return data;
  },
  update: async (id: number, payload: AppointmentPayload) => {
    const { data } = await httpClient.put<Appointment>(`/appointments/${id}`, payload);
    return data;
  },
  complete: async (id: number) => {
    const { data } = await httpClient.put<Appointment>(`/appointments/${id}/complete`);
    return data;
  },
  remove: async (id: number) => {
    await httpClient.delete(`/appointments/${id}`);
  },
};
