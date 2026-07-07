import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_EXTRACTED_JOB_NOTES_LENGTH,
  applyExtractedJobMetadataAutofill,
  normalizeExtractedJobMetadata,
} from "@/lib/analysis/job-metadata-autofill";

const EMPTY_FIELDS = {
  jobTitle: "",
  company: "",
  sourceUrl: "",
  notes: "",
};

test("Smart AI metadata fills empty job fields", () => {
  const { next, filledAny } = applyExtractedJobMetadataAutofill(EMPTY_FIELDS, {
    jobTitle: "Security Engineering Intern",
    company: "MathWorks",
    sourceUrl: "https://careers.example.com/job/123",
    notes: "Hybrid; sponsorship not provided.",
  });

  assert.equal(filledAny, true);
  assert.equal(next.jobTitle, "Security Engineering Intern");
  assert.equal(next.company, "MathWorks");
  assert.equal(next.sourceUrl, "https://careers.example.com/job/123");
  assert.equal(next.notes, "Hybrid; sponsorship not provided.");
});

test("existing user-entered job fields are not overwritten", () => {
  const { next, filledAny } = applyExtractedJobMetadataAutofill(
    {
      jobTitle: "My custom title",
      company: "",
      sourceUrl: "https://example.com/my-link",
      notes: "Keep this",
    },
    {
      jobTitle: "AI title",
      company: "AI company",
      sourceUrl: "https://ai.example.com",
      notes: "AI notes",
    },
  );

  assert.equal(filledAny, true);
  assert.equal(next.jobTitle, "My custom title");
  assert.equal(next.company, "AI company");
  assert.equal(next.sourceUrl, "https://example.com/my-link");
  assert.equal(next.notes, "Keep this");
});

test("long extracted notes are bounded", () => {
  const longNotes = "a".repeat(MAX_EXTRACTED_JOB_NOTES_LENGTH + 40);
  const normalized = normalizeExtractedJobMetadata({ notes: longNotes });
  assert.ok(normalized?.notes);
  assert.ok(normalized.notes.length <= MAX_EXTRACTED_JOB_NOTES_LENGTH);
  assert.ok(normalized.notes.endsWith("…"));
});

test("missing metadata leaves fields unchanged", () => {
  const current = {
    jobTitle: "Existing",
    company: "",
    sourceUrl: "",
    notes: "",
  };
  const { next, filledAny } = applyExtractedJobMetadataAutofill(current, undefined);
  assert.equal(filledAny, false);
  assert.deepEqual(next, current);
});
