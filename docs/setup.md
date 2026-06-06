# Setup Guide

## Prerequisites

1. **Grok Build CLI** — Download from [x.ai](https://x.ai)
2. **Z.ai API Token** — Subscribe at [z.ai](https://z.ai/subscribe?ic=ROK78RJKNW) (use code `ROK78RJKNW` for 10% OFF)
3. **Python 3.6+** — Required for running tests

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/roman-ryzenadvanced/grok-build-zai-edition.git
cd grok-build-zai-edition
```

### Step 2: Backup Existing Config

```bash
cp ~/.grok/config.toml ~/.grok/config.toml.backup
```

### Step 3: Install Configuration

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

The install script will:
- Backup your existing `~/.grok/config.toml`
- Copy the Z.ai configuration to `~/.grok/config.toml`
- Prompt you for your Z.ai API key

### Step 4: Set Your API Key

Edit `~/.grok/config.toml` and replace `your-zai-api-key-here` with your actual Z.ai token:

```toml
api_key = "YOUR_ZAI_API_KEY_HERE"
```

Or use sed for batch replacement:

```bash
sed -i 's/your-zai-api-key-here/YOUR_ACTUAL_KEY/g' ~/.grok/config.toml
```

### Step 5: Verify Installation

```bash
grok models
```

You should see the Z.ai models listed.

## Configuration Reference

### config.toml Structure

```toml
[cli]
installer = "internal"

[models]
default = "zai-glm-5.1"  # Change default model here

[model.<name>]
model = "<model-id>"      # Z.ai model identifier
base_url = "https://api.z.ai/api/coding/paas/v4"
name = "<display-name>"
api_key = "<your-key>"
temperature = 0.7         # 0.0 - 2.0
top_p = 0.95             # 0.0 - 1.0
max_completion_tokens = 8192
context_window = 128000
```

### Model Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `temperature` | 0.7 | Sampling temperature (0.0 = deterministic, 2.0 = creative) |
| `top_p` | 0.95 | Nucleus sampling threshold |
| `max_completion_tokens` | 8192 | Maximum tokens per response |
| `context_window` | 128000 | Context window size (used for auto-compact) |

## Environment Variables

You can also set your API key via environment variable:

```bash
export XAI_API_KEY="your-zai-token"
```

The credential resolution order is: `api_key` (in config) > `env_key` > `XAI_API_KEY`.

## Uninstall

To restore the original configuration:

```bash
cp ~/.grok/config.toml.backup ~/.grok/config.toml
```
