import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AppTable from "../../components/common/AppTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import AppButton from "../../components/common/AppButton";
import type { PagedResult } from "../../api/personApi";
import { userApi, type UserAccount } from "../../api/userApi";

const UserEditModal: React.FC<{ user: UserAccount; onClose: () => void; onSuccess: () => void }> = ({ user, onClose, onSuccess }) => {
  const [role, setRole] = useState(user.role);
  const [username, setUsername] = useState(user.username);
  const [enabled, setEnabled] = useState(user.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updateUser(user.id, { role, username, enabled });
      toast.success("User updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username (Email)</label>
            <input
              className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
            <select
              className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2"
              value={role}
              onChange={e => setRole(e.target.value as any)}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="DOCTOR">DOCTOR</option>
              <option value="PATIENT">PATIENT</option>
              <option value="RECEPTIONIST">RECEPTIONIST</option>
            </select>
          </div>
          <div className="flex items-center gap-3 py-2">
             <input 
               type="checkbox" 
               id="enabled-toggle" 
               checked={enabled} 
               onChange={e => setEnabled(e.target.checked)} 
               className="w-4 h-4 text-blue-600 rounded"
             />
             <label htmlFor="enabled-toggle" className="text-sm font-medium text-slate-700 dark:text-gray-300 cursor-pointer">
                Account Enabled (Login Allowed)
             </label>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <AppButton variant="secondary" onClick={onClose} disabled={saving}>Cancel</AppButton>
          <AppButton onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</AppButton>
        </div>
      </div>
    </div>
  );
};

const UserListPage: React.FC = () => {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, refetch } = useQuery<PagedResult<UserAccount>>({
    queryKey: ["users", page, term],
    queryFn: () => userApi.list({ q: term ?? "", page, size, sort: "username,asc" }),
    retry: 1,
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userApi.remove(id);
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-800">Users & Roles</h1>
        <p className="text-sm text-red-600">Unable to load users. Ensure you are logged in as ADMIN.</p>
        <AppButton variant="secondary" onClick={() => refetch()}>Retry</AppButton>
      </div>
    );
  }

  const rows = users?.content ?? [];
  const total = users?.totalElements ?? rows.length;
  const currentPage = users?.number ?? page;

  return (
    <div className="space-y-4">
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
        />
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Users & Roles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage accounts and adjust permissions.</p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            value={term}
            onChange={(e) => { setTerm(e.target.value); setPage(0); }}
            placeholder="Search users..."
          />
          <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>Clear</AppButton>
          <AppButton variant="secondary" onClick={() => refetch()}>Refresh</AppButton>
        </div>
      </div>

      <AppTable
        columns={[
          { key: "username", header: "Username" },
          { 
            key: "role", 
            header: "Role",
            render: (row) => (
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                row.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                row.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
                row.role === 'PATIENT' ? 'bg-green-100 text-green-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {row.role}
              </span>
            )
          },
          {
            key: "enabled",
            header: "Status",
            render: (row) => (
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                row.enabled === false ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {row.enabled === false ? 'Disabled' : 'Enabled'}
              </span>
            )
          },
          {
            key: "links",
            header: "Linked Profile",
            render: (row) =>
              row.patient ? `Patient: ${row.patient.fullName}` : row.doctor ? `Doctor: ${row.doctor.name}` : "Standalone",
          },
          {
            key: "location",
            header: "Location",
            render: (row) => row.location?.name || "N/A",
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <AppButton
                  variant="secondary"
                  onClick={() => setEditingUser(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="secondary"
                  className="text-red-600 border-red-100 hover:bg-red-50"
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
