<p align="center">
  <img src="assets/hero.png" alt="OpenCub terminal coding assistant" width="900">
</p>

# OpenCub

OpenCub is a local-first AI coding assistant for the terminal. It provides an
interactive CLI for asking questions about a codebase, editing files, running
commands, reviewing changes, and working with local or hosted language models.

The project is written in TypeScript, uses Ink for the terminal UI, and exposes
the `cub` command when installed as a package.

- Repository: [github.com/BitopiaLabs/Opencub](https://github.com/BitopiaLabs/Opencub)
- Package name: `opencub`
- CLI command: `cub`
- License: [MIT](LICENSE)
- Runtime: Node.js 22 or newer

## Project Docs

- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Dev Container](.devcontainer/README.md)
- [VS Code Extension](plugins/README.md)

## What It Does

- Runs as an interactive terminal assistant or a non-interactive `run` command.
- Supports local model runtimes and hosted API providers.
- Provides tools for reading, editing, searching, and organizing project files.
- Can run shell commands, inspect git state, and work with common git commands.
- Supports MCP servers through project and user configuration.
- Includes approval modes for normal work, planning, automation, and trusted
  local workflows.
- Includes an optional VS Code companion extension for editor context and diff
  review.

## Requirements

- Node.js >= 22
- pnpm 11.x for source development
- A configured model provider

For local models, install and run a compatible server such as Ollama,
llama.cpp server, LM Studio, or MLX Server. For hosted models, configure the
required API key or login flow for the provider you want to use.

## Installation

### Install From npm

After the package is published to npm, install it globally:

```bash
npm install -g opencub
cub
```

If npm returns `404 Not Found`, the package has not been published yet. Use the
source install below.

### Run From Source

```bash
git clone https://github.com/BitopiaLabs/Opencub.git
cd Opencub
npm install -g pnpm@11
pnpm install --frozen-lockfile
pnpm run build
node dist/cli.js
```

This runs OpenCub directly from the built source. It does not create a global
`cub` command.

### Create a Local `cub` Command

Before the npm package is published, you can install this checkout globally on
your own machine:

```bash
pnpm run build
npm install -g .
cub
```

Run this from the repository root. Re-run `pnpm run build` after source changes.

## Quick Start

Start the interactive UI:

```bash
cub
```

On first run, OpenCub opens a provider setup wizard. Choose a provider template,
enter the required values, and save the configuration.

Run a one-shot prompt:

```bash
cub --provider OpenAI --model your-model-name run "review this repository"
```

When running from source, replace `cub` with `node dist/cli.js`:

```bash
node dist/cli.js --provider OpenAI --model your-model-name run "review this repository"
```

## CLI Usage

```text
Usage: cub [options] [command]

Commands:
  copilot login [provider-name]   Log in to GitHub Copilot.
  codex login [provider-name]     Log in to ChatGPT / Codex.
  run                             Run a single prompt non-interactively.

Options:
  -v, --version       Show version number
  -h, --help          Show help
  --vscode            Run in VS Code mode
  --vscode-port       Specify VS Code port
  --provider          Provider name from agents.config.json
  --model             Model name configured for the provider
  --context-max       Maximum context length, for example 8192 or 128k
  --mode              normal | auto-accept | yolo | plan
  --trust-directory   Skip directory trust prompt for this run command
  --plain             Use the lightweight non-UI runtime for run commands
  --no-plain          Force the Ink UI runtime in CI or non-TTY environments
```

Examples:

```bash
cub --mode plan
cub --provider OpenAI --model your-model-name
cub --provider Ollama --model your-local-model --context-max 128k
cub --plain run "summarize the main architecture"
cub --trust-directory run "find the highest-risk test failures"
```

## Providers

OpenCub includes setup templates for:

- Ollama
- llama.cpp server
- MLX Server
- LM Studio
- OpenAI
- Anthropic Claude
- Google Gemini
- OpenRouter
- Mistral AI
- Z.ai
- Z.ai Coding Subscription
- GitHub Models
- GitHub Copilot
- ChatGPT / Codex
- Kimi Code
- MiniMax Coding Plan
- Poe
- Custom OpenAI-compatible providers

GitHub Copilot and ChatGPT / Codex use login flows:

```bash
cub copilot login
cub codex login "ChatGPT / Codex"
```

For source builds:

```bash
node dist/cli.js copilot login
node dist/cli.js codex login "ChatGPT / Codex"
```

## Configuration

OpenCub looks for configuration in the current project first, then in the user
config directory.

| File | Purpose |
| --- | --- |
| `agents.config.json` | Provider, model, tool, session, and runtime settings |
| `opencub-preferences.json` | User preferences such as defaults and trusted directories |
| `.mcp.json` | MCP server configuration |
| [`.env.example`](.env.example) | Template for environment variables used by config values |

On Linux, the default user config directory is `~/.config/opencub`. You can
override it with `OPENCUB_CONFIG_DIR`.

Useful environment variables:

```bash
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...
OPENCUB_CONFIG_DIR=/custom/config
OPENCUB_DATA_DIR=/custom/data
OPENCUB_LOG_LEVEL=debug
OPENCUB_LOG_TO_FILE=true
```

Example provider config:

```json
{
  "providers": [
    {
      "name": "OpenAI",
      "baseUrl": "https://api.openai.com/v1",
      "apiKey": "$OPENAI_API_KEY",
      "models": ["your-model-name"]
    }
  ]
}
```

Use [`.env.example`](.env.example) and
[`.mcp.example.json`](.mcp.example.json) as local templates when needed.

## Modes

| Mode | Behavior |
| --- | --- |
| `normal` | Ask before running tools that need approval. This is the interactive default. |
| `auto-accept` | Automatically approve safe operations. This is the default for `run`. |
| `plan` | Review and plan without changing files. |
| `yolo` | Approve all tool calls automatically. Use only in trusted repositories. |

## Development

For the easiest isolated development setup, use the included
[Dev Container](.devcontainer/README.md). It provides Node.js 22, pnpm 11,
Biome, project dependencies, fonts for terminal glyphs, and the forwarded port
used by the VS Code extension bridge.

Install dependencies and build:

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run start
```

Common development commands:

```bash
pnpm run dev            # TypeScript watch mode
pnpm test:format        # Biome format check
pnpm test:lint          # Biome lint
pnpm test:types         # TypeScript type check
pnpm test:ava           # Unit and integration tests
pnpm test:knip          # Unused dependency/export checks
pnpm test:audit         # Dependency audit
pnpm test:security      # Semgrep scan
pnpm test:all           # Full local test script
pnpm run build:vscode   # Build the VS Code extension package
```

## Project Layout

```text
src/
  cli.tsx              CLI entry point and argument parsing
  app/                 Top-level Ink application
  commands/            Slash commands and command registry
  features/            Auth, setup, sessions, scheduling, wizards, plain mode
  hooks/               Chat loop, prompt handling, tool execution hooks
  integrations/        VS Code, LSP, and MCP integrations
  llm/                 Provider factory and AI SDK clients
  shared/              Config, types, services, utilities, logging
  tools/               File, shell, git, web, LSP, task, and agent tools
  ui/                  Ink components

plugins/vscode/        VS Code companion extension
assets/                Project assets and packaged VS Code extension
benchmarks/            Benchmark scripts
scripts/               Build and maintenance scripts
.devcontainer/         Development container setup
```

## VS Code Extension

The VS Code companion extension is maintained in `plugins/vscode`. It can start
or connect to the OpenCub CLI, send editor context to the terminal assistant,
and display generated diffs for review.

Build the extension package:

```bash
pnpm run build:vscode
```

The packaged extension is written to:

```text
assets/opencub-vscode.vsix
```

See [plugins/README.md](plugins/README.md) for extension usage.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md)
before opening a pull request. For most changes, run at least:

```bash
pnpm test:format
pnpm test:lint
pnpm test:types
pnpm test:ava
```

Report security issues using [SECURITY.md](SECURITY.md), not a public issue.

## License

OpenCub is released under the [MIT License](LICENSE).
