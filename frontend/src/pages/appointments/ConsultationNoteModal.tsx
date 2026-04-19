import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AppButton from "../../components/common/AppButton";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import type { Appointment } from "../../api/appointmentApi";
import { consultationNoteApi, type PrescriptionItemPayload } from "../../api/consultationNoteApi";
import { personApi, type Person } from "../../api/personApi";
import resolveBackendAssetUrl from "../../api/assetUrl";
import { useI18n } from "../../i18n/I18nProvider";

interface Props {
  appointment: Appointment;
  canEdit: boolean;
  onClose: () => void;
}

const emptyPrescription = (): PrescriptionItemPayload => ({
  medicationName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

const ConsultationNoteModal: React.FC<Props> = ({ appointment, canEdit, onClose }) => {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();

  const { data: note, isLoading } = useQuery({
    queryKey: ["consultation-note", appointment.id],
    queryFn: () => consultationNoteApi.getOrNull(appointment.id),
    retry: false,
  });
  
  const { data: fullPatient } = useQuery<Person>({
    queryKey: ["patient-full", appointment.patient?.id],
    queryFn: () => personApi.getById(Number(appointment.patient?.id)),
    enabled: !!appointment.patient?.id,
  });

  const [observations, setObservations] = React.useState("");
  const [prescriptions, setPrescriptions] = React.useState<PrescriptionItemPayload[]>([]);
  const [sendEmail, setSendEmail] = React.useState(true);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = React.useState<string>("");
  const [existingAudioUrl, setExistingAudioUrl] = React.useState<string>("");
  const [audioLoading, setAudioLoading] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<BlobPart[]>([]);

  React.useEffect(() => {
    if (note) {
      setObservations(note.observations || "");
      setPrescriptions(
        (note.prescriptions || []).map((p) => ({
          medicationName: p.medicationName || "",
          dosage: p.dosage || "",
          frequency: p.frequency || "",
          duration: p.duration || "",
          instructions: p.instructions || "",
        }))
      );
    } else {
      setObservations("");
      setPrescriptions([]);
    }
    setSendEmail(true);
    setAudioBlob(null);
    setAudioPreviewUrl("");
  }, [note, appointment.id]);

  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  React.useEffect(() => {
    return () => {
      if (existingAudioUrl) {
        URL.revokeObjectURL(existingAudioUrl);
      }
    };
  }, [existingAudioUrl]);

  React.useEffect(() => {
    let cancelled = false;
    const loadAudio = async () => {
      setExistingAudioUrl("");
      if (!note?.hasAudio) return;
      setAudioLoading(true);
      try {
        const blob = await consultationNoteApi.getAudioOrNull(appointment.id);
        if (cancelled) return;
        if (blob) {
          setExistingAudioUrl(URL.createObjectURL(blob));
        }
      } catch {
        // errors are handled by httpClient interceptor unless validateStatus handles it
      } finally {
        if (!cancelled) setAudioLoading(false);
      }
    };
    loadAudio();
    return () => {
      cancelled = true;
    };
  }, [appointment.id, note?.hasAudio]);

  const pickMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
      "audio/wav",
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const startRecording = async () => {
    if (!canEdit || isRecording) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error(t("appointments.consultationNote.audio.notSupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsRecording(false);
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error(t("appointments.consultationNote.audio.permissionDenied"));
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {
      // ignore
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioPreviewUrl("");
  };

  const buildAudioFile = React.useCallback((): File | undefined => {
    if (!audioBlob) return undefined;
    const mime = audioBlob.type || "audio/webm";
    const ext = mime.includes("ogg") ? "ogg" : mime.includes("mpeg") ? "mp3" : mime.includes("wav") ? "wav" : mime.includes("mp4") ? "m4a" : "webm";
    return new File([audioBlob], `appointment-${appointment.id}-observation.${ext}`, { type: mime });
  }, [audioBlob, appointment.id]);

  const mutation = useMutation({
    mutationFn: () =>
      consultationNoteApi.upsert(appointment.id, {
        observations,
        prescriptions: prescriptions
          .map((p) => ({
            medicationName: p.medicationName?.trim(),
            dosage: p.dosage?.trim() || undefined,
            frequency: p.frequency?.trim() || undefined,
            duration: p.duration?.trim() || undefined,
            instructions: p.instructions?.trim() || undefined,
          }))
          .filter((p) => !!p.medicationName),
        sendEmail,
      }, buildAudioFile()),
    onSuccess: async () => {
      toast.success(sendEmail ? t("appointments.consultationNote.savedAndEmailed") : t("appointments.consultationNote.saved"));
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["consultation-note", appointment.id] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || t("common.requestFailed");
      toast.error(msg);
    },
  });

  const addPrescription = () => setPrescriptions((prev) => [...prev, emptyPrescription()]);
  const removePrescription = (index: number) => setPrescriptions((prev) => prev.filter((_item, i) => i !== index));
  const updatePrescription = (index: number, patch: Partial<PrescriptionItemPayload>) =>
    setPrescriptions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const handleSave = () => {
    if (!canEdit) return;
    if (!observations.trim()) {
      toast.error(t("appointments.consultationNote.validation.observationsRequired"));
      return;
    }
    if (isRecording) {
      toast.error(t("appointments.consultationNote.audio.stopBeforeSave"));
      return;
    }
    mutation.mutate();
  };

  const title = canEdit ? t("appointments.consultationNote.title") : t("appointments.consultationNote.viewTitle");
  const appointmentDate = React.useMemo(() => new Date(appointment.appointmentDate).toLocaleString(language), [appointment.appointmentDate, language]);
  const patientName = appointment.patient?.fullName || t("common.na");
  const doctorName = appointment.doctor?.name || t("common.na");
  const status = appointment.status || t("common.na");
  const noteTimestamp = note?.updatedAt || note?.createdAt;
  const noteTimestampLabel = noteTimestamp ? new Date(noteTimestamp).toLocaleString(language) : null;

  const statusStyle = React.useMemo(() => {
    const value = String(appointment.status || "").trim().toLowerCase();
    if (value === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (value === "cancelled" || value === "canceled") return "bg-rose-50 text-rose-700 border-rose-200";
    if (value === "requested") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  }, [appointment.status]);

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="px-6 py-5 border-b bg-gradient-to-r from-indigo-50 via-white to-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 font-semibold text-slate-700">
                  #{appointment.id}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2.5 py-1">{appointmentDate}</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2.5 py-1">{patientName}</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2.5 py-1">{doctorName}</span>
                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 font-semibold", statusStyle].join(" ")}>{status}</span>
              </div>
              {noteTimestampLabel && <div className="mt-2 text-xs text-slate-500">{noteTimestampLabel}</div>}
            </div>
            <AppButton variant="secondary" onClick={onClose}>
              {t("common.close")}
            </AppButton>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/30">
          {/* Patient Profile Header */}
          {fullPatient && (
            <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-5 items-center md:items-start anim-fade-in">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-100 shadow-sm shrink-0">
                {fullPatient.profilePictureUrl ? (
                  <img 
                    src={resolveBackendAssetUrl(fullPatient.profilePictureUrl)} 
                    alt={fullPatient.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-indigo-300 bg-indigo-50">
                    {fullPatient.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="sm:col-span-2">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    {language === 'fr' ? 'Nom complet' : 'Full Name'}
                  </span>
                  <span className="text-lg font-bold text-slate-800">{fullPatient.fullName}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    {language === 'fr' ? 'Âge / Sexe' : 'Age / Gender'}
                  </span>
                  <span className="font-semibold text-slate-700">{fullPatient.age} ans • {fullPatient.gender}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    {language === 'fr' ? 'Contact' : 'Contact'}
                  </span>
                  <span className="font-semibold text-slate-700">{fullPatient.phone || fullPatient.email}</span>
                </div>
                <div className="sm:col-span-2 md:col-span-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    {language === 'fr' ? 'Localisation' : 'Location'}
                  </span>
                  <span className="text-slate-600 font-medium">
                    {fullPatient.location?.path || fullPatient.locationName || (language === 'fr' ? 'Non spécifié' : 'Not specified')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-10">
              <LoadingSpinner label={t("common.loading")} />
            </div>
          ) : (
            <>
              {!note && !canEdit && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                  {t("appointments.consultationNote.noneYet")}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{t("appointments.consultationNote.observations")}</div>
                  </div>
                  {canEdit && <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-full">*</span>}
                </div>

                <textarea
                  className="mt-3 w-full min-h-40 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder={t("appointments.consultationNote.observationsPlaceholder")}
                  disabled={!canEdit}
                />

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm font-semibold text-slate-900">{t("appointments.consultationNote.audio.title")}</div>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        {isRecording ? (
                          <AppButton
                            variant="secondary"
                            className="text-red-600 hover:text-red-700 hover:border-red-200"
                            onClick={stopRecording}
                            disabled={mutation.isPending}
                          >
                            {t("appointments.consultationNote.audio.stop")}
                          </AppButton>
                        ) : (
                          <AppButton variant="secondary" onClick={startRecording} disabled={mutation.isPending}>
                            {t("appointments.consultationNote.audio.start")}
                          </AppButton>
                        )}
                        {audioBlob && (
                          <AppButton variant="secondary" onClick={clearRecording} disabled={mutation.isPending}>
                            {t("appointments.consultationNote.audio.clear")}
                          </AppButton>
                        )}
                      </div>
                    )}
                  </div>

                  {audioLoading && (
                    <div className="text-xs text-slate-500">{t("common.loading")}</div>
                  )}

                  {(audioPreviewUrl || existingAudioUrl) && (
                    <div className="space-y-3">
                      <audio className="w-full" controls src={audioPreviewUrl || existingAudioUrl} />
                      <div className="flex justify-end">
                        <AppButton
                          variant="secondary"
                          onClick={() => {
                            window.location.href = "/messages";
                          }}
                          className="text-xs"
                        >
                          {t("nav.messages")}
                        </AppButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold text-slate-900">{t("appointments.consultationNote.prescriptions")}</div>
                  {canEdit && (
                    <AppButton variant="secondary" onClick={addPrescription}>
                      {t("appointments.consultationNote.addMedication")}
                    </AppButton>
                  )}
                </div>

                {prescriptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    {t("appointments.consultationNote.noMedications")}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((item, index) => (
                      <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-4 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {index + 1}
                            </span>
                            <span>{t("appointments.consultationNote.medicationName")}</span>
                          </div>

                          {canEdit && (
                            <AppButton
                              variant="secondary"
                              className="text-red-600 hover:text-red-700 hover:border-red-200"
                              onClick={() => removePrescription(index)}
                            >
                              {t("common.remove")}
                            </AppButton>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{t("appointments.consultationNote.medicationName")}</label>
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
                              value={item.medicationName}
                              onChange={(e) => updatePrescription(index, { medicationName: e.target.value })}
                              placeholder={t("appointments.consultationNote.medicationNamePlaceholder")}
                              disabled={!canEdit}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{t("appointments.consultationNote.dosage")}</label>
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
                              value={item.dosage}
                              onChange={(e) => updatePrescription(index, { dosage: e.target.value })}
                              placeholder={t("appointments.consultationNote.dosagePlaceholder")}
                              disabled={!canEdit}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{t("appointments.consultationNote.frequency")}</label>
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
                              value={item.frequency}
                              onChange={(e) => updatePrescription(index, { frequency: e.target.value })}
                              placeholder={t("appointments.consultationNote.frequencyPlaceholder")}
                              disabled={!canEdit}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{t("appointments.consultationNote.duration")}</label>
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
                              value={item.duration}
                              onChange={(e) => updatePrescription(index, { duration: e.target.value })}
                              placeholder={t("appointments.consultationNote.durationPlaceholder")}
                              disabled={!canEdit}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">{t("appointments.consultationNote.instructions")}</label>
                          <textarea
                            className="w-full min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
                            value={item.instructions}
                            onChange={(e) => updatePrescription(index, { instructions: e.target.value })}
                            placeholder={t("appointments.consultationNote.instructionsPlaceholder")}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-900">{t("appointments.consultationNote.sendEmail")}</div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input type="checkbox" className="sr-only peer" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus-visible:ring-2 peer-focus-visible:ring-primary-200 peer-checked:bg-primary-600 transition-colors" />
                      <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {canEdit && (
          <div className="px-6 py-4 border-t bg-white/90 backdrop-blur flex items-center justify-end gap-2">
            <AppButton variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              {t("common.cancel")}
            </AppButton>
            <AppButton onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? t("common.saving") : t("common.save")}
            </AppButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationNoteModal;
