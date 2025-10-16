import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { EditProductClient } from "./EditProductClient";

// Explicit DB row typing avoids 'never' inference issues from generic clients
type DbProductRow = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  commission: number | null;
  stock_count: number | null;
  region: string[] | null;
  active: boolean | null;
  images: string[] | null;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  // Fetch product by id directly (read-only)
  const { data } = await supabase
    .from("products")
    .select(
      "id,title,description,category,price,commission,stock_count,region,active,images"
    )
    .eq("id", id)
    .maybeSingle();

  const product = (data as unknown as DbProductRow | null) ?? null;

  // Map DB row shape to client form shape; provide sensible defaults
  const mapped = product
    ? {
        id: product.id,
        title: product.title ?? "",
        description: product.description ?? "",
        category: product.category ?? "",
        basePrice: typeof product.price === "number" ? product.price : 0,
        commissionPct:
          typeof product.commission === "number" ? product.commission : 0,
        inventory:
          typeof product.stock_count === "number" ? product.stock_count : 0,
        regions: Array.isArray(product.region) ? (product.region ?? []) : [],
        active: Boolean(product.active),
        images: Array.isArray(product.images) ? (product.images ?? []) : [],
      }
    : {
        id,
        title: "",
        description: "",
        category: "",
        basePrice: 0,
        commissionPct: 0,
        inventory: 0,
        regions: [],
        active: false,
        images: [],
      };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProductClient product={mapped} />
    </Suspense>
  );
}
