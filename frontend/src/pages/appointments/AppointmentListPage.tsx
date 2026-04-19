import React, { useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AppTable from "../../components/common/AppTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import AppButton from "../../components/common/AppButton";
import { appointmentApi, type Appointment, type AppointmentPayload } from "../../api/appointmentApi";
import { doctorApi, type Doctor } from "../../api/doctorApi";
import { personApi, type Person, type PagedResult } from "../../api/personApi";
import StatsBar from "../../components/common/StatsBar";
import { useAuth } from "../../context/useAuth";
import ConsultationNoteModal from "./ConsultationNoteModal";
import { useI18n } from "../../i18n/I18nProvider";
import resolveBackendAssetUrl from "../../api/assetUrl";

const emptyForm = {
  doctorId: "",
  patientId: "",
  appointmentDate: "",
  status: "Scheduled",
  consultationFee: "",
};

const emptyQuestionnaire = {
  bloodType: "",
  contagiousDisease: "",
  allergies: "",
  chronicIllnesses: "",
  medications: "",
  surgeries: "",
  smoking: "No",
  alcohol: "No",
  familyHistory: "",
  reason: "",
};

const AppointmentListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [term, setTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [consultationAppointment, setConsultationAppointment] = useState<Appointment | null>(null);
  const [questionnaire, setQuestionnaire] = useState(emptyQuestionnaire);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [assignedVideo, setAssignedVideo] = useState("");
  const queryClient = useQueryClient();
  const { roles, user } = useAuth();
  const { language, t } = useI18n();

  const isAdmin = roles.includes("ADMIN");
  const isDoctor = roles.includes("DOCTOR");
  const isPatient = roles.includes("PATIENT");
  const canManage = roles.includes("ADMIN") || isDoctor;
  const canCreate = canManage || isPatient;

  const { data, isLoading, isError, refetch } = useQuery<PagedResult<Appointment>>({
    queryKey: ["appointments", page, term],
    queryFn: () => appointmentApi.listPage({ page, size, sort: "appointmentDate,desc", q: term || undefined }),
    retry: 1,
  });

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ["doctors-all"],
    queryFn: doctorApi.listAll,
  });

  const { data: patients } = useQuery<Person[]>({
    queryKey: ["patients-all"],
    queryFn: personApi.listAll,
    enabled: canManage,
  });

  const doctorOptions = useMemo(() => doctors ?? [], [doctors]);
  const patientOptions = useMemo(() => patients ?? [], [patients]);
  const selectedDoctor = useMemo(
    () => doctorOptions.find((doctor) => String(doctor.id) === form.doctorId) ?? null,
    [doctorOptions, form.doctorId]
  );
  const showDoctorPreview = Boolean(selectedDoctor) && (isPatient || isAdmin);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (data?.content || []).forEach((row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return counts;
  }, [data?.content]);

  React.useEffect(() => {
    // If patient opens form, auto-set patientId
    if (formOpen && !editingId && isPatient && user?.patientId) {
      setForm(prev => ({ ...prev, patientId: String(user.patientId) }));
    }
    // If doctor opens form, auto-set doctorId
    if (formOpen && !editingId && isDoctor && user?.doctorId) {
      const docId = String(user.doctorId);
      const doc = doctorOptions.find(d => String(d.id) === docId);
      const fee = doc?.department?.consultationFee;
      setForm(prev => ({
        ...prev,
        doctorId: docId,
        consultationFee: fee ? String(fee) : prev.consultationFee
      }));
    }
  }, [formOpen, editingId, isPatient, isDoctor, user, doctorOptions]);

  const resetForm = () => {
    setForm(emptyForm);
    setQuestionnaire(emptyQuestionnaire);
    setFormOpen(false);
    setEditingId(null);
  };

  const openConsultationNote = (appointment: Appointment) => setConsultationAppointment(appointment);
  const closeConsultationNote = () => setConsultationAppointment(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorId || !form.patientId || !form.appointmentDate) {
      toast.error(t("appointments.toast.detailsRequired"));
      return;
    }

    const selectedDate = new Date(form.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (selectedDate < today && !editingId) {
       toast.error(language === 'fr' ? "La date du rendez-vous ne peut pas être dans le passé" : "Appointment date cannot be in the past");
       return;
    }

    let dateStr = form.appointmentDate;
    if (dateStr.length === 16) {
      dateStr += ":00";
    }

    // Patients always create "Requested" appointments
    const statusToSubmit = isPatient ? "Requested" : form.status;

    let mergedNotes = "";
    if (isPatient && !editingId) {
      mergedNotes = `--- Pre-Appointment Questionnaire ---\n` +
        `Blood Type: ${questionnaire.bloodType}\n` +
        `Contagious Diseases: ${questionnaire.contagiousDisease}\n` +
        `Allergies: ${questionnaire.allergies}\n` +
        `Chronic Illnesses: ${questionnaire.chronicIllnesses}\n` +
        `Current Medications: ${questionnaire.medications}\n` +
        `Surgeries: ${questionnaire.surgeries}\n` +
        `Smoking: ${questionnaire.smoking}\n` +
        `Alcohol: ${questionnaire.alcohol}\n` +
        `Family History: ${questionnaire.familyHistory}\n` +
        `Reason for specifically choosing this doctor: ${questionnaire.reason}\n`;
    }

    const payload: AppointmentPayload = {
      doctorId: Number(form.doctorId),
      patientId: Number(form.patientId),
      appointmentDate: dateStr,
      status: statusToSubmit,
      consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
      notes: mergedNotes || undefined,
    };
    try {
      if (editingId) {
        await appointmentApi.update(editingId, payload);
        toast.success(t("appointments.toast.updated"));
      } else {
        await appointmentApi.create(payload);
        toast.success(isPatient ? t("appointments.toast.requested") : t("appointments.toast.created"));
        
        if (isPatient) {
          const doctor = doctorOptions.find(d => String(d.id) === String(form.doctorId));
          const spec = ((doctor?.specialization || "") + " " + (doctor?.department?.name || "")).toLowerCase();
          
          // Use dynamic video URLs if available
          let videoUrl = doctor?.videoUrl || doctor?.department?.educationalVideoUrl;

          if (!videoUrl) {
            videoUrl = language === 'fr' 
              ? "https://www.youtube.com/embed/Ol2tj61J2J0" // Default FR (General Medecine)
              : "https://www.youtube.com/embed/sEmnc_CmPR4"; // Default EN
              
            if (spec.includes("cardiolo")) {
              videoUrl = language === 'fr' 
                ? "https://www.youtube.com/embed/JMYNkjhxy_I" 
                : "https://www.youtube.com/embed/w2O5_klsuXc"; // Cardio
            } else if (spec.includes("pediatr") || spec.includes("pédiatr") || spec.includes("child") || spec.includes("enfant") || spec.includes("pedia")) {
              videoUrl = language === 'fr' 
                ? "https://www.youtube.com/embed/st9qu2RyJLM" 
                : "https://www.youtube.com/embed/ZKKNQ_lA1HQ"; // Ped
            } else if (spec.includes("neuro")) {
              videoUrl = language === 'fr' 
                ? "https://www.youtube.com/embed/jH2ZvKq_9Gk" 
                : "https://www.youtube.com/embed/HQk-0yALVBA"; // Neuro
            } else if (spec.includes("radio") || spec.includes("imagerie")) {
              videoUrl = language === 'fr' 
                ? "https://www.youtube.com/embed/A8U9EonFh8I" // Radio FR
                : "https://www.youtube.com/embed/S2C_A3aV7qA"; // Radio EN
            } else if (spec.includes("gyne") || spec.includes("gyné")) {
              videoUrl = language === 'fr' 
                ? "https://www.youtube.com/embed/7X84iC-U8X4" // Gyn FR
                : "https://www.youtube.com/embed/XW869m_pLzM"; // Gyn EN
            } else if (spec.includes("ophtal")) {
              videoUrl = language === 'fr' 
                ? "https://www.youtube.com/embed/v9qO_D4rY4Q" // Ophtal FR
                : "https://www.youtube.com/embed/Rk5E-qG9CIs"; // Ophtal EN
            } else if (spec.includes("derma")) {
              videoUrl = language === 'fr' 
                ? "https://www.youtube.com/embed/N-0-h7C4qyo" // Derma FR
                : "https://www.youtube.com/embed/ZqRk_lWbE7k"; // Derma EN
            } else if (spec.includes("chirur") || spec.includes("surger")) {
              videoUrl = language === 'fr' 
                ? "https://www.youtube.com/embed/8-P1Y5Qy7aE" // Surgery FR
                : "https://www.youtube.com/embed/9oF5V-nC-X0"; // Surgery EN
            }
          }

          setAssignedVideo(videoUrl);
          setShowVideoModal(true);
        }
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err.response?.data?.message || t("appointments.toast.saveFailed");
      toast.error(msg);
    }
  };

  const handleEdit = (row: Appointment) => {
    setForm({
      doctorId: row.doctor?.id ? String(row.doctor.id) : "",
      patientId: row.patient?.id ? String(row.patient.id) : "",
      appointmentDate: row.appointmentDate ? row.appointmentDate.substring(0, 16) : "",
      status: row.status,
      consultationFee: row.consultationFee ? String(row.consultationFee) : "",
    });
    setEditingId(row.id);
    setFormOpen(true);
  };

  const handleComplete = async (id: number) => {
    try {
      await appointmentApi.complete(id);
      toast.success(t("appointments.toast.completed"));
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch {
      toast.error(t("appointments.toast.completeFailed"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("appointments.confirm.delete"))) return;
    try {
      await appointmentApi.remove(id);
      toast.success(t("appointments.toast.deleted"));
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch {
      toast.error(t("appointments.toast.deleteFailed"));
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-800">{t("appointments.title")}</h1>
        <p className="text-sm text-red-600">{t("auditLogs.error.loadFailed")}</p> {/* Reusing general error or create a new one. Using auditLogs error as placeholder or just generic */}
        <AppButton variant="secondary" onClick={() => refetch()}>
          {t("common.retry")}
        </AppButton>
      </div>
    );
  }

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const currentPage = data?.number ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t("appointments.title")}</h1>
          <p className="text-sm text-slate-500">{t("appointments.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder={t("appointments.searchPlaceholder")}
          />
          <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>
            {t("common.clear")}
          </AppButton>
          {canCreate && <AppButton onClick={() => setFormOpen(true)}>{isPatient ? t("appointments.request") : t("appointments.new")}</AppButton>}
        </div>
      </div>

      {data && (
        <StatsBar
          items={[
            { label: t("appointments.stats.total"), value: total },
            { label: t("appointments.stats.scheduled"), value: statusCounts["Scheduled"] || 0 },
            { label: t("appointments.stats.completed"), value: statusCounts["Completed"] || 0 },
            { label: t("appointments.stats.pending"), value: statusCounts["Requested"] || 0 },
          ]}
        />
      )}

      {canCreate && formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm mb-1">{t("appointments.form.doctor")}</label>
            <select
              className="w-full border rounded px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
              value={form.doctorId}
              onChange={(e) => {
                const docId = e.target.value;
                const doc = doctorOptions.find(d => String(d.id) === docId);
                const fee = doc?.department?.consultationFee;
                setForm({
                  ...form,
                  doctorId: docId,
                  consultationFee: fee ? String(fee) : form.consultationFee
                });
              }}
              required
              disabled={!!user?.doctorId && isDoctor}
            >
              <option value="">{t("appointments.form.selectDoctor")}</option>
              {doctorOptions.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} - {doc.specialization} ({doc.department?.name}) - {doc.department?.consultationFee} FCFA
                </option>
              ))}
            </select>
          </div>
          {showDoctorPreview && selectedDoctor && (
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {selectedDoctor.profilePictureUrl ? (
                    <img
                      src={resolveBackendAssetUrl(selectedDoctor.profilePictureUrl)}
                      alt={t("appointments.doctorPreview.photoAlt", { name: selectedDoctor.name })}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-indigo-400">
                      {selectedDoctor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      {t("appointments.doctorPreview.title")}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">Dr. {selectedDoctor.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedDoctor.specialization}
                      {selectedDoctor.department?.name ? ` | ${selectedDoctor.department.name}` : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("common.location")}</span>
                      <span>{selectedDoctor.location?.path || selectedDoctor.location?.name || selectedDoctor.locationName || t("common.na")}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("common.fee")}</span>
                      <span>{selectedDoctor.department?.consultationFee ?? 0} FCFA</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("common.biography")}</span>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                      {selectedDoctor.biography || t("appointments.doctorPreview.noBiography")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">{t("appointments.form.patient")}</label>
            {isPatient ? (
              <div className="w-full border rounded px-3 py-2 bg-slate-100 text-slate-600">
                {user?.username} {t("appointments.form.you")}
              </div>
            ) : (
              <select
                className="w-full border rounded px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                required
                disabled={!!editingId} // Disable if editing existing appointment
              >
                <option value="">{t("appointments.form.selectPatient")}</option>
                {patientOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">{t("appointments.form.date")}</label>
            <input
              type="datetime-local"
              className="w-full border rounded px-3 py-2"
              value={form.appointmentDate}
              onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
              required
            />
          </div>
          {!isPatient && (
            <div>
              <label className="block text-sm mb-1">{t("appointments.form.status")}</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Scheduled">{t("appointments.status.scheduled")}</option>
                <option value="Completed">{t("appointments.status.completed")}</option>
                <option value="Cancelled">{t("appointments.status.cancelled")}</option>
                <option value="Requested">{t("appointments.status.requested")}</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">{t("appointments.form.fee")}</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 bg-slate-100 cursor-not-allowed text-slate-600"
              value={form.consultationFee}
              onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
              min="0"
              step="0.01"
              readOnly
            />
          </div>

          {isPatient && !editingId && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
              <h3 className="md:col-span-2 font-semibold text-slate-800 text-lg mb-2">
                {language === 'fr' ? "Questionnaire pré-rendez-vous" : "Pre-Appointment Questionnaire"}
              </h3>
              
              <div>
                <label className="block text-sm mb-1">{language === 'fr' ? "Groupe Sanguin" : "Blood Type"}</label>
                <input className="w-full border rounded px-3 py-2" type="text" placeholder="e.g. O+, A-, Unknown" value={questionnaire.bloodType} onChange={e => setQuestionnaire({...questionnaire, bloodType: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm mb-1">{language === 'fr' ? "Maladies contagieuses ?" : "Contagious Diseases?"}</label>
                <input className="w-full border rounded px-3 py-2" type="text" placeholder={language === 'fr' ? "Aucune, ou précisez..." : "None, or specify..."} value={questionnaire.contagiousDisease} onChange={e => setQuestionnaire({...questionnaire, contagiousDisease: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm mb-1">{language === 'fr' ? "Allergies" : "Allergies"}</label>
                <input className="w-full border rounded px-3 py-2" type="text" placeholder={language === 'fr' ? "Allergies médicamenteuses ou autres" : "Medication or other allergies"} value={questionnaire.allergies} onChange={e => setQuestionnaire({...questionnaire, allergies: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm mb-1">{language === 'fr' ? "Maladies Chroniques" : "Chronic Illnesses"}</label>
                <input className="w-full border rounded px-3 py-2" type="text" placeholder={language === 'fr' ? "Ex: Diabète, Hypertension..." : "Ex: Diabetes, Hypertension..."} value={questionnaire.chronicIllnesses} onChange={e => setQuestionnaire({...questionnaire, chronicIllnesses: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm mb-1">{language === 'fr' ? "Médicaments Actuels" : "Current Medications"}</label>
                <input className="w-full border rounded px-3 py-2" type="text" placeholder={language === 'fr' ? "Liste des traitements" : "List of ongoing treatments"} value={questionnaire.medications} onChange={e => setQuestionnaire({...questionnaire, medications: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm mb-1">{language === 'fr' ? "Chirurgies Précédentes" : "Previous Surgeries"}</label>
                <input className="w-full border rounded px-3 py-2" type="text" placeholder={language === 'fr' ? "Aucune, ou précisez..." : "None, or specify..."} value={questionnaire.surgeries} onChange={e => setQuestionnaire({...questionnaire, surgeries: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm mb-1">{language === 'fr' ? "Antécédents Familiaux" : "Family Medical History"}</label>
                <input className="w-full border rounded px-3 py-2" type="text" placeholder={language === 'fr' ? "Ex: Maladies cardiaques dans la famille" : "Ex: Heart diseases in family"} value={questionnaire.familyHistory} onChange={e => setQuestionnaire({...questionnaire, familyHistory: e.target.value})} />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm mb-1">{language === 'fr' ? "Fumez-vous ?" : "Do you smoke?"}</label>
                  <select className="w-full border rounded px-3 py-2" value={questionnaire.smoking} onChange={e => setQuestionnaire({...questionnaire, smoking: e.target.value})}>
                    <option value="No">{language === 'fr' ? "Non" : "No"}</option>
                    <option value="Yes">{language === 'fr' ? "Oui" : "Yes"}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1">{language === 'fr' ? "Consommation d'alcool ?" : "Consume Alcohol?"}</label>
                  <select className="w-full border rounded px-3 py-2" value={questionnaire.alcohol} onChange={e => setQuestionnaire({...questionnaire, alcohol: e.target.value})}>
                    <option value="No">{language === 'fr' ? "Non" : "No"}</option>
                    <option value="Occasional">{language === 'fr' ? "Occasionnellement" : "Occasional"}</option>
                    <option value="Frequent">{language === 'fr' ? "Fréquemment" : "Frequent"}</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">{language === 'fr' ? "Pourquoi voulez-vous voir spécifiquement CE médecin ?" : "Why do you specifically want to see THIS doctor?"}</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3} placeholder={language === 'fr' ? "Décrivez brièvement vos raisons ou symptômes..." : "Briefly describe your reasons or symptoms..."} value={questionnaire.reason} onChange={e => setQuestionnaire({...questionnaire, reason: e.target.value})}></textarea>
              </div>

            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-2">
            <AppButton type="button" variant="secondary" onClick={resetForm}>
              {t("common.cancel")}
            </AppButton>
            <AppButton type="submit">{editingId ? t("common.update") : (isPatient ? t("appointments.form.sendRequest") : t("common.create"))}</AppButton>
          </div>
        </form>
      )
      }

      <AppTable
        columns={[
          { key: "id", header: "ID" },
          {
            key: "appointmentDate",
            header: t("appointments.form.date"),
            render: (row: Appointment) => new Date(row.appointmentDate).toLocaleString(),
          },
          { key: "status", header: t("appointments.form.status") },
          {
            key: "doctor",
            header: t("appointments.form.doctor"),
            render: (row: Appointment) => row.doctor?.name || "N/A",
          },
          {
            key: "patient",
            header: t("appointments.form.patient"),
            render: (row: Appointment) => row.patient?.fullName || "N/A",
          },
          {
            key: "actions",
            header: t("common.actions"),
            render: (row: Appointment) => {
              const status = (row.status || "").toLowerCase();
              const isRequestedRow = status === "requested";
              const isCancelledRow = status === "cancelled";
              const isCompletedRow = status === "completed";

              return (
                <div className="flex gap-2">
                  {/* Doctor Approval Actions */}
                  {isDoctor && isRequestedRow && (
                    <>
                      <AppButton
                        variant="primary"
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                        onClick={async () => {
                          try {
                            if (!row.doctor?.id || !row.patient?.id) return;
                            await appointmentApi.update(row.id, { ...row, status: "Scheduled", doctorId: row.doctor.id, patientId: row.patient.id });
                            toast.success(t("appointments.toast.approved"));
                            queryClient.invalidateQueries({ queryKey: ["appointments"] });
                          } catch { toast.error(t("appointments.toast.approveFailed")); }
                        }}
                      >
                        {t("appointments.action.approve")}
                      </AppButton>
                      <AppButton
                        variant="secondary"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={async () => {
                          try {
                            if (!row.doctor?.id || !row.patient?.id) return;
                            await appointmentApi.update(row.id, { ...row, status: "Cancelled", doctorId: row.doctor.id, patientId: row.patient.id });
                            toast.success(t("appointments.toast.rejected"));
                            queryClient.invalidateQueries({ queryKey: ["appointments"] });
                          } catch { toast.error(t("appointments.toast.rejectFailed")); }
                        }}
                      >
                        {t("appointments.action.reject")}
                      </AppButton>
                    </>
                  )}

                  {/* Edit/Delete Management */}
                  {(canManage || (isPatient && isRequestedRow)) && (
                    <>
                      <AppButton variant="secondary" onClick={() => handleEdit(row)}>
                        {t("common.edit")}
                      </AppButton>
                      {canManage && !isCompletedRow && !isRequestedRow && (
                        <AppButton variant="secondary" onClick={() => handleComplete(row.id)}>
                          {t("appointments.action.complete")}
                        </AppButton>
                      )}
                      {canManage && !isRequestedRow && !isCancelledRow && (
                        <AppButton variant="secondary" onClick={() => openConsultationNote(row)}>
                          {t("appointments.action.observation")}
                        </AppButton>
                      )}
                      <AppButton
                        variant="secondary"
                        className="text-red-600 hover:text-red-700 hover:border-red-200"
                        onClick={() => handleDelete(row.id)}
                      >
                        {t("common.delete")}
                      </AppButton>
                    </>
                  )}
                  {isPatient && isCompletedRow && (
                    <AppButton variant="secondary" onClick={() => openConsultationNote(row)}>
                      {t("appointments.action.viewObservation")}
                    </AppButton>
                  )}
                  {!canManage && !isPatient && (
                    <span className="text-xs text-slate-500">{t("appointments.action.viewOnly")}</span>
                  )}
                </div>
              );
            },
          },
        ]}
        data={rows}
        total={total}
        page={currentPage}
        size={size}
        onPageChange={setPage}
      />

      {consultationAppointment && (
        <ConsultationNoteModal
          appointment={consultationAppointment}
          canEdit={canManage}
          onClose={closeConsultationNote}
        />
      )}

      {/* Video Modal shown after booking */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-3xl w-full flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {language === 'fr' ? "Rendez-vous Confirmé !" : "Appointment Confirmed!"}
              </h2>
              <AppButton variant="secondary" onClick={() => setShowVideoModal(false)}>
                ✕
              </AppButton>
            </div>
            <div className="p-6 flex flex-col items-center">
              <p className="mb-4 text-center text-slate-600">
                {language === 'fr' 
                  ? "Votre demande de rendez-vous a été soumise avec succès. Veuillez regarder cette courte vidéo expliquant le rôle vital de votre spécialiste :"
                  : "Your appointment request was submitted successfully. Please watch this short video explaining the vital role of your specialist:"} 
              </p>
              <div className="w-full aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <iframe 
                  className="w-full h-full" 
                  src={assignedVideo} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default AppointmentListPage;
