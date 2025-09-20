// scripts/fix-product-images.mjs
// One-off utility to backfill product images for products with no images.
// Usage: node scripts/fix-product-images.mjs
// Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { config as dotenvConfig } from 'dotenv'

// Ensure .env.local is loaded when running via Node (Next.js doesn't load it for this process)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenvConfig({ path: path.resolve(__dirname, '..', '.env.local') })
dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'

async function run() {
  console.log('Fetching products without images...')
  // We can't easily filter by array length server-side across all PostgREST versions,
  // so fetch a reasonable batch and filter client-side.
  const { data, error } = await supabase
    .from('products')
    .select('id, images')
    .limit(10000)

  if (error) {
    console.error('Fetch error:', error)
    process.exit(1)
  }

  const targets = (data || []).filter(p => !Array.isArray(p.images) || p.images.length === 0)
  console.log(`Found ${targets.length} product(s) to update.`)

  let updated = 0
  for (const p of targets) {
    const newImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [DEFAULT_IMAGE]
    const { error: upErr } = await supabase
      .from('products')
      .update({ images: newImages })
      .eq('id', p.id)
    if (upErr) {
      console.warn(`Failed to update product ${p.id}:`, upErr.message)
    } else {
      updated++
    }
  }

  console.log(`Done. Updated ${updated} product(s).`)
}

run().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
