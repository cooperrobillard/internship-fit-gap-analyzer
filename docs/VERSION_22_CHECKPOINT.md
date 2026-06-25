# Version 22 Checkpoint — Cross-Domain Taxonomy Rollout

Version 22 expanded and validated the deterministic analyzer's taxonomy while preserving the existing API, privacy, storage, and non-AI boundaries.

## Step 1 — Cross-domain taxonomy expansion

- Expanded the prior taxonomy from 7 categories, 45 canonical skills, and 15 alias groups.
- Reached 23 categories, 250 canonical skills, and an initial 86 alias groups.
- Added punctuation-safe matcher coverage for explicit phrases and aliases.
- Added ambiguity safeguards for risky abbreviations and broad terms.
- Kept the API response shape, analyzer contract, hosted save path, no-raw-resume/job-storage posture, and privacy model unchanged.

## Step 2 — Cross-domain validation

- Added 21 fictional role cases.
- Added 19 negative controls.
- Exercised all 23 categories.
- Included 49 alias-driven expected detections.
- Found 6 initial role mismatches.
- Found 11 initial negative-control failures.
- Added 12 guarded/contextual alias groups.
- Removed the unsafe JavaScript `js` alias.
- Finished with 98 final alias groups.
- Made no canonical additions, deletions, renames, or category moves during Step 2.
- Finished with 0 final validation failures.

## Step 3 — Product-copy, documentation, and checkpoint reconciliation

- Reconciled public copy with the curated cross-domain taxonomy and reviewed aliases.
- Replaced the hosted fictional example with a supply-chain operations analyst intern scenario.
- Recorded the accepted current-taxonomy behavior that `SAP ERP` detects both `erp` and `sap erp`; the exact demo expectation is four matched skills and five missing skills.
- Reconciled limitations language around broad but not exhaustive coverage, explicit recognized phrases, non-semantic matching, no proficiency/evidence-strength inference, and human interpretation.
- Added the taxonomy-maintenance guide.
- Updated hosted smoke-test expectations.
- Updated roadmap language and closed the Version 22 checkpoint.
- Preserved a production-verification requirement before claiming deployed behavior is verified.

## Preserved boundaries

- Deterministic keyword/alias matching only.
- No semantic AI, generated fit score, candidate-quality evaluation, or ranking.
- No taxonomy, alias, or validation-corpus behavior change in Step 3.
- No analyzer, API, database, RLS, Clerk/auth, persistence, dependency, PDF/DOCX, or bulk-management changes.
- Cloud saves continue to store structured results and metadata rather than raw resume or job-description body text.

## Current validated facts

- 23 categories.
- 250 canonical skills.
- 98 alias groups.
- 0 duplicate canonical skills.
- 0 unknown alias keys.
- 0 duplicate alias phrases.
- 21 fictional role cases.
- 19 negative controls.
- All 23 categories exercised.
- 49 alias-driven expected detections.
- 0 final validation failures.

These fixtures are strong regression evidence for the current curated cross-domain system, but they are not proof of exhaustive occupational coverage.

## Hosted fictional example checkpoint

The Version 22 Step 3 hosted sample uses a fictional Supply Chain Operations Analyst Intern role at Northstar Distribution and a fictional Demo Candidate. With the current validated taxonomy, the exact expected matched canonical skills are `excel`, `inventory management`, `logistics`, and `procurement`. The exact expected missing canonical skills are `demand planning`, `erp`, `forecasting`, `sap erp`, and `supplier management`. No skill should appear in both lists.

## Known limitations

- The taxonomy is broad but not exhaustive.
- Differently worded skills may be missed if they do not match explicit recognized phrases or reviewed aliases.
- Phrase detection does not prove proficiency, evidence strength, seniority, or hiring fit.
- Results require human interpretation.
- The hosted app remains limited public-beta/portfolio software, not mature production SaaS or a security-audited product.
- Account-wide export, one-click delete-all, automated retention, restore/undo, profile export, and automatic Supabase cleanup after Clerk account deletion remain unimplemented.

## Next feature track

Version 23 bulk saved-analysis management is the next implementation track. It should address account-wide or multi-row saved-analysis workflows without changing taxonomy behavior, storing raw resume/job text, bypassing RLS, or adding AI/semantic matching.
