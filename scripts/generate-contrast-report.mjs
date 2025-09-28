#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const TOKENS = path.join(ROOT, "tokens", "design-tokens.json")
const REPORT = path.join(ROOT, "reports", "contrast.md")

function get(obj, pathStr) {
  return pathStr.split('.').reduce((o,k)=>o&&o[k], obj)
}

function relativeLuminance(hex) {
  const [r,g,b] = hex.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)/255)
  const a = [r,g,b].map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4))
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2]
}

function contrastRatio(fg,bg){
  const L1 = relativeLuminance(fg)
  const L2 = relativeLuminance(bg)
  const lighter = Math.max(L1,L2)
  const darker = Math.min(L1,L2)
  return (lighter+0.05)/(darker+0.05)
}

const tokens = JSON.parse(fs.readFileSync(TOKENS, 'utf8'))
const color = tokens.color

const brand600 = get(color,'brand.600.value') || '#4F46E5'
const text900 = get(color,'foreground.900.value') || '#111827'
const text700 = get(color,'foreground.700.value') || '#374151'
const bgSoft  = get(color,'background.soft.value') || '#F9FAFB'
const white   = '#FFFFFF'

const rows = [
  { label: 'Text on white (text-900)', fg: text900, bg: white },
  { label: 'Text on bg-soft (text-700)', fg: text700, bg: bgSoft },
  { label: 'Brand on white (brand-600)', fg: brand600, bg: white },
  { label: 'White on brand (brand-600)', fg: white, bg: brand600 },
]

const lines = []
lines.push('# Contrast Report')
lines.push('')
lines.push('Using tokens from tokens/design-tokens.json')
lines.push('')
lines.push('| Case | Pair | Ratio | AA | AAA |')
lines.push('|---|---|---:|:--:|:--:|')
for (const r of rows){
  const ratio = contrastRatio(r.fg, r.bg)
  const aa = ratio >= 4.5 ? 'PASS' : 'FAIL'
  const aaa = ratio >= 7 ? 'PASS' : 'FAIL'
  lines.push(`| ${r.label} | ${r.fg} on ${r.bg} | ${ratio.toFixed(2)}:1 | ${aa} | ${aaa} |`)
}

lines.push('')
lines.push('## Palette (hex)')
const palette = {
  brand: ['100','200','300','400','500','600','700'].map(s=>get(color,`brand.${s}.value`)).filter(Boolean),
  accent: ['400','500'].map(s=>get(color,`accent.${s}.value`)).filter(Boolean),
  neutrals: [get(color,'foreground.900.value'), get(color,'foreground.700.value'), get(color,'background.soft.value'), '#FFFFFF']
}
for (const [k, list] of Object.entries(palette)){
  lines.push(`- ${k}: ${list.join(', ')}`)
}

fs.writeFileSync(REPORT, lines.join('\n'))
console.log('Wrote', path.relative(ROOT, REPORT))
