"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaginationBar({ page, hasMore }: { page: number; hasMore: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();

  function setPage(n: number) {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(Math.max(1, n)));
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="flex justify-center gap-2 mt-8">
      <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="rounded-xl border px-4 py-2 disabled:opacity-50">Previous</button>
      <span className="px-4 py-2">Page {page}</span>
      <button onClick={() => setPage(page + 1)} disabled={!hasMore} className="rounded-xl border px-4 py-2 disabled:opacity-50">Next</button>
    </div>
  );
}
