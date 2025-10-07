"use client";
import type { FeedResponse, MainShopProduct } from "@/types/catalog";
import FilterBar from "@/components/shop/FilterBar";
import PaginationBar from "@/components/shop/PaginationBar";

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
          {items.map((p: MainShopProduct) => (
            <a data-testid="product-card" key={p.id} href={`/product/${p.id}`} className="block rounded-2xl border p-3 hover:shadow-sm transition">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-200">
                {p.primary_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.primary_image} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
              <div className="mt-3">
                <h3 className="text-base font-medium line-clamp-2">{p.title}</h3>
                <div className="mt-1 text-sm opacity-80">{(p as any).brand || p.category || "—"}</div>
                <div className="mt-2 text-lg font-semibold">${p.price.toFixed(2)}</div>
              </div>
            </a>
          ))}
        </div>
      )}

      <PaginationBar page={page} hasMore={hasMore} />
    </div>
  );
}
