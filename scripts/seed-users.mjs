#!/usr/bin/env node
/*
  Seed users only (idempotent):
  - Creates/ensures supplier and influencer users in Supabase Auth
  - Ensures corresponding `profiles` rows with correct roles

  Safety:
  - FOR DEVELOPMENT/TEST ONLY. Blocks when NODE_ENV=production
  - Requires ALLOW_DEV_SEEDING=true (explicit opt-in)

  Env required:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY (unused here but validated for completeness)
  - SUPABASE_SERVICE_ROLE_KEY
  - SAMPLE_PASSWORD (recommended; if omitted, a strong random password is generated per run)
*/

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load env from .env.local first, then fallback to .env
const root = process.cwd()
const envLocal = path.join(root, '.env.local')
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
else dotenv.config()

// Security guards
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SECURITY: This script is FORBIDDEN in production!')
  process.exit(1)
}
if (process.env.ALLOW_DEV_SEEDING !== 'true') {
  console.error('❌ SECURITY: Set ALLOW_DEV_SEEDING=true to enable seeding (dev/test only)')
  process.exit(1)
}

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

// Determine password
const SAMPLE_PASSWORD = (() => {
  const p = process.env.SAMPLE_PASSWORD
  if (p && p.length >= 12) return p
  const bytes = crypto.randomBytes(18)
  const b64 = bytes.toString('base64')
  return `SeEd_${b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`
})()

if (process.env.SAFE_DEBUG_SEED === 'true') {
  console.log(`🔓 Sample password: ${SAMPLE_PASSWORD}`)
} else {
  console.log('🔐 Sample password is set (hidden).')
}

async function ensureUser(email, role, name) {
  // 1) Look up by email using admin API
  let userId = null
  try {
    const { data, error } = await admin.auth.admin.getUserByEmail(email)
    if (!error && data?.user) {
      userId = data.user.id
      info(`User exists: ${email} (${userId})`)
    }
  } catch {}

  // 2) Create if missing
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SAMPLE_PASSWORD,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (error || !data?.user) throw error || new Error('createUser returned no user')
    userId = data.user.id
    ok(`Created user: ${email} (${userId})`)
  }

  // 3) Ensure profile role/name
  const prof = await admin.from('profiles').select('id, role, name').eq('id', userId).maybeSingle()
  if (prof.error) throw prof.error
  if (!prof.data) {
    const ins = await admin.from('profiles').insert({ id: userId, role, name }).select('id').maybeSingle()
    if (ins.error) throw ins.error
    ok(`Created profile for ${email} with role=${role}`)
  } else if (prof.data.role !== role || prof.data.name !== name) {
    const upd = await admin.from('profiles').update({ role, name }).eq('id', userId)
    if (upd.error) throw upd.error
    ok(`Updated profile for ${email} to role=${role}`)
  } else {
    info(`Profile up-to-date for ${email}`)
  }

  return { id: userId }
}

async function run() {
  try {
    console.log('=== Seed users (supplier & influencer) ===')
    const supplier = await ensureUser('supplier@example.com', 'supplier', 'Supplier User')
    const influencer = await ensureUser('influencer@example.com', 'influencer', 'Influencer User')
    ok('Users ensured (no products/shops created)')
    // Do not print passwords to stdout unless SAFE_DEBUG_SEED
    console.log(JSON.stringify({
      ok: true,
      users: [
        { email: 'supplier@example.com', role: 'supplier', id: supplier.id },
        { email: 'influencer@example.com', role: 'influencer', id: influencer.id },
      ],
      passwordSource: process.env.SAMPLE_PASSWORD ? 'SAMPLE_PASSWORD' : 'generated',
    }))
  } catch (e) {
    fail('Seeding users failed', e)
    process.exit(1)
  }
}

run()



