"use client";
import Image from "next/image";
import Link from "next/link";
import type { MainShopProduct } from "@/types/catalog";

const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

export default function MainShopCard({ p }: { p: MainShopProduct }) {
  return (
    <Link
      data-testid="product-card"
      href={`/product/${p.id}`}
      className="block rounded-2xl border p-3 hover:shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
      aria-label={`View ${p.title}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
        <Image
          src={p.primary_image || "/images/fallback.jpg"}
          alt={p.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="mt-3">
        <h3 className="text-base font-medium line-clamp-2">{p.title}</h3>
        <div className="mt-1 text-sm opacity-80">{p.brand || p.category || "—"}</div>
        {p.short_description ? (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {p.short_description}
          </p>
        ) : null}
        <div className="mt-2 text-lg font-semibold">{fmt.format(p.price ?? 0)}</div>
      </div>
    </Link>
  );
}
