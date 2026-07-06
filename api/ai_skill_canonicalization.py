"""
Deterministic canonicalization for Smart AI skill labels.

Groups spelling variants and common abbreviations so recurring-gap stats,
saved analyses, comparisons, and exports stay consistent.
"""

from __future__ import annotations

import re

_SKILL_PREFIX_RE = re.compile(
    r"^(?:experience with|knowledge of|familiarity with|proficiency in|"
    r"working with|expertise in|skills? in)\s+",
    re.IGNORECASE,
)

_TRAILING_PUNCTUATION_RE = re.compile(r"[.,;:!?]+$")

_CANONICAL_ALIASES: dict[str, str] = {
    "c sharp": "C#",
    "c-sharp": "C#",
    "c#": "C#",
    "csharp": "C#",
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "nextjs": "Next.js",
    "next js": "Next.js",
    "next.js": "Next.js",
    "reactjs": "React",
    "react js": "React",
    "react.js": "React",
    "nodejs": "Node.js",
    "node js": "Node.js",
    "node.js": "Node.js",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restapi": "REST APIs",
    "restapis": "REST APIs",
    "openai api": "OpenAI API",
    "large language model": "Large language models",
    "large language models": "Large language models",
    "llm": "Large language models",
    "llms": "Large language models",
    "ml": "Machine learning",
    "machine learning": "Machine learning",
    "machine-learning": "Machine learning",
    "structured query language": "SQL",
    "sql": "SQL",
    "windows powershell": "PowerShell",
    "powershell": "PowerShell",
    "powershell scripting": "PowerShell",
    "sysinternals suite": "Sysinternals",
    "sysinternals": "Sysinternals",
    "computational fluid dynamics": "CFD",
    "cfd": "CFD",
    "computer aided design": "CAD",
    "computer-aided design": "CAD",
    "cad": "CAD",
    "3-d printing": "3D printing",
    "3d printing": "3D printing",
    "three dimensional printing": "3D printing",
    "adobe photoshop": "Adobe Photoshop",
    "photoshop": "Adobe Photoshop",
    "adobe after effects": "Adobe After Effects",
    "after effects": "Adobe After Effects",
}


def _collapse_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _lookup_keys(value: str) -> list[str]:
    keys: list[str] = []
    seen: set[str] = set()

    def add(key: str) -> None:
        if key and key not in seen:
            seen.add(key)
            keys.append(key)

    add(value)
    add(value.replace("-", " "))
    add(value.replace(" ", "-"))
    compact = re.sub(r"[\s.\-/]+", "", value)
    add(compact)
    return keys


def _prepare_lookup_value(raw: str) -> str:
    value = _collapse_whitespace(raw)
    value = _SKILL_PREFIX_RE.sub("", value).strip()
    value = _collapse_whitespace(value)
    value = _TRAILING_PUNCTUATION_RE.sub("", value).strip()
    return value.lower()


def canonicalize_ai_skill_name(raw: str) -> str:
    """Return a stable display label for a Smart AI skill name."""
    prepared = _prepare_lookup_value(raw)
    if not prepared:
        return ""

    for key in _lookup_keys(prepared):
        canonical = _CANONICAL_ALIASES.get(key)
        if canonical:
            return canonical

    return _collapse_whitespace(_TRAILING_PUNCTUATION_RE.sub("", raw.strip()))


def canonicalize_skill_name_list(raw_names: list[str]) -> list[str]:
    """Canonicalize and deduplicate profile skill names."""
    values: list[str] = []
    seen: set[str] = set()
    for raw in raw_names:
        canonical = canonicalize_ai_skill_name(raw)
        key = canonical.lower()
        if not canonical or key in seen:
            continue
        seen.add(key)
        values.append(canonical)
    return values
