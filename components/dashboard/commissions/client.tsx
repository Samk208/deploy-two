"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCommissions } from "@/lib/api/client";
import { DataTable } from "@/components/ui/data-table/table";
import { columns } from "./columns";
import { CommissionsToolbar, normalizeStatus } from "./toolbar";

export type CommissionsFilters = {
  owner: "supplier" | "admin" | "influencer";
  status?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  from?: string;
  to?: string;
};

export default function CommissionsClient({ defaultFilters }: { defaultFilters: CommissionsFilters }) {
  const [filters, setFilters] = React.useState<CommissionsFilters>({ ...defaultFilters });
  const query = useQuery({
    queryKey: ["commissions", filters],
    queryFn: () => getCommissions({
      ...filters,
      status: normalizeStatus(filters.status),
    } as any),
    staleTime: 10_000,
  });

  const page = query.data?.page ?? (filters.page ?? 1);
  const pageSize = query.data?.pageSize ?? (filters.pageSize ?? 20);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Commissions</h1>
      <CommissionsToolbar
        value={filters}
        onChange={(next: Partial<CommissionsFilters>) => setFilters((prev) => ({ ...prev, ...next, page: 1 }))}
      />
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        total={query.data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        isLoading={query.isLoading}
        isError={query.isError}
        onRefresh={() => query.refetch()}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        onPageSizeChange={(s) => setFilters((f) => ({ ...f, pageSize: s, page: 1 }))}
      />
    </div>
  );
}
