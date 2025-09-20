#!/usr/bin/env node
/*
  Enhanced product seeding (idempotent, schema-aware)
  - Ensures admin, supplier, influencer users exist with proper profiles
  - Ensures two influencer shops exist: "main" and "example-handle"
  - Upserts 6 diverse products with multiple Unsplash images
  - Realistic pricing in dollars (converts from cents input), commission 12-25%
  - Stock 25-75, categories & regions
  - Links 3 products to influencer shop with custom sale prices

  Safe to re-run: uses lookups by SKU and only inserts missing links.
*/

import { config as dotenvConfig } from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Load env
const root = process.cwd()
const envLocal = path.join(root, '.env.local')
if (fs.existsSync(envLocal)) dotenvConfig({ path: envLocal })
else dotenvConfig()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  console.error('❌ Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function ok(m) { console.log(`✅ ${m}`) }
function info(m) { console.log(`ℹ️  ${m}`) }
function fail(m, e) { console.error(`❌ ${m}`, e?.message || e || '') }

// Strong sample password (same approach as scripts/seed-sample.mjs)
const SAMPLE_PASSWORD = (() => {
  if (process.env.SAMPLE_PASSWORD && process.env.SAMPLE_PASSWORD.length >= 12) {
    return process.env.SAMPLE_PASSWORD
  }
  const bytes = crypto.randomBytes(18)
  const b64 = bytes.toString('base64')
  const base = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  return `SeEd_${base}`
})()

async function ensureUserByEmail(email, role, name) {
  let id = null
  try {
    const view = await admin.from('user_admin_view').select('id').eq('email', email).maybeSingle()
    if (!view.error && view.data?.id) {
      id = view.data.id
      info(`User exists: ${email} (${id})`)
    }
  } catch {}

  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SAMPLE_PASSWORD,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (error && !data?.user) {
      const view2 = await admin.from('user_admin_view').select('id').eq('email', email).maybeSingle()
      if (view2.data?.id) {
        id = view2.data.id
        info(`User already existed: ${email} (${id})`)
      } else {
        throw error
      }
    } else {
      id = data.user.id
      ok(`Created user: ${email} (${id})`)
    }
  }

  const prof = await admin.from('profiles').select('id, role, name').eq('id', id).maybeSingle()
  if (prof.error) throw prof.error
  if (!prof.data) {
    const ins = await admin.from('profiles').insert({ id, role, name }).select('id').maybeSingle()
    if (ins.error) throw ins.error
    ok(`Created profile for ${email} with role=${role}`)
  } else if (prof.data.role !== role || prof.data.name !== name) {
    const upd = await admin.from('profiles').update({ role, name }).eq('id', id)
    if (upd.error) throw upd.error
    ok(`Updated profile for ${email} to role=${role}`)
  } else {
    info(`Profile up-to-date for ${email}`)
  }

  return id
}

async function ensureShop(handle, name, influencer_id) {
  const { data: existing, error } = await admin.from('shops').select('id').eq('handle', handle).maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  if (existing?.id) {
    info(`Shop exists: ${handle}`)
    return existing.id
  }
  const { data, error: insErr } = await admin
    .from('shops')
    .insert({ handle, name, influencer_id, active: true })
    .select('id')
    .maybeSingle()
  if (insErr) throw insErr
  ok(`Created shop: ${handle}`)
  return data.id
}

async function upsertProductBySku(sku, productPayload) {
  // Check by SKU; if present, update key fields else insert
  const { data: found, error } = await admin.from('products').select('id').eq('sku', sku).maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  if (found?.id) {
    const { error: updErr } = await admin.from('products').update(productPayload).eq('id', found.id)
    if (updErr) throw updErr
    info(`Updated product: ${sku}`)
    return found.id
  }
  const { data, error: insErr } = await admin.from('products').insert({ ...productPayload, sku }).select('id').maybeSingle()
  if (insErr) throw insErr
  ok(`Created product: ${sku}`)
  return data.id
}

async function ensureInfluencerProductLink(influencer_id, product_id, sale_price = null, custom_title = null) {
  const { data: existing, error } = await admin
    .from('influencer_shop_products')
    .select('id')
    .eq('influencer_id', influencer_id)
    .eq('product_id', product_id)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  if (existing?.id) {
    info(`Influencer/product link exists`)
    return existing.id
  }
  const { data, error: insErr } = await admin
    .from('influencer_shop_products')
    .insert({ influencer_id, product_id, published: true, sale_price, custom_title })
    .select('id')
    .maybeSingle()
  if (insErr) throw insErr
  ok(`Linked influencer -> product`)
  return data.id
}

function dollarsFromCents(cents) {
  // Project schema stores DECIMAL(10,2) dollars; convert safely
  return Math.round(Number(cents)) / 100
}

// Six diverse products (in cents as per request, converted to dollars before insert)
const productsData = [
  {
    sku: 'ENH-TECH-001',
    title: 'Premium Headphones',
    description: 'Wireless over-ear headphones with ANC and 30h battery.',
    priceCents: 29900,
    originalCents: 34900,
    commission: 15.0,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800&h=800&fit=crop'
    ],
    category: 'Electronics',
    region: ['US', 'CA', 'EU'],
    stock_count: 50,
  },
  {
    sku: 'ENH-WEAR-002',
    title: 'Smart Fitness Watch',
    description: 'Track health metrics with GPS and 7-day battery life.',
    priceCents: 24900,
    originalCents: 27900,
    commission: 12.0,
    images: [
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1579586337278-3f436f25d4d1?w=800&h=800&fit=crop'
    ],
    category: 'Wearables',
    region: ['US', 'CA', 'EU', 'AU'],
    stock_count: 75,
  },
  {
    sku: 'ENH-HOME-003',
    title: 'Minimalist Desk Lamp',
    description: 'Adjustable LED lamp with USB charging port.',
    priceCents: 8900,
    originalCents: 9900,
    commission: 20.0,
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop'
    ],
    category: 'Home & Office',
    region: ['US', 'CA', 'EU'],
    stock_count: 30,
  },
  {
    sku: 'ENH-FASH-004',
    title: 'Premium Leather Backpack',
    description: 'Handcrafted leather backpack with laptop compartment.',
    priceCents: 15900,
    originalCents: 19900,
    commission: 25.0,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&h=800&fit=crop'
    ],
    category: 'Fashion',
    region: ['US', 'CA', 'EU'],
    stock_count: 25,
  },
  {
    sku: 'ENH-FIT-005',
    title: 'Yoga Mat Premium',
    description: 'Eco-friendly yoga mat with superior grip and cushioning.',
    priceCents: 6900,
    originalCents: 8900,
    commission: 18.0,
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1593811167562-9cef47bfc4a7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1506629905077-bda2ba771e3b?w=800&h=800&fit=crop'
    ],
    category: 'Sports & Fitness',
    region: ['US', 'CA', 'EU', 'AU'],
    stock_count: 40,
  },
  {
    sku: 'ENH-BEAU-006',
    title: 'Organic Skincare Set',
    description: 'Cleanser, toner, serum, and moisturizer set.',
    priceCents: 12900,
    originalCents: 14900,
    commission: 22.0,
    images: [
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop'
    ],
    category: 'Beauty & Personal Care',
    region: ['US', 'CA', 'EU'],
    stock_count: 60,
  },
]

async function run() {
  console.log('=== Seeding enhanced products ===')
  try {
    const adminId = await ensureUserByEmail('admin@example.com', 'admin', 'Admin User')
    const supplierId = await ensureUserByEmail('supplier@example.com', 'supplier', 'Supplier User')
    const influencerId = await ensureUserByEmail('influencer@example.com', 'influencer', 'Influencer User')

    await ensureShop('main', 'Main Shop', influencerId)
    await ensureShop('example-handle', 'Example Influencer Shop', influencerId)

    // Upsert 6 products
    const productIds = []
    for (const p of productsData) {
      const payload = {
        title: p.title,
        description: p.description,
        price: dollarsFromCents(p.priceCents), // convert to dollars for DECIMAL(10,2)
        original_price: dollarsFromCents(p.originalCents),
        images: p.images,
        category: p.category,
        region: p.region,
        in_stock: true,
        stock_count: p.stock_count,
        commission: p.commission,
        active: true,
        supplier_id: supplierId,
      }
      const id = await upsertProductBySku(p.sku, payload)
      productIds.push({ id, title: p.title })
    }

    // Link first 3 products to influencer with custom sale prices
    const links = [
      { idx: 0, sale: dollarsFromCents(productsData[0].priceCents) - 20, title: `${productsData[0].title} - Launch Offer` },
      { idx: 1, sale: dollarsFromCents(productsData[1].priceCents) - 10, title: `${productsData[1].title} - Influencer Special` },
      { idx: 2, sale: dollarsFromCents(productsData[2].priceCents) - 5, title: null },
    ]

    for (const l of links) {
      const pid = productIds[l.idx]?.id
      if (!pid) continue
      await ensureInfluencerProductLink(influencerId, pid, l.sale, l.title)
    }

    ok('Enhanced product seeding complete.')
    console.log('🌐 Test pages:')
    console.log('  - Main shop:        http://localhost:3000/shop/main')
    console.log('  - Influencer shop:  http://localhost:3000/shop/example-handle')
  } catch (e) {
    fail('Enhanced seeding failed', e)
    process.exit(1)
  }
}

run()
