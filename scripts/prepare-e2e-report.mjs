#!/usr/bin/env node
// Ensure Playwright report directories exist before test run
import fs from "fs";
import path from "path";

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

const base = path.resolve(process.cwd(), "test-results", "Dashboard Report");
const html = path.join(base, "html-report");
const artifacts = path.join(base, "test-artifacts");

ensureDir(base);
ensureDir(html);
ensureDir(artifacts);

console.log(`[prepare-e2e-report] Ensured report directories:\n- ${base}\n- ${html}\n- ${artifacts}`);


