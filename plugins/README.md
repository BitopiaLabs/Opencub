# OpenCub Plugins

First-party companion plugins for [OpenCub](../README.md). Each subdirectory is its own workspace package (see `pnpm-workspace.yaml`) with an independent `package.json`, build, and release artifact.

| Plugin | Path | Description |
|---|---|---|
| VS Code extension | [`vscode/`](vscode) | Bridges the OpenCub CLI to VS Code: status bar, diff previews, selection context, diagnostics |

---

## VS Code extension (`plugins/vscode`)

A thin extension that pairs with `cub --vscode`. It opens a local WebSocket (default port `51820`) and:

- Shows connection status in the VS Code status bar (`OpenCub` ↔ `$(check) <model>`)
- Renders agent-proposed file changes as native diff previews
- Lets you apply or reject the current OpenCub change from the command palette
- Streams the active file and current selection to the CLI so prompts can use them as context
- Opens files the agent wants you to look at
- Returns LSP diagnostics on request so the agent sees the same red squiggles you do

### Commands

| Command | Title |
|---|---|
| `opencub.connect` | Connect to OpenCub CLI |
| `opencub.disconnect` | Disconnect from OpenCub CLI |
| `opencub.startCli` | Start OpenCub CLI (opens a terminal and runs `cub --vscode`) |
| `opencub.applyChange` | Apply Current Change |
| `opencub.rejectChange` | Reject Current Change |

### Settings

| Key | Type | Default | Notes |
|---|---|---|---|
| `opencub.serverPort` | number | `51820` | Must match the CLI's `--vscode-port` |
| `opencub.autoConnect` | boolean | `true` | Connect automatically on startup |
| `opencub.autoStartCli` | boolean | `false` | Auto-launch the CLI if the first connection attempt fails |
| `opencub.showDiffPreview` | boolean | `true` | Show the diff preview before applying edits |

### Source layout

```
plugins/vscode/
  package.json          # extension manifest (publisher: BitopiaLabs)
  tsconfig.json
  src/
    extension.ts        # activate/deactivate + command + message routing
    websocket-client.ts # WS client to the CLI
    diff-manager.ts     # native diff previews + apply/reject
    protocol.ts         # message schema shared with the CLI
  media/
    icon.png
```

The matching CLI-side bridge lives at [`src/integrations/vscode/`](../src/integrations/vscode) — `vscode-server.ts`, `protocol.ts`, and `extension-installer.ts`.

### Build

The extension is bundled with `esbuild` and packaged into a `.vsix` checked in at [`../assets/opencub-vscode.vsix`](../assets/opencub-vscode.vsix):

```bash
# from the repo root
pnpm run build:vscode

# or directly inside the plugin
cd plugins/vscode
pnpm install
pnpm run build           # esbuild → dist/extension.js
pnpm exec vsce package   # produce .vsix
```

`prepublishOnly` (root) runs `pnpm run build && pnpm run build:vscode`, so a clean release always reships the extension.

### Install the bundled VSIX manually

```bash
code --install-extension assets/opencub-vscode.vsix
# or: codium / cursor / windsurfsurf --install-extension ...
```

The CLI helper `cub` can also install / detect it for you — see `src/integrations/vscode/extension-installer.ts`. The installed extension ID is `bitopialabs.opencub-vscode`.

### Run end-to-end

1. Build the extension (or install the shipped `.vsix`).
2. In VS Code, set `opencub.serverPort` if you changed it from `51820`. The extension also checks the CLI fallback range from that port through `+10`.
3. In a terminal inside the same workspace, run `cub --vscode`.
4. The status bar pill switches to `$(check) <model>`. Edits the agent proposes appear as diff previews.

---

## Adding a new plugin

1. Create `plugins/<name>/` with its own `package.json` (matching workspace conventions).
2. It is picked up automatically by `pnpm-workspace.yaml` (`plugins/*`).
3. Add a top-level build script in the root `package.json` if it ships an artifact (e.g. `build:<name>`).
4. Wire it into the release pipeline in `.github/workflows/release.yml` if it needs to be published.
5. Document it in this README.
