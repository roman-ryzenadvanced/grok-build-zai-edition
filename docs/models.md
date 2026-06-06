# Models Reference

## Z.ai GLM Models

All models use the endpoint: `https://api.z.ai/api/coding/paas/v4`

### GLM-5.1 (Default)

**Model ID**: `zai-glm-5.1` | **API Model**: `glm-5.1`

The latest stable GLM model. Best for general coding tasks, complex reasoning, and multi-step workflows.

```bash
grok --model zai-glm-5.1
```

### GLM-5

**Model ID**: `zai-glm-5` | **API Model**: `glm-5`

Balanced performance and speed. Good all-rounder for daily coding tasks.

```bash
grok --model zai-glm-5
```

### GLM-5 Turbo

**Model ID**: `zai-glm-5-turbo` | **API Model**: `glm-5-turbo`

Optimized for fast responses. Ideal for quick tasks, autocomplete, and rapid prototyping.

```bash
grok --model zai-glm-5-turbo
```

### GLM-5V Turbo

**Model ID**: `zai-glm-5v-turbo` | **API Model**: `glm-5v-turbo`

Multimodal model with vision capabilities. Best for UI design analysis, screenshot understanding, and visual code review.

```bash
grok --model zai-glm-5v-turbo
```

### GLM-4.7

**Model ID**: `zai-glm-4.7` | **API Model**: `glm-4.7`

Stable legacy model with proven reliability. Good for production-critical tasks.

```bash
grok --model zai-glm-4.7
```

### GLM-4.7 Flash

**Model ID**: `zai-glm-4.7-flash` | **API Model**: `glm-4.7-flash`

Ultra-fast lightweight model. Best for simple tasks, quick lookups, and high-volume processing.

```bash
grok --model zai-glm-4.7-flash
```

### GLM-4.6V

**Model ID**: `zai-glm-4.6v` | **API Model**: `glm-4.6v`

Vision and multimodal model. Supports image analysis and visual understanding.

```bash
grok --model zai-glm-4.6v
```

### GLM-5.2

**Model ID**: `zai-glm-5.2` | **API Model**: `glm-5.2`

The newest model with best overall performance. Cutting-edge capabilities.

```bash
grok --model zai-glm-5.2
```

## Comparison Matrix

| Model | Speed | Quality | Vision | Best Use Case |
|-------|-------|---------|--------|---------------|
| GLM-5.1 | Medium | High | No | Complex coding |
| GLM-5 | Medium | High | No | General coding |
| GLM-5 Turbo | Fast | Medium-High | No | Quick tasks |
| GLM-5V Turbo | Fast | High | Yes | Multimodal |
| GLM-4.7 | Medium | High | No | Stable production |
| GLM-4.7 Flash | Very Fast | Medium | No | Simple tasks |
| GLM-4.6V | Medium | Medium-High | Yes | Vision tasks |
| GLM-5.2 | Medium-High | Highest | No | Best performance |
