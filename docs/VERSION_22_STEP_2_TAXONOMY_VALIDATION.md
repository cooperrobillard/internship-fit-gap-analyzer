# Version 22 Step 2 Taxonomy Validation

## Scope

This validation creates an independent fictional-role corpus for the deterministic keyword/alias taxonomy. The fixtures are fictional validation evidence, not proof of exhaustive occupational coverage. No runtime AI, semantic matching, API-contract, database, schema, RLS, auth, frontend, dependency, or persistence changes were made.

## Starting taxonomy statistics

Measured from the Step 1 taxonomy before Step 2 tuning:

| Metric | Starting value |
| --- | ---: |
| Categories | 23 |
| Canonical skills | 250 |
| Alias groups | 86 |
| Duplicate canonical skills | 0 |
| Unknown alias keys | 0 |
| Duplicate alias phrases | 0 |

## Corpus design

The corpus in `data/taxonomy_validation_cases.json` uses fictional prose for resumes and job descriptions instead of comma-separated skill dumps. Each role has at least three expected job skills, at least one matched skill, and at least one missing skill. Exact extraction is asserted for resume text and job text, and end-to-end matched/missing sets are derived from fixture expectations.

| Metric | Value |
| --- | ---: |
| Role cases | 21 |
| Negative controls | 19 |
| Taxonomy categories exercised | 23 of 23 |
| Alias-driven expected detections | 49 |

Covered fictional roles:

1. backend software engineer
2. data analyst
3. machine learning engineer
4. cloud platform engineer
5. cybersecurity analyst
6. manufacturing quality engineer
7. laboratory research assistant
8. clinical research coordinator
9. finance accounting associate
10. sales customer success specialist
11. digital marketing coordinator
12. supply chain operations analyst
13. project program coordinator
14. product manager
15. UX/UI designer
16. talent acquisition coordinator
17. compliance legal operations analyst
18. instructional designer
19. executive assistant
20. multilingual community outreach
21. responsible AI analyst

## Baseline failures before tuning

The unchanged Step 1 taxonomy/alias map was run against the independent corpus before corrections. Baseline role extraction mismatches occurred in 6 role-text assertions:

| Fixture | Text side | Evidence |
| --- | --- | --- |
| backend_software_engineer | job | `js` alias detected `javascript` inside `Node JS` while the intended canonical skill was `node.js`. |
| data_analyst | resume | `visual analytics` did not map to `data visualization`. |
| clinical_research_coordinator | job | `privacy controls` did not map to the professional `privacy` skill. |
| sales_customer_success_specialist | resume | `customer support` did not map to `customer service`. |
| instructional_designer | job | `program evaluation` did not map to `evaluation`. |
| executive_assistant | job | `process documentation` did not map to `documentation`. |

Baseline negative-control failures occurred in 11 forbidden-skill assertions:

- Generic `training` prose matched `training`.
- Generic application `requirements` matched `requirements`.
- Generic paperwork `documentation` matched `documentation`.
- Generic event `evaluation` matched `evaluation`.
- Generic privacy wording matched `privacy`.
- Generic parking `limitations` matched `limitations`.
- Bare `stakeholder` matched `stakeholder` without engagement context.
- Generic `presentation` wording matched `presentation`.
- Generic `leadership` value wording matched `leadership`.
- Generic `collaboration` value wording matched `collaboration`.
- Training-week prose in a non-skill onboarding sentence matched `training`.

## Evidence-backed tuning decisions

| Decision | Type | Evidence | Change |
| --- | --- | --- | --- |
| Guard `requirements` | Safe alias group | Generic application requirements were a false positive; role prose used requirements gathering/analysis. | Added aliases for business, technical, gathering, and analysis contexts, excluding bare `requirements`. |
| Guard `training` | Safe alias group | `Training will be provided` and onboarding prose were false positives; role prose used designed/delivered employee training. | Added context aliases and excluded bare `training`. |
| Guard `documentation` | Safe alias group | Generic paperwork was a false positive; role prose used technical/process documentation. | Added technical/process documentation aliases and excluded bare `documentation`. |
| Guard `evaluation` | Safe alias group | Generic event evaluation was a false positive; role prose used model/program/rubric contexts. | Added model, program, and rubric aliases and excluded bare `evaluation`. |
| Guard `privacy` | Safe alias group | Generic privacy wording was a false positive; role prose used privacy controls/review. | Added privacy controls/review aliases and excluded bare `privacy`. |
| Guard `limitations` | Safe alias group | Generic parking limitations were a false positive; role prose used model/known limitations. | Added model/known limitations aliases and excluded bare `limitations`. |
| Guard `stakeholder` | Safe alias group | Bare stakeholder wording was too broad; role prose used engagement/communication. | Added stakeholder engagement/communication aliases and excluded bare `stakeholder`. |
| Guard `presentation` | Safe alias group | A C-suite presentation sentence should not prove a skill by itself. | Added presentation decks, presentations, and executive presentation aliases. |
| Guard `leadership` | Safe alias group | Generic value wording was too broad; role prose used team/cross-functional leadership. | Added team and cross-functional aliases. |
| Guard `collaboration` | Safe alias group | Generic value wording was too broad; role prose used team/cross-functional collaboration. | Added team and cross-functional aliases. |
| Add `customer service` aliases | Safe alias group | Customer-success prose commonly says customer support. | Added customer support/customer service support aliases. |
| Add `data visualization` aliases | Safe alias group | Analyst prose commonly says visual analytics or data visualizations. | Added visual analytics/data visualizations aliases. |
| Remove `js` alias for `javascript` | Unsafe alias removal | `Node JS` caused a false `javascript` detection when the intended skill was `node.js`. | Removed `js` from `javascript` aliases; retained `javascript` and `java script`. |

No canonical skills were added, renamed, deleted, or moved.

## Category-placement review

| Skill | Category | Decision |
| --- | --- | --- |
| privacy | responsible_ai | Remains. The taxonomy already also has `data privacy`; guarded aliases reduce generic false positives. |
| evaluation | ai_ml | Remains. Existing Step 1 placement is preserved; aliases require model/program/rubric context. |
| training | communication | Remains. Training delivery is communication-oriented in this taxonomy; dedicated education skill `training facilitation` remains separate. |
| requirements | communication | Remains. Requirements gathering/analysis is communication-intensive across product/project/software contexts. |
| stakeholder | communication | Remains. Guarded aliases require communication or engagement context. |
| documentation | communication | Remains. Technical/process documentation remains a cross-functional communication skill. |
| presentation | communication | Remains. Guarded aliases reduce accidental generic matches. |
| risk assessment | legal_risk_compliance | Remains. The corpus validates security/compliance usage without moving it. |
| customer service | communication | Remains. Customer-success category keeps CRM/account skills; broad support communication remains cross-functional. |
| data visualization | data | Remains. Alias tuning supports visual analytics without moving the canonical skill. |

## Final statistics

| Metric | Final value |
| --- | ---: |
| Categories | 23 |
| Canonical skills | 250 |
| Alias groups | 98 |
| Canonical skills added | 0 |
| Alias groups added | 12 |
| Unsafe aliases removed | 1 (`js` for `javascript`) |
| Skills moved between categories | 0 |
| Duplicate canonical skills | 0 |
| Unknown alias keys | 0 |
| Duplicate alias phrases | 0 |

## Final validation results

Final validation failures: 0.

The new validation test verifies fixture structure, unique IDs, minimum role/control counts, expected skill existence, expected category correctness, per-role coverage, all-category coverage, alias-driven expectation count, exact resume extraction, exact job extraction, exact matched sets, exact missing sets, matched/missing disjointness, negative-control absence, and direct script execution through the `__main__` block.

## Known limitations

- The analyzer remains deterministic and keyword/alias based, not semantic.
- Fictional fixtures can reveal omission and false-positive risks but cannot prove comprehensive occupational coverage.
- Some substring relationships between related canonical skills remain possible when the phrase is genuinely present, such as broader risk/forecasting terms appearing inside longer professional phrases.
- No PDF/DOCX parsing, AI extraction, semantic matching, scores, rankings, or hiring predictions are introduced.
