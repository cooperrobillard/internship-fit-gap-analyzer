"""Request and response models for the local analysis API prototype."""

from pydantic import BaseModel, Field, field_validator

MAX_ANALYSIS_TEXT_LENGTH = 100_000


class SkillItem(BaseModel):
    skill: str
    category: str


class AnalyzeMetadata(BaseModel):
    jobTitle: str | None = None
    company: str | None = None
    sourceUrl: str | None = None
    notes: str | None = None


class AnalyzeRequest(BaseModel):
    resumeText: str = Field(strict=True, max_length=MAX_ANALYSIS_TEXT_LENGTH)
    jobText: str = Field(strict=True, max_length=MAX_ANALYSIS_TEXT_LENGTH)
    jobTitle: str | None = None
    company: str | None = None
    sourceUrl: str | None = None
    notes: str | None = None

    @field_validator("resumeText", "jobText")
    @classmethod
    def require_nonempty_text(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("must not be blank")
        return trimmed

    @field_validator("jobTitle", "company", "sourceUrl", "notes")
    @classmethod
    def trim_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class AnalyzeResponse(BaseModel):
    matchedSkills: list[SkillItem]
    missingSkills: list[SkillItem]
    matchedSkillsCount: int
    missingSkillsCount: int
    summary: str
    metadata: AnalyzeMetadata = Field(default_factory=AnalyzeMetadata)


class ExtractDocumentResponse(BaseModel):
    text: str
    suggestedName: str
    skills: list[str]
    sourceKind: str


class AiTokenUsage(BaseModel):
    promptTokens: int | None = None
    completionTokens: int | None = None
    totalTokens: int | None = None


class AiSkillItem(BaseModel):
    skill: str
    category: str
    evidence: str | None = None


class AiAnalyzeRequest(BaseModel):
    resumeText: str = Field(strict=True, max_length=MAX_ANALYSIS_TEXT_LENGTH)
    jobText: str = Field(strict=True, max_length=MAX_ANALYSIS_TEXT_LENGTH)
    jobTitle: str | None = None
    company: str | None = None
    sourceUrl: str | None = None
    notes: str | None = None

    @field_validator("resumeText", "jobText")
    @classmethod
    def require_nonempty_ai_text(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("must not be blank")
        return trimmed

    @field_validator("jobTitle", "company", "sourceUrl", "notes")
    @classmethod
    def trim_optional_ai_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class AiAnalyzeResponse(BaseModel):
    analysisMode: str = "ai_smart"
    matchedSkills: list[AiSkillItem]
    missingSkills: list[AiSkillItem]
    transferableSkills: list[AiSkillItem]
    resumeSkills: list[AiSkillItem]
    jobSkills: list[AiSkillItem]
    ignoredBoilerplate: list[str]
    summary: str
    limitations: list[str]
    matchedSkillsCount: int
    missingSkillsCount: int
    metadata: AnalyzeMetadata = Field(default_factory=AnalyzeMetadata)
    usage: AiTokenUsage = Field(default_factory=AiTokenUsage)
    model: str


class AiExtractProfileRequest(BaseModel):
    resumeText: str = Field(strict=True, max_length=MAX_ANALYSIS_TEXT_LENGTH)
    filename: str | None = None
    sourceKind: str | None = None

    @field_validator("resumeText")
    @classmethod
    def require_nonempty_profile_text(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("must not be blank")
        return trimmed

    @field_validator("filename", "sourceKind")
    @classmethod
    def trim_optional_profile_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class AiExtractProfileResponse(BaseModel):
    candidateName: str
    skills: list[str]
    summary: str
    usage: AiTokenUsage = Field(default_factory=AiTokenUsage)
    model: str
