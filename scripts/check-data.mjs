#!/usr/bin/env node
/*
  Data presence checks for products/shops via Supabase REST
  - Loads .env.local automatically (Next.js convention)
  - Checks anon-visible active products
  - Checks total products/shops/influencer_shop_products with service role
  - Prints a compact report
*/

import { config as dotenvConfig } from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load env: prefer .env.local, fallback to .env
const root = process.cwd()
const envLocal = path.join(root, '.env.local')
if (fs.existsSync(envLocal)) dotenvConfig({ path: envLocal })
else dotenvConfig()

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!BASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('❌ Missing env: ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

function ok(label) { console.log(`✅ ${label}`) }
function warn(label) { console.warn(`⚠️  ${label}`) }
function fail(label, err) { console.error(`❌ ${label}`, err || '') }

async function restHEADCount(pathname, key, where = '') {
  const url = `${BASE_URL}/rest/v1/${pathname}?select=id${where}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=estimated',
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} ${body}`)
  }
  const cr = res.headers.get('Content-Range') || ''
  // Content-Range: 0-24/* OR 0-0/123
  const total = cr.split('/')[1]
  return total ? Number(total) : NaN
}

async function restSelect(pathname, key, query = '') {
  const url = `${BASE_URL}/rest/v1/${pathname}?${query}`
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} ${body}`)
  }
  return res.json()
}

async function run() {
  console.log('\n=== Supabase Data Checks ===')
  console.log('Project:', BASE_URL)

  try {
    // Anon: active products visible to public
    const anonActiveProducts = await restHEADCount('products', ANON_KEY, '&active=eq.true')
    ok(`Anon-visible active products: ${isNaN(anonActiveProducts) ? 'n/a' : anonActiveProducts}`)
  } catch (e) {
    fail('Anon products check failed', e.message)
  }

  try {
    // Service (admin): total products
    const totalProducts = await restHEADCount('products', SERVICE_KEY)
    ok(`Total products (service): ${totalProducts}`)
  } catch (e) {
    fail('Service products count failed', e.message)
  }

  try {
    // Service (admin): total shops + top 5 recent
    const totalShops = await restHEADCount('shops', SERVICE_KEY)
    ok(`Total shops (service): ${totalShops}`)
    const shops = await restSelect('shops', SERVICE_KEY, 'select=id,handle,name,active,created_at&order=created_at.desc&limit=5')
    console.log('   Top shops:', shops.map(s => `${s.handle || s.id}${s.active === false ? ' (inactive)' : ''}`).join(', ') || '(none)')
  } catch (e) {
    fail('Service shops check failed', e.message)
  }

  try {
    const ispCount = await restHEADCount('influencer_shop_products', SERVICE_KEY)
    ok(`Influencer-shop links (service): ${ispCount}`)
  } catch (e) {
    fail('Influencer_shop_products check failed', e.message)
  }

  console.log('\nHints:')
  console.log('- If counts are 0, seed supplier/admin profiles and insert sample products tied to a supplier_id.')
  console.log('- Anon-visible products require active=true and RLS allows read; writes require supplier/admin role.')
}

run().catch((e) => { fail('Unexpected error', e); process.exit(1) })
