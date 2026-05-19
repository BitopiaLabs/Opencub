---
title: "Installation"
description: "Install OpenCub via NPM, Homebrew, or Nix Flakes"
sidebar_order: 2
---

# Installation

## For Users

### NPM

Install globally and use anywhere:

```bash
npm install -g opencub
```

Then run in any directory:

```bash
cub
```

### Homebrew (macOS/Linux)

First, tap the repository:

```bash
brew tap tylerthomas/opencub https://github.com/tylerthomas/opencub
```

Then install:

```bash
brew install opencub
```

Run in any directory:

```bash
cub
```

To update:

```bash
# Update Homebrew's tap cache first (important!)
brew update

# Then upgrade opencub
brew upgrade opencub
```

> **Note**: If `brew upgrade opencub` shows the old version is already installed, run `brew update` first. Homebrew caches tap formulas locally and only refreshes them during `brew update`. Without updating the tap cache, you'll see the cached (older) version even if a newer formula exists in the repository.

### Nix Flakes

Run OpenCub directly using:

```bash
# If you have flakes enabled in your Nix config:
nix run github:tylerthomas/opencub

# If you don't have flakes enabled:
nix run --extra-experimental-features 'nix-command flakes' github:tylerthomas/opencub
```

Or install from `packages` output:

```nix
# flake.nix
{
  inputs = {
    opencub = {
      url = "github:tylerthomas/opencub";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
}

# configuration.nix
{ pkgs, inputs, system, ... }: {
  environment.systemPackages = [
    inputs.opencub.packages."${system}".default
  ];
}
```

## For Development

If you want to contribute or modify OpenCub:

**Prerequisites:**

- Node.js 22+
- pnpm (managed via Corepack — pinned by the repo's `packageManager` field, no manual install needed)

> Corepack ships with Node 22. If `pnpm` isn't found, run `corepack enable` once. To bump pnpm for the project later, run `corepack use pnpm@latest`.

**Setup:**

1. Clone and install dependencies:

```bash
git clone [repo-url]
cd opencub
pnpm install
```

2. Build the project:

```bash
pnpm run build
```

3. Run locally:

```bash
pnpm run start
```

Or build and run in one command:

```bash
pnpm run dev
```
