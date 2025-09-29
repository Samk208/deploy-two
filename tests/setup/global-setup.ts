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

  const tables = [
    "orders",
    "commissions",
    "verification_documents",
    "verification_requests",
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

  const { data: adminUser, error: adminErr } =
    await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "admin", full_name: "Test Admin" },
    });
  if (adminErr) console.warn("Failed to create admin:", adminErr);

  const { data: influencerUser, error: inflErr } =
    await supabaseAdmin.auth.admin.createUser({
      email: influencerEmail,
      password: INFLUENCER_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "influencer", full_name: "Test Influencer" },
    });
  if (inflErr) console.warn("Failed to create influencer:", inflErr);

  const { data: brandUser, error: brandErr } =
    await supabaseAdmin.auth.admin.createUser({
      email: brandEmail,
      password: BRAND_PASSWORD,
      email_confirm: true,
      // Use 'supplier' to match app roles (dashboard/supplier)
      user_metadata: { role: "supplier", full_name: "Test Brand" },
    });
  if (brandErr) console.warn("Failed to create brand:", brandErr);

  // Create Customer
  const { data: customerUser, error: custErr } =
    await supabaseAdmin.auth.admin.createUser({
      email: customerEmail,
      password: CUSTOMER_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "customer", full_name: "Test Customer" },
    });
  if (custErr) console.warn("Failed to create customer:", custErr);

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
