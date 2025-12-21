import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { roleApi, type Role } from "../../api/roleApi";
import type { PagedResult } from "../../api/personApi";
import AppTable from "../../components/common/AppTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AppButton from "../../components/common/AppButton";

const RoleListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const { data, isLoading, isError, refetch } = useQuery<PagedResult<Role>>({
    queryKey: ["roles", page, size],
    queryFn: () => roleApi.listPage({ page, size }),
    retry: 1,
  });

  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-800">Roles</h1>
        <p className="text-sm text-red-600">Unable to load roles. Ensure you are logged in as ADMIN.</p>
        <AppButton variant="secondary" onClick={() => refetch()}>
          Retry
        </AppButton>
      </div>
    );
  }

  if (isLoading || !data) return <LoadingSpinner />;

  const rows = data.content ?? [];
  const total = data.totalElements ?? rows.length;
  const currentPage = data.number ?? page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Roles</h1>
          <p className="text-sm text-slate-500">System roles that drive access control across the app.</p>
        </div>
        <AppButton variant="secondary" onClick={() => refetch()}>
          Refresh
        </AppButton>
      </div>

      <AppTable
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name" },
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

export default RoleListPage;
