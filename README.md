# dsh-codex-web-search-mcp
[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

中文 | [English](README.en.md)

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

本插件依赖以下已发布到 npm 的包来分发跨平台二进制：

- `@dhicoc/dsh-codex-web-search-mcp`：本 dsh 插件；
- `codex-web-search-mcp`：跨平台命令及其平台二进制依赖；
- `@dhicoc/codex-web-search-mcp-*`：各平台的预编译二进制包。

正常使用时不需要手动安装这些依赖，`dsh plugin` 会自动解析并安装它们。
二进制分发包源码在
[`dhicoc/codex-web-search-mcp`](https://github.com/dhicoc/codex-web-search-mcp)，
发布维护流程见下方「发布二进制包」。

---

## 安装

### npm 发布版（推荐）

```bash
# 安装已发布的 npm 版本，并注册到 web profile
dsh plugin --profile web add @dhicoc/dsh-codex-web-search-mcp

# 重启 dsh web 生效（Web bundle 无 HMR，必须重启进程）
dsh web
```

安装后验证：

```bash
dsh --profile web --dump-config
```

输出中应出现 `mcp-codex-web-search`，并包含 `serverName: codex-web-search` 和
`command: codex-web-search-mcp`。在会话中即可让 agent 调用
`codex_web_search` / `codex_web_research` / `web_fetch`。

> 如果默认 npm 镜像提示 `404 Not Found`，通常表示镜像尚未同步新包。可临时指定
> npm 官方 registry 重试：
>
> ```bash
> dsh plugin --profile web add @dhicoc/dsh-codex-web-search-mcp --registry=https://registry.npmjs.org
> ```

### 从 GitHub 安装（开发/预发布）

只有在测试仓库中尚未发布的提交时才使用 GitHub 源：

```bash
dsh plugin --profile web add github:dhicoc/dsh-codex-web-search-mcp
dsh web
```

### 凭证（二选一）

1. **推荐**：先 `codex login`（OAuth 写 `~/.codex/auth.json`），server 自动读取，无需任何配置。
2. **免 auth.json**：设环境变量 `CODEX_ACCESS_TOKEN`（可选 `CODEX_ACCOUNT_ID`）。
   在 `cordis.patch.yml` 里取消 `env:` 注释，用 dsh 的 `!!js process.env.*` 引用，
   密钥不落盘。

没有有效凭证时，3 个工具会返回清晰的中文报错，而不是崩溃。

---

## 本地测试（未发布 npm 包时）

如果需要测试本地源码，可在 web profile 内使用 `link:` 指向本插件仓库的绝对路径：

```bash
dsh plugin --profile web add link:<本插件仓库绝对路径>
dsh web
```

如果本插件依赖的 `codex-web-search-mcp` 也尚未发布，可先在其仓库执行
`npm link`，再在本插件仓库执行 `npm link codex-web-search-mcp`，最后安装本插件的
`link:` 版本。普通用户不需要这些步骤，应使用上面的 npm 发布版安装方式。

---

## 卸载与还原

```bash
dsh plugin --profile web remove @dhicoc/dsh-codex-web-search-mcp
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
