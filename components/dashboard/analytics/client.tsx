"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupplierDashboard } from "@/lib/api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function AnalyticsClient({
  currency,
  locale,
}: { currency?: string; locale?: string } = {}) {
  const { data, isLoading, error } = useQuery({ queryKey: ["supplier-dashboard"], queryFn: () => getSupplierDashboard() });

  const kpis = data?.stats ?? data?.kpis ?? {};
  const topProducts = (data?.topProducts ?? []).map((p: any) => ({
    name: p.name ?? p.title ?? String(p.id ?? ""),
    sales: p.sales_count ?? p.total_sales ?? 0,
  }));

  const daily = useMemo(() => {
    const orders = Array.isArray(data?.recentOrders) ? data!.recentOrders : [];
    const map = new Map<string, number>();
    for (const o of orders) {
      const d = o?.created_at ? new Date(o.created_at) : null;
      if (!d || Number.isNaN(+d)) continue;
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));
  }, [data]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading analytics…</div>;
  }
  if (error) {
    return <div className="text-sm text-red-600">Failed to load analytics</div>;
  }
  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Products" value={Number(kpis.totalProducts ?? kpis.products ?? 0)} />
        <Kpi label="Orders" value={Number(kpis.totalOrders ?? kpis.orders ?? 0)} />
        <Kpi label="Revenue" value={Number(kpis.totalRevenue ?? 0)} format="currency" currency={currency} locale={locale} />
        <Kpi label="Commission" value={Number(kpis.commissionEarned ?? kpis.totalCommission ?? 0)} format="currency" currency={currency} locale={locale} />
      </div>

      <div className="rounded border p-4">
        <h3 className="mb-2 font-medium">Top Products</h3>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide={topProducts.length > 12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded border p-4">
        <h3 className="mb-2 font-medium">Daily Orders</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#22c55e" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, format, currency, locale }: { label: string; value: number; format?: "currency" | "number"; currency?: string; locale?: string }) {
  const resolvedLocale = locale || undefined;
  const resolvedCurrency = currency || "USD";
  const display = format === "currency"
    ? new Intl.NumberFormat(resolvedLocale, { style: "currency", currency: resolvedCurrency }).format(value)
    : new Intl.NumberFormat(resolvedLocale).format(value);
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{display}</div>
    </div>
  );
}
