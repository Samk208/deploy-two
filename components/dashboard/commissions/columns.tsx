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
  { accessorKey: "created_at", header: "Date" },
  { accessorKey: "orders.id", header: "Order" },
  { accessorKey: "products.title", header: "Product" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "rate", header: "Rate (%)" },
  { accessorKey: "status", header: "Status" },
];
