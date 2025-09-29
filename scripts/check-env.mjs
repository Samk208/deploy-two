#!/usr/bin/env node
// Prints required env presence (first 12 chars only for URL) and exits non-zero if any missing

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
]

let missing = []
for (const k of REQUIRED) {
  const v = process.env[k]
  if (!v || String(v).trim() === '') {
    console.log(`${k}: MISSING`)
    missing.push(k)
  } else {
    const masked = k.endsWith('_URL')
      ? String(v).slice(0, 12) + '…'
      : 'SET'
    console.log(`${k}: ${masked}`)
  }
}

if (missing.length) {
  console.error(`Missing ${missing.length} required env var(s): ${missing.join(', ')}`)
  process.exit(1)
}
console.log('All required envs are set.')

