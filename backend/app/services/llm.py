"""LLM client abstraction.

The prototype works fully offline: if no API key is configured, every caller
falls back to the deterministic heuristic engine. To enable LLM-backed
extraction, set (any OpenAI-compatible endpoint works):

    COMPLYGEM_LLM_BASE_URL=https://api.openai.com/v1
    COMPLYGEM_LLM_API_KEY=sk-...
    COMPLYGEM_LLM_MODEL=gpt-4o-mini
"""
import json
import os
import urllib.request

CONFIGURED = bool(os.environ.get("COMPLYGEM_LLM_API_KEY"))
BASE_URL = os.environ.get("COMPLYGEM_LLM_BASE_URL", "https://api.openai.com/v1")
MODEL = os.environ.get("COMPLYGEM_LLM_MODEL", "gpt-4o-mini")


def chat_json(system: str, user: str, max_tokens: int = 2000) -> list | dict | None:
    """Ask the LLM for a JSON object/array. Returns None on any failure so
    callers can transparently fall back to the rule-based engine."""
    if not CONFIGURED:
        return None
    payload = {
        "model": MODEL,
        "temperature": 0,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    req = urllib.request.Request(
        f"{BASE_URL.rstrip('/')}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {os.environ['COMPLYGEM_LLM_API_KEY']}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode())
        content = body["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception:
        return None
