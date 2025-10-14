#!/usr/bin/env node
/*
  Verify supplier sign-in directly against Supabase using the anon client.
  Loads env from .env.local/.env so you don't have to export NEXT_PUBLIC_* manually.

  Usage (PowerShell):
    $env:SUP_EMAIL = 'test.brand+e2e@test.local'
    $env:SUP_PASSWORD = 'Brand1234!'
    node scripts/verify-supplier-signin.mjs
*/

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load env from .env.local first, then .env
try {
  const root = process.cwd()
  const envLocal = path.join(root, '.env.local')
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
  else dotenv.config()
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const email = process.env.SUP_EMAIL || 'test.brand+e2e@test.local'
const password = process.env.SUP_PASSWORD || 'Brand1234!'

const client = createClient(url, anon)

try {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  console.log('error =', error)
  console.log('user  =', data?.user?.id || null)
  process.exit(error ? 1 : 0)
} catch (e) {
  console.error('❌ Unexpected error:', e?.message || e)
  process.exit(1)
}