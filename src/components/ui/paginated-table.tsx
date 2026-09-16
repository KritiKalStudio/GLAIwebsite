"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const DEFAULT_PAGE_SIZE = 10;

export type TableColumn<T> = {
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
};

export function PaginatedTable<T>({
  rows,
  columns,
  rowKey,
  pageSize = DEFAULT_PAGE_SIZE,
  empty = "No results.",
  filterPlaceholder,
  matches,
  summaryNoun,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string;
  pageSize?: number;
  empty?: string;
  filterPlaceholder?: string;
  matches?: (row: T, query: string) => boolean;
  summaryNoun: string;
}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const searchable = Boolean(matches);
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!matches || !normalized) return rows;
    return rows.filter((row) => matches(row, normalized));
  }, [matches, normalized, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = start + visible.length;

  return (
    <div>
      {searchable ? (
        <div className="mb-3 max-w-sm">
          <label className="sr-only" htmlFor={`filter-${summaryNoun}`}>
            {filterPlaceholder ?? `Search ${summaryNoun}`}
          </label>
          <TextInput
            id={`filter-${summaryNoun}`}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={filterPlaceholder ?? `Search ${summaryNoun}`}
            className="py-2 text-sm"
          />
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-md border border-brand/10 bg-paper">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-brand/10 bg-mist/60 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className={cn("px-3 py-2 sm:px-4 sm:py-2.5", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand/10">
            {visible.length ? (
              visible.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-mist/50">
                  {columns.map((column) => (
                    <td key={column.header} className={cn("px-3 py-2 align-middle sm:px-4 sm:py-2.5", column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-sm text-muted sm:px-4" colSpan={columns.length}>
                  {normalized ? `No ${summaryNoun} match that search.` : empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted sm:text-sm">
        <p>
          {filtered.length
            ? `Showing ${from}–${to} of ${filtered.length} ${summaryNoun}`
            : `0 ${summaryNoun}`}
        </p>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <span className="tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
