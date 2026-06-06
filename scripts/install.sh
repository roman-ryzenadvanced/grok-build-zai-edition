#!/bin/bash
set -e

echo "=========================================="
echo "  Grok Build Z.ai Edition - Installer"
echo "=========================================="
echo ""

GROK_DIR="${GROK_HOME:-$HOME/.grok}"
CONFIG_FILE="$GROK_DIR/config.toml"
BACKUP_FILE="$GROK_DIR/config.toml.zai-backup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -d "$GROK_DIR" ]; then
    echo "ERROR: Grok Build CLI directory not found at $GROK_DIR"
    exit 1
fi

if [ -f "$CONFIG_FILE" ]; then
    echo "Backing up existing config to $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

echo "Installing Z.ai configuration..."
cp "$PROJECT_DIR/config/config.toml" "$CONFIG_FILE"

echo ""
read -p "Enter your Z.ai API key (or press Enter to set later): " API_KEY

if [ -n "$API_KEY" ]; then
    sed -i "s/your-zai-api-key-here/$API_KEY/g" "$CONFIG_FILE"
    echo "API key configured."
else
    echo "API key not set. Edit $CONFIG_FILE and replace 'your-zai-api-key-here' with your key."
    echo "Get a Z.ai API key at: https://z.ai/subscribe?ic=ROK78RJKNW"
fi

echo ""
echo "Installation complete!"
echo "Usage: grok --model zai-glm-5.1"
