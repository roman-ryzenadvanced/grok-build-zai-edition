# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-06

### Changed

- **🔄 Web GUI Replaced**: Complete replacement of Next.js/CopilotKit-based web GUI with **[Odysseus](https://github.com/pewdiepie-archdaemon/odysseus)** — a full-featured FastAPI/Python AI workspace
  - **Old stack removed**: Next.js 15, CopilotKit AG-UI protocol, TypeScript frontend, npm/node build toolchain
  - **New stack added**:
    - Python 3.11+ / FastAPI async web framework
    - Uvicorn ASGI server (default port 3000)
    - SQLAlchemy ORM with SQLite persistence
    - Static HTML/CSS/JS frontend (zero Node.js dependency)
    - OpenAI-compatible `/v1/chat/completions` API integration
    - MCP (Model Context Protocol) for extensible tool use

### Added

- **Odysseus Chat UI Features**:
  - Multi-model chat with any OpenAI-compatible provider (Z.ai GLM, Ollama, OpenRouter, etc.)
  - Agent mode with built-in tools (MCP, shell, files, web search, memory/skills)
  - Deep Research — multi-step source gathering + visual synthesis reports
  - Document editor with AI assistance (markdown, HTML, CSV, syntax highlighting)
  - Session management with persistent chat history in SQLite
  - Streaming responses via Server-Sent Events (SSE)
  - Mobile-friendly responsive design + PWA install support
  - Dark/Light themes with built-in theme editor
  - File uploads (vision analysis, PDF parsing)
  - Memory & Skills system for persistent agent context
- **Model Endpoints System**: Configure Z.ai (or any provider) via Odysseus Settings → Endpoints — stores API keys, base URLs, and model lists in SQLite `model_endpoints` table
- **GUI Quick Start**: Python venv + pip + uvicorn workflow (no npm required)
- **Ubuntu Desktop Shortcut**: `.desktop` launcher at `~/.local/share/applications/odysseus-gui.desktop` for one-click server start + browser open
- **Screenshot**: New Odysseus GUI screenshot at `docs/screenshots/odysseus-gui.png`
- **Grok-Odysseus Sync Documentation**: Architecture diagram and comparison table showing how both interfaces share the same Z.ai API endpoint

### Grok Build ↔ Odysseus Sync Architecture

Both interfaces now share the same Z.ai API endpoint:

```
Browser → Odysseus (FastAPI:3000) → Z.ai API (GLM models)
Terminal → Grok CLI (config.toml) → Z.ai API (GLM models)
```

| Feature | Grok Build CLI | Odysseus Web GUI |
|---------|---------------|------------------|
| Interface | Terminal (TUI) | Browser (Web UI) |
| AI Backend | Z.ai (`config.toml`) | Z.ai (SQLite endpoints) |
| Models | `~/.grok/config.toml` | `model_endpoints` table |
| Streaming | NDJSON stdout | HTTP SSE |
| Tool Use | Built-in agent tools | MCP + built-in tools |
| Session Mgmt | `~/.grok/sessions/` | SQLite `app.db` |
| Best For | Coding, file ops, git work | Chat, research, documents |

### Removed

- All Next.js/CopilotKit source code (backed up as `gui-nextjs-backup/`)
- AG-UI SSE event bridge (`api/grok-agent` route)
- Grok CLI subprocess spawner backend
- npm/package.json build dependencies
- CopilotSidebar and fullscreen toggle components
- Custom "grokday" CSS theme overrides

### Technical Details

Odysseus uses its own Model Endpoints system (SQLite-backed) to configure AI providers independently from Grok CLI's `config.toml`. Both systems point to the same Z.ai OpenAI-compatible endpoint (`https://api.z.ai/api/coding/paas/v4`) but manage models separately. The GUI runs as an independent FastAPI process on port 3000 (configurable via `APP_PORT` in `.env`), while Grok CLI continues to work from the terminal as before.

No changes were made to the core Grok Build CLI or its configuration system. The GUI replacement is purely additive — it adds a web interface alongside the existing terminal experience.

## [1.0.0] - 2026-06-06

### Added

- **Initial Release**: Full Z.ai GLM model integration for Grok Build CLI
- **8 Z.ai Models Configured**:
  - `zai-glm-5.1` (default) — Latest stable GLM model
  - `zai-glm-5` — Balanced performance
  - `zai-glm-5-turbo` — Fast inference
  - `zai-glm-5v-turbo` — Multimodal with vision support
  - `zai-glm-4.7` — Stable legacy model
  - `zai-glm-4.7-flash` — Ultra-fast lightweight model
  - `zai-glm-4.6v` — Vision and multimodal tasks
  - `zai-glm-5.2` — Newest model, best performance
- **Z.ai API Endpoint**: Configured to use `https://api.z.ai/api/coding/paas/v4`
- **Install Script**: Automated installation script (`scripts/install.sh`)
- **Configuration Script**: Model verification and testing (`scripts/configure.sh`)
- **Test Suite**: Comprehensive test coverage
  - `test_config.py` — Configuration file validation
  - `test_models.py` — Model definition verification
  - `test_connectivity.py` — API endpoint connectivity tests
- **Documentation**: Complete docs including setup guide, model reference, FAQ, and troubleshooting
- **Custom Model Support**: Uses Grok Build CLI's native `[model.*]` configuration system

### Fixed

- **Issue: Default model set to grok-build (x.ai)**
  - Root Cause: Original `config.toml` only had `[cli]` section with `installer = "internal"`, no custom model definitions
  - Fix: Added `[models]` section with `default = "zai-glm-5.1"` and 8 individual `[model.*]` sections
  - Verification: `grok --model zai-glm-5.1` now routes to Z.ai endpoint

- **Issue: Incorrect Z.ai API endpoint**
  - Root Cause: Initial configuration used `https://z.ai/v1` which is not the correct coding plan endpoint
  - Fix: Updated all model definitions to use `https://api.z.ai/api/coding/paas/v4`
  - Verification: API requests now correctly resolve to Z.ai's coding plan infrastructure

- **Issue: Model ID mismatch**
  - Root Cause: Initial model name `coding-plan` did not match actual Z.ai model identifiers
  - Fix: Updated all model entries to use correct model IDs (`glm-5.1`, `glm-5`, etc.)
  - Verification: Each model definition matches Z.ai's API model identifiers exactly

- **Issue: No fallback models available**
  - Root Cause: Only one model was configured initially
  - Fix: Added all 8 available Z.ai GLM models with distinct performance characteristics
  - Verification: Users can now switch between models via `--model` flag

### Technical Details

The configuration leverages the Grok Build CLI's built-in support for custom OpenAI-compatible model endpoints. No binary modification, reverse engineering, or authentication bypass was required. The CLI's `config.toml` file natively supports:

- Custom `base_url` for any OpenAI-compatible API
- Per-model `api_key` configuration
- Model-specific parameter tuning (temperature, top_p, etc.)
- Context window configuration for auto-compaction

The Z.ai API is fully OpenAI-compatible, making it a drop-in replacement for the default x.ai endpoint.
