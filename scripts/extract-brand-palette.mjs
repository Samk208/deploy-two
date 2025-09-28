#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import Vibrant from "node-vibrant"
import { chromium } from "playwright"

const ROOT = process.cwd()
const PUBLIC = path.join(ROOT, "public")
const TOKENS = path.join(ROOT, "tokens", "design-tokens.json")
const BRAND_CSS = path.join(ROOT, "styles", "brand.css")
const REPORT = path.join(ROOT, "reports", "contrast.md")

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.split("=")
  return [k.replace(/^--/, ""), v ?? true]
}))

async function screenshot(url) {
  const tmp = path.join(os.tmpdir(), `brand-scan-${Date.now()}.png`)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(url, { waitUntil: "networkidle" })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: tmp, fullPage: false })
  await browser.close()
  return tmp
}

function toHex(rgb) {
  const [r,g,b] = rgb
  return "#" + [r,g,b].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase()
}

function uniq(arr) {
  return Array.from(new Set(arr.map(x => x.toUpperCase())))
}

function relativeLuminance(hex) {
  const rgb = hex.replace(/^#/, "").match(/.{2}/g).map(h => parseInt(h, 16) / 255)
  const srgb = rgb.map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4))
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2]
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg)
  const L2 = relativeLuminance(bg)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

function ensureBrandPurple(hexes) {
  const brand = "#4F46E5" // keep exact
  if (!hexes.some(h => h.toUpperCase() === brand)) hexes.unshift(brand)
  return hexes
}

async function extract(imagePath) {
  const v = new Vibrant(imagePath, { colorCount: 12 })
  const palette = await v.getPalette()
  const swatches = Object.values(palette).filter(Boolean)
  let colors = swatches.map(s => s.getHex().toUpperCase())
  colors = uniq(colors)
  colors = ensureBrandPurple(colors)
  return colors.slice(0, 12)
}

function pickSemantic(colors) {
  const brand600 = "#4F46E5"
  const brand700 = "#4338CA"
  const brand500 = "#6366F1"
  const accent500 = colors.find(c => /^#F/i.test(c)) || "#F59E0B"
  const bgSoft = "#F9FAFB"
  const text900 = "#111827"
  const text700 = "#374151"

  return {
    brand: { 700: brand700, 600: brand600, 500: brand500, 400: "#818CF8", 300: "#A5B4FC", 200: "#C7D2FE", 100: "#E0E7FF" },
    accent: { 500: accent500, 400: "#FBBF24" },
    background: { base: "#FFFFFF", soft: bgSoft },
    foreground: { 900: text900, 700: text700, 600: "#4B5563" }
  }
}

function writeTokens(sem) {
  const json = {
    "$schema": "https://design-tokens.org/schema.json",
    "color": sem
  }
  fs.writeFileSync(TOKENS, JSON.stringify(json, null, 2))
}

function writeBrandCss(sem) {
  const css = `:root {
  --brand-900: #312E81;
  --brand-800: #3730A3;
  --brand-700: ${sem.brand[700]};
  --brand-600: ${sem.brand[600]};
  --brand-500: ${sem.brand[500]};
  --brand-400: ${sem.brand[400]};
  --brand-300: ${sem.brand[300]};
  --brand-200: ${sem.brand[200]};
  --brand-100: ${sem.brand[100]};

  --accent-500: ${sem.accent[500]};
  --accent-400: ${sem.accent[400]};

  --bg-soft: ${sem.background.soft};
  --text-900: ${sem.foreground[900]};
  --text-700: ${sem.foreground[700]};
  --text-600: ${sem.foreground[600]};

  --background: #FFFFFF;
  --foreground: var(--text-900);
  --primary: var(--brand-600);
  --primary-foreground: #FFFFFF;
  --secondary: #F3F4F6;
  --secondary-foreground: var(--text-900);
  --muted: #F3F4F6;
  --muted-foreground: var(--text-600);
  --accent: var(--accent-500);
  --accent-foreground: #1F2937;
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;
  --border: #E5E7EB;
  --input: #E5E7EB;
  --ring: var(--brand-500);
}
`
  fs.writeFileSync(BRAND_CSS, css)
}

function mdRow(label, fg, bg) {
  const ratio = contrastRatio(fg, bg)
  const r = ratio.toFixed(2)
  const aa = ratio >= 4.5 ? "PASS" : "FAIL"
  const aaa = ratio >= 7 ? "PASS" : "FAIL"
  return `| ${label} | ${fg} on ${bg} | ${r}:1 | ${aa} | ${aaa} |`
}

function writeContrast(sem) {
  const lines = []
  lines.push(`# Contrast Report`)
  lines.push("")
  lines.push("| Case | Pair | Ratio | AA | AAA |")
  lines.push("|---|---|---:|:--:|:--:|")
  lines.push(mdRow("Text on white (text-900)", sem.foreground[900], "#FFFFFF"))
  lines.push(mdRow("Text on bg-soft (text-700)", sem.foreground[700], sem.background.soft))
  lines.push(mdRow("Brand on white (brand-600)", sem.brand[600], "#FFFFFF"))
  lines.push(mdRow("White on brand (brand-600)", "#FFFFFF", sem.brand[600]))
  fs.writeFileSync(REPORT, lines.join("\n"))
}

async function main() {
  let image
  if (args.url) {
    image = await screenshot(args.url)
  } else {
    const candidate = path.join(PUBLIC, "brand-source.png")
    image = fs.existsSync(candidate) ? candidate : path.join(PUBLIC, "fashion-banner.png")
  }

  const colors = await extract(image)
  const sem = pickSemantic(colors)

  writeTokens(sem)
  writeBrandCss(sem)
  writeContrast(sem)

  console.log("Generated:")
  console.log(" -", path.relative(ROOT, TOKENS))
  console.log(" -", path.relative(ROOT, BRAND_CSS))
  console.log(" -", path.relative(ROOT, REPORT))
}

main().catch(err => { console.error(err); process.exit(1) })
