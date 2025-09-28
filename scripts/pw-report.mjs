#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

function readJson(p) {
  try {
    const raw = fs.readFileSync(p, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error(`Failed to read ${p}:`, e.message)
    process.exit(1)
  }
}

function walk(root, cb) {
  (root.suites || []).forEach((s) => walk(s, cb))
  ;(root.specs || []).forEach((sp) => {
    (sp.tests || []).forEach((t) => cb(sp, t))
  })
}

function summarize(json) {
  const tests = []
  walk(json, (spec, t) => {
    tests.push({ file: spec.file, title: t.title, project: t.projectName, results: t.results || [] })
  })

  const failed = tests.filter((t) => t.results.some((r) => r.status === 'failed'))
  const passed = tests.filter((t) => t.results.every((r) => r.status === 'passed'))
  const flaky = tests.filter((t) => t.results.some((r) => r.status === 'flaky'))
  const skipped = tests.filter((t) => t.results.every((r) => r.status === 'skipped'))

  // Top error messages
  const top = {}
  for (const f of failed) {
    const r = f.results.find((r) => r.status === 'failed') || {}
    const msg = String((r.error && (r.error.message || r.error)) || 'Unknown').split('\n')[0]
    top[msg] = (top[msg] || 0) + 1
  }

  // Per-file counts
  const perFile = {}
  for (const t of tests) {
    const f = t.file
    const isFailed = t.results.some((r) => r.status === 'failed')
    perFile[f] = perFile[f] || { failed: 0, passed: 0, total: 0 }
    perFile[f][isFailed ? 'failed' : 'passed']++
    perFile[f].total++
  }

  return { tests, failed, passed, flaky, skipped, top, perFile }
}

function printSummary(sum, limit = 10) {
  const { tests, failed, passed, flaky, skipped, top, perFile } = sum
  console.log(`Total: ${tests.length}  Passed: ${passed.length}  Failed: ${failed.length}  Flaky: ${flaky.length}  Skipped: ${skipped.length}`)

  console.log('\nTop failure messages:')
  Object.entries(top)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .forEach(([m, c]) => console.log(`- ${c}x ${m}`))

  console.log('\nFailures by file:')
  Object.entries(perFile)
    .sort((a, b) => (b[1].failed || 0) - (a[1].failed || 0))
    .forEach(([f, c]) => console.log(`${c.failed} failed, ${c.passed} passed  -  ${f}`))

  console.log('\nFailed details:')
  for (const f of failed) {
    const r = f.results.find((r) => r.status === 'failed') || {}
    const msg = String((r.error && (r.error.message || r.error)) || '').split('\n')[0]
    console.log(`- ${f.file} :: ${f.title}${f.project ? ` [${f.project}]` : ''}\n  ${msg}`)
  }
}

function writeMachineSummary(sum, outDir = 'test-results/summary') {
  const out = path.resolve(outDir)
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({
    totals: {
      total: sum.tests.length,
      passed: sum.passed.length,
      failed: sum.failed.length,
      flaky: sum.flaky.length,
      skipped: sum.skipped.length,
    },
    topFailures: Object.entries(sum.top).sort((a,b)=>b[1]-a[1]).map(([message,count])=>({message,count})),
    perFile: sum.perFile,
    failed: sum.failed.map(f=>{
      const r=f.results.find(r=>r.status==='failed')||{}
      return { file:f.file, title:f.title, project:f.project, message: (r.error&&(r.error.message||r.error))||'', stack: (r.error&&r.error.stack)||'' }
    })
  }, null, 2))
}

function main() {
  const args = process.argv.slice(2)
  const inputIdx = args.findIndex((a) => a === '--input')
  const input = inputIdx >= 0 ? args[inputIdx + 1] : 'test-results.json'
  const limitIdx = args.findIndex((a) => a === '--limit')
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 10
  const json = readJson(path.resolve(input))
  const sum = summarize(json)
  printSummary(sum, limit)
  writeMachineSummary(sum)
}

main()
