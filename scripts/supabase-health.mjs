#!/usr/bin/env node
// Read-only health probe: verifies Supabase envs and anonymous read of products

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, anon)

;(async () => {
  const { error } = await supabase.from('products').select('*', { head: true, count: 'exact' }).eq('active', true)
  if (error) {
    console.error('Health check FAILED:', error.message)
    process.exit(2)
  }
  console.log('Supabase health OK (anon read)')
})().catch((e) => {
  console.error('Unexpected error:', e?.message || e)
  process.exit(3)
})


