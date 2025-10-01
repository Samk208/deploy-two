#!/usr/bin/env node
// Usage: node scripts/set-password.mjs <email> <newPassword> [role]

import { createClient } from '@supabase/supabase-js'
import { config as dotenvConfig } from 'dotenv'
import path from 'path'

// Load .env.local so we can use the same project as the app/tests
dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') })

const [,, emailArg, passwordArg, roleArg] = process.argv
if (!emailArg || !passwordArg) {
  console.error('Usage: node scripts/set-password.mjs <email> <newPassword> [role]')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(email) {
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
    if (match) return match
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function main() {
  const email = emailArg
  const newPassword = passwordArg
  const role = roleArg // optional; when provided, upsert profile role

  const user = await findUserByEmail(email)
  if (!user) {
    console.error(`User not found for email: ${email}`)
    process.exit(2)
  }

  const { error: upErr } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (upErr) {
    console.error('Failed to update password:', upErr.message)
    process.exit(3)
  }

  if (role) {
    const { error: profErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, role }, { onConflict: 'id' })
    if (profErr) {
      console.warn('Password updated, but failed to upsert role in profiles:', profErr.message)
    }
  }

  console.log(JSON.stringify({ ok: true, id: user.id, email: user.email, role: role || null }, null, 2))
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(10)
})


