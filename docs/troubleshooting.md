# Troubleshooting

## Common Issues

### Issue: CLI shows subscription/login menu on launch

**Symptom**: Running `grok` displays a menu asking to subscribe, login, or quit.

**Root Cause**: The Grok Build CLI performs a subscription status check on startup, independent of model configuration. This is built into the compiled binary.

**Solutions**:
1. Navigate through the menu options normally
2. Use headless mode: `grok -p "your prompt" --model zai-glm-5.1`
3. Ensure you have valid x.ai credentials in `~/.grok/auth.json`

---

### Issue: 401 Unauthorized from Z.ai API

**Symptom**: API requests fail with authentication error.

**Root Cause**: The API key in `config.toml` is invalid, expired, or rate-limited.

**Solutions**:
1. Verify your token at [z.ai dashboard](https://z.ai)
2. Update `~/.grok/config.toml` with the correct key
3. Check Z.ai rate limits and quota

---

### Issue: Model not found error

**Symptom**: `grok --model zai-glm-5.1` returns "model not found".

**Root Cause**: The model ID in the config doesn't match what the CLI expects.

**Solutions**:
1. Run `grok models` to list available models
2. Ensure `[models] default = "zai-glm-5.1"` is set correctly
3. Verify the section name matches: `[model.zai-glm-5.1]`

---

### Issue: Slow response times

**Symptom**: Z.ai models respond slower than expected.

**Root Cause**: Network latency to Z.ai's API servers, or model is overloaded.

**Solutions**:
1. Try a faster model: `grok --model zai-glm-4.7-flash`
2. Check Z.ai status page for service issues
3. Reduce `max_completion_tokens` in config

---

### Issue: Configuration not loading

**Symptom**: Changes to `config.toml` are not reflected.

**Root Cause**: The CLI caches configuration or file has syntax errors.

**Solutions**:
1. Restart the CLI after editing config
2. Validate TOML syntax: `python3 -c "import tomllib; tomllib.load(open('~/.grok/config.toml'))"`
3. Check file permissions: `chmod 644 ~/.grok/config.toml`

---

### Issue: Auto-compact triggers too early/late

**Symptom**: Context window compaction happens at unexpected times.

**Root Cause**: The `context_window` value in config doesn't match the actual model's context size.

**Solutions**:
1. Adjust `context_window` in each model's config section
2. Set `auto_compact_threshold_percent` in `[session]`:
```toml
[session]
auto_compact_threshold_percent = 85
```
