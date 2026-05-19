# AGENTS.md

AI coding agent instructions for **opencub**.

## Project Overview

A local-first CLI coding agent. Brings the power of agentic coding tools (Claude Code, Gemini CLI, Aider) to local models (Ollama, llama.cpp) and controlled APIs (OpenRouter, Anthropic, Google, any OpenAI-compatible endpoint).

**Project Type:** Node.js CLI built with React (Ink.js)
**Primary Language:** TypeScript (strict mode)
**Binary:** `cub`
**Package:** `opencub`

## Architecture

**Key Frameworks & Libraries:**
- React 19 with Ink.js for terminal UI
- Vercel AI SDK (`ai` v6) for LLM integration
- Model Context Protocol SDK
- AVA for tests, Biome for lint/format

**Project Structure:**

```
src/
├── cli.tsx              Entry point (compiled to dist/cli.js, run as `cub`)
├── app/                 App shell, orchestration, prompts
├── hooks/               React hooks (state, handlers, chat-handler)
├── ui/                  Ink components
│   └── primitives/      Low-level UI building blocks
├── commands/            Slash commands, registry, parser
├── tools/               Built-in tools + registry
│   └── tool-calling/    XML/JSON tool-call parsers (fallback path)
├── llm/                 LLM stack
│   ├── ai-sdk-client/   Vercel AI SDK wrapper
│   ├── models/          models.dev integration
│   ├── model-database/  Model metadata
│   └── client-factory.ts
├── integrations/        External integrations
│   ├── mcp/
│   ├── lsp/
│   └── vscode/
├── features/            Product features
│   ├── auth/            Copilot/Codex login
│   ├── session/         Chat session persistence
│   ├── schedule/        Cron-scheduled runs
│   ├── subagents/       Delegated agent runs
│   ├── custom-commands/ User markdown commands
│   ├── init/            /init wizard
│   ├── wizards/         Setup wizards
│   ├── usage/           Usage tracking
│   └── plain/           --plain Ink-free runtime
├── shared/              Shared utilities (utils, types, config, etc.)
└── test-utils/          Shared test helpers
```

## Development Commands

```bash
pnpm run build          # Compile TypeScript to dist/
pnpm run dev            # Watch mode
pnpm run start          # Run compiled CLI (`cub`)
pnpm run test:all       # Full check: format, lint, types, AVA tests, knip, audit, security
pnpm run test:ava src/path/to/file.spec.ts  # Run single test file
pnpm run test:lint:fix  # Auto-fix lint/format issues
```

## Code Style Guidelines

- TypeScript strict mode, `@/*` path alias → `src/*`
- Biome enforces: tabs, single quotes, semicolons, trailing commas, 80-char lines
- Key lint rules: `useExhaustiveDependencies`, `noUnusedVariables`, `noUnusedImports` (all error)
- React 19 functional components with hooks; PascalCase for components, camelCase for everything else
- Prefer `const`/`let`, async/await, native ES features

## Testing

- Framework: **AVA** with tsx loader
- Specs co-located: `src/**/*.spec.ts` and `*.spec.tsx`
- Serial execution (tests run one at a time)
- Run single test: `pnpm run test:ava src/path/to/file.spec.ts`

## State Management

All app state lives in `src/hooks/useAppState.tsx`. Other hooks receive state and setters from it. `src/app/App.tsx` orchestrates them via `useAppHandlers`. Global `src/shared/utils/message-queue.tsx` lets deep components push messages to the chat without prop-drilling.

## LLM Stack

`src/llm/client-factory.ts` creates clients via `createLLMClient(provider?)`. The wrapper logic (streaming, tool calls, error handling, retries) lives in `src/llm/ai-sdk-client/`.

## AI Coding Assistance Notes

- Use the `string_replace` and `write_file` tools — they're the supported edit primitives.
- Tool execution has two paths: native (AI SDK) and XML/JSON fallback for non-tool-trained models. `LLMChatResponse.toolsDisabled` signals which path produced the response.
- The CLI has a fast path for `--version` / `--help` that avoids importing the React app — don't add static imports to the top of `src/cli.tsx`.
- For UI changes: build and run `./dist/cli.js` to verify (tests don't catch every UX regression).

## Repository

Source: https://github.com/tylerthomas/opencub
