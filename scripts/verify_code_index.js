#!/usr/bin/env node
/*
  scripts/verify_code_index.js
  - Reads main_docs/CODE_INDEX.md and verifies each referenced path exists in the repo.
  - Outputs a small JSON report to stdout and writes `tmp/verify_code_index_report.json`.
*/

const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const indexPath = path.join(repoRoot, 'main_docs', 'CODE_INDEX.md')

if (!fs.existsSync(indexPath)) {
  console.error(`Error: CODE_INDEX.md not found at ${indexPath}`)
  process.exit(2)
}

const md = fs.readFileSync(indexPath, 'utf8')

// Find occurrences like `path/to/file` at line starts or in table
const filePaths = new Set()
const pathRegex = /`([a-zA-Z0-9_\-\/\[\].]+\.[a-zA-Z0-9_\-]+|app\/[\w\-\[\]/]+|lib\/[\w\-/.]+|main_docs\/[\w\-/.]+)`/g
let m
while ((m = pathRegex.exec(md)) !== null) {
  filePaths.add(m[1])
}

const results = []
for (const p of Array.from(filePaths)) {
  const abs = path.join(repoRoot, p)
  const exists = fs.existsSync(abs)
  results.push({ path: p, exists })
}

const missing = results.filter(r => !r.exists)

const out = {
  timestamp: new Date().toISOString(),
  total_references: results.length,
  missing_count: missing.length,
  results
}

// Ensure tmp dir exists
const tmpDir = path.join(repoRoot, 'tmp')
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
const outPath = path.join(tmpDir, 'verify_code_index_report.json')
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))

console.log(JSON.stringify(out, null, 2))

if (missing.length > 0) {
  console.error('\nMissing files were found — see tmp/verify_code_index_report.json for details')
  process.exit(1)
}

console.log('\nAll referenced files exist. Report written to tmp/verify_code_index_report.json')
process.exit(0)
