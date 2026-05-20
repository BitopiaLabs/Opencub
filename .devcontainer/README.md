# OpenCub Dev Container

A reproducible, zero-setup development environment for [OpenCub](../README.md). Open the repository in any tool that understands the [Development Containers](https://containers.dev/) spec and you get a fully configured workspace in one click.

---

## What's in the box

| Layer | Detail |
|---|---|
| Base image | `mcr.microsoft.com/devcontainers/base:ubuntu-22.04` |
| Runtime | Node.js 22 (NodeSource), pnpm (latest), Biome (global) |
| Shell | zsh + oh-my-zsh, with pnpm + Node on PATH |
| Fonts | Fira Code (apt) and FiraCode Nerd Font (powerline glyphs) |
| Extras | `jq`, `curl`, `wget`, `git`, `vim`, `unzip`, `build-essential`, `python3` |
| User | `vscode` (non-root) at `/workspaces/opencub` |
| VS Code extensions | Biome, TypeScript next, Prettier, GitLens |
| Forwarded ports | `51820` (VS Code ↔ CLI WebSocket bridge) |

The container is named `opencub-dev` and the pnpm store is persisted in a named volume (`opencub-pnpm-store`) for fast reinstalls.

---

## Files

| File | Purpose |
|---|---|
| `devcontainer.json` | Dev Containers manifest — image, features, VS Code settings, ports, mounts, lifecycle |
| `Dockerfile` | Image definition (Node 22, pnpm, Biome, fonts, zsh) |
| `docker-compose.yml` | Compose-based alternative for running outside a Dev Containers host |
| `scripts/post-create.sh` | Post-create hook: `pnpm install`, build, husky, scaffold `.env`, print summary |

---

## How to use it

### VS Code / Cursor / Windsurf

1. Install the **Dev Containers** extension.
2. Open this repository.
3. Run **Dev Containers: Reopen in Container**.
4. Wait for the post-create script to install dependencies and build.
5. Edit `.env` with your provider API keys.
6. Run `pnpm run start` (or `cub` after `npm link`) to launch the CLI.

### GitHub Codespaces

Click **Code → Codespaces → Create codespace on main**. The same `devcontainer.json` is used.

### Plain Docker Compose

If you want the same image without a Dev Containers host:

```bash
cd .devcontainer
docker compose up -d
docker exec -it opencub-dev zsh
```

The repository is mounted into `/workspaces/opencub`; the pnpm store is cached in a named volume.

---

## Lifecycle

On first create, [`scripts/post-create.sh`](scripts/post-create.sh) runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm run build`
3. `pnpm run prepare` (husky)
4. `pnpm test:format` + `pnpm test:types` (smoke; warnings are non-fatal)
5. Copies `.env.example` → `.env` if missing
6. Prints versions and next steps

Re-run it any time with:

```bash
bash .devcontainer/scripts/post-create.sh
```

---

## Customization

- **Node version.** Change `NODE_VERSION` in the `Dockerfile` and `node-version` in `.github/workflows/release.yml` together.
- **Extra VS Code extensions.** Add to `customizations.vscode.extensions` in `devcontainer.json`.
- **Git credentials.** Uncomment the `~/.gitconfig` mount in `docker-compose.yml` (or use the [Dev Containers Git credential forwarding](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials) docs for the VS Code path).
- **Different port.** Change `forwardPorts` and the matching `ports` entry in `docker-compose.yml`. Make sure it also matches `opencub.serverPort` in the VS Code extension settings — see [`plugins/README.md`](../plugins/README.md).

---

## Troubleshooting

- **`pnpm: command not found` inside the container.** The image installs pnpm globally, but a fresh shell may need a new login. Run `exec zsh` or open a new terminal.
- **VS Code can't connect to the CLI.** Start the CLI with `cub --vscode` (or `cub --vscode --vscode-port=51820`) inside the container and confirm port `51820` is forwarded.
- **Slow first install.** That's the cold pnpm store. Subsequent rebuilds reuse the `opencub-pnpm-store` volume and are much faster.
- **Permission errors writing to `/workspaces/opencub`.** Ensure your host user owns the repository directory before mounting; the container user is `vscode` (UID auto-mapped by the common-utils feature).
