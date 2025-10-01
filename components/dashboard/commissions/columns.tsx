import { ColumnDef } from "@tanstack/react-table";

export type CommissionRow = {
  id: string;
  created_at: string;
  status: string;
  amount: number;
  rate?: number;
  orders?: { id: string } | null;
  products?: { id: string; title?: string } | null;
};

export const columns: ColumnDef<CommissionRow>[] = [
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      const iso = row.original.created_at;
      const ts = Date.parse(iso);
      if (!Number.isFinite(ts)) return "—";
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(new Date(ts));
    },
  },
  {
    accessorKey: "orders.id",
    header: "Order",
    cell: ({ row }) => row.original.orders?.id ?? "—",
  },
  {
    accessorKey: "products.title",
    header: "Product",
    cell: ({ row }) => row.original.products?.title ?? "—",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
        Number(row.original.amount || 0)
      ),
  },
  {
    accessorKey: "rate",
    header: "Rate (%)",
    cell: ({ row }) => {
      const r = row.original.rate;
      if (typeof r !== "number" || !Number.isFinite(r)) return "—";
      // If rate is a fraction (e.g., 0.1), display as percentage; if already 10, display as is.
      const pct = r <= 1 ? r * 100 : r;
      return `${Math.round(pct)}%`;
    },
  },
  { accessorKey: "status", header: "Status" },
];
