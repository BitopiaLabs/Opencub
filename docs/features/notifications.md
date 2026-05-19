---
title: "Desktop Notifications"
description: "Get notified when OpenCub needs your attention"
sidebar_order: 14
---

# Desktop Notifications

When OpenCub is running a long task in the background, you might switch to another window and miss when it needs your input. Desktop notifications let you know when attention is required.

## Quick Start

Open `/settings` and select **Notifications** to enable them. Toggle which events you want to be notified about:

- **Tool Confirmation** — a tool call needs your approval
- **Question Prompt** — the AI has asked you a question
- **Generation Complete** — the AI has finished responding and is ready for your next message

You can also enable notification **sound**.

## How It Works

OpenCub uses native OS notification APIs — no bundled binaries or external dependencies.

| Platform | Method | Icon Support |
|----------|--------|:------------:|
| **macOS** | `terminal-notifier` (if installed) | Yes |
| **macOS** | `osascript` (fallback) | No |
| **Linux** | `notify-send` | Yes |
| **Windows** | PowerShell toast | No |

### macOS — Getting the Best Experience

By default, OpenCub falls back to `osascript` which shows basic notifications without the OpenCub icon. For the full experience with icon support and proper click-to-focus behaviour, install `terminal-notifier` via Homebrew:

```bash
brew install terminal-notifier
```

OpenCub will automatically detect and use it. You may need to allow notifications for `terminal-notifier` in **System Settings > Notifications** the first time.

### Linux

Notifications use `notify-send`, which is included with most desktop environments (GNOME, KDE, etc.). The OpenCub icon is included automatically when available.

## Configuration

Notification preferences are stored in `opencub-preferences.json` under the `opencub.notifications` namespace. You can configure them via `/settings` or by editing the file directly:

```json
{
  "opencub": {
    "notifications": {
      "enabled": true,
      "sound": true,
      "events": {
        "toolConfirmation": true,
        "questionPrompt": true,
        "generationComplete": false
      },
      "customMessages": {
        "toolConfirmation": {
          "title": "Action Required",
          "message": "OpenCub needs your approval"
        }
      }
    }
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Master toggle for all notifications |
| `sound` | boolean | `false` | Play a sound with each notification |
| `events.toolConfirmation` | boolean | `true` | Notify when a tool needs approval |
| `events.questionPrompt` | boolean | `true` | Notify when the AI asks a question |
| `events.generationComplete` | boolean | `true` | Notify when a response is ready |
| `customMessages.<event>` | object | — | Override the default title and message for an event |

Notification titles include the current project directory name, e.g. "Tool Confirmation Required in my-project".
