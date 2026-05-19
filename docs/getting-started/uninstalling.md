---
title: "Uninstalling"
description: "How to uninstall OpenCub and clean up configuration files"
sidebar_order: 3
---

# Uninstalling OpenCub

## Finding Your Installation

If you're unsure how OpenCub was installed, find the binary location first:

```bash
which opencub
```

This will show the path — for example:
- `/usr/local/bin/opencub` or `/usr/local/lib/node_modules/...` → npm
- `/opt/homebrew/bin/opencub` or `.../Cellar/...` → Homebrew
- `/nix/store/...` → Nix

## NPM

```bash
npm uninstall -g opencub
```

## Homebrew

```bash
brew uninstall opencub
```

## Nix

If installed via `nix run`, no uninstall is needed. If added to your system packages, remove it from your `configuration.nix` or `flake.nix` and rebuild.

## Troubleshooting

If `opencub` still works after uninstalling, your shell may have cached the old path. Restart your terminal or run:

```bash
hash -r
```

If it persists, you may have multiple installations. Run `which opencub` again to find the remaining one and uninstall using the appropriate method above.

## Removing Configuration Files

To also remove OpenCub's configuration and preferences:

```bash
# macOS
rm -rf ~/Library/Preferences/opencub/

# Linux
rm -rf ~/.config/opencub/

# Per-project config (in each project directory)
rm -f .mcp.json
rm -rf .opencub/
```
