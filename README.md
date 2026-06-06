<div align="center">

# Grok Build Z.ai Edition

### Use Any AI Provider with Grok Build CLI — No Subscription Required

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](VERSION)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Models](https://img.shields.io/badge/models-8%20GLM-orange.svg)](docs/models.md)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey.svg)](#installation)

---

## Get 10% OFF Z.ai Coding Plans!

### Use invite code: **ROK78RJKNW**

[![Subscribe to Z.ai](https://img.shields.io/badge/Z.ai%20Subscribe-10%25%20OFF-9333ea?style=for-the-badge&logo=zapier&logoColor=white)](https://z.ai/subscribe?ic=ROK78RJKNW)

**[Click here to subscribe and save 10% on your Z.ai coding plan!](https://z.ai/subscribe?ic=ROK78RJKNW)**

---

</div>

## What is This?

**Grok Build Z.ai Edition** is a pre-configured setup that enables the Grok Build CLI to work with **Z.ai's GLM models** — a powerful alternative to x.ai's default models. This configuration provides access to 8 state-of-the-art GLM models via Z.ai's OpenAI-compatible API endpoint, without requiring an x.ai subscription for AI inference.

## Supported Models

| Model ID | Name | Best For |
|----------|------|----------|
| `glm-5.1` | GLM-5.1 | General coding, complex tasks |
| `glm-5` | GLM-5 | General coding, balanced performance |
| `glm-5-turbo` | GLM-5 Turbo | Fast responses, quick tasks |
| `glm-5v-turbo` | GLM-5V Turbo | Multimodal, vision tasks |
| `glm-4.7` | GLM-4.7 | Stable, reliable coding |
| `glm-4.7-flash` | GLM-4.7 Flash | Ultra-fast, lightweight tasks |
| `glm-4.6v` | GLM-4.6V | Vision and multimodal |
| `glm-5.2` | GLM-5.2 | Latest, best performance |

## Installation

### Prerequisites

- Grok Build CLI installed (`~/.grok/downloads/grok-linux-x86_64` or equivalent)
- Z.ai API token ([get one with 10% OFF](https://z.ai/subscribe?ic=ROK78RJKNW))
- Bash shell (Linux/macOS) or Git Bash (Windows)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/roman-ryzenadvanced/grok-build-zai-edition.git
cd grok-build-zai-edition

# Run the install script
chmod +x scripts/install.sh
./scripts/install.sh
```

### Manual Installation

1. Copy the configuration file:
   ```bash
   cp config/config.toml ~/.grok/config.toml
   ```

2. Edit `~/.grok/config.toml` and replace the API key with your own:
   ```toml
   api_key = "your-zai-api-key-here"
   ```

3. Restart Grok Build CLI

## Usage

### Start Grok with Z.ai Models

```bash
# Use the default model (GLM-5.1)
grok

# Specify a model explicitly
grok --model zai-glm-5.1
grok --model zai-glm-5-turbo
grok --model zai-glm-4.7-flash
```

### Headless Mode

```bash
# Single prompt with Z.ai model
grok -p "Explain this code" --model zai-glm-5.1

# Auto-approve all tool executions
grok -p "Fix all lint errors" --model zai-glm-5 --always-approve
```

## Configuration

The configuration is stored in `~/.grok/config.toml`. Key settings:

```toml
[models]
default = "zai-glm-5.1"  # Default model

[model.zai-glm-5.1]
model = "glm-5.1"
base_url = "https://api.z.ai/api/coding/paas/v4"
api_key = "your-zai-token"
```

See [docs/setup.md](docs/setup.md) for full configuration reference.

## Architecture

```
~/.grok/
+-- config.toml          # Main configuration (modified for Z.ai)
+-- auth.json            # Original x.ai auth (unchanged)
+-- sessions/            # Session storage
+-- memory/              # Cross-session memory
+-- ...
```

The Z.ai configuration uses the Grok Build CLI's native `[model.*]` configuration system, which supports OpenAI-compatible endpoints. This is a **fully supported feature** of the CLI — no binary modification, reverse engineering, or auth bypass required.

## How It Works

1. Grok Build CLI's `config.toml` supports custom model definitions via `[model.<name>]` sections
2. Each model section specifies: `base_url`, `model`, `api_key`, and optional parameters
3. The CLI routes API requests to the specified `base_url` instead of the default x.ai endpoint
4. Z.ai's API is OpenAI-compatible, so requests work seamlessly

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/setup.md) | Detailed installation and configuration |
| [Models Reference](docs/models.md) | Complete model documentation |
| [FAQ](docs/faq.md) | Frequently asked questions |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |
| [Changelog](CHANGELOG.md) | Version history and changes |

## Troubleshooting

### Common Issues

**Issue: CLI still shows subscription menu**
- Root Cause: The Grok Build CLI checks x.ai subscription status before loading models
- Solution: Navigate through the menu, or use headless mode (`grok -p "..."`)

**Issue: 401 Unauthorized from Z.ai**
- Root Cause: Invalid or expired API token
- Solution: Verify your token in `~/.grok/config.toml`

**Issue: Model not found**
- Root Cause: Model ID mismatch
- Solution: Run `grok models` to see available models

See [docs/troubleshooting.md](docs/troubleshooting.md) for more.

## Testing

```bash
# Run all tests
python3 tests/test_config.py
python3 tests/test_models.py
python3 tests/test_connectivity.py
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Disclaimer

This project is **not affiliated with** xAI or Grok Build. It is a community configuration that leverages the CLI's built-in support for custom model endpoints. Use of Z.ai's API is subject to their terms of service.

---

<div align="center">

**[Get 10% OFF Z.ai with code ROK78RJKNW](https://z.ai/subscribe?ic=ROK78RJKNW)**

Made with care by [Roman](https://github.com/roman-ryzenadvanced)

</div>
