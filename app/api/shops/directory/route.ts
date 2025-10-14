import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureTypedClient } from "@/lib/supabase/types";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const supabase = ensureTypedClient(await createServerSupabaseClient());

    // 1) Fetch basic shops
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select(
        "id, influencer_id, handle, name, description, logo, banner, created_at"
      )
      .order("created_at", { ascending: false });

    if (shopsError) {
      console.error("Directory: shops fetch error", shopsError);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch shops" },
        { status: 500 }
      );
    }

    if (!shops || shops.length === 0) {
      return NextResponse.json({ ok: true, data: { shops: [], count: 0 } });
    }

    const influencerIds = Array.from(
      new Set(shops.map((s: any) => s.influencer_id).filter(Boolean))
    );

    // 2) Profiles for influencer names/avatars
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, avatar, verified")
      .in("id", influencerIds);

    if (profilesError) {
      console.error("Directory: profiles fetch error", profilesError);
    }
    const profileById = new Map((profiles || []).map((p: any) => [p.id, p]));

    // 3) Shop product links with categories for counts
    const { data: links, error: linksError } = await supabase
      .from("influencer_shop_products")
      .select(
        `influencer_id, products!inner ( category, active, deleted_at, in_stock, stock_count )`
      )
      .eq("published", true)
      .eq("products.active", true)
      .is("products.deleted_at", null)
      .eq("products.in_stock", true)
      .gt("products.stock_count", 0);

    if (linksError) {
      console.error("Directory: links fetch error", linksError);
    }

    const agg: Record<string, { count: number; categories: string[] }> = {};
    for (const row of links || []) {
      const inf = row.influencer_id as string;
      const productData = row.products as any;
      const categoriesFromRow: string[] = Array.isArray(productData)
        ? productData
            .map((p: any) => p?.category)
            .filter((c: unknown): c is string => typeof c === "string")
        : typeof productData?.category === "string"
          ? [productData.category]
          : [];

      if (!agg[inf]) agg[inf] = { count: 0, categories: [] };
      agg[inf].count += 1;
      for (const cat of categoriesFromRow) {
        if (!agg[inf].categories.includes(cat)) agg[inf].categories.push(cat);
      }
    }

    const result = shops.map((s: any) => {
      const prof = profileById.get(s.influencer_id) || {};
      const stats = agg[s.influencer_id] || { count: 0, categories: [] };
      return {
        id: s.id,
        handle: s.handle,
        name: s.name,
        description: s.description || "",
        logo: s.logo || null,
        banner: s.banner || null,
        product_count: stats.count,
        influencer_name: prof.name || "Influencer",
        influencer_avatar: prof.avatar || null,
        verified: !!prof.verified,
        categories: stats.categories,
      };
    });

    return NextResponse.json({
      ok: true,
      data: { shops: result, count: result.length },
    });
  } catch (error) {
    console.error("Directory API error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
