# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Build and run
pnpm run build          # Compile TypeScript to dist/ with executable permissions
pnpm run build:credits  # Regenerate contributors.json from git history (CI/release only)
pnpm run start          # Run the compiled application
pnpm run dev            # Watch mode compilation (tsc --watch)

# Testing (run before committing)
pnpm run test:all       # Full suite: format, lint, types, AVA tests, knip, audit, security

# Individual test commands
pnpm run test:ava src/path/to/file.spec.ts  # Run single test file
pnpm run test:ava:coverage                  # Tests with coverage
pnpm run test:types                         # TypeScript checking only
pnpm run test:format                        # Biome format check
pnpm run test:lint                          # Biome lint check
pnpm run test:lint:fix                      # Auto-fix lint/format issues
pnpm run test:knip                          # Unused code detection
pnpm run test:benchmark                     # Run model benchmarks

# VS Code extension
pnpm run build:vscode   # Build extension to assets/opencub-vscode.vsix
```

## Project Overview

OpenCub is a React-based CLI coding agent built with Ink.js that provides local-first AI assistance with multiple provider support (Ollama, OpenRouter, Anthropic, Google, any OpenAI-compatible API).

**Entry point**: `src/cli.tsx` → dynamic import of `App` from `src/app/App.tsx` (re-exported via `src/app/index.ts`). `cli.tsx` has fast paths for `--help`/`--version` (no app import), copilot/codex device-flow login, and a `--plain` non-Ink shell (`src/features/plain/shell.ts`) for CI / non-TTY environments.

## Architecture

### Core Application Flow

1. **Directory Trust Check** (`useDirectoryTrust`) — First-run security disclaimer for new directories
2. **App Initialization** (`useAppInitialization`) — Creates LLM client, loads MCP servers, loads custom commands
3. **Central State** (`useAppState`) — Single source of truth for 50+ state variables
4. **Chat/Tool Flow** — User input → LLM → tool confirmation → execution → response

### Top-level layout

```
src/
├── cli.tsx              # Entry point (binary: cub)
├── app/                 # App shell, orchestration, prompts
├── hooks/               # React hooks (state, handlers, chat-handler)
├── ui/                  # Ink components (was: components/)
│   └── primitives/      # Low-level UI building blocks
├── commands/            # Slash commands, registry, parser
├── tools/               # Built-in tools, registry
│   └── tool-calling/    # XML / JSON tool-call parsers (fallback path)
├── llm/                 # LLM stack
│   ├── ai-sdk-client/   # Vercel AI SDK wrapper
│   ├── models/          # models.dev integration
│   ├── model-database/  # Model metadata
│   └── client-factory.ts
├── integrations/        # External integrations
│   ├── mcp/             # Model Context Protocol
│   ├── lsp/             # Language Server Protocol
│   └── vscode/          # VS Code extension server
├── features/            # Product features
│   ├── auth/            # Copilot / Codex device-flow login
│   ├── session/         # Chat session persistence
│   ├── schedule/        # Cron-scheduled agent runs
│   ├── subagents/       # Delegated agent runs
│   ├── custom-commands/ # User markdown commands from .opencub/commands/
│   ├── init/            # /init wizard
│   ├── wizards/         # Interactive setup flows
│   ├── usage/           # Usage tracking
│   └── plain/           # --plain Ink-free runtime
├── shared/              # Shared utilities
│   ├── utils/
│   ├── types/
│   ├── config/
│   ├── context/
│   ├── tokenization/
│   ├── markdown-parser/
│   ├── security/
│   ├── services/
│   ├── constants.ts
│   ├── prompt-history.ts
│   └── message-handler.ts
└── test-utils/          # Shared test helpers
```

### State Management Pattern

All state lives in `src/hooks/useAppState.tsx`. Other hooks (`useChatHandler`, `useToolHandler`, `useModeHandlers`) receive state and setters from it. `src/app/App.tsx` orchestrates them via `useAppHandlers`. Global `src/shared/utils/message-queue.tsx` lets deep components push chat messages without prop-drilling.

### Tool System

Tools are registered in `src/tools/tool-manager.ts` with:
- **handler**: Executes the tool
- **nativeTool**: AI SDK tool definition
- **formatter**: Formats output for display
- **validator**: Pre-execution validation (optional)

File editing uses a content-based approach:
- `string_replace`: Primary edit tool — replaces exact content
- `write_file`: Whole file overwrites

Two execution paths exist: native tool calling (preferred, via AI SDK) and XML/JSON fallbacks for models that don't support tools. `LLMChatResponse.toolsDisabled` signals which path produced the response; the conversation loop only runs `parseToolCalls()` (in `src/tools/tool-calling/`) when `toolsDisabled` is true.

### Command System

Slash commands live in `src/commands/` and are lazy-loaded via `src/commands/lazy-registry.ts`. To add a new command: create the command file exporting a `Command` object (name, description, handler), then add an entry to `lazyCommands` in the registry. Commands return React elements for Ink rendering. Some commands (clear, model, provider, etc.) need app state and are intercepted as "special commands" in `src/app/utils/app-util.ts`.

### Configuration Resolution Order

1. `agents.config.json` in working directory (project-level)
2. Platform config dir: `~/.config/opencub/agents.config.json` (Linux), `~/Library/Preferences/opencub/` (macOS)
3. `~/.agents.config.json` (legacy fallback)

If `OPENCUB_CONFIG_DIR` is set, the platform/legacy lookups are skipped and that directory is used directly.

Environment variable substitution in config values: `$VAR`, `${VAR}`, `${VAR:-default}`

### LLM Client Architecture

`src/llm/client-factory.ts` creates clients via `createLLMClient(provider?)`. Uses Vercel AI SDK (`ai` v6) with `@ai-sdk/openai-compatible` for any OpenAI-compatible API, plus dedicated `@ai-sdk/anthropic` and `@ai-sdk/google` providers. The wrapper logic (streaming, tool calls, error handling, prepareStep, retries) lives in `src/llm/ai-sdk-client/`.

## Code Style

- **TypeScript strict mode** with `@/*` path alias mapping to `src/*`
- **Biome** for formatting (tabs, single quotes, semicolons, trailing commas)
- **Key lint rules**: `useExhaustiveDependencies: error`, `noUnusedVariables: error`, `noUnusedImports: error`
- **React 19** with Ink.js for CLI rendering

## Testing

- **Framework**: AVA with tsx loader
- **Location**: `src/**/*.spec.ts` files alongside source
- **Serial execution**: Tests run one at a time
- **Run single test**: `pnpm run test:ava src/path/to/file.spec.ts`

## Development Modes

Four user-facing modes (toggle with Shift+Tab during chat):
- **normal**: Confirm each tool before execution
- **auto-accept**: Automatically execute most tools (bash and destructive git still prompt)
- **yolo**: Automatically execute every tool without exception
- **plan**: Show tool calls but don't execute

There is also an internal **scheduler** mode used by `src/features/schedule/` for cron-driven runs; it disables interactive tools (`ask_user`, `agent`).
