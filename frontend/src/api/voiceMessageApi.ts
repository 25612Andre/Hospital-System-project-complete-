import type { AxiosRequestConfig } from "axios";
import httpClient from "./httpClient";

export interface VoiceMessageResponse {
    id: number;
    senderId: number;
    senderName: string;
    recipientId: number;
    recipientName: string;
    audioContentType: string;
    timestamp: string;
    isRead: boolean;
}

const fallbackOrigin =
    typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:8899";

const rawBase = import.meta.env.VITE_API_BASE_URL || fallbackOrigin;
const apiBase = rawBase.endsWith("/api") ? rawBase : `${rawBase.replace(/\/$/, "")}/api`;
const silentRequestConfig = { skipToast: true } as AxiosRequestConfig;
const silentBlobRequestConfig = {
    responseType: "blob",
    skipToast: true,
} as AxiosRequestConfig;

export const voiceMessageApi = {
    send: async (recipientId: number, audioFile: File) => {
        const formData = new FormData();
        formData.append("recipientId", recipientId.toString());
        formData.append("audio", audioFile);
        const { data } = await httpClient.post<VoiceMessageResponse>("/voice-messages", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return data;
    },
    getInbox: async () => {
        const { data } = await httpClient.get<VoiceMessageResponse[]>("/voice-messages/inbox");
        return data;
    },
    getSent: async () => {
        const { data } = await httpClient.get<VoiceMessageResponse[]>("/voice-messages/sent");
        return data;
    },
    getUnreadCount: async () => {
        const { data } = await httpClient.get<number>("/voice-messages/unread-count");
        return data;
    },
    markAsRead: async (id: number) => {
        await httpClient.put(`/voice-messages/${id}/read`, {}, silentRequestConfig);
    },
    getAudioUrl: (id: number) => {
        return `${apiBase}/voice-messages/${id}/audio`;
    },
    getAudioBlob: async (id: number) => {
        const response = await httpClient.get<Blob>(`/voice-messages/${id}/audio`, silentBlobRequestConfig);
        return response.data;
    },
};
