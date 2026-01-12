import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export interface UserAccount {
    id: number;
    username: string;
    role: "ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTIONIST";
    twoFactorEnabled?: boolean;
    profilePictureUrl?: string;
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
    create: async (data: any, profilePicture?: File) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        if (profilePicture) {
            formData.append("profilePicture", profilePicture);
        }
        const response = await httpClient.post<UserAccount>("/users", formData);
        return response.data;
    },

    list: async (params?: any) => {
        const { data } = await httpClient.get<PagedResult<UserAccount>>("/users/search", { params });
        return data;
    },

    updateProfile: async (payload: UserProfileUpdatePayload) => {
        const { data } = await httpClient.put<UserAccount>("/users/profile", payload);
        return data;
    },

    getProfile: async () => {
        const { data } = await httpClient.get<UserAccount>("/users/profile");
        return data;
    },

    updateProfilePicture: async (profilePicture: File) => {
        const formData = new FormData();
        formData.append("profilePicture", profilePicture);
        const { data } = await httpClient.put<UserAccount>("/users/profile-picture", formData);
        return data;
    },
};
