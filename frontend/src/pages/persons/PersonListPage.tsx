import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { personApi } from "../../api/personApi";
import type { Person, PagedResult } from "../../api/personApi";
import AppTable from "../../components/common/AppTable";
import SearchInput from "../../components/common/SearchInput";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AppButton from "../../components/common/AppButton";
import StatsBar from "../../components/common/StatsBar";
import { useAuth } from "../../context/useAuth";

const PersonListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState({ name: "", email: "", phone: "", gender: "" });
  const navigate = useNavigate();
  const { roles } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = roles.includes("ADMIN") || roles.includes("DOCTOR");
  const canDelete = roles.includes("ADMIN");

  const { data, isLoading } = useQuery<PagedResult<Person>>({
    queryKey: ["patients", page, term, filters.name, filters.email, filters.phone, filters.gender],
    queryFn: () =>
      personApi.list({
        page,
        size,
        sort: "id,asc",
        q: term || undefined,
        filters,
      }),
  });

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ name: "", email: "", phone: "", gender: "" });
    setPage(0);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      await personApi.remove(id);
      toast.success("Patient deleted");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    } catch {
      toast.error("Failed to delete patient");
    }
  };

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Patients</h1>
          <p className="text-sm text-slate-500">Search, paginate, and manage patients.</p>
        </div>
        {/* New Patient button removed as per request */}
      </div>

      <StatsBar
        items={[
          { label: "Total Patients", value: data.totalElements },
          { label: "Showing", value: data.content.length },
        ]}
      />

      <div className="flex gap-3 items-center flex-wrap">
        <SearchInput value={term} onChange={(e) => { setTerm(e.target.value); setPage(0); }} placeholder="Search patients..." />
        <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>
          Clear
        </AppButton>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-700">Column filters</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Name</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              placeholder="e.g. Mia"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={filters.email}
              onChange={(e) => handleFilterChange("email", e.target.value)}
              placeholder="demo@hospital.rw"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Phone</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={filters.phone}
              onChange={(e) => handleFilterChange("phone", e.target.value)}
              placeholder="+2507..."
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Gender</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
            >
              <option value="">Any</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <AppButton variant="secondary" onClick={clearFilters}>
            Clear filters
          </AppButton>
        </div>
      </div>

      <AppTable
        columns={[
          { key: "fullName", header: "Full Name" },
          { key: "email", header: "Email" },
          { key: "phone", header: "Phone" },
          {
            key: "location",
            header: "Location",
            render: (row: Person) => {
              if (!row.location) return "N/A";
              return row.location.path || row.location.name || "N/A";
            },
          },
          {
            key: "actions",
            header: "Actions",
            render: (row: Person) => (
              <div className="flex gap-2">
                <AppButton variant="secondary" onClick={() => navigate(`/patients/${row.id}`)}>
                  View
                </AppButton>
                {canWrite && (
                  <AppButton variant="ghost" onClick={() => navigate(`/patients/${row.id}/edit`)}>
                    Edit
                  </AppButton>
                )}
                {canDelete && row.id && (
                  <AppButton variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(row.id as number)}>
                    Delete
                  </AppButton>
                )}
              </div>
            ),
          },
        ]}
        data={data.content}
        total={data.totalElements}
        page={data.number}
        size={size}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};

export default PersonListPage;
