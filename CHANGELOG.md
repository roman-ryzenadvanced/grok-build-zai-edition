# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-06

### Added

- **Local Web GUI**: Full-featured web-based chat interface built with [CopilotKit](https://github.com/CopilotKit/CopilotKit)
  - Next.js 15 App Router + TypeScript frontend
  - CopilotSidebar persistent chat + toggleable fullscreen mode
  - Real-time streaming responses via AG-UI SSE protocol
  - Model selector to switch between all 8 Z.ai GLM models
  - Working directory picker for Grok file operations
  - Session management (create new / resume existing)
  - Thought panel to view Grok's reasoning process
  - Dark "grokday" theme with custom CSS overrides
  - Grok CLI runner backend spawning headless `grok` subprocess with `--output-format streaming-json`
  - AG-UI event bridge translating Grok NDJSON stream to AG-UI SSE events
  - Config parser reading models from `~/.grok/config.toml`
- **API Routes**:
  - `/api/grok-agent` — AG-UI SSE endpoint (main chat backend)
  - `/api/grok-models` — Model list from config.toml
  - `/api/grok-sessions` — Session list/create/resume
- **GUI Documentation**: Dedicated README in `gui/` directory
- **Screenshot**: Web GUI screenshot added to `docs/screenshots/`

### Technical Details

The GUI uses CopilotKit's `runtimeUrl` prop to connect to a custom Next.js API route that implements the AG-UI protocol. The backend spawns the Grok CLI in headless mode with streaming JSON output, parses NDJSON events (text, thought, end), and transforms them to AG-UI SSE events (RUN_STARTED, TEXT_MESSAGE_START/CONTENT/END, RUN_FINISHED, CUSTOM). This architecture requires no modifications to the Grok CLI binary — it uses the officially supported `--output-format streaming-json` flag.

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
