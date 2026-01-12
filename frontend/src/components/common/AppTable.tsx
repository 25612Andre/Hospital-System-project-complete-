import React from "react";
import Pagination from "./Pagination";
import { useI18n } from "../../i18n/I18nProvider";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  size?: number;
  onPageChange?: (page: number) => void;
}

function AppTable<T extends { id?: number | string }>({
  columns,
  data,
  total,
  page,
  size,
  onPageChange,
}: Props<T>) {
  const { t } = useI18n();

  return (
    <div className="border border-slate-200 rounded-xl shadow-md bg-white overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th key={col.key as string} className="px-6 py-4">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {data.map((row, idx) => (
            <tr
              key={String(row.id ?? idx)}
              className="bg-white hover:bg-slate-50 transition-colors duration-150"
            >
              {columns.map((col) => (
                <td key={col.key as string} className="px-4 py-3 text-slate-800">
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key as string] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length}>
                {t("common.noDataFound")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {total !== undefined && size && page !== undefined && onPageChange && (
        <div className="p-4 bg-white border-t border-slate-100">
          <Pagination
            total={total}
            page={page}
            size={size}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default AppTable;
