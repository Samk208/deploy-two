#!/usr/bin/env node
/*
  Dev-only seeder for influencer shops:
  - Ensures two influencer users (style-forward@test.local, tech-trends@test.local)
  - Upserts shops: style-forward, tech-trends
  - Links 3–4 products to each from existing catalog with a small discount

  Safety:
  - Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  - Aborts if NODE_ENV==='production' and ALLOW_DEV_SEEDING!=='true'
*/

import { createClient } from '@supabase/supabase-js'
import { config as dotenvConfig } from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const root = process.cwd()
const envLocal = path.join(root, '.env.local')
if (fs.existsSync(envLocal)) dotenvConfig({ path: envLocal })
else dotenvConfig()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  console.error('❌ Missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SEEDING !== 'true') {
  console.error('❌ Refusing to seed in production (set ALLOW_DEV_SEEDING=true to override for CI-only)')
  process.exit(1)
}

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

function ok(msg) { console.log(`✅ ${msg}`) }
function info(msg) { console.log(`ℹ️  ${msg}`) }
function warn(msg) { console.warn(`⚠️  ${msg}`) }

async function ensureInfluencer(email, name) {
  // Try via admin view if present
  let id = null
  try {
    const view = await admin.from('user_admin_view').select('id').eq('email', email).maybeSingle()
    if (!view.error && view.data?.id) id = view.data.id
  } catch {}

  if (!id) {
    const generatedPassword = process.env.SAMPLE_PASSWORD ||
      crypto.randomBytes(16).toString('base64url') + '1!Aa'

    const res = await admin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { role: 'influencer', name, test: true }
    })
    if (res.error && !res.data?.user) throw res.error
    id = res.data.user.id
    ok(`Created influencer user ${email}`)
  } else {
    info(`Influencer user exists: ${email}`)
  }

  // Ensure profile role/name
  const prof = await admin.from('profiles').select('id, role, name').eq('id', id).maybeSingle()
  if (prof.error) throw prof.error
  if (!prof.data) {
    const ins = await admin.from('profiles').insert({ id, role: 'influencer', name, verified: true }).select('id').maybeSingle()
    if (ins.error) throw ins.error
    ok(`Created profile for ${email}`)
  } else if (prof.data.role !== 'influencer' || prof.data.name !== name) {
    const upd = await admin.from('profiles').update({ role: 'influencer', name }).eq('id', id)
    if (upd.error) throw upd.error
    ok(`Updated profile for ${email}`)
  }

  return id
}

async function ensureShop(handle, name, influencer_id) {
  const existing = await admin.from('shops').select('id').eq('handle', handle).maybeSingle()
  if (!existing.error && existing.data?.id) {
    info(`Shop exists: ${handle}`)
    return existing.data.id
  }
  const ins = await admin.from('shops').insert({ influencer_id, handle, name, active: true }).select('id').maybeSingle()
  if (ins.error) throw ins.error
  ok(`Created shop: ${handle}`)
  return ins.data.id
}

async function curatedProductsFor(categoryPrefix) {
  // Prefer category match, fallback to any active in-stock
  const pref = await admin
    .from('products')
    .select('id, price, category, in_stock, active')
    .eq('active', true)
    .eq('in_stock', true)
    .ilike('category', `${categoryPrefix}%`)
    .limit(6)
  if (pref.error) throw pref.error
  if (pref.data?.length >= 3) return pref.data

  const any = await admin
    .from('products')
    .select('id, price, category, in_stock, active')
    .eq('active', true)
    .eq('in_stock', true)
    .limit(6)
  if (any.error) throw any.error
  return any.data
}

async function linkUpTo(influencer_id, products, discountFactor) {
  const toLink = (products || []).slice(0, 4)
  for (const p of toLink) {
    const exists = await admin
      .from('influencer_shop_products')
      .select('id')
      .eq('influencer_id', influencer_id)
      .eq('product_id', p.id)
      .maybeSingle()
    if (!exists.error && exists.data?.id) { info(`Link exists for ${p.id}`); continue }
    const sale = typeof p.price === 'number' ? Math.round(p.price * discountFactor * 100) / 100 : null
    const ins = await admin
      .from('influencer_shop_products')
      .insert({ influencer_id, product_id: p.id, sale_price: sale, published: true })
      .select('id')
      .maybeSingle()
    if (ins.error) throw ins.error
    ok(`Linked product ${p.id}`)
  }
}

async function main() {
  const styleId = await ensureInfluencer('style-forward@test.local', 'Style Forward')
  const techId = await ensureInfluencer('tech-trends@test.local', 'Tech Trends')

  await ensureShop('style-forward', 'Style Forward', styleId)
  await ensureShop('tech-trends', 'Tech Trends', techId)

  const fashion = await curatedProductsFor('Fashion')
  const electronics = await curatedProductsFor('Electronics')
  await linkUpTo(styleId, fashion, 0.90)
  await linkUpTo(techId, electronics, 0.95)

  ok('Influencer shops seeded (style-forward, tech-trends).')
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e?.message || e)
  process.exit(1)
})


