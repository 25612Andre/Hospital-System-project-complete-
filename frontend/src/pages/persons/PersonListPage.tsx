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
import { useI18n } from "../../i18n/I18nProvider";
import { useDebounce } from "../../hooks/useDebounce";

const PersonListPage: React.FC = () => {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState({ name: "", email: "", phone: "", gender: "" });
  const navigate = useNavigate();
  const { roles } = useAuth();
  const queryClient = useQueryClient();
  const canDelete = roles.includes("ADMIN");
  const canCreate = roles.includes("ADMIN") || roles.includes("DOCTOR");

  // Debounce search term and filters to avoid excessive API calls while typing
  const debouncedTerm = useDebounce(term, 300);
  const debouncedFilters = useDebounce(filters, 300);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<PagedResult<Person>>({
    queryKey: ["patients", page, debouncedTerm, debouncedFilters.name, debouncedFilters.email, debouncedFilters.phone, debouncedFilters.gender],
    queryFn: () =>
      personApi.list({
        page,
        size,
        sort: "id,asc",
        q: debouncedTerm || undefined,
        filters: debouncedFilters,
      }),
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
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
    if (!window.confirm(t("patients.deleteConfirm"))) return;
    try {
      await personApi.remove(id);
      toast.success(t("patients.toast.deleted"));
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    } catch {
      toast.error(t("patients.toast.deleteFailed"));
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="text-red-600 text-lg font-semibold">{t("common.errorLoadingData")}</div>
        <p className="text-slate-500 text-sm">{error?.message || t("common.unexpectedError")}</p>
        <AppButton onClick={() => refetch()}>{t("common.retry")}</AppButton>
      </div>
    );
  }

  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t("nav.patients")}</h1>
          <p className="text-sm text-slate-500">{t("patients.subtitle")}</p>
        </div>
        {canCreate && (
          <AppButton onClick={() => navigate("/patients/new")}>
            {t("patients.newPatient")}
          </AppButton>
        )}
      </div>

      <StatsBar
        items={[
          { label: t("patients.stats.totalPatients"), value: data.totalElements },
          { label: t("patients.stats.showing"), value: data.content.length },
        ]}
      />

      <div className="flex gap-3 items-center flex-wrap">
        <SearchInput value={term} onChange={(e) => { setTerm(e.target.value); setPage(0); }} placeholder={t("patients.searchPlaceholder")} />
        <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>
          {t("common.clear")}
        </AppButton>
        {isFetching && <span className="text-sm text-slate-400 animate-pulse">{t("common.loading")}</span>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-700">{t("patients.filters.title")}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">{t("patients.filters.name")}</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              placeholder={t("patients.filters.namePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">{t("patients.filters.email")}</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={filters.email}
              onChange={(e) => handleFilterChange("email", e.target.value)}
              placeholder={t("patients.filters.emailPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">{t("patients.filters.phone")}</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={filters.phone}
              onChange={(e) => handleFilterChange("phone", e.target.value)}
              placeholder={t("patients.filters.phonePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">{t("patients.filters.gender")}</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
            >
              <option value="">{t("patients.filters.gender.any")}</option>
              <option value="FEMALE">{t("patients.filters.gender.female")}</option>
              <option value="MALE">{t("patients.filters.gender.male")}</option>
              <option value="OTHER">{t("patients.filters.gender.other")}</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <AppButton variant="secondary" onClick={clearFilters}>
            {t("patients.filters.clear")}
          </AppButton>
        </div>
      </div>

      <AppTable
        columns={[
          { key: "fullName", header: t("patients.table.fullName") },
          { key: "email", header: t("patients.table.email") },
          { key: "phone", header: t("patients.table.phone") },
          {
            key: "location",
            header: t("patients.table.location"),
            render: (row: Person) => {
              if (!row.location) return t("common.na");
              return row.location.path || row.location.name || t("common.na");
            },
          },
          {
            key: "actions",
            header: t("common.actions"),
            render: (row: Person) => (
              <div className="flex gap-2">
                <AppButton variant="secondary" onClick={() => navigate(`/patients/${row.id}`)}>
                  {t("common.view")}
                </AppButton>
                {canDelete && row.id && (
                  <AppButton variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(row.id as number)}>
                    {t("common.delete")}
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
