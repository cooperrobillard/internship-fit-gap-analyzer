import assert from "node:assert/strict";
import test from "node:test";

import {
  mapWebAnalysisToCloudSaveInput,
  withCurrentMetadataForSave,
} from "@/lib/analysis/to-cloud-save-input";
import type { WebAnalysisInput, WebAnalysisResult } from "@/lib/analysis/types";

const BASE_INPUT: WebAnalysisInput = {
  resumeText: "structured resume text",
  jobText: "job posting text",
};

const BASE_RESULT: WebAnalysisResult = {
  matchedSkills: [{ skill: "Python", category: "Programming" }],
  missingSkills: [{ skill: "AWS", category: "Cloud" }],
  matchedSkillsCount: 1,
  missingSkillsCount: 1,
  summary: "Summary",
};

test("save payload uses metadata autofilled after analysis", () => {
  const analyzedInput: WebAnalysisInput = { ...BASE_INPUT };
  const saveInput = withCurrentMetadataForSave(analyzedInput, {
    jobTitle: "Security Engineering Intern",
    company: "MathWorks",
    sourceUrl: "",
    notes: "",
  });
  const mapped = mapWebAnalysisToCloudSaveInput(saveInput, BASE_RESULT);

  assert.equal(mapped.metadata.jobTitle, "Security Engineering Intern");
  assert.equal(mapped.metadata.company, "MathWorks");
  assert.equal(mapped.metadata.runLabel, "Security Engineering Intern @ MathWorks");
});

test("manual user-entered metadata is preserved over empty metadata", () => {
  const analyzedInput: WebAnalysisInput = {
    ...BASE_INPUT,
    jobTitle: "My title",
    company: "My company",
  };
  const saveInput = withCurrentMetadataForSave(analyzedInput, {
    jobTitle: "My title",
    company: "My company",
    sourceUrl: "",
    notes: "",
  });
  const mapped = mapWebAnalysisToCloudSaveInput(saveInput, BASE_RESULT);

  assert.equal(mapped.metadata.jobTitle, "My title");
  assert.equal(mapped.metadata.company, "My company");
});

test("edits made after analysis are used at save time", () => {
  const analyzedInput: WebAnalysisInput = {
    ...BASE_INPUT,
    jobTitle: "Original title",
  };
  const saveInput = withCurrentMetadataForSave(analyzedInput, {
    jobTitle: "Edited title",
    company: "Edited company",
    sourceUrl: "https://example.com/job",
    notes: "Hybrid role",
  });
  const mapped = mapWebAnalysisToCloudSaveInput(saveInput, BASE_RESULT);

  assert.equal(mapped.metadata.jobTitle, "Edited title");
  assert.equal(mapped.metadata.company, "Edited company");
  assert.equal(mapped.metadata.sourceUrl, "https://example.com/job");
  assert.equal(mapped.metadata.notes, "Hybrid role");
});
