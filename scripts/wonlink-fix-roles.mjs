#!/usr/bin/env node
/*
  Set roles for three users by email:
  - test.admin+e2e@test.local  -> admin (auth metadata only, skip profiles to avoid DB allowlist)
  - test.brand+e2e@test.local  -> supplier
  - audio.avenue@example.com   -> influencer

  Uses Admin API listUsers to find by email robustly.
*/
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

try {
  const root = process.cwd()
  const envLocal = path.join(root, '.env.local')
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
  else dotenv.config()
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRole) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

const targets = [
  { email: 'test.admin+e2e@test.local',       role: 'admin',      name: 'Test Admin' },
  { email: 'test.brand+e2e@test.local',       role: 'supplier',   name: 'Test Brand' },
  { email: 'audio.avenue@example.com',        role: 'influencer', name: 'Audio Avenue' },
]

async function findUserIdByEmail(email) {
  const perPage = 200
  let page = 1
  const needle = email.trim().toLowerCase()
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users || []
    const match = users.find(u => (u.email || '').trim().toLowerCase() === needle)
    if (match) return match.id
    if (!users.length) break
    page += 1
    if (page > 25) break
  }
  return null
}

async function ensureProfile(id, role, name) {
  const { data: existing, error: selErr } = await admin.from('profiles').select('id, role').eq('id', id).maybeSingle()
  if (selErr) throw selErr
  if (!existing) {
    const { error } = await admin.from('profiles').insert({ id, role, name }).single()
    if (error) throw error
    return 'inserted'
  }
  if (existing.role !== role) {
    const { error } = await admin.from('profiles').update({ role, name }).eq('id', id)
    if (error) throw error
    return 'updated'
  }
  return 'noop'
}

async function run() {
  const report = []
  for (const t of targets) {
    const id = await findUserIdByEmail(t.email)
    if (!id) { report.push({ email: t.email, status: 'missing-auth' }); continue }

    // Always set auth metadata role
    const { error: updErr } = await admin.auth.admin.updateUserById(id, { user_metadata: { role: t.role } })
    if (updErr) throw updErr

    // Update profiles for non-admin roles only (admin may be allowlisted server-side)
    let prof = 'skipped'
    if (t.role !== 'admin') {
      try { prof = await ensureProfile(id, t.role, t.name) } catch (e) { prof = `error:${e?.message || e}` }
    }
    report.push({ email: t.email, id, setRole: t.role, profile: prof })
  }
  console.log(JSON.stringify({ ok: true, report }, null, 2))
}

run().catch((e) => { console.error('error', e); process.exit(1) })
