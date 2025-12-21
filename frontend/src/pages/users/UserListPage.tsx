import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AppTable from "../../components/common/AppTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import AppButton from "../../components/common/AppButton";
import HierarchicalLocationPicker from "../../components/common/HierarchicalLocationPicker";
import httpClient from "../../api/httpClient";
import type { PagedResult } from "../../api/personApi";
import type { LocationNode } from "../../api/locationApi";
import { departmentApi, type Department } from "../../api/departmentApi";

interface UserRow {
  id: number;
  username: string;
  role: string;
  patient?: { id: number };
  doctor?: { id: number };
  location?: { id: number; name?: string; path?: string };
}

const UserListPage: React.FC = () => {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "PATIENT",
    locationId: null as number | null,
    // extended fields
    fullName: "",
    phone: "",
    departmentId: null as number | null,
    specialization: "",
  });
  const queryClient = useQueryClient();

  // Fetch departments for Doctor creation
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments-all"],
    queryFn: departmentApi.listAll,
    // Only enabled if we are viewing the form? Or always fine.
    staleTime: 5 * 60 * 1000,
  });

  const { data: users, isLoading, isError, refetch } = useQuery<PagedResult<UserRow>>({
    queryKey: ["users", page, term],
    queryFn: () =>
      httpClient
        .get<PagedResult<UserRow>>("/users/search", { params: { q: term ?? "", page, size, sort: "username,asc" } })
        .then((res) => res.data),
    retry: 1,
  });

  const handleLocationChange = (locationId: number | null, _location: LocationNode | null) => {
    setForm({ ...form, locationId });
  };

  const handleEdit = (row: UserRow) => {
    setEditId(row.id);
    setForm({
      username: row.username,
      password: "", // Don't populate password
      role: row.role,
      locationId: row.location?.id ?? null,
      fullName: "", // Cannot extract easily from row unless expanded
      phone: "",
      departmentId: null,
      specialization: "",
    });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm({
      username: "",
      password: "",
      role: "PATIENT",
      locationId: null,
      fullName: "",
      phone: "",
      departmentId: null,
      specialization: ""
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await httpClient.delete(`/users/${id}`);
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error("Failed to delete user");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username) {
      toast.error("Username is required");
      return;
    }
    // Password required only for new users
    if (!editId && !form.password) {
      toast.error("Password is required for new users");
      return;
    }

    try {
      const payload = {
        username: form.username,
        password: form.password || undefined, // Send undefined if empty to avoid processing
        role: form.role,
        locationId: form.locationId ?? undefined,
        fullName: form.fullName || undefined,
        phone: form.phone || undefined,
        departmentId: form.departmentId || undefined,
        specialization: form.specialization || undefined,
      };

      if (editId) {
        await httpClient.put(`/users/${editId}`, payload);
        toast.success("User updated");
      } else {
        await httpClient.post("/users", payload);
        toast.success("User created");
      }

      handleCancel(); // Reset form
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(editId ? "Failed to update user" : "Failed to create user");
      console.error(err);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-800">Users & Roles</h1>
        <p className="text-sm text-red-600">Unable to load users. Ensure you are logged in as ADMIN.</p>
        <AppButton variant="secondary" onClick={() => refetch()}>
          Retry
        </AppButton>
      </div>
    );
  }

  const rows = users?.content ?? [];
  const total = users?.totalElements ?? rows.length;
  const currentPage = users?.number ?? page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Users & Roles</h1>
          <p className="text-sm text-slate-500">Manage accounts and assign locations.</p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Search users..."
          />
          <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>
            Clear
          </AppButton>
          <AppButton variant="secondary" onClick={() => refetch()}>
            Refresh
          </AppButton>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-lg shadow-sm p-4 space-y-4"
      >
        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
          {editId ? "Edit User" : "Create New User"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Username (email)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              {editId ? "Password (leave blank to keep)" : "Password"}
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editId}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Role</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {["ADMIN", "DOCTOR", "PATIENT"].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Profile Details for Doctor/Patient */}
        {(form.role === "DOCTOR" || form.role === "PATIENT") && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {form.role === "DOCTOR" ? "Doctor Profile" : "Patient Profile"} (Auto-create)
            </div>
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder={`e.g. Dr. ${form.username.split('@')[0]}`}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+250..."
              />
            </div>

            {form.role === "DOCTOR" && (
              <>
                <div>
                  <label className="block text-sm mb-1">Department</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.departmentId || ""}
                    onChange={(e) => setForm({ ...form, departmentId: Number(e.target.value) || null })}
                  >
                    <option value="">Select Department</option>
                    {departments?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Specialization</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <div className="border-t pt-4">
          <HierarchicalLocationPicker
            value={form.locationId}
            onChange={handleLocationChange}
            label="Location"
          />
        </div>

        <div className="flex justify-end pt-2 gap-2">
          {editId && (
            <AppButton variant="secondary" type="button" onClick={handleCancel}>
              Cancel
            </AppButton>
          )}
          <AppButton type="submit">{editId ? "Update User" : "Create User"}</AppButton>
        </div>
      </form>

      <AppTable
        columns={[
          { key: "username", header: "Username" },
          { key: "role", header: "Role" },
          {
            key: "links",
            header: "Linked",
            render: (row) =>
              row.patient ? `Patient #${row.patient.id}` : row.doctor ? `Doctor #${row.doctor.id}` : "None",
          },
          {
            key: "location",
            header: "Location",
            render: (row) => row.location?.path || row.location?.name || "N/A",
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <AppButton variant="secondary" onClick={() => handleEdit(row)}>
                  Edit
                </AppButton>
                <AppButton
                  variant="secondary"
                  className="text-red-600 hover:text-red-700 hover:border-red-200"
                  onClick={() => handleDelete(row.id)}
                >
                  Delete
                </AppButton>
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
    </div>
  );
};

export default UserListPage;
