# OpenCub

A local-first CLI coding agent with multi-provider support. Bring the power of agentic coding tools like Claude Code and Gemini CLI to local models (Ollama, llama.cpp) and controlled APIs (OpenRouter, Anthropic, Google, any OpenAI-compatible endpoint).

Built for privacy and control, with first-class support for small open-weights models that other agents leave behind.

## Quick Start

```bash
npm install -g opencub
cub
```

### CLI Flags

```bash
# Non-interactive mode with specific provider/model
cub --provider openrouter --model google/gemini-3.1-flash run "analyze src/app.ts"

# Interactive mode starting with specific provider
cub --provider ollama --model llama3.1

# Flags can appear before or after 'run' command
cub run --provider openrouter "refactor database module"

# Boot directly into a development mode (normal, auto-accept, yolo, plan)
cub --mode yolo
cub --mode plan run "audit the auth module"
```

## Documentation

See the [docs/](docs/) folder:

- **[Getting Started](docs/getting-started/index.md)** — Installation, setup, and first steps
- **[Configuration](docs/configuration/index.md)** — AI providers, MCP servers, preferences, logging, timeouts
- **[Features](docs/features/index.md)** — Custom commands, checkpointing, development modes, task management, and more
- **[Commands Reference](docs/features/commands.md)** — Complete list of built-in slash commands
- **[Keyboard Shortcuts](docs/features/keyboard-shortcuts.md)** — Full shortcut reference

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT — see [LICENSE.md](LICENSE.md).
