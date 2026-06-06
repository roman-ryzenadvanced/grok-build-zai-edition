#!/usr/bin/env python3
"""Test: Validate each model definition has required fields."""
import os
import sys
import re

CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.toml')

EXPECTED_MODELS = {
    "zai-glm-5.1": "glm-5.1",
    "zai-glm-5": "glm-5",
    "zai-glm-5-turbo": "glm-5-turbo",
    "zai-glm-5v-turbo": "glm-5v-turbo",
    "zai-glm-4.7": "glm-4.7",
    "zai-glm-4.7-flash": "glm-4.7-flash",
    "zai-glm-4.6v": "glm-4.6v",
    "zai-glm-5.2": "glm-5.2",
}

REQUIRED_FIELDS = ["model", "base_url", "name", "api_key", "temperature", "top_p", "max_completion_tokens", "context_window"]

def test_model_definitions():
    """Each model must have all required fields."""
    content = open(CONFIG_PATH).read()
    passed = 0
    for config_name, model_id in EXPECTED_MODELS.items():
        section_pattern = rf'\[model\.{re.escape(config_name)}\](.*?)(?=\[model\.|$)'
        match = re.search(section_pattern, content, re.DOTALL)
        if not match:
            print(f"  [FAIL] Model section not found: {config_name}")
            continue
        section = match.group(1)
        all_fields_ok = True
        for field in REQUIRED_FIELDS:
            if field not in section:
                print(f"  [FAIL] {config_name}: missing field '{field}'")
                all_fields_ok = False
        if all_fields_ok:
            print(f"  [PASS] {config_name}: all required fields present")
            passed += 1
    return passed, len(EXPECTED_MODELS)

if __name__ == "__main__":
    print("Running model definition tests...")
    passed, total = test_model_definitions()
    print(f"\nResults: {passed}/{total} model definitions valid")
    sys.exit(0 if passed == total else 1)
