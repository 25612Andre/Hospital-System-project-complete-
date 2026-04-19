import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export interface UserAccount {
    id: number;
    username: string;
    role: "ADMIN" | "DOCTOR" | "PATIENT";
    twoFactorEnabled?: boolean;
    profilePictureUrl?: string;
    location?: { id: number; name: string };
    patient?: { id: number; fullName: string };
    doctor?: { id: number; name: string };
    enabled?: boolean;
}

export type UserProfileUpdatePayload = {
    username?: string;
    role?: string;
    password?: string;
    fullName?: string;
    phone?: string;
    specialization?: string;
    biography?: string;
    gender?: string;
    age?: number;
    locationId?: number;
    locationName?: string;
    enabled?: boolean;
};

export type UserAccountCreatePayload = Record<string, string | number | boolean | null | undefined>;

export type UserListParams = {
    q?: string;
    page?: number;
    size?: number;
    sort?: string;
};

export const userApi = {
    create: async (data: UserAccountCreatePayload, profilePicture?: File) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });
        if (profilePicture) {
            formData.append("profilePicture", profilePicture);
        }
        const response = await httpClient.post<UserAccount>("/users", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },

    list: async (params?: UserListParams) => {
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
        const { data } = await httpClient.put<UserAccount>("/users/profile-picture", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return data;
    },
    updateUser: async (id: number, payload: UserProfileUpdatePayload) => {
        const { data } = await httpClient.put<UserAccount>(`/users/${id}`, payload);
        return data;
    },
    remove: async (id: number) => {
        await httpClient.delete(`/users/${id}`);
    },
};
