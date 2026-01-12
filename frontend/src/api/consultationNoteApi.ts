import httpClient from "./httpClient";

export interface PrescriptionItemPayload {
  medicationName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface PrescriptionItem extends PrescriptionItemPayload {
  id: number;
}

export interface ConsultationNotePayload {
  observations: string;
  prescriptions?: PrescriptionItemPayload[];
  sendEmail?: boolean;
}

export interface ConsultationNote {
  id: number;
  appointmentId: number;
  doctorId?: number;
  doctorName?: string;
  patientId?: number;
  patientName?: string;
  patientEmail?: string;
  observations: string;
  hasAudio?: boolean;
  prescriptions: PrescriptionItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const consultationNoteApi = {
  getOrNull: async (appointmentId: number) => {
    const response = await httpClient.get<ConsultationNote>(`/appointments/${appointmentId}/consultation-note`, {
      validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
    });
    if (response.status === 204) return null;
    return response.data;
  },
  getAudioOrNull: async (appointmentId: number) => {
    const response = await httpClient.get<Blob>(`/appointments/${appointmentId}/consultation-note/audio`, {
      responseType: "blob",
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });
    if (response.status === 404) return null;
    return response.data;
  },
  upsert: async (appointmentId: number, payload: ConsultationNotePayload, audioFile?: File) => {
    if (audioFile) {
      const formData = new FormData();
      formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      formData.append("audio", audioFile);
      const { data } = await httpClient.put<ConsultationNote>(`/appointments/${appointmentId}/consultation-note`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    }
    const { data } = await httpClient.put<ConsultationNote>(`/appointments/${appointmentId}/consultation-note`, payload);
    return data;
  },
};
