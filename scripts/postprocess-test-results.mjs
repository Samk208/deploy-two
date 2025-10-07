#!/usr/bin/env node
/**
 * Post-process Playwright test-results.json to convert absolute Windows paths
 * to repository-relative paths so they work across machines/CI.
 */
import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = path.resolve(process.cwd());
const workspaceRootNorm = workspaceRoot.replace(/\\/g, '/');
const reportPath = path.resolve('dashboard-build/test-results.json');

function toRelative(p) {
  if (!p || typeof p !== 'string') return p;
  const normalized = p.replace(/\\/g, '/');
  // If already relative, leave it
  if (!/^[A-Za-z]:\//.test(normalized) && !normalized.startsWith('/')) return normalized;
  // Make relative to workspace root
  let rel = path.relative(workspaceRootNorm, normalized).replace(/\\/g, '/');
  // Put artifacts under a stable folder if outside repo
  if (rel.startsWith('..')) {
    const baseName = path.basename(normalized);
    rel = `dashboard-build/test-artifacts/${baseName}`;
  }
  return rel;
}

function processAttachment(att) {
  if (!att || typeof att !== 'object') return att;
  if (att.path) att.path = toRelative(att.path);
  if (att.source) att.source = toRelative(att.source);
  return att;
}

function walk(obj) {
  if (Array.isArray(obj)) return obj.map(walk);
  if (obj && typeof obj === 'object') {
    // Process known attachment arrays
    if (Array.isArray(obj.attachments)) obj.attachments = obj.attachments.map(processAttachment);
    // Recurse for any nested items
    for (const k of Object.keys(obj)) obj[k] = walk(obj[k]);
  }
  return obj;
}

if (!fs.existsSync(reportPath)) {
  console.error(`File not found: ${reportPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(reportPath, 'utf8');
let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error('Could not parse JSON at', reportPath, e);
  process.exit(1);
}

const processed = walk(json);
fs.writeFileSync(reportPath, JSON.stringify(processed, null, 2));
console.log('Normalized attachment paths in', reportPath);
