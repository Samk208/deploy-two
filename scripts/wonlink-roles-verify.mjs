#!/usr/bin/env node
/*
  Verify roles for specified emails in Supabase using Admin listUsers (reliable):
  - Finds auth users by email via pagination
  - Reads profiles.role for each user id
  - Reads auth user_metadata.role (metaRole)
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

async function findUserByEmail(email) {
  const needle = email.trim().toLowerCase()
  const perPage = 200
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users || []
    const match = users.find(u => (u.email || '').trim().toLowerCase() === needle)
    if (match) return match
    if (!users.length) break
    page += 1
    if (page > 25) break
  }
  return null
}

async function verifyOne(email) {
  const authUser = await findUserByEmail(email)
  const id = authUser?.id || null
  let profile = null
  if (id) {
    const { data } = await admin.from('profiles').select('id, role, name').eq('id', id).maybeSingle()
    profile = data || null
  }
  const metaRole = ((authUser?.user_metadata?.role || '') + '').toLowerCase() || null
  return { email, auth: id ? { id, metaRole } : null, profile }
}

async function run() {
  const emails = [
    'test.admin+e2e@test.local',
    'test.brand+e2e@test.local',
    'audio.avenue@example.com',
  ]
  const results = []
  for (const e of emails) {
    try { results.push(await verifyOne(e)) } catch (err) { results.push({ email: e, error: String(err?.message || err) }) }
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2))
}

run().catch((e) => { console.error('unexpected', e); process.exit(1) })
