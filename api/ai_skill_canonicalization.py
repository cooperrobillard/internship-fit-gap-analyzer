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
    # AI-assisted development
    "ai assisted development": "AI-assisted development",
    "ai assisted development tool": "AI-assisted development",
    "ai assisted development tools": "AI-assisted development",
    "ai assisted coding": "AI-assisted development",
    "ai assisted software development": "AI-assisted development",
    "ai coding assistants": "AI-assisted development",
    "ai coding tools": "AI-assisted development",
    "ai developer tools": "AI-assisted development",
    "ai development tools": "AI-assisted development",
    "ai productivity tools for development": "AI-assisted development",
    "ai tools for developer productivity": "AI-assisted development",
    "ai tools for development productivity": "AI-assisted development",
    "coding with ai tools": "AI-assisted development",
    "generative ai development tools": "AI-assisted development",
    "llm assisted coding": "AI-assisted development",
    "llm assisted development": "AI-assisted development",
    "llm assisted prototyping": "AI-assisted development",
    "llm assisted software development": "AI-assisted development",
    # Large language models
    "large language model": "Large language models",
    "large language models": "Large language models",
    "llm": "Large language models",
    "llms": "Large language models",
    # OpenAI API
    "openai api": "OpenAI API",
    "openai apis": "OpenAI API",
    "openai integration": "OpenAI API",
    "openai platform api": "OpenAI API",
    # REST APIs
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restapi": "REST APIs",
    "restapis": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
    # Machine learning
    "machine learning": "Machine learning",
    "machine-learning": "Machine learning",
    "ml": "Machine learning",
    # Computer vision
    "computer vision": "Computer vision",
    "visual perception": "Computer vision",
    # C#
    "c sharp": "C#",
    "c sharp programming": "C#",
    "c#": "C#",
    "c# programming": "C#",
    "c-sharp": "C#",
    "csharp": "C#",
    # C++
    "c plus plus": "C++",
    "c++": "C++",
    "c++ programming": "C++",
    # JavaScript / TypeScript / web
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "next js": "Next.js",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "react js": "React",
    "react.js": "React",
    "reactjs": "React",
    "node js": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    # PowerShell
    "powershell": "PowerShell",
    "powershell scripting": "PowerShell",
    "windows powershell": "PowerShell",
    # SQL
    "sql": "SQL",
    "structured query language": "SQL",
    # CI/CD
    "ci/cd": "CI/CD",
    "continuous deployment": "CI/CD",
    "continuous integration": "CI/CD",
    "continuous integration and deployment": "CI/CD",
    "continuous integration / continuous deployment": "CI/CD",
    # Data structures and algorithms
    "algorithms and data structures": "Data structures and algorithms",
    "data structures & algorithms": "Data structures and algorithms",
    "data structures and algorithms": "Data structures and algorithms",
    # Embedded systems
    "embedded software systems": "Embedded systems",
    "embedded system": "Embedded systems",
    "embedded systems": "Embedded systems",
    # Firmware testing
    "firmware test": "Firmware testing",
    "firmware testing": "Firmware testing",
    "firmware validation": "Firmware testing",
    # Engineering / creative tools
    "3-d printing": "3D printing",
    "3d printing": "3D printing",
    "adobe after effects": "Adobe After Effects",
    "adobe photoshop": "Adobe Photoshop",
    "after effects": "Adobe After Effects",
    "cad": "CAD",
    "cfd": "CFD",
    "computer aided design": "CAD",
    "computer-aided design": "CAD",
    "computational fluid dynamics": "CFD",
    "photoshop": "Adobe Photoshop",
    "sysinternals": "Sysinternals",
    "sysinternals suite": "Sysinternals",
    "three dimensional printing": "3D printing",
}

_CANONICAL_SKILL_CATEGORIES: dict[str, str] = {
    "AI-assisted development": "AI tools",
    "Large language models": "AI/ML",
    "OpenAI API": "AI/ML",
    "Machine learning": "AI/ML",
    "Computer vision": "AI/ML",
    "REST APIs": "Backend",
    "CI/CD": "Backend",
    "C#": "Programming",
    "C++": "Programming",
    "PowerShell": "Programming",
    "SQL": "Data",
    "Data structures and algorithms": "Programming",
    "Embedded systems": "Engineering",
    "Firmware testing": "Engineering",
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


def canonicalize_ai_skill_category(skill: str, category: str) -> str:
    """Prefer a stable category for canonical skill concepts."""
    preferred = _CANONICAL_SKILL_CATEGORIES.get(skill)
    if preferred:
        return preferred

    trimmed = category.strip()
    return trimmed or "General"


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
