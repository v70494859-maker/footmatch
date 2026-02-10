"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  page: number;
  totalPages: number;
  basePath: string;
}

export default function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Search...",
  page,
  totalPages,
  basePath,
}: DataTableProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("q") ?? "";

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  }

  function handlePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          defaultValue={currentSearch}
          placeholder={searchPlaceholder}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-surface-900 border border-surface-800 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-surface-500 focus:outline-none focus:ring-1 focus:ring-pitch-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-800">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-900 border-b border-surface-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {data.length > 0 ? (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-surface-800/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-surface-300">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-surface-500"
                >
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-medium text-surface-300 bg-surface-900 border border-surface-800 rounded-lg hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-surface-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-medium text-surface-300 bg-surface-900 border border-surface-800 rounded-lg hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
