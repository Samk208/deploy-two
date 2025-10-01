"use client";
import React from "react";

import { CommissionsFilters } from "./client";

export function normalizeStatus(status?: string) {
  if (!status || status === "ALL") return undefined;
  return status;
}

export function CommissionsToolbar({ value, onChange }: { value: CommissionsFilters; onChange: (next: Partial<CommissionsFilters>) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground mb-1">Status</label>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={value.status ?? "ALL"}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          {/* Never use empty value; use ALL sentinel */}
          <option value="ALL">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground mb-1">From</label>
        <input
          type="date"
          className="rounded border px-2 py-1 text-sm"
          value={value.from ?? ""}
          onChange={(e) => onChange({ from: e.target.value })}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground mb-1">To</label>
        <input
          type="date"
          className="rounded border px-2 py-1 text-sm"
          value={value.to ?? ""}
          onChange={(e) => onChange({ to: e.target.value })}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground mb-1">Search</label>
        <input
          className="w-64 rounded border px-2 py-1 text-sm"
          placeholder="Order ID or Product title"
          value={value.q ?? ""}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>
    </div>
  );
}
