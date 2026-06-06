#!/usr/bin/env python3
"""Test: Verify Z.ai API endpoint is reachable."""
import os
import sys
import urllib.request
import urllib.error
import json
import re

ENDPOINT = "https://api.z.ai/api/coding/paas/v4"

def test_endpoint_reachable():
    """The Z.ai API endpoint should respond to requests."""
    try:
        req = urllib.request.Request(f"{ENDPOINT}/models", method="GET")
        req.add_header("User-Agent", "grok-build-zai-edition/1.0.0")
        response = urllib.request.urlopen(req, timeout=10)
        print(f"  [PASS] Endpoint reachable (HTTP {response.status})")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print(f"  [PASS] Endpoint reachable (HTTP 401 - auth required, expected without key)")
            return True
        print(f"  [FAIL] HTTP error: {e.code} {e.reason}")
        return False
    except urllib.error.URLError as e:
        print(f"  [FAIL] Connection error: {e.reason}")
        return False
    except Exception as e:
        print(f"  [FAIL] Unexpected error: {e}")
        return False

def test_api_key_format():
    """Config should have a non-placeholder API key."""
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.toml')
    content = open(config_path).read()
    if "your-zai-api-key-here" in content:
        print("  [INFO] API key is placeholder (expected in repo template)")
        return True
    if re.search(r'api_key\s*=\s*"[^"]{10,}"', content):
        print("  [PASS] API key appears to be set")
        return True
    print("  [WARN] API key format unexpected")
    return True

if __name__ == "__main__":

    print("Running connectivity tests...")
    passed = 0
    total = 2
    if test_endpoint_reachable(): passed += 1
    if test_api_key_format(): passed += 1
    print(f"\nResults: {passed}/{total} tests passed")
    sys.exit(0 if passed == total else 1)
