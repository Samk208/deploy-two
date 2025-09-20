// Supabase CI smoke tests: validates connectivity and critical schema
// Usage: node scripts/ci-supabase-smoke.mjs

import { createClient } from '@supabase/supabase-js'

function getEnv(name, required = true) {
  const v = process.env[name]
  if (required && (!v || v.trim() === '')) {
    throw new Error(`Missing required env: ${name}`)
  }
  return v
}

async function main() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const failures = []

  async function assertSelect(table, columns, message) {
    const colStr = Array.isArray(columns) ? columns.join(', ') : columns
    const { data, error } = await supabase.from(table).select(colStr).limit(1)
    if (error) {
      failures.push({ table, columns: colStr, error: error.message })
      console.error(`✖ ${message || `Select from ${table}`}: ${error.message}`)
    } else {
      console.log(`✔ ${message || `Select from ${table}`}: OK (${data?.length ?? 0} rows)`)    
    }
  }

  console.log('Running Supabase smoke checks...')

  // Basic health check on users table
  await assertSelect('users', ['id', 'email', 'role', 'verified'], 'users core columns')

  // Products shape (supplier_id, price, commission, region, active)
  await assertSelect('products', ['id', 'title', 'supplier_id', 'price', 'commission', 'region', 'active'], 'products core columns')

  // Shops shape (handle, influencer_id, name, active)
  await assertSelect('shops', ['id', 'handle', 'influencer_id', 'name', 'active'], 'shops core columns')

  // Orders basic
  await assertSelect('orders', ['id', 'customer_id', 'total', 'status', 'items'], 'orders core columns')

  // Commissions basic
  await assertSelect('commissions', ['id', 'order_id', 'product_id', 'supplier_id', 'influencer_id', 'amount', 'rate', 'status'], 'commissions core columns')

  // Onboarding-related tables
  await assertSelect('profiles', ['id', 'role', 'verified', 'language'], 'profiles core columns')
  await assertSelect('verification_requests', ['id', 'user_id', 'role', 'status'], 'verification_requests core columns')
  await assertSelect('verification_documents', ['id', 'request_id', 'doc_type', 'status', 'storage_path'], 'verification_documents core columns')
  await assertSelect('influencer_payouts', ['id', 'user_id', 'bank_name', 'country'], 'influencer_payouts core columns')

  // Optional: email_verifications, if present
  await assertSelect('email_verifications', ['id', 'email', 'token', 'verified'], 'email_verifications core columns')

  if (failures.length > 0) {
    console.error(`\n${failures.length} database smoke checks failed:`)
    for (const f of failures) {
      console.error(` - ${f.table} [${f.columns}]: ${f.error}`)
    }
    process.exit(1)
  }

  console.log('All Supabase smoke checks passed.')
}

main().catch((err) => {
  console.error('Smoke test failed with error:', err?.stack || err?.message || String(err))
  process.exit(1)
})
