// Smoke test for this config-only dsh bundle.
//
// Verifies the manifest contract that `dsh plugin add` relies on, with zero
// runtime dependencies — no dsh, no MCP binary, no npm install required beyond
// a plain `node test.mjs`.
import { readFileSync, existsSync } from 'node:fs'
import assert from 'node:assert/strict'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// 1. package.json must declare a dsh.bundle manifest — a client-only plugin is
//    not installable via `dsh plugin add`.
assert.ok(pkg.dsh?.bundle, 'package.json must declare dsh.bundle')
assert.equal(typeof pkg.dsh.bundle.patch, 'string', 'dsh.bundle.patch must be a string')

// 2. The referenced patch file exists and is non-empty.
const patch = pkg.dsh.bundle.patch
assert.ok(existsSync(new URL(patch, import.meta.url)), `bundle patch file missing: ${patch}`)
const patchText = readFileSync(new URL(patch, import.meta.url), 'utf8')
assert.ok(patchText.trim(), 'bundle patch must not be empty')

// 3. The patch inserts the expected dsh MCP client wiring.
assert.match(patchText, /-?\s*id:\s*mcp-codex-web-search/, 'patch must insert id mcp-codex-web-search')
assert.match(patchText, /name:\s*'?@deepseek-ai\/dsh-mcp-client'?/, 'patch must load @deepseek-ai/dsh-mcp-client')
assert.match(patchText, /serverName:\s*codex-web-search/, 'patch must set serverName codex-web-search')

// 4. The three advertised tools stay consistent with the serverName namespace.
for (const tool of ['codex_web_search', 'codex_web_research', 'web_fetch']) {
  assert.ok(patchText.includes(tool), `bundle must document the ${tool} tool`)
}

// 5. index.js is side-effect-free ESM and imports cleanly.
await import('./index.js')

console.log('ok: dsh-codex-web-search-mcp bundle manifest is valid')