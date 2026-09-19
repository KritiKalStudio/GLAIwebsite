"use client";

import Link from "next/link";
import { PaginatedTable, type TableColumn } from "@/components/ui/paginated-table";

export type CountryCountRow = {
  country: string;
  countryCode: string;
  total: number;
};

export type DirectoryAmbassadorRow = {
  id: string;
  fullName: string;
  country: string;
  region: string | null;
  profession: string | null;
};

function includesQuery(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

export function CountryCountsTable({ rows }: { rows: CountryCountRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    const byTotal = Number(b.total) - Number(a.total);
    if (byTotal) return byTotal;
    return a.country.localeCompare(b.country);
  });

  return (
    <PaginatedTable
      rows={sorted}
      rowKey={(row) => row.countryCode}
      summaryNoun="countries"
      empty="No countries have approved ambassadors yet."
      filterPlaceholder="Search countries"
      matches={(row, query) => includesQuery(row.country, query) || includesQuery(row.countryCode, query)}
      columns={[
        {
          header: "Country",
          cell: (row) => (
            <Link href={`/love-ambassadors/network/${row.countryCode}`} className="font-medium text-brand hover:underline">
              {row.country}
            </Link>
          ),
        },
        {
          header: "Ambassadors",
          className: "w-32 text-right tabular-nums",
          cell: (row) => Number(row.total),
        },
      ]}
    />
  );
}

export function PlaceCountsTable({
  rows,
  empty,
  summaryNoun,
  filterPlaceholder,
}: {
  rows: { name: string; slug: string; total: number; href: string }[];
  empty: string;
  summaryNoun: string;
  filterPlaceholder: string;
}) {
  const sorted = [...rows].sort((a, b) => {
    const byTotal = Number(b.total) - Number(a.total);
    if (byTotal) return byTotal;
    return a.name.localeCompare(b.name);
  });

  return (
    <PaginatedTable
      rows={sorted}
      rowKey={(row) => row.slug}
      summaryNoun={summaryNoun}
      empty={empty}
      filterPlaceholder={filterPlaceholder}
      matches={(row, query) => includesQuery(row.name, query)}
      pageSize={20}
      columns={[
        {
          header: "Place",
          cell: (row) =>
            row.total > 0 ? (
              <Link href={row.href} className="font-medium text-brand hover:underline">
                {row.name}
              </Link>
            ) : (
              <Link href={row.href} className="text-muted hover:underline">
                {row.name}
              </Link>
            ),
        },
        {
          header: "Ambassadors",
          className: "w-32 text-right tabular-nums",
          cell: (row) => Number(row.total),
        },
      ]}
    />
  );
}

export function AmbassadorDirectoryTable({
  rows,
  showCountry = true,
}: {
  rows: DirectoryAmbassadorRow[];
  showCountry?: boolean;
}) {
  const sorted = [...rows].sort((a, b) => {
    const byCountry = a.country.localeCompare(b.country);
    if (byCountry) return byCountry;
    return a.fullName.localeCompare(b.fullName);
  });

  const columns: TableColumn<DirectoryAmbassadorRow>[] = [
    {
      header: "Name",
      cell: (row) => <span className="font-medium">{row.fullName}</span>,
    },
  ];
  if (showCountry) {
    columns.push({ header: "Country", cell: (row) => row.country });
  }
  columns.push(
    { header: "Region", cell: (row) => row.region || "—" },
    { header: "Profession", cell: (row) => row.profession || "—" },
  );

  return (
    <PaginatedTable
      rows={sorted}
      rowKey={(row) => row.id}
      summaryNoun="ambassadors"
      empty="No consenting ambassadors have opted in to the public directory yet."
      filterPlaceholder={showCountry ? "Search by name, country, or profession" : "Search by name, region, or profession"}
      matches={(row, query) =>
        includesQuery(row.fullName, query) ||
        includesQuery(row.country, query) ||
        includesQuery(row.region, query) ||
        includesQuery(row.profession, query)
      }
      columns={columns}
    />
  );
}
