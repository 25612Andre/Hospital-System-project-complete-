import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AppTable from "../../components/common/AppTable";
import AppButton from "../../components/common/AppButton";
import SearchInput from "../../components/common/SearchInput";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { doctorApi, type Doctor } from "../../api/doctorApi";
import { departmentApi, type Department } from "../../api/departmentApi";
import type { PagedResult } from "../../api/personApi";
import StatsBar from "../../components/common/StatsBar";
import { useAuth } from "../../context/useAuth";
import { userApi } from "../../api/userApi";
import { useI18n } from "../../i18n/I18nProvider";

const emptyForm: Doctor = {
  name: "",
  contact: "",
  specialization: "",
  department: undefined,
  location: undefined,
  locationName: "",
};

const DoctorListPage: React.FC = () => {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [term, setTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Doctor & { username?: string; password?: string; confirm?: string }>(emptyForm);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const canManage = roles.includes("ADMIN");

  const { data: doctors, isLoading, isError, refetch } = useQuery<PagedResult<Doctor>>({
    queryKey: ["doctors", page, term],
    queryFn: () => doctorApi.listPage({ page, size, sort: "id,asc", q: term || undefined }),
    retry: 1,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments-all"],
    queryFn: departmentApi.listAll,
  });

  const departmentOptions = useMemo<Department[]>(() => departments ?? [], [departments]);

  const handleLocationChange = (name: string) => {
    setForm({ ...form, locationName: name });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setProfilePicture(null);
    setProfilePreview("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department?.id) {
      toast.error(t("doctors.validation.departmentRequired"));
      return;
    }

    try {
      if (editingId) {
        const payload: Doctor = {
          ...form,
          department: { id: Number(form.department.id), name: form.department.name },
          location: form.location?.id ? { id: form.location.id } : undefined,
        };
        await doctorApi.update(editingId, payload);
        toast.success(t("doctors.toast.updated"));
      } else {
        if (!form.username || !form.password || !form.confirm) {
          toast.error(t("appointments.toast.required"));
          return;
        }
        if (form.password !== form.confirm) {
          toast.error(t("signup.validation.passwordMismatch"));
          return;
        }
        await userApi.create({
          role: "DOCTOR",
          username: form.username,
          password: form.password,
          fullName: form.name,
          phone: form.contact,
          specialization: form.specialization,
          departmentId: form.department.id,
          locationName: form.locationName
        }, profilePicture || undefined);
        toast.success(t("doctors.toast.created"));
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    } catch (err: any) {
      const msg = err.response?.data?.message || t("doctors.toast.saveFailed");
      toast.error(msg);
    }
  };

  const handleEdit = (doc: Doctor) => {
    setForm({
      id: doc.id,
      name: doc.name,
      contact: doc.contact,
      specialization: doc.specialization,
      department: doc.department ? { id: doc.department.id, name: doc.department.name } : undefined,
      location: doc.location ? { id: doc.location.id } : undefined,
      locationName: doc.location?.name || "",
      username: "", // Not editable here
      password: "",
      confirm: ""
    });
    setEditingId(doc.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm(t("doctors.deleteConfirm"))) return;
    try {
      await doctorApi.remove(id);
      toast.success(t("doctors.toast.deleted"));
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    } catch {
      toast.error(t("doctors.toast.deleteFailed"));
    }
  };

  if (isLoading || !departments) return <LoadingSpinner />;
  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-800">{t("nav.doctors")}</h1>
        <p className="text-sm text-red-600">{t("doctors.error.unableToLoad")}</p>
        <AppButton variant="secondary" onClick={() => refetch()}>
          {t("common.retry")}
        </AppButton>
      </div>
    );
  }

  const doctorRows = doctors?.content ?? [];
  const totalDoctors = doctors?.totalElements ?? 0;
  const currentPage = doctors?.number ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t("nav.doctors")}</h1>
          <p className="text-sm text-slate-500">{t("doctors.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder={t("doctors.searchPlaceholder")}
          />
          <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>
            {t("common.clear")}
          </AppButton>
          {canManage && <AppButton onClick={() => setShowForm(true)}>{t("doctors.newDoctor")}</AppButton>}
        </div>
      </div>

      <StatsBar
        items={[
          { label: t("doctors.stats.totalDoctors"), value: totalDoctors },
          { label: t("doctors.stats.departments"), value: departmentOptions.length },
          { label: t("doctors.stats.showing"), value: doctorRows.length },
        ]}
      />

      {canManage && showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {!editingId && (
            <div className="md:col-span-2 flex flex-col items-center gap-4 mb-4 border-b pb-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border bg-gray-100">
                {profilePreview ? (
                  <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                )}
              </div>
              <label className="cursor-pointer bg-white px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 shadow-sm">
                {t("common.choosePhoto")}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProfilePicture(file);
                    setProfilePreview(URL.createObjectURL(file));
                  }
                }} />
              </label>
            </div>
          )}

          {!editingId && (
            <>
              <div>
                <label className="block text-sm mb-1">{t("signup.emailUsername")}</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.username || ""}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="doctor@hospital.rw"
                  required={!editingId}
                />
              </div>
              <div className="hidden md:block"></div>
              <div>
                <label className="block text-sm mb-1">{t("common.password")}</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">{t("signup.confirm")}</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="password"
                  value={form.confirm || ""}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="md:col-span-2 border-t my-2"></div>
            </>
          )}

          <div>
            <label className="block text-sm mb-1">{t("common.name")}</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t("common.contact")}</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t("common.specialization")}</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t("common.department")}</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.department?.id ?? ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : undefined;
                const dept = departmentOptions.find((d) => d.id === id);
                setForm({ ...form, department: id ? { id, name: dept?.name || "" } : undefined });
              }}
              required
            >
              <option value="">{t("doctors.selectDepartment")}</option>
              {departmentOptions.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({t("common.fee")}: {dept.consultationFee})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 pt-2">
            <label className="block text-sm mb-1">{t("common.location")}</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.locationName || ""}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Enter city or area..."
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <AppButton type="button" variant="secondary" onClick={resetForm}>
              {t("common.cancel")}
            </AppButton>
            <AppButton type="submit">{editingId ? t("common.update") : t("common.create")}</AppButton>
          </div>
        </form>
      )}

      <AppTable
        columns={[
          { key: "name", header: t("common.name") },
          { key: "specialization", header: t("common.specialization") },
          { key: "contact", header: t("common.contact") },
          {
            key: "department",
            header: t("common.department"),
            render: (row: Doctor) =>
              row.department ? `${row.department.name || ""}` : t("common.unassigned"),
          },
          {
            key: "location",
            header: t("common.location"),
            render: (row: Doctor) => row.location?.path || row.location?.name || t("common.na"),
          },
          {
            key: "actions",
            header: t("common.actions"),
            render: (row: Doctor) => (
              <div className="flex gap-2">
                {canManage && (
                  <>
                    <AppButton variant="secondary" onClick={() => handleEdit(row)}>
                      {t("common.edit")}
                    </AppButton>
                    <AppButton variant="ghost" onClick={() => handleDelete(row.id)}>
                      {t("common.delete")}
                    </AppButton>
                  </>
                )}
              </div>
            ),
          },
        ]}
        data={doctorRows}
        total={totalDoctors}
        page={currentPage}
        size={size}
        onPageChange={setPage}
      />
    </div>
  );
};

export default DoctorListPage;
