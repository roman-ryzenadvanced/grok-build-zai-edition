# Frequently Asked Questions

## General

### What is Grok Build Z.ai Edition?
A pre-configured setup that enables the Grok Build CLI to use Z.ai's GLM models via the CLI's native custom model endpoint support.

### Does this require an x.ai subscription?
The Grok Build CLI itself may require an x.ai subscription to launch. However, once running, all AI inference is routed to Z.ai's API.

### Is this legal/allowed?
Yes. This configuration uses the Grok Build CLI's built-in `[model.*]` configuration system, which is a documented and supported feature. No binary modification or reverse engineering is involved.

## Setup

### How do I get a Z.ai API key?
Subscribe at [z.ai](https://z.ai/subscribe?ic=ROK78RJKNW). Use invite code `ROK78RJKNW` for 10% OFF coding plans.

### Can I use multiple providers?
Yes. The Grok Build CLI supports multiple `[model.*]` sections. You can have both x.ai and Z.ai models configured simultaneously.

### How do I switch models?
Use the `--model` flag:
```bash
grok --model zai-glm-5-turbo
```

Or change the default in `config.toml`:
```toml
[models]
default = "zai-glm-5-turbo"
```

## Troubleshooting

### Why am I still seeing the x.ai subscription menu?
The subscription check happens at CLI startup, before model loading. This is a built-in feature of the Grok Build CLI that cannot be bypassed via configuration.

### How do I fix "401 Unauthorized"?
Your Z.ai API key is invalid or expired. Get a new one at [z.ai](https://z.ai/subscribe?ic=ROK78RJKNW).

### Can I change the temperature/top_p settings?
Yes, edit each model's section in `~/.grok/config.toml`:
```toml
[model.zai-glm-5.1]
temperature = 0.3
top_p = 0.9
```
