"""
OpenAI-backed smart analysis and profile extraction for the FastAPI service.

Uses the Responses API with strict JSON schema structured outputs.
Does not persist raw resume or job text.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from typing import Any, Protocol

from openai import (
    APIConnectionError as OpenAIAPIConnectionError,
    APIError as OpenAIAPIError,
    APIStatusError as OpenAIAPIStatusError,
    APITimeoutError as OpenAIAPITimeoutError,
    AuthenticationError as OpenAIAuthenticationError,
    BadRequestError as OpenAIBadRequestError,
    InternalServerError as OpenAIInternalServerError,
    NotFoundError as OpenAINotFoundError,
    PermissionDeniedError as OpenAIPermissionDeniedError,
    RateLimitError as OpenAIRateLimitError,
    UnprocessableEntityError as OpenAIUnprocessableEntityError,
)
from pydantic import ValidationError

from api.ai_skill_canonicalization import (
    canonicalize_ai_skill_category,
    canonicalize_ai_skill_name,
    canonicalize_skill_name_list,
)
from api.models import (
    AiAnalyzeResponse,
    AiExtractProfileResponse,
    AiSkillItem,
    AiTokenUsage,
    AnalyzeMetadata,
    ExtractedJobMetadata,
)

logger = logging.getLogger(__name__)

DEFAULT_ANALYSIS_MODEL = "gpt-5.4-mini"
DEFAULT_REQUEST_TIMEOUT_SECONDS = 30.0
MAX_EXTRACTED_JOB_NOTES_LENGTH = 280
OPENAI_MAX_RETRIES = 0

_BILLING_OR_QUOTA_ERROR_CODES = frozenset(
    {
        "billing_hard_limit_reached",
        "billing_not_active",
        "credit_balance_exhausted",
        "insufficient_quota",
        "organization_spend_limit_exceeded",
        "organization_usage_limit_exceeded",
        "project_spend_limit_exceeded",
    }
)

SYSTEM_INSTRUCTIONS = """You are a professional résumé and job-description skill analyst.

Rules:
- Identify explicit, supported, and strongly implied professional skills only.
- Do not invent skills that lack support in the provided text.
- Separate technical tools, programming languages, frameworks, engineering methods, domain knowledge, soft skills, and creative tools where useful for the category field.
- Ignore boilerplate unrelated to role requirements (onboarding, hybrid work, visa sponsorship, generic equal-opportunity language, generic culture copy, application links, interviewing logistics) unless genuinely relevant to the role.
- Preserve useful canonical names such as PowerShell, Python, Sysinternals, Next.js, REST APIs, OpenAI API, CALDERA, ANSYS Fluent, CFD, PyTorch, ResNet-18.
- Prefer stable, reusable canonical skill labels over one-off wording. Use common industry names, group synonyms and spelling variants, and keep skill names concise for recurring-gap analysis.
- Put supporting detail in evidence or category fields, not in the skill name. Do not turn every responsibility into a unique skill label.
- Do not include personal contact details (email, phone, address, URLs to personal pages).
- Evidence snippets must be short and must not reproduce long résumé or job passages.
- Output only schema-compliant structured data."""


class AiServiceError(Exception):
    """Base class for safe, user-facing AI service failures."""

    error_class: str = "ai.unknown"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class AiDisabledError(AiServiceError):
    error_class = "ai.disabled"


class MissingApiKeyError(AiServiceError):
    error_class = "provider_auth_or_configuration"


class OpenAiBillingOrQuotaError(AiServiceError):
    error_class = "provider_billing_or_quota"


class OpenAiRateLimitError(AiServiceError):
    error_class = "provider_rate_limited"


class OpenAiTimeoutError(AiServiceError):
    error_class = "provider_timeout"


class OpenAiConnectionError(AiServiceError):
    error_class = "provider_connection"


class OpenAiAuthOrConfigurationError(AiServiceError):
    error_class = "provider_auth_or_configuration"


class OpenAiUnavailableError(AiServiceError):
    error_class = "provider_unavailable"


class OpenAiUnknownError(AiServiceError):
    error_class = "provider_unknown"


class MalformedResponseError(AiServiceError):
    error_class = "provider_invalid_response"


class ResponseValidationError(AiServiceError):
    error_class = "provider_invalid_response"


class OpenAiResponsesClient(Protocol):
    def create(self, **kwargs: Any) -> Any: ...


def _resolve_responses_client(client: Any) -> OpenAiResponsesClient:
    """Use SDK responses resource when present; tests may pass a direct mock."""
    responses = getattr(client, "responses", None)
    if responses is not None and callable(getattr(responses, "create", None)):
        return responses
    return client


def _log_openai_call_failure(error_class: str) -> None:
    """Log an allowlisted provider category without provider or input details."""
    logger.warning(
        "OpenAI structured call failed (category=%s)",
        error_class,
    )


def _structured_provider_error_values(exc: BaseException) -> set[str]:
    """Collect normalized SDK error codes/types without inspecting free-form messages."""
    values: set[str] = set()
    for value in (getattr(exc, "code", None), getattr(exc, "type", None)):
        if isinstance(value, str) and value.strip():
            values.add(value.strip().lower())

    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        candidates = [body]
        nested_error = body.get("error")
        if isinstance(nested_error, dict):
            candidates.append(nested_error)
        for candidate in candidates:
            for key in ("code", "type"):
                value = candidate.get(key)
                if isinstance(value, str) and value.strip():
                    values.add(value.strip().lower())
    return values


def _is_billing_or_quota_error(exc: BaseException) -> bool:
    return bool(_structured_provider_error_values(exc) & _BILLING_OR_QUOTA_ERROR_CODES)


def _classify_openai_exception(exc: BaseException) -> AiServiceError:
    """Map installed OpenAI SDK exceptions to stable, privacy-safe categories."""
    if isinstance(exc, (OpenAIAPITimeoutError, TimeoutError)):
        return OpenAiTimeoutError("OpenAI request timed out.")

    if isinstance(exc, OpenAIRateLimitError):
        if _is_billing_or_quota_error(exc):
            return OpenAiBillingOrQuotaError("OpenAI billing or quota is unavailable.")
        return OpenAiRateLimitError("OpenAI rate limit reached.")

    if isinstance(exc, (OpenAIAuthenticationError, OpenAIPermissionDeniedError)):
        return OpenAiAuthOrConfigurationError("OpenAI authentication or configuration failed.")

    if isinstance(exc, OpenAIAPIConnectionError):
        return OpenAiConnectionError("OpenAI could not be reached.")

    if isinstance(exc, OpenAIInternalServerError):
        return OpenAiUnavailableError("OpenAI is temporarily unavailable.")

    if isinstance(
        exc,
        (OpenAIBadRequestError, OpenAINotFoundError, OpenAIUnprocessableEntityError),
    ):
        return OpenAiAuthOrConfigurationError("OpenAI request configuration was rejected.")

    if isinstance(exc, OpenAIAPIStatusError):
        if exc.status_code == 429:
            if _is_billing_or_quota_error(exc):
                return OpenAiBillingOrQuotaError("OpenAI billing or quota is unavailable.")
            return OpenAiRateLimitError("OpenAI rate limit reached.")
        if exc.status_code in {400, 401, 403, 404, 422}:
            return OpenAiAuthOrConfigurationError("OpenAI request configuration was rejected.")
        if exc.status_code >= 500:
            return OpenAiUnavailableError("OpenAI is temporarily unavailable.")

    if isinstance(exc, OpenAIAPIError):
        return OpenAiUnknownError("OpenAI request failed.")

    return OpenAiUnknownError("Smart AI analysis is temporarily unavailable.")


@dataclass(frozen=True)
class AiRuntimeConfig:
    enabled: bool
    api_key: str | None
    model: str
    timeout_seconds: float


def is_ai_features_enabled() -> bool:
    return os.environ.get("AI_FEATURES_ENABLED", "").strip() == "true"


def get_ai_runtime_config() -> AiRuntimeConfig:
    raw_timeout = os.environ.get("OPENAI_REQUEST_TIMEOUT_SECONDS", "").strip()
    timeout_seconds = DEFAULT_REQUEST_TIMEOUT_SECONDS
    if raw_timeout:
        try:
            timeout_seconds = max(1.0, float(raw_timeout))
        except ValueError:
            timeout_seconds = DEFAULT_REQUEST_TIMEOUT_SECONDS

    raw_key = os.environ.get("OPENAI_API_KEY", "").strip()
    raw_model = os.environ.get("OPENAI_ANALYSIS_MODEL", "").strip()

    return AiRuntimeConfig(
        enabled=is_ai_features_enabled(),
        api_key=raw_key or None,
        model=raw_model or DEFAULT_ANALYSIS_MODEL,
        timeout_seconds=timeout_seconds,
    )


def _require_runtime(config: AiRuntimeConfig | None = None) -> AiRuntimeConfig:
    runtime = config or get_ai_runtime_config()
    if not runtime.enabled:
        raise AiDisabledError("Smart AI features are disabled.")
    if not runtime.api_key:
        raise MissingApiKeyError("OpenAI is not configured.")
    return runtime


def _create_openai_client(runtime: AiRuntimeConfig) -> Any:
    """Create one-attempt OpenAI client; all provider failures return to fallback."""
    from openai import OpenAI

    return OpenAI(
        api_key=runtime.api_key,
        timeout=runtime.timeout_seconds,
        max_retries=OPENAI_MAX_RETRIES,
    )


def _skill_item_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "skill": {"type": "string"},
            "category": {"type": "string"},
            "evidence": {"type": "string"},
        },
        "required": ["skill", "category", "evidence"],
        "additionalProperties": False,
    }


def _job_metadata_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "jobTitle": {"type": "string"},
            "company": {"type": "string"},
            "sourceUrl": {"type": "string"},
            "notes": {"type": "string"},
        },
        "required": ["jobTitle", "company", "sourceUrl", "notes"],
        "additionalProperties": False,
    }


def _analyze_output_schema() -> dict[str, Any]:
    skill_schema = _skill_item_schema()
    return {
        "type": "object",
        "properties": {
            "matchedSkills": {"type": "array", "items": skill_schema},
            "missingSkills": {"type": "array", "items": skill_schema},
            "transferableSkills": {"type": "array", "items": skill_schema},
            "resumeSkills": {"type": "array", "items": skill_schema},
            "jobSkills": {"type": "array", "items": skill_schema},
            "ignoredBoilerplate": {"type": "array", "items": {"type": "string"}},
            "summary": {"type": "string"},
            "limitations": {"type": "array", "items": {"type": "string"}},
            "jobMetadata": _job_metadata_schema(),
        },
        "required": [
            "matchedSkills",
            "missingSkills",
            "transferableSkills",
            "resumeSkills",
            "jobSkills",
            "ignoredBoilerplate",
            "summary",
            "limitations",
            "jobMetadata",
        ],
        "additionalProperties": False,
    }


def _profile_output_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "candidateName": {"type": "string"},
            "skills": {"type": "array", "items": {"type": "string"}},
            "summary": {"type": "string"},
        },
        "required": ["candidateName", "skills", "summary"],
        "additionalProperties": False,
    }


def _responses_text_format(name: str, schema: dict[str, Any]) -> dict[str, Any]:
    return {
        "format": {
            "type": "json_schema",
            "name": name,
            "strict": True,
            "schema": schema,
        }
    }


def _normalize_skill_items(raw_items: list[dict[str, Any]]) -> list[AiSkillItem]:
    items: list[AiSkillItem] = []
    seen: set[str] = set()
    for raw in raw_items:
        skill = canonicalize_ai_skill_name(str(raw.get("skill", "")))
        category = canonicalize_ai_skill_category(
            skill,
            str(raw.get("category", "")).strip() or "General",
        )
        evidence = str(raw.get("evidence", "")).strip() or None
        if not skill:
            continue
        dedupe_key = skill.lower()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        items.append(AiSkillItem(skill=skill, category=category, evidence=evidence))
    return items


def _normalize_optional_metadata_field(value: Any) -> str | None:
    if value is None:
        return None
    trimmed = str(value).strip()
    return trimmed or None


def _normalize_extracted_job_metadata(raw: Any) -> ExtractedJobMetadata | None:
    if not isinstance(raw, dict):
        return None

    job_title = _normalize_optional_metadata_field(raw.get("jobTitle"))
    company = _normalize_optional_metadata_field(raw.get("company"))
    source_url = _normalize_optional_metadata_field(raw.get("sourceUrl"))
    notes = _normalize_optional_metadata_field(raw.get("notes"))

    if notes and len(notes) > MAX_EXTRACTED_JOB_NOTES_LENGTH:
        notes = notes[: MAX_EXTRACTED_JOB_NOTES_LENGTH - 1].rstrip() + "…"

    if not any([job_title, company, source_url, notes]):
        return None

    return ExtractedJobMetadata(
        jobTitle=job_title,
        company=company,
        sourceUrl=source_url,
        notes=notes,
    )


def _normalize_string_list(raw_items: list[Any]) -> list[str]:
    values: list[str] = []
    seen: set[str] = set()
    for raw in raw_items:
        value = str(raw).strip()
        key = value.lower()
        if not value or key in seen:
            continue
        seen.add(key)
        values.append(value)
    return values


def _map_usage(response: Any) -> AiTokenUsage:
    usage = getattr(response, "usage", None)
    if usage is None:
        return AiTokenUsage()

    prompt_tokens = getattr(usage, "input_tokens", None)
    if prompt_tokens is None:
        prompt_tokens = getattr(usage, "prompt_tokens", None)

    completion_tokens = getattr(usage, "output_tokens", None)
    if completion_tokens is None:
        completion_tokens = getattr(usage, "completion_tokens", None)

    total_tokens = getattr(usage, "total_tokens", None)
    if total_tokens is None and prompt_tokens is not None and completion_tokens is not None:
        total_tokens = int(prompt_tokens) + int(completion_tokens)

    return AiTokenUsage(
        promptTokens=int(prompt_tokens) if prompt_tokens is not None else None,
        completionTokens=int(completion_tokens) if completion_tokens is not None else None,
        totalTokens=int(total_tokens) if total_tokens is not None else None,
    )


def _extract_output_json(response: Any) -> dict[str, Any]:
    output_text = getattr(response, "output_text", None)
    if isinstance(output_text, str) and output_text.strip():
        try:
            parsed = json.loads(output_text)
        except json.JSONDecodeError as exc:
            raise MalformedResponseError("AI response was not valid JSON.") from exc
        if isinstance(parsed, dict):
            return parsed
        raise MalformedResponseError("AI response JSON was not an object.")

    output = getattr(response, "output", None)
    if isinstance(output, list):
        for item in output:
            content = getattr(item, "content", None)
            if not isinstance(content, list):
                continue
            for part in content:
                part_type = getattr(part, "type", None)
                text = getattr(part, "text", None)
                if part_type in {"output_text", "text"} and isinstance(text, str) and text.strip():
                    try:
                        parsed = json.loads(text)
                    except json.JSONDecodeError as exc:
                        raise MalformedResponseError("AI response was not valid JSON.") from exc
                    if isinstance(parsed, dict):
                        return parsed

    raise MalformedResponseError("AI response did not include structured output.")


def _call_openai_structured(
    *,
    client: OpenAiResponsesClient,
    model: str,
    timeout_seconds: float,
    schema_name: str,
    schema: dict[str, Any],
    user_prompt: str,
) -> tuple[dict[str, Any], AiTokenUsage, str]:
    responses_client = _resolve_responses_client(client)
    try:
        response = responses_client.create(
            model=model,
            instructions=SYSTEM_INSTRUCTIONS,
            input=user_prompt,
            store=False,
            text=_responses_text_format(schema_name, schema),
            timeout=timeout_seconds,
        )
    except Exception as exc:
        classified = _classify_openai_exception(exc)
        _log_openai_call_failure(classified.error_class)
        raise classified from exc

    try:
        payload = _extract_output_json(response)
    except MalformedResponseError as exc:
        _log_openai_call_failure(exc.error_class)
        raise
    usage = _map_usage(response)
    resolved_model = getattr(response, "model", None) or model
    return payload, usage, str(resolved_model)


def _build_analyze_prompt(
    resume_text: str,
    job_text: str,
    job_title: str | None,
    company: str | None,
    source_url: str | None,
    notes: str | None,
) -> str:
    metadata_lines: list[str] = []
    if job_title:
        metadata_lines.append(f"Job title: {job_title}")
    if company:
        metadata_lines.append(f"Company: {company}")
    if source_url:
        metadata_lines.append(f"Source URL: {source_url}")
    if notes:
        metadata_lines.append(f"Analyst notes: {notes}")

    metadata_block = "\n".join(metadata_lines)
    metadata_section = f"\n\nOptional job metadata:\n{metadata_block}" if metadata_block else ""

    return (
        "Compare the résumé against the job description and produce structured skill-fit analysis.\n\n"
        "Skill bucketing — the product shows only matchedSkills and missingSkills:\n"
        "- matchedSkills: job requirements directly supported by the résumé, plus strong "
        "transferable matches that reasonably satisfy a role requirement. For transferable "
        "matches, note the transfer briefly in category or evidence (for example, "
        "'Transferable match').\n"
        "- missingSkills: role requirements without direct or strong transferable support.\n"
        "- transferableSkills: optional debug/details only. Leave empty unless a weak adjacent "
        "signal is worth retaining internally. Do not treat this as a third user-facing bucket.\n"
        "- Do not list every résumé skill. Include only skills relevant to this role comparison.\n"
        "- Keep summary and limitations concise; they are stored for reference, not shown as a report.\n"
        "- Use stable canonical skill labels suitable for recurring-gap tracking across jobs.\n"
        "- Populate jobMetadata when the posting supports it:\n"
        "  - jobTitle and company only when clearly stated in the posting.\n"
        "  - sourceUrl only when an actual URL appears in the text.\n"
        "  - notes: concise application/work details only (hybrid, sponsorship, focus area, team, deadline, location, or major role focus). "
        "Use at most 1–2 short sentences or a few semicolon-separated phrases.\n"
        "  - Use empty strings for unknown jobMetadata fields.\n"
        "  - Do not include equal-opportunity boilerplate, generic culture copy, long paragraphs, or résumé content in notes.\n\n"
        f"Résumé text:\n{resume_text}\n\n"
        f"Job description text:\n{job_text}"
        f"{metadata_section}"
    )


def run_smart_analysis(
    *,
    resume_text: str,
    job_text: str,
    job_title: str | None = None,
    company: str | None = None,
    source_url: str | None = None,
    notes: str | None = None,
    client: OpenAiResponsesClient | None = None,
    config: AiRuntimeConfig | None = None,
) -> AiAnalyzeResponse:
    runtime = _require_runtime(config)
    if client is None:
        client = _create_openai_client(runtime)

    prompt = _build_analyze_prompt(
        resume_text=resume_text,
        job_text=job_text,
        job_title=job_title,
        company=company,
        source_url=source_url,
        notes=notes,
    )

    payload, usage, model = _call_openai_structured(
        client=client,
        model=runtime.model,
        timeout_seconds=runtime.timeout_seconds,
        schema_name="smart_job_fit_analysis",
        schema=_analyze_output_schema(),
        user_prompt=prompt,
    )

    try:
        matched_skills = _normalize_skill_items(payload.get("matchedSkills", []))
        missing_skills = _normalize_skill_items(payload.get("missingSkills", []))
        transferable_skills = _normalize_skill_items(payload.get("transferableSkills", []))
        resume_skills = _normalize_skill_items(payload.get("resumeSkills", []))
        job_skills = _normalize_skill_items(payload.get("jobSkills", []))
        ignored_boilerplate = _normalize_string_list(payload.get("ignoredBoilerplate", []))
        summary = str(payload.get("summary", "")).strip()
        limitations = _normalize_string_list(payload.get("limitations", []))
        job_metadata = _normalize_extracted_job_metadata(payload.get("jobMetadata"))

        if not summary:
            raise ResponseValidationError("AI response summary was empty.")

        response = AiAnalyzeResponse(
            analysisMode="ai_smart",
            matchedSkills=matched_skills,
            missingSkills=missing_skills,
            transferableSkills=transferable_skills,
            resumeSkills=resume_skills,
            jobSkills=job_skills,
            ignoredBoilerplate=ignored_boilerplate,
            summary=summary,
            limitations=limitations or [
                "Smart AI analysis may miss niche skills or over-weight common phrases. Review results before acting on them.",
            ],
            matchedSkillsCount=len(matched_skills),
            missingSkillsCount=len(missing_skills),
            metadata=AnalyzeMetadata(
                jobTitle=job_title,
                company=company,
                sourceUrl=source_url,
                notes=notes,
            ),
            jobMetadata=job_metadata,
            usage=usage,
            model=model,
        )
        return response
    except (AttributeError, TypeError, ValueError, ValidationError) as exc:
        raise ResponseValidationError("AI response failed validation.") from exc


def run_profile_extraction(
    *,
    resume_text: str,
    filename: str | None = None,
    source_kind: str | None = None,
    client: OpenAiResponsesClient | None = None,
    config: AiRuntimeConfig | None = None,
) -> AiExtractProfileResponse:
    runtime = _require_runtime(config)
    if client is None:
        client = _create_openai_client(runtime)

    context_lines: list[str] = []
    if filename:
        context_lines.append(f"Source filename kind: {filename}")
    if source_kind:
        context_lines.append(f"Source type: {source_kind}")
    context_block = "\n".join(context_lines)
    context_section = f"\n\n{context_block}" if context_block else ""

    prompt = (
        "Extract a suggested profile name and a rich list of professional skills from this résumé text. "
        "Do not include contact details. Prefer stable canonical skill labels over one-off wording; "
        "use common industry names and group synonyms or spelling variants.\n\n"
        f"Résumé text:\n{resume_text}{context_section}"
    )

    payload, usage, model = _call_openai_structured(
        client=client,
        model=runtime.model,
        timeout_seconds=runtime.timeout_seconds,
        schema_name="resume_profile_extraction",
        schema=_profile_output_schema(),
        user_prompt=prompt,
    )

    try:
        candidate_name = str(payload.get("candidateName", "")).strip()
        skills = canonicalize_skill_name_list(_normalize_string_list(payload.get("skills", [])))
        summary = str(payload.get("summary", "")).strip()
        if not candidate_name or not skills or not summary:
            raise ResponseValidationError("AI profile response was incomplete.")

        return AiExtractProfileResponse(
            candidateName=candidate_name,
            skills=skills,
            summary=summary,
            usage=usage,
            model=model,
        )
    except ResponseValidationError:
        raise
    except (AttributeError, TypeError, ValueError, ValidationError) as exc:
        raise ResponseValidationError("AI profile response failed validation.") from exc
