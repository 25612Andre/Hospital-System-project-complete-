import React, { useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { useQuery } from "@tanstack/react-query";
import { auditLogApi, EntityType, AuditAction } from "../../api/auditLogApi";
import type { AuditLog, AuditLogSearchParams } from "../../api/auditLogApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AppButton from "../../components/common/AppButton";
import { toast } from "react-toastify";

const NotificationsReportPage: React.FC = () => {
    const { t, language } = useI18n();
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<AuditLogSearchParams>({
        page: 0,
        size: 20,
    });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["audit-logs", filters],
        queryFn: () => auditLogApi.search(filters),
        retry: 1,
    });

    const { data: stats } = useQuery({
        queryKey: ["audit-stats"],
        queryFn: auditLogApi.getStatistics,
        retry: 1,
    });

    const handleFilterChange = (key: keyof AuditLogSearchParams, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value || undefined,
            page: 0, // Reset to first page when filters change
        }));
        setPage(0);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const getActionBadgeColor = (action: AuditAction) => {
        switch (action) {
            case AuditAction.CREATE:
                return "bg-green-100 text-green-800 border-green-200";
            case AuditAction.UPDATE:
                return "bg-blue-100 text-blue-800 border-blue-200";
            case AuditAction.DELETE:
                return "bg-red-100 text-red-800 border-red-200";
            case AuditAction.APPROVE:
                return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case AuditAction.REJECT:
                return "bg-orange-100 text-orange-800 border-orange-200";
            case AuditAction.LOGIN:
                return "bg-purple-100 text-purple-800 border-purple-200";
            case AuditAction.LOGOUT:
                return "bg-gray-100 text-gray-800 border-gray-200";
            default:
                return "bg-slate-100 text-slate-800 border-slate-200";
        }
    };

    const getEntityTypeColor = (entityType: EntityType) => {
        switch (entityType) {
            case EntityType.USER_ACCOUNT:
                return "text-purple-700";
            case EntityType.APPOINTMENT:
                return "text-blue-700";
            case EntityType.BILL:
                return "text-green-700";
            case EntityType.PATIENT:
                return "text-pink-700";
            case EntityType.DOCTOR:
                return "text-indigo-700";
            case EntityType.DEPARTMENT:
                return "text-orange-700";
            case EntityType.LOCATION:
                return "text-teal-700";
            default:
                return "text-slate-700";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const formatEntityType = (entityType: string) => {
        const key = `auditLogs.entity.${entityType}` as any;
        const translated = t(key);
        return translated !== key ? translated : entityType.replace(/_/g, " ");
    };

    if (isLoading && !data) return <LoadingSpinner />;

    if (isError && !data) {
        toast.error(t("auditLogs.error.loadFailed"));
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold text-slate-800">{t("auditLogs.title")}</h1>
                <p className="text-sm text-red-600">{t("dashboard.error.unableToLoad")}</p>
                <AppButton variant="secondary" onClick={() => refetch()}>
                    {t("common.retry")}
                </AppButton>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {t("auditLogs.title")}
                </h1>
                <p className="text-slate-500 mt-1">
                    {t("auditLogs.subtitle")}
                </p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">{t("auditLogs.stats.total")}</p>
                                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalLogs}</p>
                            </div>
                            <div className="p-3 bg-blue-200 bg-opacity-50 rounded-lg">
                                <svg className="w-8 h-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600 uppercase tracking-wide">{t("auditLogs.stats.last24h")}</p>
                                <p className="text-3xl font-bold text-green-900 mt-1">{stats.last24Hours}</p>
                            </div>
                            <div className="p-3 bg-green-200 bg-opacity-50 rounded-lg">
                                <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">{t("auditLogs.stats.creates")}</p>
                                <p className="text-3xl font-bold text-purple-900 mt-1">
                                    {stats.byAction.CREATE || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-200 bg-opacity-50 rounded-lg">
                                <svg className="w-8 h-8 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 uppercase tracking-wide">{t("auditLogs.stats.deletes")}</p>
                                <p className="text-3xl font-bold text-red-900 mt-1">
                                    {stats.byAction.DELETE || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-red-200 bg-opacity-50 rounded-lg">
                                <svg className="w-8 h-8 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("auditLogs.filters.title")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t("auditLogs.filters.entityType")}
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.entityType || ""}
                            onChange={(e) => handleFilterChange("entityType", e.target.value)}
                        >
                            <option value="">{t("auditLogs.filters.allTypes")}</option>
                            {Object.values(EntityType).map((type) => (
                                <option key={type} value={type}>
                                    {formatEntityType(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t("auditLogs.filters.action")}
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.action || ""}
                            onChange={(e) => handleFilterChange("action", e.target.value)}
                        >
                            <option value="">{t("auditLogs.filters.allActions")}</option>
                            {Object.values(AuditAction).map((action) => (
                                <option key={action} value={action}>
                                    {t(`auditLogs.action.${action}` as any)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t("auditLogs.filters.startDate")}
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.startDate || ""}
                            onChange={(e) => handleFilterChange("startDate", e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t("auditLogs.filters.endDate")}
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.endDate || ""}
                            onChange={(e) => handleFilterChange("endDate", e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <AppButton
                        variant="secondary"
                        onClick={() => {
                            setFilters({ page: 0, size: 20 });
                            setPage(0);
                        }}
                    >
                        {t("auditLogs.filters.clear")}
                    </AppButton>
                    <AppButton onClick={() => refetch()}>
                        {t("auditLogs.filters.refresh")}
                    </AppButton>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    {t("auditLogs.table.timestamp")}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    {t("auditLogs.table.action")}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    {t("auditLogs.table.entity")}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    {t("auditLogs.table.performedBy")}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    {t("auditLogs.table.reason")}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    {t("auditLogs.table.ipAddress")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {data?.content && data.content.length > 0 ? (
                                data.content.map((log: AuditLog) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getActionBadgeColor(
                                                    log.action
                                                )}`}
                                            >
                                                {t(`auditLogs.action.${log.action}` as any)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${getEntityTypeColor(log.entityType)}`}>
                                                    {formatEntityType(log.entityType)}
                                                </span>
                                                <span className="text-xs text-slate-500">{t("search.id")}: {log.entityId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                    {log.performedBy.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-slate-900">{log.performedBy}</p>
                                                    <p className="text-xs text-slate-500">{t("search.id")}: {log.performedByUserId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs">
                                            <div className="truncate" title={log.reason || "N/A"}>
                                                {log.reason || <span className="text-slate-400 italic">{t("auditLogs.table.noReason")}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {log.ipAddress || <span className="text-slate-400">—</span>}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium">{t("auditLogs.table.noData")}</p>
                                            <p className="text-sm mt-1">{t("auditLogs.table.adjustFilters")}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            {t("auditLogs.pagination.showing", { page: page + 1, total: data.totalPages, count: data.totalElements })}
                        </div>
                        <div className="flex gap-2">
                            <AppButton
                                variant="secondary"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 0}
                            >
                                {t("pagination.previous")}
                            </AppButton>
                            <AppButton
                                variant="secondary"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= data.totalPages - 1}
                            >
                                {t("pagination.next")}
                            </AppButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsReportPage;
