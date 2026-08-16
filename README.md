# dsh-codex-web-search-mcp

把 [codex-web-search-mcp](https://github.com/dhicoc/codex-web-search-mcp)（模型无关的
OpenAI Codex / Grok 联网搜索与深度研究 MCP server，Rust 独立二进制）接进
[DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 的
**一键插件**。

安装并重启 `dsh web` 后，3 个工具会以 dsh 原生 MCP 工具形式出现：

| 工具 | dsh 内名称 |
| --- | --- |
| 单步搜索 | `mcp__codex-web-search__codex_web_search` |
| 多步深度研究 | `mcp__codex-web-search__codex_web_research` |
| 抓正文 | `mcp__codex-web-search__web_fetch` |

> 与普通 Claude Code / Cursor 的 MCP 接入不同——本插件**不依赖任何模型厂商**，
> 搜索走 Codex 独立搜索端点，换 Gemini / OpenRouter / 本地模型都不受影响。

---

## 前置条件（重要）

本插件依赖 `codex-web-search-mcp` 这个 npm 包来分发跨平台二进制。它（以及其下的
5 个平台二进制包 `@dhicoc/codex-web-search-mcp-*`）**需要先在 npm 发布**后才能
`dsh plugin add` 一键安装。

- 二进制分发包源码在 [`dhicoc/codex-web-search-mcp`](https://github.com/dhicoc/codex-web-search-mcp)
  （`codex-web-search-mcp` 根包 + `npm/platforms/*` 下的 5 个平台子包；跨平台预编译二进制
  发布在它的 GitHub Releases v2.3.1）。
- 发布步骤见下方「发布二进制包」。

未发布前想本地验证，可用 `link:` 依赖（见「本地测试」）。

---

## 安装

```bash
# 一键安装并注册到 web profile
dsh plugin --profile web add github:dhicoc/dsh-codex-web-search-mcp

# 重启 dsh web 生效（Web bundle 无 HMR，必须重启进程）
dsh web
```

装好后用 `dsh --profile web --dump-config` 检查是否已出现
`mcp-codex-web-search` 这一行；在会话里让 agent 调用
`codex_web_search` / `codex_web_research` / `web_fetch` 即可。

### 凭证（二选一）

1. **推荐**：先 `codex login`（OAuth 写 `~/.codex/auth.json`），server 自动读取，无需任何配置。
2. **免 auth.json**：设环境变量 `CODEX_ACCESS_TOKEN`（可选 `CODEX_ACCOUNT_ID`）。
   在 `cordis.patch.yml` 里取消 `env:` 注释，用 dsh 的 `!!js process.env.*` 引用，
   密钥不落盘。

没有有效凭证时，3 个工具会返回清晰的中文报错，而不是崩溃。

---

## 本地测试（未发布 npm 包时）

```bash
# 在 web profile 内用 link: 指向本地二进制包 + 本插件
dsh plugin --profile web add link:<本仓库绝对路径>

# 或者先把二进制包 link 进本插件再 add：
#   cd ../project_009+claude-code-search-mcp && npm link
#   cd ../project_016+codex-web-search-dsh-plugin && npm link codex-web-search-mcp
#   dsh plugin --profile web add link:<本仓库绝对路径>
dsh web
```

---

## 卸载与还原

```bash
dsh plugin --profile web remove dsh-codex-web-search-mcp
```

删除插件即移除 `mcp-codex-web-search` 这一行，dsh 不再加载该 MCP server，
不影响其它能力。

---

## 降级：不用插件，直接用 dsh 原生 MCP 配置

dsh 内置 `@deepseek-ai/dsh-mcp-client` 本就会读 `.mcp.json` / `~/.dsh/mcp.json`。
如果你不想走插件，也可以手动把下面这段写进任一 MCP 配置文件（效果等价）：

```json
{
  "mcpServers": {
    "codex-web-search": {
      "command": "codex-web-search-mcp"
    }
  }
}
```

或在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

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

## 发布二进制包（维护者）

> 二进制需在 `dhicoc/codex-web-search-mcp` 仓库根的 `npm/platforms/<平台>/bin/` 下就位
> （统一名 `bin/codex-web-search-mcp[.exe]`，可从 Releases v2.3.1 下载）。再按依赖顺序发布：

1. 依次发布 5 个平台子包（在 `dhicoc/codex-web-search-mcp` 仓库根执行）：

   ```bash
   cd npm/platforms/win32-x64 && npm publish --access public
   cd ../win32-arm64 && npm publish --access public
   cd ../darwin-universal && npm publish --access public
   cd ../linux-x64 && npm publish --access public
   cd ../linux-arm64 && npm publish --access public
   ```

2. 再发布 umbrella 包（带 bin shim + optionalDependencies）：

   ```bash
   cd ../.. && npm publish --access public
   ```

3. 最后在本插件仓库发布本插件：

   ```bash
   npm publish --access public
   ```

4. 给仓库打 `dsh-plugin` topic，自动被 awesome-dsh-plugins 收录。

---

## 工作原理

- 本仓库是一个**配置型 Cordis bundle**：`cordis.patch.yml` 借用 dsh 自带的
  `@deepseek-ai/dsh-mcp-client`，用一行 `config` 把它实例化成指向
  `codex-web-search-mcp` 二进制的 stdio server（`serverName: codex-web-search`）。
- `codex-web-search-mcp` 依赖通过 `optionalDependencies` 按当前平台拉取对应
  预编译二进制包，并暴露 `bin/codex-web-search-mcp` 命令（一个轻量 JS shim，
  运行时定位已安装的平台二进制并 spawn，**无需 postinstall**，规避 pnpm
  `allowBuilds` 墙）。

## 许可证

MIT（与上游 codex-web-search-mcp 一致）。
