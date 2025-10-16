#!/usr/bin/env node
/*
  wonlink-shops-cleanup-seed.mjs

  Purpose (safe by default):
  - DRY RUN preview of:
    1) Removing test products from influencer shops (shops.products)
    2) Seeding real products into a target influencer shop
    3) Optionally creating a new influencer shop

  Safety:
  - Defaults to DRY RUN (no writes). Set APPLY_CHANGES=true to write.
  - Honors database freeze by default; refuses writes if app.is_shops_frozen() unless FORCE_BYPASS_FREEZE=true
  - Uses service role; middleware freezes do not affect this script

  Required env:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - ALLOW_DEV_SEEDING=true (guards against prod misuse)

  Optional env:
  - TARGET_SHOP_HANDLE=your-handle           (shop to clean + seed)
  - TEST_PATTERNS="E2E Test|Test Product|Dummy|Sample" (title match)
  - REAL_SUPPLIER_ID=uuid                    (prioritize products from this supplier)
  - PRODUCTS_TO_SEED_COUNT=12                (how many to add)
  - FILTER_CATEGORY=Electronics              (optional)
  - FILTER_BRAND=Apple|Sony                  (optional, matches title ILIKE)
  - APPLY_CHANGES=false                      (set true to apply)
  - FORCE_BYPASS_FREEZE=false                (set true to write while DB freeze on)
  - NEW_SHOP_HANDLE=creator-two              (optional: create new shop)
  - NEW_SHOP_NAME="Creator Two"             (optional)
  - NEW_SHOP_INFLUENCER_EMAIL=user@x.com     (or NEW_SHOP_INFLUENCER_ID=uuid)
*/

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load .env.local first then .env
const root = process.cwd()
const envLocal = path.join(root, '.env.local')
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
else dotenv.config()

// Guards
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SECURITY: This script is FORBIDDEN in production!')
  process.exit(1)
}
if (process.env.ALLOW_DEV_SEEDING !== 'true') {
  console.error('❌ SECURITY: Set ALLOW_DEV_SEEDING=true to enable (dev/test only)')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRole) {
  console.error('❌ Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DRY_RUN = (process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false'
const APPLY_CHANGES = (process.env.APPLY_CHANGES ?? 'false').toLowerCase() === 'true'
const FORCE_BYPASS_FREEZE = (process.env.FORCE_BYPASS_FREEZE ?? 'false').toLowerCase() === 'true'

const TARGET_SHOP_HANDLE = process.env.TARGET_SHOP_HANDLE || ''
const TEST_PATTERNS = (process.env.TEST_PATTERNS || 'E2E Test|Test Product|Dummy|Sample')
  .split('|')
  .map(s => s.trim())
  .filter(Boolean)
const REAL_SUPPLIER_ID = process.env.REAL_SUPPLIER_ID || ''
const PRODUCTS_TO_SEED_COUNT = Math.max(0, parseInt(process.env.PRODUCTS_TO_SEED_COUNT || '12', 10) || 12)
const FILTER_CATEGORY = (process.env.FILTER_CATEGORY || '').trim()
const FILTER_BRAND = (process.env.FILTER_BRAND || '').trim()

const NEW_SHOP_HANDLE = (process.env.NEW_SHOP_HANDLE || '').trim()
const NEW_SHOP_NAME = (process.env.NEW_SHOP_NAME || '').trim()
const NEW_SHOP_INFLUENCER_EMAIL = (process.env.NEW_SHOP_INFLUENCER_EMAIL || '').trim()
const NEW_SHOP_INFLUENCER_ID = (process.env.NEW_SHOP_INFLUENCER_ID || '').trim()

function info(m) { console.log(`ℹ️  ${m}`) }
function ok(m) { console.log(`✅ ${m}`) }
function warn(m) { console.warn(`⚠️  ${m}`) }
function err(m, e) { console.error(`❌ ${m}`, e?.message || e || '') }

async function isDbShopsFrozen() {
  try {
    const { data, error } = await admin.rpc('app.is_shops_frozen')
    if (error) throw error
    return Boolean(data)
  } catch (e) {
    warn(`Could not read app.is_shops_frozen(): ${e?.message || e}`)
    // If unknown, assume frozen for safety
    return true
  }
}

function buildOrIlike(column, patterns) {
  // Supabase .or() expects "a.ilike.%x%,b.ilike.%y%" syntax
  const parts = []
  for (const p of patterns) {
    const escaped = p.replaceAll('%', '\\%').replaceAll('_', '\\_')
    parts.push(`${column}.ilike.%${escaped}%`)
  }
  return parts.join(',')
}

async function getShopByHandle(handle) {
  if (!handle) return { data: null, error: null }
  return await admin.from('shops').select('id, influencer_id, handle, name, products').eq('handle', handle).maybeSingle()
}

async function listTestProducts() {
  // Identify test products by title patterns
  let query = admin.from('products').select('id, title, created_at, supplier_id, active, in_stock, stock_count').limit(500)
  if (TEST_PATTERNS.length) {
    query = query.or(buildOrIlike('title', TEST_PATTERNS))
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function listSeedCandidates(excludeIds = new Set()) {
  let query = admin
    .from('products')
    .select('id, title, price, commission, images, category, region, supplier_id, in_stock, stock_count, active, created_at')
    .is('deleted_at', null)
    .eq('active', true)
    .or('in_stock.eq.true,stock_count.gt.0')

  if (REAL_SUPPLIER_ID) query = query.eq('supplier_id', REAL_SUPPLIER_ID)
  if (FILTER_CATEGORY) query = query.eq('category', FILTER_CATEGORY)
  if (FILTER_BRAND) {
    const brandPatterns = FILTER_BRAND.split('|').map(s => s.trim()).filter(Boolean)
    if (brandPatterns.length) query = query.or(buildOrIlike('title', brandPatterns))
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(200)
  if (error) throw error
  const filtered = (data || []).filter(p => !excludeIds.has(p.id))
  return filtered.slice(0, PRODUCTS_TO_SEED_COUNT)
}

function normalizeShopProducts(productsCol) {
  // Supports string[] or JSON object array from current API
  if (!Array.isArray(productsCol)) return { ids: [], overridesById: {} }
  const first = productsCol[0]
  if (!first) return { ids: [], overridesById: {} }
  if (typeof first === 'string') {
    return { ids: productsCol, overridesById: {} }
  }
  const ids = []
  const overridesById = {}
  for (const obj of productsCol) {
    const id = obj?.product_id || obj?.id
    if (id) {
      ids.push(id)
      overridesById[id] = {
        custom_title: obj.custom_title,
        sale_price: obj.sale_price,
        published: obj.published,
      }
    }
  }
  return { ids, overridesById }
}

async function softDeleteProduct(productId) {
  const { data, error } = await admin.rpc('soft_delete_product', { product_id: productId })
  if (error) throw error
  return data
}

async function run() {
  info('Wonlink Shops Cleanup & Seed (DRY RUN by default)')
  info(`Target shop handle: ${TARGET_SHOP_HANDLE || '(none)'}`)
  info(`Patterns for test products: ${TEST_PATTERNS.join(' | ')}`)
  info(`Seed count: ${PRODUCTS_TO_SEED_COUNT}`)
  if (REAL_SUPPLIER_ID) info(`Prioritize supplier: ${REAL_SUPPLIER_ID}`)

  const frozen = await isDbShopsFrozen()
  info(`DB shops freeze: ${frozen ? 'ON' : 'OFF'}`)
  if (frozen && APPLY_CHANGES && !FORCE_BYPASS_FREEZE) {
    warn('Freeze is ON. APPLY_CHANGES denied unless FORCE_BYPASS_FREEZE=true')
  }

  // 1) Find test products
  const testProducts = await listTestProducts()
  info(`Found ${testProducts.length} potential test products by title pattern`)

  // 2) If target shop provided, preview cleanup and seeding
  let shop = null
  if (TARGET_SHOP_HANDLE) {
    const shopRes = await getShopByHandle(TARGET_SHOP_HANDLE)
    if (shopRes.error) throw shopRes.error
    shop = shopRes.data
    if (!shop) {
      warn(`Shop not found for handle=${TARGET_SHOP_HANDLE}`)
    } else {
      ok(`Shop resolved: ${shop.name} (${shop.id}) influencer=${shop.influencer_id}`)
      const { ids: currentIds } = normalizeShopProducts(shop.products)
      const currentSet = new Set(currentIds)
      const testSet = new Set(testProducts.map(p => p.id))
      const toRemove = currentIds.filter(id => testSet.has(id))
      const keptIds = currentIds.filter(id => !testSet.has(id))
      info(`Current products: ${currentIds.length}; test-linked in shop: ${toRemove.length}`)

      // Seed candidates excluding already present
      const exclude = new Set(keptIds)
      const seedCandidates = await listSeedCandidates(exclude)
      info(`Seed candidates available: ${seedCandidates.length}`)

      const plannedAddIds = seedCandidates.map(p => p.id)
      const plannedNewList = [...keptIds, ...plannedAddIds]

      // Preview summary
      console.log('\n--- DRY RUN PREVIEW (shop update) ---')
      console.log(`Handle: ${shop.handle}`)
      console.log(`Remove ${toRemove.length} test products`) 
      console.log(`Add ${plannedAddIds.length} real products`) 
      if (!APPLY_CHANGES || frozen) {
        console.log('Action: NO WRITE (dry-run or freeze ON)')
      } else {
        console.log('Action: APPLY CHANGES')
      }

      // Apply update (write guarded)
      if (APPLY_CHANGES && (!frozen || FORCE_BYPASS_FREEZE)) {
        const { error: updErr } = await admin
          .from('shops')
          .update({ products: plannedNewList, updated_at: new Date().toISOString() })
          .eq('id', shop.id)
        if (updErr) throw updErr
        ok(`Shop products updated: -${toRemove.length} +${plannedAddIds.length}`)
      }
    }
  }

  // 3) Optionally create a new influencer shop
  if (NEW_SHOP_HANDLE && (NEW_SHOP_INFLUENCER_EMAIL || NEW_SHOP_INFLUENCER_ID)) {
    let influencerId = NEW_SHOP_INFLUENCER_ID
    if (!influencerId && NEW_SHOP_INFLUENCER_EMAIL) {
      try {
        const byEmail = await admin.auth.admin.getUserByEmail(NEW_SHOP_INFLUENCER_EMAIL)
        influencerId = byEmail?.data?.user?.id || ''
      } catch (e) {
        warn(`Failed to resolve influencer by email: ${NEW_SHOP_INFLUENCER_EMAIL}`)
      }
      if (!influencerId) {
        const prof = await admin.from('profiles').select('id').eq('email', NEW_SHOP_INFLUENCER_EMAIL).maybeSingle()
        if (prof.data?.id) influencerId = prof.data.id
      }
    }

    if (!influencerId) {
      warn('New shop requested but influencer_id could not be resolved; skipping creation')
    } else {
      // Compute initial product list (optional)
      const initialSeed = await listSeedCandidates(new Set())
      const initialIds = initialSeed.map(p => p.id)
      console.log('\n--- DRY RUN PREVIEW (new shop) ---')
      console.log(`Handle: ${NEW_SHOP_HANDLE}`)
      console.log(`Name:   ${NEW_SHOP_NAME || '(unnamed)'} `)
      console.log(`Influencer: ${influencerId}`)
      console.log(`Initial products: ${initialIds.length}`)
      if (!APPLY_CHANGES || frozen) {
        console.log('Action: NO WRITE (dry-run or freeze ON)')
      } else {
        console.log('Action: APPLY CHANGES')
      }

      if (APPLY_CHANGES && (!frozen || FORCE_BYPASS_FREEZE)) {
        const nowIso = new Date().toISOString()
        const { error: insErr } = await admin.from('shops').insert({
          influencer_id: influencerId,
          handle: NEW_SHOP_HANDLE,
          name: NEW_SHOP_NAME || NEW_SHOP_HANDLE,
          products: initialIds, // Use string[] for broad compatibility
          active: true,
          created_at: nowIso,
          updated_at: nowIso,
        })
        if (insErr) throw insErr
        ok(`New shop created: ${NEW_SHOP_HANDLE}`)
      }
    }
  }

  // 4) Optional: Soft-delete test products themselves (very conservative; off by default)
  const SHOULD_SOFT_DELETE_TESTS = (process.env.SOFT_DELETE_TEST_PRODUCTS || 'false').toLowerCase() === 'true'
  if (SHOULD_SOFT_DELETE_TESTS && testProducts.length) {
    console.log('\n--- DRY RUN PREVIEW (soft delete test products) ---')
    console.log(`Count: ${testProducts.length}`)
    if (!APPLY_CHANGES || frozen) {
      console.log('Action: NO WRITE (dry-run or freeze ON)')
    } else {
      console.log('Action: APPLY CHANGES')
    }
    if (APPLY_CHANGES && (!frozen || FORCE_BYPASS_FREEZE)) {
      for (const p of testProducts) {
        await softDeleteProduct(p.id).catch(e => warn(`soft_delete_product failed ${p.id}: ${e?.message || e}`))
      }
      ok(`Soft-deleted ${testProducts.length} test products`)
    }
  }

  console.log('\n🎯 Done (dry-run preview complete)')
}

run().catch(e => {
  err('Script failed', e)
  process.exit(1)
})


