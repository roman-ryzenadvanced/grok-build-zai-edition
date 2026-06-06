#!/bin/bash
set -e
echo "Grok Build Z.ai Edition - Config Check"
GROK_DIR="${GROK_HOME:-$HOME/.grok}"
CONFIG_FILE="$GROK_DIR/config.toml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Config not found. Run scripts/install.sh first."
    exit 1
fi
MODELS=("zai-glm-5.1" "zai-glm-5" "zai-glm-5-turbo" "zai-glm-5v-turbo" "zai-glm-4.7" "zai-glm-4.7-flash" "zai-glm-4.6v" "zai-glm-5.2")
for model in "${MODELS[@]}"; do
    if grep -q "\[model\.$model\]" "$CONFIG_FILE"; then echo "  [OK] $model"; else echo "  [MISSING] $model"; fi
done
if grep -q "your-zai-api-key-here" "$CONFIG_FILE"; then
    echo "[WARNING] API key not configured!"
else
    echo "[OK] API key is configured."
fi
if grep -q "https://api.z.ai/api/coding/paas/v4" "$CONFIG_FILE"; then echo "[OK] Z.ai endpoint configured."; else echo "[WARNING] Z.ai endpoint not found."; fi
