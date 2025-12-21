import httpClient from "./httpClient";
import type { SearchResultDTO } from "../dto/SearchResultDTO";
import type { LocationNode } from "./locationApi";

export interface DashboardSummary {
  patients: number;
  doctors: number;
  departments: number;
  appointments: number;
  todayAppointments: number;
  completedAppointments: number;
  bills: number;
  revenue: number;
  locations: number;
}

interface DashboardSummaryDTO {
  totalPatients: number;
  totalDoctors: number;
  totalDepartments: number;
  totalAppointments: number;
  todayAppointments: number;
  completedAppointments: number;
  totalBills: number;
  totalRevenue: number;
  totalLocations: number;
}

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const { data } = await httpClient.get<DashboardSummaryDTO>("/dashboard/summary");
    return {
      patients: data.totalPatients,
      doctors: data.totalDoctors,
      departments: data.totalDepartments,
      appointments: data.totalAppointments,
      todayAppointments: data.todayAppointments,
      completedAppointments: data.completedAppointments,
      bills: data.totalBills,
      revenue: data.totalRevenue,
      locations: data.totalLocations,
    };
  },

  globalSearch: async (term: string) => {
    const { data } = await httpClient.get<Record<string, SearchResultDTO[]>>("/search", {
      params: { q: term },
    });
    return data;
  },

  locations: async () => {
    const { data } = await httpClient.get<LocationNode[]>("/locations");
    return data;
  },
};
