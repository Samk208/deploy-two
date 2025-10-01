"use client";
import { useQuery } from "@tanstack/react-query";
import { getOrderById, getSupplierDashboard } from "@/lib/api/client";
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table/table";

type Order = {
  id: string;
  status: string;
  total: number;
  created_at?: string;
  [k: string]: any;
};

export default function OrdersClient() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["supplier-dashboard"], queryFn: () => getSupplierDashboard() });
  const recent = (data?.recentOrders ?? []) as Array<Order>;
  const [orderId, setOrderId] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [findError, setFindError] = useState<string | null>(null);

  async function handleFind() {
    setFindError(null);
    setDetail(null);
    try {
      if (!orderId.trim()) return;
      const d = await getOrderById(orderId.trim());
      setDetail(d as Order);
    } catch (e: any) {
      setFindError(e?.message || "Failed to fetch order");
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading orders…</div>;
  }
  if (isError) {
    return <div className="text-sm text-red-600">Failed to load orders: {(error as any)?.message || "Unknown error"}</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Orders</h1>
      <div className="flex gap-2">
        <input
          className="w-64 rounded border px-2 py-1 text-sm"
          placeholder="Find Order by ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <button className="rounded border px-3 py-1 text-sm" onClick={handleFind}>Find</button>
      </div>
      {findError && <div className="text-sm text-red-600">{findError}</div>}

      <DataTable
        columns={[
          { accessorKey: "id", header: "Order" },
          { accessorKey: "status", header: "Status" },
          { accessorKey: "total", header: "Total" },
          { accessorKey: "created_at", header: "Date" },
        ]}
        data={recent}
        total={recent.length}
        page={1}
        pageSize={recent.length || 10}
      />

      {detail && (
        <div className="rounded border p-3">
          <h2 className="mb-2 font-medium">Order Detail</h2>
          <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(detail, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
