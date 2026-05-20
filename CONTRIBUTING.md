# Contributing to OpenCub

Thank you for helping improve OpenCub. This guide explains how to set up the
project, make focused changes, run the right checks, and submit pull requests
that are easy to review.

By participating in this project, you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md). Report security issues using
[SECURITY.md](SECURITY.md), not a public GitHub issue.

## Before You Start

Small fixes such as typos, broken links, test corrections, and clear bug fixes
can go straight to a pull request.

Please open an issue first for larger work, including:

- new provider integrations
- new CLI flags or commands
- changes to approval behavior or tool execution
- major UI changes
- release workflow changes
- new runtime dependencies
- breaking config changes

That discussion keeps implementation work aligned before anyone spends time on
a large patch.

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | 22 or newer |
| pnpm | 11.x |
| git | Any recent version |

Optional tools depend on what you are testing:

- a local model runtime such as Ollama, llama.cpp server, LM Studio, or MLX
  Server
- API keys for hosted providers
- VS Code, when working on the companion extension
- Semgrep, when running the security scan locally

The development container in `.devcontainer/` provides the expected Node,
pnpm, editor, and font setup.

## Setup

```bash
git clone https://github.com/BitopiaLabs/Opencub.git
cd Opencub
pnpm install --frozen-lockfile
pnpm run build
node dist/cli.js --version
```

For provider testing, create local configuration files as needed:

```bash
cp .env.example .env
cp .mcp.example.json .mcp.json
```

Do not commit local secrets, generated credentials, personal config files, or
debug logs.

## Project Structure

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
```

When adding code, follow the nearest existing pattern before introducing a new
abstraction.

## Development Workflow

Start TypeScript watch mode:

```bash
pnpm run dev
```

Run the built CLI:

```bash
pnpm run build
pnpm run start
```

Run the CLI directly from source build output:

```bash
node dist/cli.js
node dist/cli.js run "summarize this repository"
```

For non-interactive test runs, use `--plain` when you want to avoid the Ink UI:

```bash
node dist/cli.js --plain run "summarize README.md"
```

## Testing

Run the checks that match your change before opening a pull request.

```bash
pnpm test:format        # Biome format check
pnpm test:lint          # Biome lint
pnpm test:types         # TypeScript type check
pnpm test:ava           # Unit and integration tests
pnpm test:knip          # Unused dependency/export checks
pnpm test:audit         # Dependency audit
pnpm test:security      # Semgrep scan
pnpm test:benchmark     # Benchmark report
pnpm test:all           # Full local test script
```

For most code changes, run at least:

```bash
pnpm test:format
pnpm test:lint
pnpm test:types
pnpm test:ava
```

For a focused AVA test:

```bash
pnpm exec ava src/path/to/file.spec.ts
```

For coverage:

```bash
pnpm test:ava:coverage
```

Coverage is expected to stay at or above the configured threshold in CI.

## Test Guidelines

- Place tests next to the source file as `*.spec.ts` or `*.spec.tsx`.
- Keep tests deterministic. Do not rely on real network calls, local machine
  state, or external binaries unless the test explicitly guards that case.
- Mock `fetch`, file system boundaries, shell execution, provider clients, and
  timers where needed.
- Add or update tests for user-visible behavior changes.
- Prefer small, direct tests over broad snapshots that fail for unrelated copy
  changes.
- Do not skip or delete failing tests without explaining the reason in the pull
  request.

## Code Style

Biome enforces formatting and linting.

Important conventions:

- Use tabs for indentation.
- Use single quotes in TypeScript and double quotes in JSX attributes.
- Keep imports organized.
- Prefer named exports.
- Prefer `function name()` for exported top-level functions.
- Avoid `any`; use a narrow type or `unknown` with validation.
- Keep user-facing messages clear and short.
- Do not add broad refactors to a feature or bug-fix pull request.

Format files before committing:

```bash
pnpm format
```

## Logging

Production code should use the logging utilities in
`src/shared/utils/logging/`. Do not use `console.log` in application paths.

Example:

```ts
import {createChildLogger, getLogger} from '@/shared/utils/logging';

const log = getLogger();
log.info({tool: 'read-file', path}, 'tool invoked');
log.error({err}, 'failed to read provider config');

const providerLog = createChildLogger({component: 'provider-factory'});
providerLog.debug({providerName}, 'creating provider');
```

Logging rules:

- Put structured context in the first argument.
- Log errors under the `err` key.
- Do not log API keys, auth headers, raw prompts, model output, file contents,
  or environment values.
- Add redaction tests if you introduce a field that may contain secrets.

## Provider Changes

Provider setup templates live in:

```text
src/features/wizards/templates/provider-templates.ts
```

Provider construction lives in:

```text
src/llm/ai-sdk-client/providers/provider-factory.ts
```

When changing provider behavior:

- update the wizard template if setup changes
- update the factory if SDK or request behavior changes
- add tests for config parsing and provider creation
- document required API keys, base URLs, scopes, and login flows
- avoid hard-coding secrets or user-specific endpoints

## Tool Changes

Agent tools live in `src/tools/`.

When adding or changing a tool:

- keep the tool interface narrow and explicit
- validate paths and user-controlled arguments
- define the approval behavior clearly
- add focused tests next to the tool
- register the tool where existing tools are registered
- update documentation if users need to know about the new behavior

Be conservative with tools that write files, run commands, change git state, or
make network requests.

## VS Code Extension

The companion extension is in `plugins/vscode`.

Useful commands:

```bash
pnpm --filter opencub-vscode run build
pnpm --filter opencub-vscode run lint
pnpm run build:vscode
```

`pnpm run build:vscode` writes the packaged extension to:

```text
assets/opencub-vscode.vsix
```

If extension behavior changes, update `plugins/README.md` and add or update
tests for the CLI-side integration when possible.

## Documentation Changes

Keep documentation practical and verifiable.

- Prefer exact commands that work from a clean checkout.
- Keep provider and model examples generic unless a specific model is required.
- Update README examples when CLI flags or config fields change.
- Do not document planned features as if they already exist.

## Commit Messages

Use a lightweight Conventional Commits style:

```text
feat: add provider setup validation
fix: handle empty model list in wizard
docs: clarify source installation steps
test: cover provider edit flow
chore: update build workflow
refactor: simplify vscode protocol handling
```

Common types:

- `feat`
- `fix`
- `docs`
- `test`
- `chore`
- `refactor`
- `perf`
- `build`
- `ci`

Keep the subject short and specific. Use the body only when the reason for the
change is not obvious from the diff.

## Pull Request Process

1. Create a branch from `main`.
2. Keep the pull request focused on one logical change.
3. Add or update tests for behavior changes.
4. Update documentation when commands, config, providers, tools, or workflows
   change.
5. Run the relevant local checks.
6. Open the pull request against `main`.
7. Fill in the pull request template with the commands you ran.
8. Respond to review comments with follow-up commits.

Avoid force-pushing during review unless a maintainer asks for it. Incremental
commits make review easier.

## CI

Pull requests run checks for:

- formatting
- linting
- TypeScript types
- AVA tests with coverage
- unused dependencies and exports
- build artifacts
- dependency audit
- Semgrep
- CodeQL

The release workflow runs on pushes to `main`. It publishes only when the
version in `package.json` differs from the version currently available on npm.

Version changes should follow semver:

- patch for fixes
- minor for backwards-compatible features
- major for breaking changes

## Bug Reports

Use the GitHub bug report template. A useful report includes:

- OpenCub version
- Node.js version
- operating system
- exact command used
- provider and model name
- relevant config, with secrets removed
- expected behavior
- actual behavior
- logs, if available and scrubbed

## Security

Do not report vulnerabilities in public issues. Follow the instructions in
[SECURITY.md](SECURITY.md).

Never include API keys, OAuth tokens, private prompts, private repository
content, or customer data in issues, pull requests, test fixtures, or logs.

## License

By contributing to OpenCub, you agree that your contributions are licensed
under the [MIT License](LICENSE).
