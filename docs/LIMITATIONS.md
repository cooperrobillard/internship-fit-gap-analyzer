# Limitations

This document explains the current limitations of the Internship Fit & Skill-Gap Analyzer.

The project is a hosted job-fit analyzer with optional Smart AI analysis and a local CLI/Streamlit workflow. It is useful for learning and for first-pass skill-gap analysis, but it should not be treated as a perfect job-fit evaluator or mature production SaaS.

## Current approach

The hosted analyzer supports Smart AI analysis when configured, plus rule-based keyword matching as a deterministic fallback.

It compares:

- skills found in a resume text file,
- skills found in job description text files,
- skills listed in `skills_taxonomy.json`,
- alternate skill phrases listed in `skill_aliases.json`.

Then it reports which job skills appear to be missing from the resume.

## What the tool does well

The current version can:

- read resume and job-description text files,
- search for known skills,
- group skills by category,
- compare job skills against resume skills,
- identify missing skills,
- count recurring gaps across multiple jobs,
- generate markdown and CSV outputs,
- optionally save analysis results to a SQLite database (`--database`),
- optionally create pandas-generated summary CSV files (`--pandas-summary`),
- run basic tests.

This is useful for spotting repeated skill gaps across internship postings and other early-career or professional role descriptions covered by the current taxonomy.

## What the tool does not do yet

The current version does not:

- understand the full meaning of a job description,
- distinguish required skills from preferred skills,
- judge whether resume evidence is strong or weak,
- detect skill level, such as beginner vs. intermediate vs. advanced,
- understand whether a project actually proves a skill,
- guarantee transferable-skill detection in rule-based mode without explicit keywords,
- provide Smart AI analysis when it is disabled, over quota, or misconfigured,
- generate resume bullets or application materials,
- provide hiring decisions, fit guarantees, or formal legal/security compliance,
- provide account-wide export/delete, automated retention, restore/undo, or account deletion data cleanup in the hosted app.

Optional SQLite and pandas features store and summarize results locally. They do not add semantic understanding of job descriptions or resume evidence.


## Current hosted limitations (Version 25 limited-public-beta state)

The hosted app exists at the canonical limited-public-beta URL `https://jobfit.cooperrobillard.com` and includes a public landing page, Clerk Production sign-in, dashboard analysis, structured saved analyses, structured resume-profile management, saved-profile analysis handoff, comparison/export/delete surfaces, safe errors/retries, Supabase RLS, basic Vercel rate limiting for `POST /api/analyze`, privacy-safe production observability, custom-domain configuration, canonical metadata, provider/integration reconciliation, and canonical-host Production QA.

Version 25 completed custom-domain configuration, Clerk Production migration, canonical metadata, provider/integration reconciliation, canonical-host Production QA, and final documentation closeout. Portfolio publication and broader promotion are intentionally deferred and are not prerequisites for Version 25 technical completion.

Important current limits:

- **Not mature production SaaS.** Dev 19 completed bounded RLS, abuse-control, privacy-copy, and readiness checks, and later work improved UI/routes and taxonomy validation, but there is no formal penetration test, comprehensive security audit, or legal/privacy compliance sign-off.
- **Curated cross-domain but not exhaustive.** Version 22 validation exercises 23 categories with fictional role cases and negative controls, which is strong regression evidence but not proof of universal occupational coverage.
- **Smart AI when configured** — transient OpenAI processing with quota limits and rule-based fallback; outputs may still miss niche skills or over-group variants.
- **Rule-based fallback** — explicit taxonomy phrases and reviewed aliases; not semantic understanding, generated fit scores, or hiring judgment.
- **Phrase detection is not proficiency evidence.** A detected phrase does not prove skill level, project depth, evidence strength, candidate quality, or hiring fit. Results require human interpretation.
- **No PDF/DOCX parsing.** Hosted upload support is limited to transient `.txt` handling where available.
- **No raw resume/job-body persistence by the application save path.** Pasted/uploaded text is sent through Vercel to Render for the request, but saved cloud records are structured results and metadata. Platform/service logging cannot be guaranteed absent.
- **Structured resume profiles are not full resumes.** Profiles store names, optional notes/description, skill lists, source type, and timestamps; they do not store raw resume body text. Selecting a profile constructs temporary structured analysis input from those fields.
- **Data controls are bounded.** Version 23 completed saved-analysis data controls for the currently loaded browser scope: users can analyze without saving, progressively load saved-analysis history in pages of ten, delete individual saved analyses, delete selected currently loaded saved analyses after confirmation, create/edit/delete structured profiles, export supported currently loaded saved-analysis/derived reports, and clear browser inputs. Search, selection, export, deletion, detail, and comparison actions apply only to records currently loaded in the browser. There is no account-wide select-all, one-click account-wide export, account-wide delete-all, automated retention, restore/undo, profile export, or automatic Supabase cleanup claim when a Clerk account is deleted.
- **Abuse controls are basic.** Vercel rate limiting is IP-based for the analysis route; it is not account quotas, bot prevention, or comprehensive DDoS protection.

Version 23 production data-control QA passed, but that evidence is not a formal security audit, penetration test, legal privacy-policy review, or compliance certification. See [`VERSION_23_CHECKPOINT.md`](VERSION_23_CHECKPOINT.md) and [`VERSION_23_DATA_CONTROL_QA.md`](VERSION_23_DATA_CONTROL_QA.md) for the bounded Version 23 saved-analysis data-control checkpoint and accepted production Playwright QA evidence.

Observability is bounded but implemented for Version 24's privacy-safe production-observability scope, with a bounded PASS verdict in [`VERSION_24_CHECKPOINT.md`](VERSION_24_CHECKPOINT.md). This is still not a formal security audit, penetration test, legal review, compliance certification, or mature-SaaS claim. Step 2 implements transient request correlation and sanitized server-native application events for the analysis path; Step 3A adds a server-only Sentry SDK adapter behind a kill switch; Step 3B records Sentry proxy/API project configuration, provider-side scrubbing, disabled IP storage, a branch-specific Vercel Preview proxy canary before production enablement, local FastAPI synthetic verification, Vercel/Render production enablement, Sentry alert rules, UptimeRobot frontend/backend monitors, notification tests, and redaction inspections against deployed commit `a272b760d97258ceb6eb3edef8852b5dcf005bd9`; Step 4 records production smoke verification, request-ID correlation across browser/Vercel/Render, successful-analysis absence from Sentry, existing canary reinspection, alert and uptime checks, kill-switch readiness, rollback readiness, and a SEV-4 record for one unconfirmed non-sustained external Render `/health` HTTP 503 anomaly. Version 25 added canonical frontend monitoring, retained the old Vercel fallback monitor, and completed canonical-host Production verification on commit `0ceb8b88a602f349e1de89e4fd9bf00e5725939d`. Platform/Clerk/WAF-generated responses may not include the application request ID, request IDs are not stored with users or analyses, direct browser-to-Supabase operations are outside this correlation path, production log retention remains provider-controlled, and there is no browser error monitoring, session replay, tracing, profiling, source-map upload, external log aggregation, or OpenTelemetry. The hosted Render backend failure path was not deliberately triggered in every verification pass; the Python adapter was verified against the real Sentry API project using a local synthetic FastAPI exception path. Provider/platform logging cannot be guaranteed absent. See [`VERSION_24_STEP_1_OBSERVABILITY_REQUIREMENTS.md`](VERSION_24_STEP_1_OBSERVABILITY_REQUIREMENTS.md), [`OBSERVABILITY_PROVIDER_DECISION.md`](OBSERVABILITY_PROVIDER_DECISION.md), [`VERSION_24_STEP_2_REQUEST_CORRELATION.md`](VERSION_24_STEP_2_REQUEST_CORRELATION.md), [`VERSION_24_STEP_3A_SENTRY_INTEGRATION.md`](VERSION_24_STEP_3A_SENTRY_INTEGRATION.md), [`VERSION_24_STEP_3B_PROVIDER_CONFIGURATION.md`](VERSION_24_STEP_3B_PROVIDER_CONFIGURATION.md), [`VERSION_24_STEP_4_PRODUCTION_VERIFICATION.md`](VERSION_24_STEP_4_PRODUCTION_VERIFICATION.md), [`VERSION_25_STEP_6_PRODUCTION_VERIFICATION.md`](VERSION_25_STEP_6_PRODUCTION_VERIFICATION.md), [`VERSION_25_STEP_7_PROJECT_CLOSEOUT.md`](VERSION_25_STEP_7_PROJECT_CLOSEOUT.md), and [`PRODUCTION_INCIDENT_RESPONSE_RUNBOOK.md`](PRODUCTION_INCIDENT_RESPONSE_RUNBOOK.md). No unrestricted session replay is approved, and no raw résumé/job text should be intentionally captured by observability tooling.

See [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md) for the Dev 19 readiness checkpoint and [`VERSION_22_CHECKPOINT.md`](VERSION_22_CHECKPOINT.md) for the current taxonomy checkpoint.

## Saved-analysis comparison limitations (Version 6)

The local Streamlit UI can compare **two saved job results** and show a **saved gap priority summary** across all saved analyses. These views are read-only and rule-based.

Important limits:

- **Missing-skill comparison only.** SQLite stores individual missing skills in `skill_gaps`, but stores only `matched_skills_count` per job—not individual matched skill names. Saved comparison cannot show shared or unique **matched** skills from the database.
- **Not a recommendation engine.** The gap priority summary describes which missing skills appear in the most saved job results. It does not rank jobs, score fit, or claim which skill you should learn next.
- **Two results at a time.** The UI compares exactly two saved analyses, not three or more.
- **Latest-run vs. all-saves.** **Saved Analysis History** still shows top recurring gaps for the **latest run only**. **Saved Gap Priority Summary** aggregates across **all** saved job results (up to 10 skills shown).
- **Example job names.** The priority summary lists distinct job filenames when available. The same filename saved in multiple runs may appear once in examples even when the recurrence count is higher.
See [`VERSION_6_CHECKPOINT.md`](VERSION_6_CHECKPOINT.md) for the full Version 6 workflow and commands.

## Saved-result management limitations (Version 7)

The local Streamlit UI can **search** saved job results and **delete one selected result** at a time with explicit confirmation.

Important limits:

- **Deletion is permanent.** There is no undo, archive, or trash recovery.
- **One record at a time.** No bulk delete, delete-all, or delete-by-search.
- **Local only.** Deletes affect `data/outputs/analysis_results.db` on your machine only.
- **Skill gaps keyed by run + job name.** `skill_gaps` rows do not store `job_result_id`; deletion matches `run_id` and `job_filename`. Normal UI saves have one result per job name per run.
- **Search is substring-based.** No date-range, category, or gap-count filters.
- **No saved-record editing.** You cannot change labels, metadata, or stored skill rows after save.
- **Gap priority summary stays global.** Search filters browsing and pickers but not the all-saves priority summary.
- **Parent run cleanup.** An empty `analysis_runs` row is removed only when its last `job_results` row is deleted; multi-job runs keep the parent when siblings remain.

See [`VERSION_7_CHECKPOINT.md`](VERSION_7_CHECKPOINT.md) for the full Version 7 workflow and commands.

## Saved-analysis metadata limitations (Version 10)

The local Streamlit UI can save optional **source URL** and **notes** per job result when SQLite saving is enabled.

Important limits:

- **Save-time only.** Metadata is entered on the Analyze tab before save; there is no post-save edit UI.
- **Optional fields.** Blank source URL and notes are not stored as meaningful values.
- **Local SQLite only.** Metadata is not synced to cloud storage.
- **No application tracker.** No status fields (applied, rejected, etc.), tags, or reminders.
- **Display labels still use job name.** Optional job title/company from the UI compose the stored `job_filename` label; source URL and notes are separate fields.
- **CLI saves omit metadata by default.** Terminal `--database` runs do not prompt for source URL or notes unless added in a future CLI step.

See [`VERSION_10_CHECKPOINT.md`](VERSION_10_CHECKPOINT.md).

## Keyword matching limitations

Because the analyzer uses explicit phrase matching, it can miss skills when the wording is different.

For example, if the taxonomy contains:

```text
rest api
```

but a job description says:

```text
API development
```

the tool may not count that as the same skill unless an alias is added.

The reviewed alias file helps, but it is still manual, broad rather than exhaustive, and intentionally guarded against unsafe matches.

### False positives

The tool can also find skills that are not actually strong evidence.

For example, if a resume mentions a skill only once, the analyzer may count it as present even if the experience is limited.

This means the report answers:

```text
Does this word or phrase appear?
```

It does not fully answer:

```text
Can the person confidently use this skill?
```

### False negatives

The tool can also miss real skills.

For example, the resume might show data-analysis experience without using the exact word pandas.

In that case, the analyzer may mark pandas as a gap even if the person has related experience.

## Privacy considerations

Private resumes and real job descriptions may contain personal or sensitive information.

For public GitHub use:

- use `data/resume/sample_resume.txt` and `data/sample_jobs/` for tracked sample inputs,
- put private files in `data/resume/resume.txt` and `data/jobs/` (all `.txt` files in `data/jobs/` are Git-ignored),
- use `--jobs data/jobs` to analyze private job descriptions from the CLI,
- keep generated outputs and `.db` files out of Git if they are based on private data.

For the **local Streamlit UI**:

- pasted job text stays in your browser session for that run; the app does not save it to tracked repo files,
- the private resume option reads `data/resume/resume.txt` only when that file exists locally and you select it,
- the UI does not display resume contents—only file paths and analysis results,
- do not commit pasted content, private resume files, or screenshots that contain real PII.

The `.gitignore` file helps avoid tracking private local files, generated outputs, and SQLite database files.

## How to interpret the output

The output should be treated as a first-pass guide.

The report is useful for asking:

- Which skills keep appearing across jobs?
- Which tools should I learn next?
- Which gaps might be worth building projects around?
- Which areas should I describe more clearly on my resume?

The report should not be treated as a final hiring judgment or a complete resume review.

## Current best use

The best current use of this tool is:

1. Add several internship job descriptions.
2. Run the analyzer.
3. Review recurring gaps.
4. Decide which skills are worth learning or documenting better.
5. Use the results to guide future projects and resume updates.

## Future improvements

Possible future improvements include:

- better matching logic,
- required vs. preferred skill detection,
- stronger tests,
- confidence notes,
- evidence mapping from resume projects to job requirements,
- final UI, accessibility, mobile polish, and broader hosted data-control improvements,
- responsible AI evaluation examples.

## Bottom line

This tool is useful, but it is not magic.

It helps organize job-skill patterns, but a human still needs to review the results, interpret the context, and decide what action to take.
