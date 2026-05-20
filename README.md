# OpenCub

> A local-first CLI coding agent with multi-provider support, built for local models and small open-weights models.

OpenCub (`cub`) is a terminal-based AI coding assistant. It runs entirely on your machine, talks to whichever LLM provider you point it at — including local runtimes like Ollama, llama.cpp, LM Studio, MLX Server — and exposes a rich tool surface (file editing, shell, git, search, MCP) plus an interactive Ink UI for chat, planning, checkpoints, and approvals.

- **Repository:** https://github.com/BitopiaLabs/Opencub
- **License:** MIT
- **Node:** ≥ 22

---

## Highlights

- **Local-first.** Designed for small open-weights models running on your hardware. Hosted providers are first-class too.
- **Multi-provider.** 18+ providers out of the box: Ollama, llama.cpp, MLX Server, LM Studio, OpenAI, Anthropic, Google Gemini, OpenRouter, Mistral, GitHub Copilot, GitHub Models, ChatGPT/Codex, Z.AI, Kimi, Minimax, Poe, plus a generic OpenAI-compatible "Custom" adapter.
- **Rich tool surface.** File ops, ripgrep-backed search, shell execution, full git suite (status, diff, commit, branch, stash, push, pull, PR), web fetch + search, LSP diagnostics, task lists, and subagents.
- **Two runtimes.** Interactive Ink UI for chat sessions; a lightweight `--plain` runtime for CI / non-TTY scripting.
- **Development modes.** `normal`, `auto-accept`, `yolo`, and `plan` — explicit confirmation policies you choose per session.
- **Safety first.** First-run directory trust prompt, per-tool approval, checkpointing, and a built-in security disclaimer.
- **MCP support.** Load Model Context Protocol servers from `.mcp.json` (project) or your user config.
- **VS Code integration.** Optional companion extension that streams diffs and selection context to/from the CLI over a local WebSocket. See [`plugins/README.md`](plugins/README.md).
- **Devcontainer included.** Zero-setup dev environment with Node 22, pnpm, Biome, and Fira Code Nerd Font. See [`.devcontainer/README.md`](.devcontainer/README.md).

---

## Installation

### From npm (recommended)

```bash
npm install -g opencub
cub
```

### From source

```bash
git clone https://github.com/BitopiaLabs/Opencub.git
cd Opencub
pnpm install --frozen-lockfile
pnpm run build
node dist/cli.js          # or: ./dist/cli.js
```

> Don't have pnpm? `npm install -g pnpm@11` first. `npm install` also works in a pinch since dependencies are declared in `package.json`.

---

## Quick start

Launch the interactive session and walk through the first-run wizard to configure a provider:

```bash
cub
```

Or skip the prompts and run one-shot from any shell / CI job:

```bash
cub --provider ollama --model llama3.1 run "summarize src/cli.tsx"
cub --provider openrouter --model google/gemini-3.1-flash run "find dead code in src/tools"
```

### Provider login flows

Providers that use OAuth device flow have dedicated subcommands:

```bash
cub copilot login            # GitHub Copilot device flow
cub codex login              # ChatGPT / Codex device flow
```

Credentials are stored in your platform's standard config directory (overridable via `OPENCUB_CONFIG_DIR`).

---

## Usage

```
Usage: cub [options] [command]

Commands:
  copilot login [provider-name]   Log in to GitHub Copilot (device flow).

Options:
  -v, --version       Show version number
  -h, --help          Show help
  --vscode            Run in VS Code mode (start the WebSocket bridge)
  --vscode-port       Specify VS Code port (default 51820)
  --provider          AI provider (must exist in agents.config.json)
  --model             Model name (must be available for the provider)
  --context-max       Max context length in tokens (k/K suffix, e.g. 128k)
  --mode              Development mode: normal | auto-accept | yolo | plan
                      Default: normal interactively, auto-accept for `run`.
  --trust-directory   Skip the first-run directory trust prompt (run only)
  --plain             Lightweight, Ink-free runtime (run only; auto in CI)
  --no-plain          Force the Ink runtime even in CI / non-TTY
  run                 Run a single prompt non-interactively
```

### Examples

```bash
cub --provider openrouter --model google/gemini-3.1-flash run "analyze src/app.ts"
cub --provider ollama --model llama3.1 --context-max 128k
cub --mode yolo run "refactor database module"
cub --mode plan
cub --trust-directory run "analyze src/app.ts"
cub --plain run "summarize README.md"
```

---

## Configuration

OpenCub uses two layers of config:

| File | Scope | Purpose |
|---|---|---|
| `agents.config.json` | project (cwd) | provider + model setup, per-project overrides |
| `~/.config/opencub/preferences.json` (or platform equivalent) | user | global defaults, last-used model, update check, themes |
| `.mcp.json` | project | MCP servers loaded for this project (`.mcp.example.json` ships as a template) |
| `.env` | project | Variables referenced from configs via `$VAR_NAME` (`.env.example` ships as a template) |

Run `cub` once and the interactive wizard will create / merge a working `agents.config.json` for you. To bootstrap an env file:

```bash
cp .env.example .env
```

### Common environment variables

```bash
OPENROUTER_API_KEY=...
OPENAI_API_KEY=...
ZAI_AUTH_TOKEN=...
FALLBACK_MODEL=your-model

OPENCUB_CONFIG_DIR=/custom/config        # override config location
OPENCUB_DATA_DIR=/custom/data            # override data location
OPENCUB_LOG_LEVEL=debug                  # trace|debug|info|warn|error
OPENCUB_LOG_TO_FILE=true
OPENCUB_LOG_TO_CONSOLE=true
```

See [`.env.example`](.env.example) for the full list.

### Supported providers

`ollama`, `llama-cpp`, `mlx-server`, `lmstudio`, `openai`, `anthropic`, `gemini`, `openrouter`, `mistral`, `z-ai`, `z-ai-coding`, `github-models`, `github-copilot`, `chatgpt-codex`, `kimi-code`, `minimax-coding`, `poe`, plus a generic `custom` adapter for any OpenAI-compatible endpoint.

---

## Tools

The agent has access to a curated set of safe, well-tested tools — each with its own approval policy:

- **Files:** `read-file`, `write-file`, `string-replace`, `create-directory`, `copy-file`, `move-file`, `delete-file`, `find-files`, `list-directory`, `search-file-contents`
- **Shell:** `execute-bash` (sandboxed approval flow)
- **Git:** `git-status`, `git-diff`, `git-log`, `git-add`, `git-commit`, `git-branch`, `git-stash`, `git-reset`, `git-push`, `git-pull`, `git-pr`
- **Web:** `fetch-url`, `web-search`
- **Code intelligence:** `lsp-get-diagnostics`
- **Agent control:** `agent-tool` (subagents), `ask-question`, task management (`create-task`, `update-task`, `list-tasks`, `delete-task`)
- **MCP:** any tool exposed by your configured MCP servers

Each tool's behavior, parameters, and approval policy live next to its source in `src/tools/`.

---

## Development modes

| Mode | Tool execution |
|---|---|
| `normal` | Per-tool approval prompts (default for interactive) |
| `auto-accept` | Auto-confirm safe / read-only tools (default for `run`) |
| `yolo` | Auto-confirm everything (use with care) |
| `plan` | Read-only; the agent plans without touching the filesystem |

---

## Development

```bash
pnpm install --frozen-lockfile

pnpm run build          # tsc + tsc-alias, produces dist/cli.js
pnpm run dev            # tsc --watch
pnpm run start          # node dist/cli.js

pnpm test:all           # full pipeline
pnpm test:ava           # unit + integration tests (5,500+ tests)
pnpm test:types         # tsc --noEmit
pnpm test:lint          # biome lint
pnpm test:format        # biome check
pnpm test:knip          # unused export detection
pnpm test:audit         # pnpm audit
pnpm test:security      # semgrep scan
pnpm test:benchmark     # benchmark report

pnpm run build:vscode   # bundles plugins/vscode into assets/opencub-vscode.vsix
```

### Project layout

```
src/
  cli.tsx              # entry point + fast-path flag parsing
  app/                 # top-level Ink application
  commands/            # slash-commands (/agents, /init, /model, ...)
  features/            # auth, init, plain, schedule, session, subagents, wizards
  hooks/               # chat handler, conversation loop, tool executor
  integrations/        # vscode + lsp bridges
  llm/                 # provider factory + AI SDK clients
  shared/              # config, types, services, utilities
  tools/               # the agent's tool surface (file, git, shell, web, ...)
  ui/                  # Ink components
plugins/vscode/        # VS Code companion extension
.devcontainer/         # ready-to-go dev container
benchmarks/            # tokenizer + perf benchmarks
scripts/               # changelog extractor, credits generator, model fetcher
```

### Testing notes

- Tests run under [AVA](https://github.com/avajs/ava) in **serial** mode (`workerThreads: false`) — see `package.json#ava`.
- Test files live alongside source as `*.spec.ts` / `*.spec.tsx`.
- Use `node --import=tsx` semantics; you do not need a separate build step.

---

## Updating

OpenCub checks for new releases on a throttled schedule and prints the right update command for your install method (`npm`, `homebrew`, `nix`, or a generic message). To check / update manually:

```bash
npm update -g opencub                     # npm
brew upgrade opencub                      # homebrew (if installed via brew)
nix run github:BitopiaLabs/Opencub        # nix
```

---

## Contributing

Issues, discussions, and PRs are welcome at the [GitHub repository](https://github.com/BitopiaLabs/Opencub). Before opening a PR:

1. `pnpm test:format && pnpm test:lint && pnpm test:types`
2. `pnpm test:ava` (full suite must stay green)
3. Add or update tests for any user-visible behavior change.

---

## License

[MIT](LICENSE) © BitopiaLabs
