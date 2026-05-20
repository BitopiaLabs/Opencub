# Contributing to OpenCub

Thanks for taking the time to contribute! This document explains how to set up your environment, the standards we follow, and the workflow for getting changes merged.

By participating in this project you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). Security vulnerabilities should be reported per [SECURITY.md](SECURITY.md), **not** as a public issue.

---

## Quick links

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Issues](https://github.com/BitopiaLabs/Opencub/issues)
- [Pull Requests](https://github.com/BitopiaLabs/Opencub/pulls)

---

## Ways to contribute

| Kind | How |
|---|---|
| Bug reports | Open an [Issue](https://github.com/BitopiaLabs/Opencub/issues/new/choose) using the **Bug Report** template |
| Feature requests | Open an Issue using the **Feature Request** template; describe the problem first, solution second |
| Code | Fork, branch, PR — see [Pull request process](#pull-request-process) below |
| Provider support | Add or extend a template in `src/features/wizards/templates/provider-templates.ts` and matching factory branch in `src/llm/ai-sdk-client/providers/provider-factory.ts` |
| New tool | Add under `src/tools/` with a `.spec.tsx` sibling; register in `src/tools/index.ts` and (if needed) `tool-profiles.ts` |
| Docs | Edit `README.md`, `.devcontainer/README.md`, `plugins/README.md`, or this file |

Small fixes (typos, broken links, obvious bugs) don't need a prior issue. Larger changes — new commands, breaking behavior, public API changes — **please open an issue first** so we can agree on the approach before you spend time on it.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | **≥ 22** (the V8 compile cache enabled in `src/cli.tsx` requires 22.8+) |
| pnpm | **11.x** (`packageManager` field pins this; `npm install -g pnpm@11`) |
| git | any recent |
| Optional | A local model runtime (Ollama, llama.cpp, LM Studio, MLX Server) **or** an API key for a hosted provider, if you want to exercise the agent end-to-end |

The fastest path is the included **Dev Container** — see [`.devcontainer/README.md`](.devcontainer/README.md). It pins Node 22, pnpm, Biome, and the right fonts.

---

## Setting up

```bash
git clone https://github.com/BitopiaLabs/Opencub.git
cd Opencub
pnpm install --frozen-lockfile
pnpm run build
node dist/cli.js --version       # smoke test
```

First-run extras:

- `cp .env.example .env` if you want to use environment variables for provider keys.
- `cp .mcp.example.json .mcp.json` if you want to test MCP servers locally.
- The `prepare` script installs Husky hooks automatically. The pre-commit hook runs `lint-staged` (Biome) over staged files.

---

## Project layout

```
src/
  cli.tsx              entry point + fast-path flag parsing
  app/                 top-level Ink application
  commands/            slash-commands (/agents, /init, /model, ...)
  features/            auth, init, plain, schedule, session, subagents, wizards
  hooks/               chat handler, conversation loop, tool executor
  integrations/        vscode + lsp + mcp bridges
  llm/                 provider factory, AI SDK clients, model registry
  shared/              config, types, services, utilities, security, logging
  tools/               the agent's tool surface (file, git, shell, web, lsp, tasks)
  ui/                  Ink components
plugins/vscode/        VS Code companion extension (separate workspace)
.devcontainer/         ready-to-go dev environment
benchmarks/            tokenizer + perf benchmarks
scripts/               credits generator, model fetcher, test helpers
```

When in doubt, search for an existing example of the kind of code you're adding and follow its pattern.

---

## Development workflow

```bash
pnpm run dev            # tsc --watch
pnpm run start          # node dist/cli.js
```

For a tight loop on a specific tool or command, write a `.spec.ts` next to the source and run AVA on that one file:

```bash
./node_modules/.bin/ava src/tools/read-file.spec.tsx
```

---

## Tests

The full pipeline must stay green before a PR is merged. CI (`.github/workflows/pr-checks.yml`) runs each of these in parallel.

```bash
pnpm test:format        # biome check (whitespace, organize-imports, ...)
pnpm test:lint          # biome lint (rules in biome.json)
pnpm test:types         # tsc --noEmit
pnpm test:ava           # AVA unit + integration tests (5,500+ tests)
pnpm test:knip          # unused-export detection (config: knip.json)
pnpm test:audit         # pnpm audit, level=high, --ignore-unfixable
pnpm test:security      # semgrep scan (config: .semgrepignore)
pnpm test:benchmark     # benchmark report
pnpm test:all           # everything above
```

### Testing rules of thumb

- **Tests live next to source** as `*.spec.ts` / `*.spec.tsx`. Don't put them in a `test/` folder.
- **AVA runs serially** (`workerThreads: false` in `package.json#ava`) — don't write tests that assume parallelism.
- **No `console.log` in source.** Use the logging API (see below). The CI lint rule allows `console.log` only because the structured logger uses it internally.
- **Coverage stays at ≥ 80% lines.** The PR check enforces this via `c8`.
- **Don't add network calls to tests.** Mock `fetch` (see existing `*.spec.ts` files for the pattern).
- **Don't shell out to real binaries in tests.** Mock `execFile`, or guard the call with an environment skip.

---

## Code style

Style is enforced by Biome (`biome.json`). The short version:

- **Tabs** for indentation, **LF** line endings, **80-col** line width.
- **Single quotes** in JS/TS, **double quotes** in JSX.
- Semicolons always on; trailing commas everywhere; bracket spacing off.
- Imports are auto-organized on save / on commit.
- Prefer `function foo()` over `const foo = () =>` for exported top-level functions.
- Prefer named exports; avoid `default export` unless a framework demands it.
- **No `any`** unless you genuinely cannot avoid it (the rule is `warn`, not `error`, but reviewers will push back).
- **No unused variables, no unused imports** (`error` in CI).
- React/Ink components live in `src/ui/` and `src/commands/*.tsx`; co-locate small helpers with the component.

Run the formatter before committing:

```bash
pnpm format             # biome check --write
```

The pre-commit hook does this automatically on staged files.

---

## Logging

> Linked from `.github/pull_request_template.md` — please keep this anchor (`#logging`) stable.

OpenCub uses [pino](https://github.com/pinojs/pino) under the hood, wrapped in a small structured-logging facade at `src/shared/utils/logging/`. **Do not use `console.log`** in production paths — it bypasses redaction, transports, and log levels.

### Quick usage

```ts
import {getLogger, createChildLogger} from '@/shared/utils/logging';

const log = getLogger();
log.info({tool: 'read-file', path}, 'tool invoked');
log.error({err}, 'failed to parse model response');

// For a sub-system, prefer a child logger with bindings:
const mcpLog = createChildLogger({component: 'mcp-client', serverName});
mcpLog.debug({request}, 'sending request');
```

### Rules

- **Structured first.** Pass context as an object (`{tool, path, ...}`), not interpolated into the message string.
- **Levels.** `trace` for noisy internals, `debug` for dev-only signal, `info` for user-visible events, `warn` for recoverable issues, `error` for failures, `fatal` only for unrecoverable shutdowns.
- **Errors.** Always log the error under the `err` key — pino's serializer formats it correctly. `log.error({err, ...context}, 'message')`.
- **Redaction.** Secrets (API keys, tokens, auth headers) are scrubbed by `redaction.ts`. If you add a new field name that could carry a secret, add it to the redaction list with a test.
- **Performance.** Wrap hot paths in `isLevelEnabled('debug')` if building the log object is expensive.
- **No PII.** Don't log raw user prompts, model outputs, file contents, or environment values into persistent transports.

Configuration lives in `src/shared/utils/logging/config.ts` and is driven by `OPENCUB_LOG_*` env vars (see `.env.example`).

---

## Commit messages

We follow a lightweight [Conventional Commits](https://www.conventionalcommits.org/) style. Type prefix, optional scope, short imperative subject:

```
feat(tools): add lsp-get-diagnostics tool
fix(provider-factory): pass HTTP-Referer for openrouter
docs(readme): document --plain runtime
chore(deps): bump @ai-sdk/anthropic to 3.0.59
refactor(chat-handler): extract tool-executor helper
test(update-checker): cover nix install path
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`, `ci`. Keep the subject under 72 characters. Body and footer are optional but welcome for non-trivial changes — explain the *why*, not the *what*.

---

## Pull request process

1. **Fork** the repo and create a topic branch from `main`:
   ```bash
   git checkout -b feat/my-thing
   ```
2. Make focused commits. One logical change per PR is much easier to review than a kitchen sink.
3. Make sure the full pipeline passes locally:
   ```bash
   pnpm test:format && pnpm test:lint && pnpm test:types && pnpm test:ava && pnpm test:knip
   ```
4. Update or add **tests** for any user-visible behavior change.
5. Update **docs** if your change touches CLI flags, env vars, configuration, or public APIs.
6. Open the PR against `main`. Fill in the template — the checklist exists to save reviewer cycles, not as red tape.
7. Address review feedback by pushing additional commits (don't force-push during review unless asked — it makes incremental review harder).
8. A maintainer will squash-merge once CI is green and at least one approving review is in.

### What gets PRs declined

- Failing CI (any of: format, lint, types, AVA, knip, audit, semgrep).
- Drive-by refactors mixed into a feature PR — split them.
- New runtime dependencies without justification. Each one is a maintenance + supply-chain cost; prefer reusing existing deps or writing 10 lines yourself.
- Disabling tests without an issue link and a deadline.
- Changes to provider URLs, model IDs, or pricing data without a citation in the PR body.

---

## Releases

Releases are driven by `.github/workflows/release.yml`. On every push to `main` it:

1. Compares `package.json#version` to the latest `opencub` version on npm.
2. If different, runs the full test pipeline + builds the VS Code extension.
3. Publishes to npm, creates a GitHub Release, posts to Discord, and updates the Nix package.

To cut a release:

1. Bump `version` in `package.json` (and `plugins/vscode/package.json` if the extension changed).
2. Merge to `main`. CI does the rest.

Use [semver](https://semver.org/): `MAJOR.MINOR.PATCH`. Breaking changes bump MAJOR, new features bump MINOR, bug fixes bump PATCH.

---

## Reporting bugs

Use the [Bug Report](https://github.com/BitopiaLabs/Opencub/issues/new?template=bug_report.md) template. The most useful bug reports include:

- A **minimal repro** — exact command, exact config, exact prompt.
- The provider + model you were using.
- Output of `cub --version` and `node --version`.
- Logs from `~/.local/share/opencub/logs/` (Linux) / equivalent on macOS / Windows, with `OPENCUB_LOG_LEVEL=debug` if possible. **Scrub any API keys before pasting.**

---

## Code of Conduct

We follow the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). In short: be kind, assume good faith, focus on the work. Reports go through the channels described in that document.

---

## License

By contributing to OpenCub, you agree that your contributions will be licensed under the [MIT License](LICENSE).
