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
import type { LocationNode } from "../../api/locationApi";
import HierarchicalLocationPicker from "../../components/common/HierarchicalLocationPicker";
import StatsBar from "../../components/common/StatsBar";
import { useAuth } from "../../context/useAuth";

const emptyForm: Doctor = {
  name: "",
  contact: "",
  specialization: "",
  department: undefined,
  location: undefined,
};

const DoctorListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [term, setTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Doctor>(emptyForm);
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

  const handleLocationChange = (locationId: number | null, _location: LocationNode | null) => {
    setForm({ ...form, location: locationId ? { id: locationId } : undefined });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department?.id) {
      toast.error("Please select a department");
      return;
    }
    const payload: Doctor = {
      ...form,
      department: { id: Number(form.department.id), name: form.department.name },
      location: form.location?.id ? { id: form.location.id } : undefined,
    };
    try {
      if (editingId) {
        await doctorApi.update(editingId, payload);
        toast.success("Doctor updated");
      } else {
        await doctorApi.create(payload);
        toast.success("Doctor created");
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    } catch {
      toast.error("Could not save doctor");
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
    });
    setEditingId(doc.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Delete this doctor?")) return;
    try {
      await doctorApi.remove(id);
      toast.success("Doctor removed");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    } catch {
      toast.error("Unable to delete doctor");
    }
  };

  if (isLoading || !departments) return <LoadingSpinner />;
  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-800">Doctors</h1>
        <p className="text-sm text-red-600">Unable to load doctors. Ensure you are logged in as ADMIN or DOCTOR.</p>
        <AppButton variant="secondary" onClick={() => refetch()}>
          Retry
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
          <h1 className="text-2xl font-semibold text-slate-800">Doctors</h1>
          <p className="text-sm text-slate-500">Manage doctors, their specialties, and department assignments.</p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Search doctors..."
          />
          <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>
            Clear
          </AppButton>
          {canManage && <AppButton onClick={() => setShowForm(true)}>New Doctor</AppButton>}
        </div>
      </div>

      <StatsBar
        items={[
          { label: "Total Doctors", value: totalDoctors },
          { label: "Departments", value: departmentOptions.length },
          { label: "Showing", value: doctorRows.length },
        ]}
      />

      {canManage && showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Contact</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Specialization</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Department</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.department?.id ?? ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : undefined;
                const dept = departmentOptions.find((d) => d.id === id);
                setForm({ ...form, department: id ? { id, name: dept?.name, consultationFee: dept?.consultationFee } : undefined });
              }}
              required
            >
              <option value="">Select department</option>
              {departmentOptions.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} (Fee: {dept.consultationFee})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 border-t pt-4">
            <HierarchicalLocationPicker
              value={form.location?.id ?? null}
              onChange={handleLocationChange}
              label="Location"
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <AppButton type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </AppButton>
            <AppButton type="submit">{editingId ? "Update" : "Create"}</AppButton>
          </div>
        </form>
      )}

      <AppTable
        columns={[
          { key: "name", header: "Name" },
          { key: "specialization", header: "Specialization" },
          { key: "contact", header: "Contact" },
          {
            key: "department",
            header: "Department",
            render: (row: Doctor) =>
              row.department ? `${row.department.name || ""}` : "Unassigned",
          },
          {
            key: "location",
            header: "Location",
            render: (row: Doctor) => row.location?.path || row.location?.name || "N/A",
          },
          {
            key: "actions",
            header: "Actions",
            render: (row: Doctor) => (
              <div className="flex gap-2">
                {canManage && (
                  <>
                    <AppButton variant="secondary" onClick={() => handleEdit(row)}>
                      Edit
                    </AppButton>
                    <AppButton variant="ghost" onClick={() => handleDelete(row.id)}>
                      Delete
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
