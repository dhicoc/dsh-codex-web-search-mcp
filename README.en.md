# dsh-codex-web-search-mcp
[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

[中文](README.md) | English

Wire [codex-web-search-mcp](https://github.com/dhicoc/codex-web-search-mcp) — a model-independent OpenAI Codex / Grok web-search & deep-research MCP server (standalone Rust binary) — into [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) as a one-click plugin.

After installing and restarting `dsh web`, three tools appear as native dsh MCP tools:

| Tool | dsh name |
| --- | --- |
| Single-step search | `mcp__codex-web-search__codex_web_search` |
| Multi-step deep research | `mcp__codex-web-search__codex_web_research` |
| Fetch page text | `mcp__codex-web-search__web_fetch` |

> Unlike the typical Claude Code / Cursor MCP wiring, this plugin is **independent of any model vendor** — search goes through the Codex search endpoint, so switching to Gemini / OpenRouter / local models changes nothing.

---

## Prerequisites

The plugin relies on these npm packages to distribute cross-platform binaries:

- `@dhicoc/dsh-codex-web-search-mcp`: this dsh plugin;
- `codex-web-search-mcp`: the cross-platform command and its platform binary dependencies;
- `@dhicoc/codex-web-search-mcp-*`: prebuilt per-platform binaries.

You don't have to install any of these manually — `dsh plugin` resolves and installs them automatically. The binary distribution sources live in [`dhicoc/codex-web-search-mcp`](https://github.com/dhicoc/codex-web-search-mcp).

---

## Install

### From npm (recommended)

```bash
dsh plugin --profile web add @dhicoc/dsh-codex-web-search-mcp
dsh web          # restart (web bundles have no HMR; a restart is required)
```

Verify:

```bash
dsh --profile web --dump-config
```

You should see `mcp-codex-web-search` with `serverName: codex-web-search` and `command: codex-web-search-mcp`.

> If your default npm mirror returns `404 Not Found`, it usually hasn't synced the package yet; retry against the official registry:
>
> ```bash
> dsh plugin --profile web add @dhicoc/dsh-codex-web-search-mcp --registry=https://registry.npmjs.org
> ```

### From GitHub (dev / pre-release)

```bash
dsh plugin --profile web add github:dhicoc/dsh-codex-web-search-mcp
dsh web
```

### Credentials (pick one)

1. **Recommended**: run `codex login` (OAuth writes `~/.codex/auth.json`); the server reads it automatically.
2. **No auth.json**: set `CODEX_ACCESS_TOKEN` (optionally `CODEX_ACCOUNT_ID`) and uncomment the `env:` block in `cordis.patch.yml` to reference them with `!!js process.env.*` so secrets never touch disk.

Without valid credentials the three tools return a clear error message instead of crashing.

---

## Uninstall

```bash
dsh plugin --profile web remove @dhicoc/dsh-codex-web-search-mcp
```

---

## Fallback: native dsh MCP config (no plugin)

dsh's built-in `@deepseek-ai/dsh-mcp-client` already reads `.mcp.json` / `~/.dsh/mcp.json`. To get the same effect without the plugin, add:

```json
{
  "mcpServers": {
    "codex-web-search": {
      "command": "codex-web-search-mcp"
    }
  }
}
```

or append to `~/.dsh/profiles/web/cordis.patch.yml`:

```yaml
- insert:
    - id: mcp-codex-web-search
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: codex-web-search
        transport: stdio
        command: codex-web-search-mcp
```

---

## How it works

- This repo is a **config-only Cordis bundle**: `cordis.patch.yml` reuses dsh's built-in `@deepseek-ai/dsh-mcp-client` and, with one line of `config`, instantiates it as a stdio server pointing at the `codex-web-search-mcp` binary (`serverName: codex-web-search`).
- The `codex-web-search-mcp` dependency pulls the matching prebuilt platform binary through `optionalDependencies` and exposes a `bin/codex-web-search-mcp` command (a lightweight JS shim that locates and spawns the installed binary at runtime — **no postinstall**, sidestepping the pnpm `allowBuilds` gate).

## License

MIT (same as upstream codex-web-search-mcp).