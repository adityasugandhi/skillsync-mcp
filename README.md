# SkillSync MCP

[![npm version](https://img.shields.io/npm/v/@stranzwersweb2/skillsync-mcp)](https://www.npmjs.com/package/@stranzwersweb2/skillsync-mcp)
[![LightNow capabilities](https://lightnow.ai/badge/io.github.adityasugandhi/skillsync-mcp)](https://lightnow.ai/servers/io.github.adityasugandhi/skillsync-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![Node.js >= 20](https://img.shields.io/badge/Node.js-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![Security Patterns](https://img.shields.io/badge/Regex_Threat_Patterns-101-red.svg)](#security-model)
[![M8ven Score](https://m8ven.ai/badge/mcp/adityasugandhi-skillsync-mcp-k28u2v)](https://m8ven.ai/mcp/adityasugandhi-skillsync-mcp-k28u2v)

**[Website](https://skillsync.js.org)** | **[npm](https://www.npmjs.com/package/@stranzwersweb2/skillsync-mcp)** | **[GitHub](https://github.com/adityasugandhi/skillsync-mcp)**

An MCP (Model Context Protocol) server for [SkillsMP](https://skillsmp.com) -- the marketplace for Claude Code skills. Search, scan for security threats, install, and manage skills directly from your AI assistant.

**Every skill is scanned against 101 regex threat patterns before it installs; critical matches are blocked.** The scanner is rule-based (no machine-learning model ships in this package): it can miss novel or obfuscated attacks and can flag benign text.

## Research (experimental, not shipped)

> Experimental detector: 99.2% attack detection on Boundary Pairs synthetic test data, in each of three training runs (119/120 attacks each). Average benign false-alarm rate 3.9% (per-run 2.5%, 4.2%, 5.0%). 10 held-out scenarios from one synthetic generator; not evidence of real-world protection. Shipped rule-based scanner is separate.

The detector is a fine-tuned DeBERTa-v3-base classifier. It is not part of the npm package and is not used by the install gate. Methods, results, baselines and negative results: [docs/research/](docs/research/) and [skillsync.js.org/research.html](https://skillsync.js.org/research.html).

## Features

- **Search** -- Keyword and semantic search across the SkillsMP marketplace (via the third-party SkillsMP API)
- **Security Scan** -- 101 regex threat patterns in 19 categories: prompt injection, reverse shells, credential theft, supply chain attacks, crypto mining, obfuscation, and more
- **Install** -- Download skills from GitHub to `~/.claude/skills/` with automatic security gate
- **Uninstall** -- Clean removal of installed skills
- **Safe Search** -- Combined search + auto-scan in one step
- **Installed Skills Registry** -- List all installed skills with risk levels and content hashes
- **Deep Audit** -- Force a fresh security scan on any installed skill
- **Startup Verification** -- Background discovery, content hashing, and `fs.watch` for live sync

## Why SkillSync?

| | Raw `git clone` | SkillSync MCP |
|---|---|---|
| Security scan before install | No | Regex scan -- 101 patterns |
| Blocks critical findings | No | Install blocked on a critical pattern match (e.g. prompt injection, RCE, credential theft) |
| Multi-client support | N/A | Config docs for Claude Code, OpenClaw, Cursor, Windsurf, GitHub Copilot, Zed, nanobot |
| Marketplace search | Manual | Keyword + semantic search via the SkillsMP API |
| Startup verification | No | fs.watch + content hash |
| Output sanitization | No | Strips hidden Unicode controls from third-party text |

## Data Flow

Search, suggestions and subscription sync send queries (and `SKILLSMP_API_KEY`, if set) to the SkillsMP API at `skillsmp.com`. Note that `skillsmp_suggest` builds its query from **the names of up to 10 of your installed skills**, plus the optional project `context` you pass (up to 200 characters), and sends that query to SkillsMP. Semantic search is provided by SkillsMP (it states it uses Cloudflare AI; the model is not disclosed). Skill source is fetched from `github.com` for scanning. Sync subscriptions live in a local config file; SkillSync has no cloud service of its own.

## Tools (13)

| Tool | Description |
|------|-------------|
| `skillsmp_search` | Keyword search across SkillsMP marketplace |
| `skillsmp_ai_search` | Semantic search via the SkillsMP ai-search API (third-party) |
| `skillsmp_scan_skill` | Security scan a GitHub skill repo (101 regex patterns) |
| `skillsmp_search_safe` | Search + auto-scan top results |
| `skillsmp_install_skill` | Scan then install to `~/.claude/skills/` |
| `skillsmp_uninstall_skill` | Remove an installed skill |
| `skillsmp_list_installed` | List all installed skills with risk levels (optional refresh) |
| `skillsmp_audit_installed` | Deep security audit of a specific installed skill |
| `skillsmp_suggest` | AI-powered skill recommendations based on installed skills |
| `skillsmp_compare` | Side-by-side security comparison of two skills |
| `skillsync_configure` | Manage sync subscriptions and settings |
| `skillsync_sync_now` | Run sync cycle: poll, diff, install/update/remove |
| `skillsync_status` | Show sync engine status and schedule |

## Compatible With

> Works with **Claude Code** | **OpenClaw** | **Cursor** | **Windsurf** | **GitHub Copilot** | **Zed** | **nanobot** -- any MCP-compatible client

## Install

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "skillsmp": {
      "command": "npx",
      "args": ["-y", "@stranzwersweb2/skillsync-mcp"]
    }
  }
}
```

### OpenClaw

Add to `~/.openclaw/mcp.json`:

```json
{
  "mcpServers": {
    "skillsmp": {
      "version": "1.4.1",
      "autoUpdate": false,
      "command": "npx",
      "args": ["-y", "@stranzwersweb2/skillsync-mcp@1.4.1"]
    }
  }
}
```

> OpenClaw uses the same `SKILL.md` format as Claude Code. Skills installed via this server are compatible with both platforms. OpenClaw users should pin versions and review tool policies per the [security hardening guide](https://aimaker.substack.com/p/openclaw-security-hardening-guide).

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "skillsmp": {
      "command": "npx",
      "args": ["-y", "@stranzwersweb2/skillsync-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "skillsmp": {
      "command": "npx",
      "args": ["-y", "@stranzwersweb2/skillsync-mcp"]
    }
  }
}
```

### GitHub Copilot

Add to `.github/copilot-mcp.json` in your project root, or `~/.github/copilot-mcp.json` for global config:

```json
{
  "mcpServers": {
    "skillsync": {
      "command": "npx",
      "args": ["-y", "@stranzwersweb2/skillsync-mcp"],
      "env": {
        "SKILLSMP_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Zed

Add to `~/.config/zed/settings.json` under the `"context_servers"` key:

```json
{
  "context_servers": {
    "skillsync": {
      "command": {
        "path": "npx",
        "args": ["-y", "@stranzwersweb2/skillsync-mcp"],
        "env": {
          "SKILLSMP_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

### Global install

```bash
npm install -g @stranzwersweb2/skillsync-mcp
```

Then reference in any MCP config:

```json
{
  "mcpServers": {
    "skillsmp": {
      "command": "skillsync-mcp"
    }
  }
}
```

### Client Compatibility

| Client | Config Path | Skill Format |
|--------|------------|--------------|
| Claude Code | `~/.claude/settings.json` | `SKILL.md` in `~/.claude/skills/` |
| OpenClaw | `~/.openclaw/mcp.json` | `SKILL.md` (same format, ClawHub registry) |
| Cursor | `.cursor/mcp.json` | MCP tools only |
| Windsurf | `~/.windsurf/mcp.json` | MCP tools only |
| GitHub Copilot | `.github/copilot-mcp.json` | MCP tools only |
| Zed | `~/.config/zed/settings.json` | MCP tools only |
| nanobot | MCP config | MCP tools only |

## Security Model

Installation is gated by a rule-based, multi-level security scan: 101 regex patterns (47 critical, 3 critical multi-line, 51 warning) in 19 categories. See [docs/THREAT_PATTERNS.md](docs/THREAT_PATTERNS.md).

| Risk Level | Behavior |
|------------|----------|
| **Safe / Low** | Install proceeds, warnings shown |
| **Medium / High** | Install blocked -- requires `force: true` to override |
| **Critical** | Install blocked -- no override |

### Additional Safety Guards

- Path traversal prevention on skill names and filenames
- SSRF prevention -- only `github.com` URLs accepted
- `npm install --ignore-scripts` -- blocks `postinstall` attacks
- Max 50 files, 2MB total size limit
- Binary files skipped, suspicious filenames flagged
- Content hash for TOCTOU verification
- Output sanitization -- strips zero-width Unicode, bidi overrides, truncates to prevent prompt injection

## How It Works

```
Search SkillsMP -> Pick a skill -> Security scan (101 regex patterns)
                                        |
                              Critical? -> BLOCKED
                              Medium/High? -> Requires force=true
                              Safe/Low? -> Download from GitHub
                                        |
                              Write to ~/.claude/skills/<name>/
                                        |
                              npm install --ignore-scripts (if needed)
                                        |
                              Startup verification (fs.watch + content hash)
                                        |
                              Restart your MCP client to load
```

## Examples

Ask your AI assistant:

```
Search for git-related skills on SkillsMP
```

```
Scan this skill for security issues: https://github.com/user/repo/tree/main/skills/my-skill
```

```
Install the commit skill from https://github.com/user/repo/tree/main/skills/commit
```

```
List all my installed skills
```

```
Run a deep security audit on the commit skill
```

```
Uninstall the commit skill
```

## Development

```bash
git clone https://github.com/adityasugandhi/skillsync-mcp.git
cd skillsync-mcp
npm install
npm run build
npm run dev    # Watch mode with tsx
npm run test:build  # Build + run tests
```

## Requirements

- Node.js >= 20
- Any MCP-compatible client (Claude Code, OpenClaw, Cursor, Windsurf, GitHub Copilot, Zed, nanobot, etc.)

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- Browse [open issues](https://github.com/adityasugandhi/skillsync-mcp/issues) or look for the `good-first-issue` label
- To add new threat detection patterns, see [docs/THREAT_PATTERNS.md](docs/THREAT_PATTERNS.md)
- All PRs must pass the existing test suite (`npm run test:build`)

## Publisher

The npm package is published under the legacy scope `@stranzwersweb2` — this is the same author as the GitHub owner [`adityasugandhi`](https://github.com/adityasugandhi). Both identities belong to Aditya Sugandhi.

## Author

**Aditya Sugandhi** -- [adityasugandhi.com](https://adityasugandhi.com) | [GitHub](https://github.com/adityasugandhi)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=adityasugandhi/skillsync-mcp&type=Date)](https://star-history.com/#adityasugandhi/skillsync-mcp&Date)

## License

[MIT](LICENSE) - [Aditya Sugandhi](https://adityasugandhi.com)
