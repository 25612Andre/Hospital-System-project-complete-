import React, { useMemo, useState } from "react";
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

const emptyForm = {
  doctorId: "",
  patientId: "",
  appointmentDate: "",
  status: "Scheduled",
  consultationFee: "",
};

const AppointmentListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [term, setTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { roles, user } = useAuth();

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
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDate = new Date(form.appointmentDate);
    const year = selectedDate.getFullYear();
    if (isNaN(year) || year > 2100 || year < 1900) {
      toast.error("Please enter a valid year between 1900 and 2100.");
      return;
    }

    if (!form.doctorId || !form.patientId || !form.appointmentDate) {
      toast.error("All fields are required");
      return;
    }
    let dateStr = form.appointmentDate;
    if (dateStr.length === 16) {
      dateStr += ":00";
    }

    // Patients always create "Requested" appointments
    const statusToSubmit = isPatient ? "Requested" : form.status;

    const payload: AppointmentPayload = {
      doctorId: Number(form.doctorId),
      patientId: Number(form.patientId),
      appointmentDate: dateStr,
      status: statusToSubmit,
      consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
    };
    try {
      if (editingId) {
        await appointmentApi.update(editingId, payload);
        toast.success("Appointment updated");
      } else {
        await appointmentApi.create(payload);
        toast.success(isPatient ? "Appointment Requested" : "Appointment created");
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Unable to save appointment";
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
      toast.success("Appointment marked completed");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e) {
      toast.error("Failed to complete appointment");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this appointment?")) return;
    try {
      await appointmentApi.remove(id);
      toast.success("Appointment deleted");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e) {
      toast.error("Failed to delete appointment");
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-800">Appointments</h1>
        <p className="text-sm text-red-600">Unable to load appointments. Ensure you are logged in.</p>
        <AppButton variant="secondary" onClick={() => refetch()}>
          Retry
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
          <h1 className="text-2xl font-semibold text-slate-800">Appointments</h1>
          <p className="text-sm text-slate-500">Paginated list with scheduling actions and quick completion.</p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Search by doctor or patient..."
          />
          <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>
            Clear
          </AppButton>
          {canCreate && <AppButton onClick={() => setFormOpen(true)}>{isPatient ? "Request Appointment" : "New Appointment"}</AppButton>}
        </div>
      </div>

      {data && (
        <StatsBar
          items={[
            { label: "Total Appointments", value: total },
            { label: "Scheduled", value: statusCounts["Scheduled"] || 0 },
            { label: "Completed", value: statusCounts["Completed"] || 0 },
            { label: "Pending", value: statusCounts["Requested"] || 0 },
          ]}
        />
      )}

      {canCreate && formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm mb-1">Doctor</label>
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
              <option value="">Select doctor</option>
              {doctorOptions.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} - {doc.specialization} ({doc.department?.name}) - {doc.department?.consultationFee} RWF
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Patient</label>
            {isPatient ? (
              <div className="w-full border rounded px-3 py-2 bg-slate-100 text-slate-600">
                {user?.username} (You)
              </div>
            ) : (
              <select
                className="w-full border rounded px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                required
                disabled={!!editingId} // Disable if editing existing appointment
              >
                <option value="">Select patient</option>
                {patientOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Date & time</label>
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
              <label className="block text-sm mb-1">Status</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Requested">Requested (Pending)</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Consultation fee (Auto-filled)</label>
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
          <div className="md:col-span-2 flex justify-end gap-2">
            <AppButton type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </AppButton>
            <AppButton type="submit">{editingId ? "Update" : (isPatient ? "Send Request" : "Create")}</AppButton>
          </div>
        </form>
      )
      }

      <AppTable
        columns={[
          { key: "id", header: "ID" },
          {
            key: "appointmentDate",
            header: "Date",
            render: (row: Appointment) => new Date(row.appointmentDate).toLocaleString(),
          },
          { key: "status", header: "Status" },
          {
            key: "doctor",
            header: "Doctor",
            render: (row: Appointment) => row.doctor?.name || "N/A",
          },
          {
            key: "patient",
            header: "Patient",
            render: (row: Appointment) => row.patient?.fullName || "N/A",
          },
          {
            key: "actions",
            header: "Actions",
            render: (row: Appointment) => (
              <div className="flex gap-2">
                {/* Doctor Approval Actions */}
                {isDoctor && row.status === "Requested" && (
                  <>
                    <AppButton
                      variant="primary"
                      className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                      onClick={async () => {
                        try {
                          if (!row.doctor?.id || !row.patient?.id) return;
                          await appointmentApi.update(row.id, { ...row, status: "Scheduled", doctorId: row.doctor.id, patientId: row.patient.id });
                          toast.success("Appointment Approved");
                          queryClient.invalidateQueries({ queryKey: ["appointments"] });
                        } catch (e) { toast.error("Failed to approve"); }
                      }}
                    >
                      Approve
                    </AppButton>
                    <AppButton
                      variant="secondary"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () => {
                        try {
                          if (!row.doctor?.id || !row.patient?.id) return;
                          await appointmentApi.update(row.id, { ...row, status: "Cancelled", doctorId: row.doctor.id, patientId: row.patient.id });
                          toast.success("Appointment Rejected");
                          queryClient.invalidateQueries({ queryKey: ["appointments"] });
                        } catch (e) { toast.error("Failed to reject"); }
                      }}
                    >
                      Reject
                    </AppButton>
                  </>
                )}

                {/* Edit/Delete Management */}
                {(canManage || (isPatient && row.status === "Requested")) && (
                  <>
                    <AppButton variant="secondary" onClick={() => handleEdit(row)}>
                      Edit
                    </AppButton>
                    {canManage && row.status !== "Completed" && row.status !== "Requested" && (
                      <AppButton variant="secondary" onClick={() => handleComplete(row.id)}>
                        Complete
                      </AppButton>
                    )}
                    <AppButton
                      variant="secondary"
                      className="text-red-600 hover:text-red-700 hover:border-red-200"
                      onClick={() => handleDelete(row.id)}
                    >
                      Delete
                    </AppButton>
                  </>
                )}
                {!canManage && !isPatient && (
                  <span className="text-xs text-slate-500">View only</span>
                )}
              </div>
            ),
          },
        ]}
        data={rows}
        total={total}
        page={currentPage}
        size={size}
        onPageChange={setPage}
      />
    </div >
  );
};

export default AppointmentListPage;
