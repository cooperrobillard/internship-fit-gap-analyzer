# Taxonomy Maintenance Guide

This guide explains how to maintain the deterministic, keyword/alias-based skill taxonomy without changing the product into semantic or AI extraction.

## File locations and responsibilities

- `data/skills_taxonomy.json` owns categories and canonical skill names.
- `data/skill_aliases.json` owns reviewed alternate phrases that map to canonical skills.
- `data/taxonomy_validation_cases.json` owns fictional positive role cases and negative controls.
- `tests/test_taxonomy_quality.py` checks taxonomy and alias integrity.
- `tests/test_taxonomy_role_validation.py` checks role fixtures, negative controls, exact expected detections, and alias-driven coverage.

## Canonical skill naming

Use short, lowercase canonical names that are stable in saved results, such as `excel`, `inventory management`, or `sap erp`. Prefer commonly understood professional names over vendor slogans or long descriptions. Do not rename canonical skills casually; historical saved analyses may already contain the old canonical string. Keep canonical skills globally unique across all categories.

## Alias naming

Add aliases only when they are explicit recognized phrases for an existing canonical skill. Use lowercase phrases unless punctuation or casing is essential to the phrase being tested. Include safe punctuation variants where needed, such as slash, hyphen, or spaced product names. Do not add broad aliases that match ordinary prose without clear skill evidence.

## Category placement

Place a canonical skill in the category where a user would most reasonably review it. Avoid duplicating the same canonical skill across multiple categories; category placement is a product taxonomy choice, not an ontology guarantee. If a skill spans domains, document the chosen placement in review notes rather than adding duplicate canonicals.

## Ambiguous-term safeguards

Avoid ambiguous aliases such as short acronyms or ordinary words unless tests prove the surrounding matcher behavior is safe. Prefer contextual aliases, longer phrases, or canonical-only matching when an abbreviation is risky. Keep negative controls for ambiguous terms that could create false positives.

## Punctuation handling

The matcher is punctuation-aware for explicit phrases and aliases. Maintain tests for punctuation variants when adding skills that commonly appear with `/`, `-`, `.`, or product-style spacing. Add punctuation aliases only when they represent real public wording and do not broaden matching beyond the intended skill.

## When to add a canonical skill

Add a canonical skill when the skill is a durable professional capability, tool, method, or domain concept; appears across plausible job postings or resume evidence; is not already represented by an existing canonical skill; can be matched through explicit wording; and can be covered with fictional positive and negative fixtures.

## When to add an alias instead

Add an alias when the concept already has a canonical skill, the new phrase is a common spelling, abbreviation, product wording, or professional synonym, the phrase should report the existing canonical skill, and negative controls show it does not create unsafe matches.

## When not to add either

Do not add a canonical skill or alias when the phrase is too broad, promotional, or subjective; evaluates candidate quality, seniority, hiring fit, or proficiency; requires semantic inference rather than explicit phrase matching; would store or require raw private resume/job text; or comes from copying an external taxonomy wholesale.

## Fictional role evidence

Validation fixtures must use fictional people, employers, postings, and prose. They should look realistic enough to exercise domain wording without using private resumes, real job descriptions, real links, or identifiable individuals.

## Positive fixture requirements

Positive role cases should include a role title and domain, resume-side prose, job-side prose, exact expected matched canonical skills, exact expected missing canonical skills, and alias-driven expectations when the fixture is intended to prove alias coverage.

## Negative-control requirements

Negative controls should include ordinary prose that must not trigger a risky skill. Add negative controls for acronyms, short aliases, punctuation variants, and ambiguous business words.

## Exact extraction expectations

Role validation should assert exact matched and missing canonical skills. A fixture should fail if a new skill appears unexpectedly, an expected skill disappears, or a skill appears in both matched and missing lists.

## Statistics and integrity checks

Before opening a PR, confirm the intended counts and integrity facts. As of the Version 22 checkpoint, the validated taxonomy has 23 categories, 250 canonical skills, 98 alias groups, 0 duplicate canonical skills, 0 unknown alias keys, and 0 duplicate alias phrases.

## Required test commands

Run these from the repository root after taxonomy or fixture maintenance:

```bash
python3 tests/test_taxonomy_role_validation.py
python3 tests/test_taxonomy_quality.py
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py api/models.py api/analysis_service.py src/extract_keywords.py src/analysis_runner.py tests/test_taxonomy_quality.py tests/test_taxonomy_role_validation.py tests/test_api_service.py run_tests.py streamlit_app.py
```

For frontend copy that references taxonomy behavior, also run:

```bash
cd web
npm ci
npm run lint
./node_modules/.bin/tsc --noEmit
npm run build
cd ..
```

## PR review checklist

- [ ] Canonical skill names are stable, lowercase, and globally unique.
- [ ] Aliases point only to known canonical skills.
- [ ] Alias phrases are unique and not dangerously broad.
- [ ] Category placement is intentional.
- [ ] Positive fixtures use fictional evidence and exact expectations.
- [ ] Negative controls cover ambiguous additions.
- [ ] Historical saved-result compatibility was considered.
- [ ] Public copy remains clear that matching is rule-based, broad but not exhaustive, non-semantic, non-AI, and requires human interpretation.

## Compatibility with historical saved results

Saved analyses store canonical skill strings. Renaming, deleting, splitting, or moving canonical skills can make old saved results harder to compare with new results. Prefer additive aliases over canonical renames, and document any unavoidable compatibility impact before implementation.

## External taxonomy boundaries

External taxonomies, course catalogs, job boards, or vendor lists can inspire research, but they must not be copied wholesale. Copying external taxonomies can create licensing, attribution, maintenance, and product-fit problems. Use original, reviewed, project-specific taxonomy entries.

## AI and semantic extraction boundary

Runtime AI extraction or semantic matching would change the product method, privacy posture, user expectations, evaluation needs, and possibly provider/data-processing obligations. It requires a separate product and privacy design decision before implementation.
