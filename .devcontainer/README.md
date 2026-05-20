# OpenCub Dev Container

This directory defines a reproducible development container for OpenCub. It is
intended for contributors who want a clean Node.js 22 environment without
installing project tooling directly on their host machine.

The setup works with VS Code Dev Containers, compatible editors, GitHub
Codespaces, and Docker Compose.

## Included Tooling

| Area | Details |
| --- | --- |
| Base image | `mcr.microsoft.com/devcontainers/base:ubuntu-22.04` |
| Node.js | Node.js 22 from NodeSource |
| Package manager | pnpm 11.0.9 |
| Formatter/linter | Biome 2.3.10 globally, plus the project-local dependency |
| Shell | zsh with oh-my-zsh for the `vscode` user |
| Fonts | Fira Code and FiraCode Nerd Font |
| System tools | `jq`, `curl`, `wget`, `git`, `vim`, `unzip`, `build-essential`, `python3`, `python3-pip` |
| User | `vscode` |
| Workspace | `/workspaces/opencub` |
| Forwarded port | `51820` for the OpenCub VS Code bridge |

## Files

| File | Purpose |
| --- | --- |
| [`devcontainer.json`](devcontainer.json) | Main Dev Containers configuration |
| [`Dockerfile`](Dockerfile) | Image definition for Node, pnpm, Biome, fonts, and shell tooling |
| [`docker-compose.yml`](docker-compose.yml) | Compose entry point for running the same image outside a Dev Containers host |
| [`scripts/post-create.sh`](scripts/post-create.sh) | First-run setup script |

## Use With VS Code, Cursor, or Windsurf

1. Install the Dev Containers extension.
2. Open the OpenCub repository.
3. Run `Dev Containers: Reopen in Container`.
4. Wait for `scripts/post-create.sh` to finish.
5. Add provider credentials to `.env` or configure `agents.config.json`.
6. Start OpenCub:

```bash
pnpm run start
```

`pnpm run start` runs `node dist/cli.js`. The container does not install the
`cub` command globally by default.

## Use With GitHub Codespaces

Create a codespace from the repository. Codespaces uses
[`devcontainer.json`](devcontainer.json), runs the same post-create script, and
opens the workspace at `/workspaces/opencub`.

## Use With Docker Compose

From the repository root:

```bash
docker compose -f .devcontainer/docker-compose.yml up -d
docker exec -it opencub-dev zsh
```

Inside the container:

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run start
```

The compose file mounts the repository at `/workspaces/opencub` and persists
the pnpm store in the `opencub-pnpm-store` Docker volume.

## First-Run Script

The post-create script runs automatically for Dev Containers and Codespaces:

```bash
bash .devcontainer/scripts/post-create.sh
```

It performs these steps:

1. Installs dependencies with `pnpm install --frozen-lockfile`.
2. Builds the CLI with `pnpm run build`.
3. Runs `pnpm run prepare` when Husky is installed.
4. Runs `pnpm test:format` and `pnpm test:types` as setup checks.
5. Copies `.env.example` to `.env` if `.env` does not exist.
6. Prints Node.js, pnpm, and Biome versions.

The format and type checks print warnings if they fail, but they do not block
container creation. Fix those failures before committing code.

## Common Commands

```bash
pnpm run build          # Build dist/cli.js
pnpm run start          # Run the built CLI
pnpm run dev            # TypeScript watch mode
pnpm test:format        # Biome format check
pnpm test:lint          # Biome lint
pnpm test:types         # TypeScript type check
pnpm test:ava           # AVA tests
pnpm test:all           # Full local test script
pnpm run build:vscode   # Build assets/opencub-vscode.vsix
```

For one-shot CLI testing:

```bash
node dist/cli.js --plain run "summarize this repository"
```

## VS Code Extension Port

Port `51820` is forwarded by default. Use it when testing the VS Code companion
extension with the CLI bridge:

```bash
pnpm run build
node dist/cli.js --vscode --vscode-port 51820
```

See [../plugins/README.md](../plugins/README.md) for extension-specific setup.

## Configuration

Provider credentials can be set in `.env` or in OpenCub config files. The
post-create script creates `.env` from `.env.example` when it is missing.

Do not commit `.env`, `agents.config.json`, local credentials, generated logs,
or personal editor settings.

## Rebuilds And Updates

Rebuild the container after changing:

- `.devcontainer/Dockerfile`
- `.devcontainer/devcontainer.json`
- `.devcontainer/docker-compose.yml`
- Node.js, pnpm, or system package requirements

In VS Code, use `Dev Containers: Rebuild Container`.

For Docker Compose:

```bash
docker compose -f .devcontainer/docker-compose.yml down
docker compose -f .devcontainer/docker-compose.yml up -d --build
```

To clear the cached pnpm store:

```bash
docker volume rm opencub-pnpm-store
```

## Troubleshooting

### `pnpm` is not found

Open a new terminal in the container or run:

```bash
exec zsh
```

### The VS Code extension cannot connect

Confirm the CLI bridge is running inside the container:

```bash
node dist/cli.js --vscode --vscode-port 51820
```

Also confirm the editor is forwarding port `51820`.

### File permission errors

The container runs as the `vscode` user. If mounted files are not writable,
check ownership of the repository on the host and rebuild the container.

### Docker Compose mounts the wrong files

Run Compose from the repository root:

```bash
docker compose -f .devcontainer/docker-compose.yml up -d
```

The compose file expects `.devcontainer/docker-compose.yml` to be inside the
repository and mounts `..` from that directory to `/workspaces/opencub`.

### Container name already exists

The container name is `opencub-dev`. Remove the old container and start again:

```bash
docker rm -f opencub-dev
docker compose -f .devcontainer/docker-compose.yml up -d
```
