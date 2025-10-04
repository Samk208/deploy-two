import type { FullConfig } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";
import path from "path";

// Ensure Playwright global setup has env vars loaded (Next.js doesn't load them for this Node process)
dotenvConfig({ path: path.resolve(process.cwd(), ".env.local") });

// Defer importing supabase admin until after env is loaded (CommonJS require to avoid ESM import error)
function getAdminClient() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("../../lib/supabase/admin") as { supabaseAdmin: any };
  return mod.supabaseAdmin;
}

async function deleteAuthUserByEmail(email: string) {
  const supabaseAdmin = getAdminClient();
  try {
    const { data: list, error: listErr } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
    if (listErr) throw listErr;
    const user = list.users.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (user) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) throw error;
    }
  } catch (e) {
    console.warn(`Warning: failed to delete auth user ${email}:`, e);
  }
}

// Ensure a user exists with the desired credentials/metadata.
// If the user already exists (e.g., prior delete failed due to FK/constraints), update it in-place.
async function ensureAuthUser(email: string, password: string, metadata: Record<string, any>) {
  const supabaseAdmin = getAdminClient();
  const lc = email.toLowerCase();
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    console.warn("List users failed while ensuring user:", listErr);
  }
  const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === lc);
  if (existing) {
    // Update password, confirm email, and metadata to desired role/state
    const { data: upd, error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (updErr) {
      console.warn(`Failed to update existing auth user ${email}:`, updErr);
    }
    return { user: upd?.user ?? existing };
  }
  // Create if not found
  const { data: created, error: crtErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (crtErr) {
    console.warn(`Failed to create auth user ${email}:`, crtErr);
  }
  return { user: created?.user };
}

export default async function globalSetup(_config: FullConfig) {
  const supabaseAdmin = getAdminClient();
  const influencerEmail = "test.influencer+e2e@test.local";
  const brandEmail = "test.brand+e2e@test.local";
  const adminEmail = "test.admin+e2e@test.local";
  const customerEmail = "test.customer+e2e@test.local";
  const ADMIN_PASSWORD = "TestAdmin123!";
  const CUSTOMER_PASSWORD = "NewTestPassword123!";
  const BRAND_PASSWORD = "NewBrandPassword123!";
  const INFLUENCER_PASSWORD = "NewInfluencerPassword123!";
  const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";

  // Clean in dependency order to avoid FK violations
  const tables = [
    "commissions", // depends on orders/products/profiles
    "influencer_shop_products", // depends on products and profiles
    "orders",
    "verification_documents",
    "verification_requests",
    "shops", // depends on profiles (influencer)
    "products",
    "profiles",
  ] as const;

  for (const t of tables) {
    try {
      const { error } = await supabaseAdmin
        .from(t as any)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) console.warn(`Cleanup warning for ${t}:`, error.message);
    } catch (e) {
      console.warn(`Cleanup exception for ${t}:`, e);
    }
  }

  await Promise.all([
    deleteAuthUserByEmail(influencerEmail),
    deleteAuthUserByEmail(brandEmail),
    deleteAuthUserByEmail(adminEmail),
    deleteAuthUserByEmail(customerEmail),
  ]);

  // Create or update users to the desired state
  const adminUser = await ensureAuthUser(adminEmail, ADMIN_PASSWORD, {
    role: "admin",
    full_name: "Test Admin",
  });
  const influencerUser = await ensureAuthUser(influencerEmail, INFLUENCER_PASSWORD, {
    role: "influencer",
    full_name: "Test Influencer",
  });
  const brandUser = await ensureAuthUser(brandEmail, BRAND_PASSWORD, {
    // Use 'supplier' to match app roles (dashboard/supplier)
    role: "supplier",
    full_name: "Test Brand",
  });
  const customerUser = await ensureAuthUser(customerEmail, CUSTOMER_PASSWORD, {
    role: "customer",
    full_name: "Test Customer",
  });

  // Ensure profiles exist with correct roles for middleware/redirects
  try {
    const rows: Array<{
      id: string;
      role: string;
      name?: string | null;
    }> = [];
    if (adminUser?.user?.id)
      rows.push({
        id: adminUser.user.id,
        role: "admin",
        name: "Test Admin",
      });
    if (influencerUser?.user?.id)
      rows.push({
        id: influencerUser.user.id,
        role: "influencer",
        name: "Test Influencer",
      });
    if (brandUser?.user?.id)
      rows.push({
        id: brandUser.user.id,
        role: "supplier",
        name: "Test Brand",
      });
    if (customerUser?.user?.id)
      rows.push({
        id: customerUser.user.id,
        role: "customer",
        name: "Test Customer",
      });

    if (rows.length > 0) {
      const { error: profErr } = await supabaseAdmin
        .from("profiles")
        .upsert(rows as any, { onConflict: "id" });
      if (profErr) console.warn("Failed to upsert profiles:", profErr.message);
    }
  } catch (e) {
    console.warn("Profiles upsert exception:", e);
  }

  if (brandUser?.user?.id) {
    const products = [
      {
        title: "E2E Test Product A",
        description: "Seeded by global-setup",
        price: 19.99,
        original_price: 24.99,
        images: [DEFAULT_IMAGE],
        category: "general",
        region: [],
        in_stock: true,
        stock_count: 100,
        supplier_id: brandUser.user.id,
        commission: 10,
        active: true,
      },
      {
        title: "E2E Test Product B",
        description: "Seeded by global-setup",
        price: 29.99,
        original_price: 39.99,
        images: [DEFAULT_IMAGE],
        category: "general",
        region: [],
        in_stock: true,
        stock_count: 100,
        supplier_id: brandUser.user.id,
        commission: 15,
        active: true,
      },
      {
        title: "E2E Test Product C",
        description: "Seeded by global-setup",
        price: 9.99,
        original_price: 12.99,
        images: [DEFAULT_IMAGE],
        category: "general",
        region: [],
        in_stock: true,
        stock_count: 100,
        supplier_id: brandUser.user.id,
        commission: 5,
        active: true,
      },
    ];
    const { data: seeded, error: seedErr } = await supabaseAdmin
      .from("products")
      .insert(products as any)
      .select("id, price");
    if (seedErr) console.warn("Failed to seed products:", seedErr.message);

    // Seed one influencer shop and link products so /shop/[handle] has data
    try {
      if (influencerUser?.user?.id) {
        const SHOP_HANDLE = "style-forward"; // matches sample cards and your screenshots

        // Upsert shop row (unique by handle)
        const shopRow = {
          influencer_id: influencerUser.user.id,
          handle: SHOP_HANDLE,
          name: "Style Forward",
          description: "Curated looks from our E2E influencer.",
          logo: null,
          banner: null,
          active: true,
        } as any
        const { error: shopUpsertErr } = await supabaseAdmin
          .from("shops")
          .upsert(shopRow, { onConflict: "handle" })
        if (shopUpsertErr) throw new Error(`Shop upsert failed: ${shopUpsertErr.message}`)

        // Link 1-3 products to the influencer shop as published
        if (seeded && seeded.length > 0) {
          const links = seeded.slice(0, 3).map((p: any, i: number) => ({
            influencer_id: influencerUser.user.id,
            product_id: p.id,
            custom_title: undefined,
            sale_price: i === 0 ? Number((Number(p.price) * 0.8).toFixed(2)) : null,
            published: true,
          }))
          // Upsert links with composite conflict on influencer_id,product_id
          const { error: linksErr } = await supabaseAdmin
            .from("influencer_shop_products")
            .upsert(links as any, { onConflict: "influencer_id,product_id" })
          if (linksErr) throw new Error(`Link upsert failed: ${linksErr.message}`)
        }
      }
    } catch (e) {
      console.warn("Seeding influencer shop exception:", e)
    }

    // Seed one minimal order and commission so supplier dashboard has data
    try {
      if (
        customerUser?.user?.id &&
        influencerUser?.user?.id &&
        seeded &&
        seeded.length > 0
      ) {
        const productId = seeded[0].id;
        const productPrice = Number(seeded[0].price) || 19.99;
        const orderTotal = productPrice;

        const order = {
          customer_id: customerUser.user.id,
          items: [{ product_id: productId, quantity: 1, price: productPrice }],
          total: orderTotal,
          status: "pending",
          shipping_address: { line1: "123 Test", city: "Seoul", country: "KR" },
          billing_address: { line1: "123 Test", city: "Seoul", country: "KR" },
          payment_method: "card",
        };
        const { data: orderIns, error: ordErr } = await supabaseAdmin
          .from("orders")
          .insert(order as any)
          .select("id")
          .single();
        if (ordErr) {
          console.warn("Failed to seed order:", ordErr.message);
        } else if (orderIns?.id) {
          const commissionAmount = Number((orderTotal * 0.1).toFixed(2));
          const commissionRow = {
            order_id: orderIns.id,
            influencer_id: influencerUser?.user?.id,
            supplier_id: brandUser.user.id,
            product_id: productId,
            amount: commissionAmount,
            rate: 10,
            status: "pending",
          };
          const { error: commErr } = await supabaseAdmin
            .from("commissions")
            .insert(commissionRow as any);
          if (commErr)
            console.warn("Failed to seed commission:", commErr.message);
        }
      }
    } catch (e) {
      console.warn("Seeding order/commission exception:", e);
    }
  }
}
