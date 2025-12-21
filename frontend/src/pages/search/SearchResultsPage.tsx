import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { dashboardApi } from "../../api/dashboardApi";
import type { SearchResultDTO } from "../../dto/SearchResultDTO";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import AppButton from "../../components/common/AppButton";

const labelMap: Record<string, string> = {
  patients: "Patients",
  doctors: "Doctors",
  appointments: "Appointments",
  bills: "Bills",
  departments: "Departments",
  locations: "Locations",
};

const SearchResultsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get("q") || "";
  const typeParam = params.get("type") || "all";
  const sortParam = params.get("sort") || "asc";
  const [term, setTerm] = useState(query);

  // Sync term if URL changes externally
  React.useEffect(() => {
    setTerm(query);
  }, [query]);

  // Auto-search on typing
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (term !== query) {
        const newParams = new URLSearchParams(params);
        if (term) {
          newParams.set("q", term);
        } else {
          newParams.delete("q");
        }
        setParams(newParams);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [term, query, params, setParams]);

  const { data, isLoading, isError } = useQuery<Record<string, SearchResultDTO[]>>({
    queryKey: ["global-search", query],
    queryFn: () => dashboardApi.globalSearch(query),
    enabled: !!query,
  });

  const displayData = React.useMemo(() => {
    if (!data) return {};
    const filtered: Record<string, SearchResultDTO[]> = {};

    // Filter buckets
    Object.keys(data).forEach(key => {
      if (typeParam !== "all" && key !== typeParam) return;
      filtered[key] = [...data[key]];
    });

    // Sort items
    Object.keys(filtered).forEach(key => {
      filtered[key].sort((a, b) => {
        const valA = (a.label || "").toLowerCase();
        const valB = (b.label || "").toLowerCase();
        if (sortParam === "desc") {
          return valB.localeCompare(valA);
        }
        return valA.localeCompare(valB);
      });
    });
    return filtered;
  }, [data, typeParam, sortParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // handled by effect, but force immediate update?
    const newParams = new URLSearchParams(params);
    newParams.set("q", term);
    setParams(newParams);
  };

  if (!query && !term) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">Search</h1>
        <p className="text-sm text-slate-600">Type a term in the global search bar to see matching records.</p>
      </div>
    );
  }

  if (isLoading && !data) return <LoadingSpinner />;
  if (isError) {
    return <p className="text-sm text-red-600">Unable to load search results right now.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-slate-800">Search Results</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          {/* Local controls synced with URL */}
          <select
            className="border rounded px-2 py-2 text-sm"
            value={typeParam}
            onChange={(e) => {
              const newParams = new URLSearchParams(params);
              newParams.set("type", e.target.value);
              setParams(newParams);
            }}
          >
            <option value="all">All Types</option>
            <option value="patients">Patients</option>
            <option value="doctors">Doctors</option>
            <option value="appointments">Appointments</option>
            <option value="bills">Bills</option>
          </select>
          <SearchInput value={term} onChange={(e) => setTerm(e.target.value)} />
          <select
            className="border rounded px-2 py-2 text-sm"
            value={sortParam}
            onChange={(e) => {
              const newParams = new URLSearchParams(params);
              newParams.set("sort", e.target.value);
              setParams(newParams);
            }}
          >
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
          <AppButton type="submit">Search</AppButton>
        </form>
      </div>

      {Object.values(displayData).every((r) => r.length === 0) && (
        <p className="text-slate-500 italic">No matches found for your query.</p>
      )}

      {Object.entries(displayData)
        .filter(([, results]) => results.length > 0)
        .map(([bucket, results]) => (
          <div key={bucket} className="bg-white border rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {labelMap[bucket] ?? bucket} ({results.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((item) => (
                <div
                  key={`${bucket}-${item.id}`}
                  className="border rounded-md p-3 text-sm hover:border-primary-200 transition-colors"
                >
                  <div className="text-xs uppercase tracking-wide text-slate-500">{item.type}</div>
                  <div className="text-base font-semibold text-slate-800">{item.label}</div>
                  <div className="text-slate-600">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default SearchResultsPage;
