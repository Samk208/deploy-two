"use client";
import type { FeedResponse, MainShopProduct } from "@/types/catalog";
import FilterBar from "@/components/shop/FilterBar";
import PaginationBar from "@/components/shop/PaginationBar";
import MainShopCard from "@/components/shop/MainShopCard";

export default function MainShopClient({ initial }: { initial: FeedResponse }) {
  const { items, page, hasMore, total } = initial;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mb-4">Shop</h1>
      <div className="sticky top-16 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="py-3">
          <FilterBar total={total} />
        </div>
      </div>

      {items.length === 0 ? (
        <div data-testid="empty-state" className="rounded-2xl border p-8 text-center">
          No products yet — try clearing filters or adjusting the search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p: MainShopProduct) => <MainShopCard key={p.id} p={p} />)}
        </div>
      )}

      <PaginationBar page={page} hasMore={hasMore} />
    </div>
  );
}
