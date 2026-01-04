import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AppTable from "../../components/common/AppTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import AppButton from "../../components/common/AppButton";
import httpClient from "../../api/httpClient";
import type { PagedResult } from "../../api/personApi";

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
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, refetch } = useQuery<PagedResult<UserRow>>({
    queryKey: ["users", page, term],
    queryFn: () =>
      httpClient
        .get<PagedResult<UserRow>>("/users/search", { params: { q: term ?? "", page, size, sort: "username,asc" } })
        .then((res) => res.data),
    retry: 1,
  });

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
