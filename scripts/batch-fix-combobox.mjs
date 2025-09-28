#!/usr/bin/env node
// Batch fix: Replace selectOption on product-category with click + role option selection
// Pattern fixed (generic label):
//   await page.selectOption('[data-testid="product-category"]', 'Some Label')
// Becomes:
//   await page.click('[data-testid="product-category"]');
//   await page.getByRole('option', { name: 'Some Label' }).click();

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const testsDir = path.join(repoRoot, 'tests');

/** Recursively collect files */
function walk(dir, matcher) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walk(full, matcher));
    } else if (matcher(full)) {
      files.push(full);
    }
  }
  return files;
}

function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');

  // Regex matches lines like:
  //   await page.selectOption('[data-testid="product-category"]', 'Electronics')
  //   await page.selectOption("[data-testid='product-category']", "Electronics")
  // Captures indentation for pretty replacement
  const regex = new RegExp(
    String.raw`^(\s*)await\s+page\.selectOption\(\s*(["'])\[data-testid=(["'])product-category\3\]\2\s*,\s*(["'])([^"']+)\4\s*\)\s*;?`,
    'gm'
  );

  let changed = false;
  const replaced = original.replace(regex, (_m, indent, _q1, _q2, _q3, label) => {
    changed = true;
    return (
      `${indent}await page.click('[data-testid=\"product-category\"]');\n` +
      `${indent}await page.getByRole('option', { name: '${label}' }).click();`
    );
  });

  if (changed) {
    fs.writeFileSync(filePath, replaced, 'utf8');
  }
  return changed;
}

if (!fs.existsSync(testsDir)) {
  console.error(`Tests directory not found: ${testsDir}`);
  process.exit(1);
}

const testFiles = walk(testsDir, (f) => f.endsWith('.ts'));
let modifiedCount = 0;
let fileCount = 0;
for (const f of testFiles) {
  const changed = fixFile(f);
  if (changed) {
    modifiedCount++;
    console.log(`[fixed] ${path.relative(repoRoot, f)}`);
  }
  fileCount++;
}

console.log(`\nProcessed ${fileCount} files. Modified ${modifiedCount} file(s).`);
if (modifiedCount === 0) {
  console.log('No matching selectOption patterns found.');
}


