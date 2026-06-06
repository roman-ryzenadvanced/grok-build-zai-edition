#!/usr/bin/env python3
"""Test: Validate config.toml structure and syntax."""
import os
import sys

CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.toml')

def test_config_exists():
    """Config file must exist."""
    assert os.path.isfile(CONFIG_PATH), f"Config file not found: {CONFIG_PATH}"
    print("  [PASS] Config file exists")

def test_config_has_cli_section():
    """Config must have [cli] section."""
    content = open(CONFIG_PATH).read()
    assert "[cli]" in content, "Missing [cli] section"
    print("  [PASS] [cli] section present")

def test_config_has_models_section():
    """Config must have [models] section with default."""
    content = open(CONFIG_PATH).read()
    assert "[models]" in content, "Missing [models] section"
    assert 'default = "zai-glm-5.1"' in content, "Default model not set to zai-glm-5.1"
    print("  [PASS] [models] section with correct default")

def test_config_has_all_models():
    """Config must define all 8 Z.ai models."""
    content = open(CONFIG_PATH).read()
    models = ["zai-glm-5.1", "zai-glm-5", "zai-glm-5-turbo", "zai-glm-5v-turbo",
              "zai-glm-4.7", "zai-glm-4.7-flash", "zai-glm-4.6v", "zai-glm-5.2"]
    for model in models:
        assert f"[model.{model}]" in content, f"Missing model definition: {model}"
    print(f"  [PASS] All {len(models)} models defined")

def test_config_endpoint():
    """All models must use the correct Z.ai endpoint."""
    content = open(CONFIG_PATH).read()
    assert 'base_url = "https://api.z.ai/api/coding/paas/v4"' in content, "Incorrect endpoint"
    print("  [PASS] Correct Z.ai endpoint configured")

if __name__ == "__main__":
    print("Running config tests...")
    tests = [test_config_exists, test_config_has_cli_section, test_config_has_models_section,
             test_config_has_all_models, test_config_endpoint]
    passed = 0
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"  [FAIL] {test.__name__}: {e}")
    print(f"\nResults: {passed}/{len(tests)} tests passed")
    sys.exit(0 if passed == len(tests) else 1)
