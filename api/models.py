"""Request and response models for the local analysis API prototype."""

from pydantic import BaseModel, Field, field_validator


class SkillItem(BaseModel):
    skill: str
    category: str


class AnalyzeMetadata(BaseModel):
    jobTitle: str | None = None
    company: str | None = None
    sourceUrl: str | None = None
    notes: str | None = None


class AnalyzeRequest(BaseModel):
    resumeText: str
    jobText: str
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
