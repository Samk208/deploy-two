"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/catalog";

type Props = {
  total?: number;
};

export default function FilterBar({ total }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "new");
  const [category, setCategory] = useState(sp.get("category") ?? "");
  const [brand, setBrand] = useState(sp.get("brand") ?? "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") ?? "");
  const [inStockOnly, setInStockOnly] = useState((sp.get("inStockOnly") ?? "true") === "true");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q) params.set("q", q); else params.delete("q");
      params.set("page", "1");
      router.push(`/shop?${params.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function apply() {
    const params = new URLSearchParams(sp.toString());
    function setOrDel(k: string, v: string) {
      if (v) {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    }
    setOrDel("sort", sort);
    setOrDel("category", category);
    setOrDel("brand", brand);
    setOrDel("minPrice", minPrice);
    setOrDel("maxPrice", maxPrice);
    params.set("inStockOnly", String(inStockOnly));
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  }

  function clearAll() {
    router.push("/shop");
  }

  const countText = useMemo(() => (typeof total === "number" ? `${total} items` : ""), [total]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
      <div className="flex-1 flex gap-2">
        <label className="sr-only" htmlFor="q">Search products</label>
        <input
          id="q"
          aria-label="Search products"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
        />
        <label className="sr-only" htmlFor="sort">Sort</label>
        <select
          id="sort"
          aria-label="Sort"
          className="rounded-xl border px-3 py-2"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:flex gap-2">
        <label className="sr-only" htmlFor="category">Category</label>
        <input id="category" aria-label="Category" className="rounded-xl border px-3 py-2" placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} />
        <label className="sr-only" htmlFor="brand">Brand</label>
        <input id="brand" aria-label="Brand" className="rounded-xl border px-3 py-2" placeholder="Brand" value={brand} onChange={(e)=>setBrand(e.target.value)} />
        <label className="sr-only" htmlFor="minPrice">Minimum price</label>
        <input id="minPrice" aria-label="Minimum price" className="rounded-xl border px-3 py-2" type="number" placeholder="Min $" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} />
        <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
        <input id="maxPrice" aria-label="Maximum price" className="rounded-xl border px-3 py-2" type="number" placeholder="Max $" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} />
        <label className="inline-flex items-center gap-2 text-sm" htmlFor="inStockOnly">
          <input id="inStockOnly" type="checkbox" checked={inStockOnly} onChange={(e)=>setInStockOnly(e.target.checked)} />
          In stock
        </label>
        <button onClick={apply} className="rounded-xl border px-3 py-2 font-medium">Apply</button>
        <button onClick={clearAll} className="rounded-xl border px-3 py-2">Clear</button>
      </div>

      <div className="text-sm opacity-70">{countText}</div>
    </div>
  );
}
