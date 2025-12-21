import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export interface UserAccount {
    id: number;
    username: string;
    role: "ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTIONIST";
    twoFactorEnabled?: boolean;
    location?: { id: number; name: string };
    patient?: { id: number; fullName: string };
    doctor?: { id: number; name: string };
}

export type UserProfileUpdatePayload = {
    username?: string; // usually ignored for profile update logic unless admin
    password?: string;
    fullName?: string;
    phone?: string;
    specialization?: string;
    gender?: string;
    age?: number;
};

export const userApi = {
    list: async (params?: any) => {
        const { data } = await httpClient.get<PagedResult<UserAccount>>("/users/search", { params });
        return data;
    },

    updateProfile: async (payload: UserProfileUpdatePayload) => {
        const { data } = await httpClient.put<UserAccount>("/users/profile", payload);
        return data;
    }
};
