#!/usr/bin/env node
/*
  Seed sample data (idempotent):
  - Creates admin, supplier, influencer users (if missing)
  - Ensures profiles have correct roles
  - Creates 2 sample products for supplier
  - Creates 2 shops ("main" and "example-handle") for influencer
  - Links one product to influencer shop

  Safe to re-run: checks existence before inserts.
*/

import { config as dotenvConfig } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Load env
const root = process.cwd()
const envLocal = path.join(root, '.env.local')
if (fs.existsSync(envLocal)) dotenvConfig({ path: envLocal })
else dotenvConfig()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon || !serviceRole) {
  console.error('❌ Missing env: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

function ok(m) { console.log(`✅ ${m}`) }
function info(m) { console.log(`ℹ️  ${m}`) }
function fail(m, e) { console.error(`❌ ${m}`, e?.message || e || '') }

// ⚠️  CRITICAL SECURITY WARNING ⚠️
// This script is for DEVELOPMENT/TESTING ONLY and must NEVER be run in production!
// It creates users with predictable/test passwords which is a severe security risk.
//
// PRODUCTION SAFETY CHECKS:
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SECURITY: This script is FORBIDDEN in production environment!')
  console.error('   Reason: Creates users with test passwords (SAMPLE_PASSWORD env var)')
  console.error('   This would create a critical security vulnerability in production.')
  console.error('   Set NODE_ENV to "development" or "test" to run this script.')
  process.exit(1)
}

if (!process.env.ALLOW_DEV_SEEDING && process.env.NODE_ENV !== 'development') {
  console.error('❌ SECURITY: Development seeding not explicitly allowed')
  console.error('   Set ALLOW_DEV_SEEDING=true to enable (development/testing only)')
  console.error('   WARNING: Never set this in production - it creates test users!')
  process.exit(1)
}

console.log('⚠️  WARNING: This script creates users with test passwords')
console.log('⚠️  Password source: SAMPLE_PASSWORD environment variable')
console.log('⚠️  Environment:', process.env.NODE_ENV || 'development')
console.log('⚠️  Only use in development/testing environments!')

// Determine sample user password from env or generate a secure fallback
const SAMPLE_PASSWORD = (() => {
  if (process.env.SAMPLE_PASSWORD && process.env.SAMPLE_PASSWORD.length >= 12) {
    return process.env.SAMPLE_PASSWORD
  }
  // Generate a strong random password: 24 chars base64url
  const bytes = crypto.randomBytes(18) // 24 chars when base64url
  const b64 = bytes.toString('base64')
  // base64url safe
  const base = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  // ensure a mix of chars
  return `SeEd_${base}`
})()

// Do not log secrets. For local debugging, enable SAFE_DEBUG_SEED to emit a non-sensitive notice only.
if (process.env.NODE_ENV !== 'production' && process.env.SAFE_DEBUG_SEED === 'true') {
  console.log('🔐 Sample password is set (hidden).')
}

async function ensureUserByEmail(email, role, name) {
  // Try to find via admin view first
  let id = null
  try {
    const view = await admin.from('user_admin_view').select('id').eq('email', email).maybeSingle()
    if (!view.error && view.data?.id) {
      id = view.data.id
      info(`User exists: ${email} (${id})`)
    }
  } catch {}

  if (!id) {
    // Create user
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SAMPLE_PASSWORD,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (error && !data?.user) {
      // If already registered, look up via view again
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

  // Ensure profile role/name
  const prof = await admin.from('profiles').select('id, role, name').eq('id', id).maybeSingle()
  if (prof.error) throw prof.error
  if (!prof.data) {
    // Trigger should have created, but ensure manually
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
  const { data, error: insErr } = await admin.from('shops').insert({ handle, name, influencer_id, active: true }).select('id').maybeSingle()
  if (insErr) throw insErr
  ok(`Created shop: ${handle}`)
  return data.id
}

async function ensureProduct(sku, title, supplier_id) {
  const { data: found, error } = await admin.from('products').select('id').eq('sku', sku).maybeSingle()
  if (!error && found?.id) {
    info(`Product exists: ${sku}`)
    return found.id
  }
  const payload = {
    sku,
    title,
    description: `${title} description`,
    price: 19.99,
    original_price: 24.99,
    images: ['https://picsum.photos/seed/' + encodeURIComponent(sku) + '/600/600'],
    category: 'general',
    region: [],
    in_stock: true,
    stock_count: 100,
    commission: 10,
    active: true,
    supplier_id,
  }
  const { data, error: insErr } = await admin.from('products').insert(payload).select('id').maybeSingle()
  if (insErr) throw insErr
  ok(`Created product: ${sku}`)
  return data.id
}

async function ensureInfluencerProductLink(influencer_id, product_id) {
  const { data: existing, error } = await admin
    .from('influencer_shop_products')
    .select('id')
    .eq('influencer_id', influencer_id)
    .eq('product_id', product_id)
    .maybeSingle()
  if (!error && existing?.id) {
    info(`Influencer/product link exists`)
    return existing.id
  }
  const { data, error: insErr } = await admin
    .from('influencer_shop_products')
    .insert({ influencer_id, product_id, published: true })
    .select('id')
    .maybeSingle()
  if (insErr) throw insErr
  ok(`Linked influencer -> product`)
  return data.id
}

async function run() {
  console.log('=== Seeding sample data ===')
  try {
    const adminId = await ensureUserByEmail('admin@example.com', 'admin', 'Admin User')
    const supplierId = await ensureUserByEmail('supplier@example.com', 'supplier', 'Supplier User')
    const influencerId = await ensureUserByEmail('influencer@example.com', 'influencer', 'Influencer User')

    const shop1 = await ensureShop('main', 'Main Shop', influencerId)
    const shop2 = await ensureShop('example-handle', 'Example Influencer Shop', influencerId)

    const p1 = await ensureProduct('SEED-001', 'Sample Product One', supplierId)
    const p2 = await ensureProduct('SEED-002', 'Sample Product Two', supplierId)

    await ensureInfluencerProductLink(influencerId, p1)

    ok('Seeding complete.')
  } catch (e) {
    fail('Seeding failed', e)
    process.exit(1)
  }
}

run()
