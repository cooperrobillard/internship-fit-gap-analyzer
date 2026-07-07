import assert from "node:assert/strict";
import test from "node:test";

import { deriveProfileNameFromFilename, resolveDefaultProfileName } from "@/lib/profile-name";

test("file upload defaults profile name from filename instead of candidate name", () => {
  assert.equal(
    deriveProfileNameFromFilename("software_resume_final.pdf"),
    "Software Resume Final",
  );
});

test("filename with underscores and hyphens becomes readable title", () => {
  assert.equal(
    deriveProfileNameFromFilename("Cooper_Robillard_Resume_2026-06-02_v1.pdf"),
    "Cooper Robillard Resume 2026 06 02 v1",
  );
  assert.equal(
    deriveProfileNameFromFilename("SWE_resume_final.docx"),
    "SWE Resume Final",
  );
  assert.equal(
    deriveProfileNameFromFilename("mechanical-internship-profile.md"),
    "Mechanical Internship Profile",
  );
});

test("empty filename falls back to Resume profile", () => {
  assert.equal(deriveProfileNameFromFilename(""), "Resume profile");
});

test("pasted text extraction with candidateName Jane Doe defaults profile name to Jane Doe", () => {
  assert.equal(
    resolveDefaultProfileName({
      candidateName: "Jane Doe",
      ruleBasedSuggestedName: "Resume profile",
    }),
    "Jane Doe",
  );
});

test("file upload prefers filename even when candidateName is present", () => {
  assert.equal(
    resolveDefaultProfileName({
      filename: "software_resume_final.pdf",
      candidateName: "Jane Doe",
    }),
    "Software Resume Final",
  );
});
