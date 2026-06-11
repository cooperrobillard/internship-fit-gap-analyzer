"use client";

import { useState } from "react";
import { runDemoRuleAnalysis } from "@/lib/analysis/demo-rule-analyzer";
import type { WebAnalysisInput, WebAnalysisResult } from "@/lib/analysis/types";

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";

function SkillList({
  title,
  skills,
  emptyMessage,
}: {
  title: string;
  skills: { skill: string; category: string }[];
  emptyMessage: string;
}) {
  if (skills.length === 0) {
    return (
      <div>
        <h4 className="font-medium text-zinc-900">{title}</h4>
        <p className="mt-2 text-zinc-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-medium text-zinc-900">{title}</h4>
      <ul className="mt-2 space-y-1">
        {skills.map((item) => (
          <li
            key={`${item.skill}-${item.category}`}
            className="rounded-md bg-zinc-50 px-3 py-2 text-zinc-800"
          >
            <span className="font-medium">{item.skill}</span>
            <span className="text-zinc-500"> · {item.category}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalysisForm() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<WebAnalysisInput | null>(null);
  const [result, setResult] = useState<WebAnalysisResult | null>(null);

  function handleAnalyze() {
    const trimmedResume = resumeText.trim();
    const trimmedJob = jobText.trim();

    if (!trimmedResume || !trimmedJob) {
      setValidationError("Resume text and job description text are required.");
      setResult(null);
      return;
    }

    setValidationError(null);

    const analysisInput: WebAnalysisInput = {
      resumeText: trimmedResume,
      jobText: trimmedJob,
      jobTitle: jobTitle.trim() || undefined,
      company: company.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const analysisResult = runDemoRuleAnalysis(analysisInput);

    // `lastInput` + `result` are ready for mapWebAnalysisToCloudSaveInput when save is wired.
    setLastInput(analysisInput);
    setResult(analysisResult);
  }

  return (
    <div className={`${boxClass} border-violet-200 bg-violet-50 text-violet-950`}>
      <p className="font-medium text-violet-950">Web analysis prototype</p>
      <p className="mt-2 text-violet-900/90">
        Analyze pasted resume and job description text with a{" "}
        <strong>temporary rule-based adapter</strong> in the browser. This is an
        early web prototype—the full Python analyzer and analysis service are not
        connected yet. Pasted text is analyzed in this session only and is{" "}
        <strong>not saved</strong> by this form. Cloud saving of real analyses is
        not connected yet.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-violet-950">Job title (optional)</span>
          <input
            type="text"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="e.g. Software Engineering Intern"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-violet-950">Company (optional)</span>
          <input
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="e.g. Demo Company"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-violet-950">Source URL (optional)</span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="https://example.com/posting"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-violet-950">Notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="Optional reminder for yourself"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-violet-950">Resume text (required)</span>
        <textarea
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          rows={5}
          className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
          placeholder="Paste resume text here…"
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-violet-950">
          Job description text (required)
        </span>
        <textarea
          value={jobText}
          onChange={(event) => setJobText(event.target.value)}
          rows={5}
          className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
          placeholder="Paste job description here…"
        />
      </label>

      {validationError ? (
        <p className="mt-3 text-sm text-red-800">{validationError}</p>
      ) : null}

      <button
        type="button"
        onClick={handleAnalyze}
        className="mt-4 rounded-md bg-violet-800 px-4 py-2 text-sm font-medium text-white hover:bg-violet-900"
      >
        Analyze pasted text
      </button>

      {result ? (
        <div className="mt-6 rounded-lg border border-violet-200 bg-white p-4 text-zinc-800">
          <p className="font-medium text-zinc-900">Analysis result (demo)</p>
          <p className="mt-2 text-sm text-zinc-600">{result.summary}</p>
          <p className="mt-3 text-sm text-zinc-700">
            Matched: <strong>{result.matchedSkillsCount}</strong> · Missing:{" "}
            <strong>{result.missingSkillsCount}</strong>
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SkillList
              title="Matched skills"
              skills={result.matchedSkills}
              emptyMessage="None from the demo taxonomy."
            />
            <SkillList
              title="Missing skills"
              skills={result.missingSkills}
              emptyMessage="None from the demo taxonomy."
            />
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Optional metadata above is not saved yet. A future save action can map{" "}
            {lastInput ? "this run" : "the result"} to the cloud contract (skills +
            metadata only, no pasted text). Use Test cloud save separately to
            verify Supabase writes with sample data only.
          </p>
        </div>
      ) : null}
    </div>
  );
}
