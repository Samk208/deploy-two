#!/usr/bin/env node
/*
  One-off admin password reset script (no email required)

  What it does
  - Looks up each user by email with Supabase Admin API
  - Sets a new password for that user

  Requirements
  - Node 18+
  - Env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - Run ONLY in development/test. Keep the service role key secret.

  Usage
    node scripts/admin-reset-passwords.mjs

  Optional: define different passwords via env
    ADMIN_PASSWORD=MyPwd SUPPLIER_PASSWORD=MyPwd INFLUENCER_PASSWORD=MyPwd \
    node scripts/admin-reset-passwords.mjs
*/

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load env from .env.local first, fallback to .env
try {
  const root = process.cwd()
  const envLocal = path.join(root, '.env.local')
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
  else dotenv.config()
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRole) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function ok(m) { console.log(`✅ ${m}`) }
function info(m) { console.log(`ℹ️  ${m}`) }
function fail(m, e) { console.error(`❌ ${m}`, e?.message || e || '') }

async function getUserByEmailRest(email) {
  const endpoint = `${url.replace(/\/$/, '')}/auth/v1/admin/users?email=${encodeURIComponent(email)}`
  const res = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${serviceRole}`,
      'apikey': serviceRole,
    }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Lookup failed (${res.status}): ${text}`)
  }
  const json = await res.json()
  const user = Array.isArray(json?.users) ? json.users[0] : (Array.isArray(json) ? json[0] : null)
  return user || null
}

async function setPasswordByEmail(email, newPassword) {
  const user = await getUserByEmailRest(email)
  if (!user?.id) throw new Error(`User not found: ${email}`)
  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password: newPassword })
  if (updErr) throw updErr
  ok(`Password reset for ${email}`)
}

async function run() {
  // Default passwords (override via env if desired)
  const ADMIN_EMAIL = 'test.admin+e2e@test.local'
  const SUPPLIER_EMAIL = 'test.brand+e2e@test.local'
  const INFLUENCER_EMAIL = 'audio.avenue@example.com'

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TestAdmin123!'
  const SUPPLIER_PASSWORD = process.env.SUPPLIER_PASSWORD || 'Sup3rBrand!'
  const INFLUENCER_PASSWORD = process.env.INFLUENCER_PASSWORD || '24690H'

  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SECURITY: Do not run this in production')
    process.exit(1)
  }

  info('Resetting passwords via Supabase Admin API...')
  try {
    await setPasswordByEmail(ADMIN_EMAIL, ADMIN_PASSWORD)
    await setPasswordByEmail(SUPPLIER_EMAIL, SUPPLIER_PASSWORD)
    await setPasswordByEmail(INFLUENCER_EMAIL, INFLUENCER_PASSWORD)
  } catch (e) {
    fail('Failed to reset one or more passwords', e)
    process.exit(1)
  }

  ok('All requested passwords updated successfully.')
  console.log('\nNext steps:')
  console.log('- Clear cookies for http://localhost:3000 in your browser')
  console.log('- Try signing in with the updated passwords')
}

run()
