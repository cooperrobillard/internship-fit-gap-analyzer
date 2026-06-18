# Agent Operating Runbook

This runbook explains how AI coding agents should work in the `internship-fit-gap-analyzer` repo without breaking the privacy-safe, small-branch workflow.

Public product name: **Job Fit & Skill-Gap Analyzer**

---

## 1. Operating model

The project uses bounded autonomy.

Agents may:

- inspect code
- plan changes
- edit safe files
- run tests/builds
- run privacy checks
- produce diffs/PRs
- update docs when appropriate

Agents must stop for:

- secrets
- env vars
- production SQL
- Supabase dashboard actions
- RLS policy changes
- destructive database actions
- Vercel/Render production settings
- DNS/custom-domain changes
- billing/account settings
- ambiguous privacy/security decisions

The human is the release manager.

---

## 2. Starting a task

Before editing, the agent should:

1. Read `AGENTS.md`.
2. Read the task issue/brief.
3. Identify the task type:
   - normal coding
   - docs-only
   - Supabase/RLS-sensitive
   - UI polish
   - production hardening
   - deployment/domain
4. Inspect the current repo state.
5. Confirm likely files to edit.
6. Identify forbidden files.
7. Create or use a small branch.

Recommended start:

```bash
git status
git checkout main
git pull origin main
git checkout -b <branch-name>
git status
```

Cloud agents should create their own task branch or PR branch instead of merging to `main`.

---

## 3. Planning

Before editing, produce a short plan:

* goal
* files likely to change
* files that must not change
* checks to run
* manual verification needed
* stop conditions

Keep the plan practical. Do not over-plan.

---

## 4. Inspecting files safely

Use read-only commands first:

```bash
find . -maxdepth 3 -type f | sort
git status --short
git grep -n "<term>"
grep -Rni "<term>" <path> || true
sed -n '1,220p' <file>
```

Do not inspect `.env`, `.env.local`, or `web/.env.local`.

Do not print secrets.

---

## 5. Editing safely

Edit only files required for the task.

Prefer small, focused modules/components.

Avoid broad unrelated refactors.

Do not change package files unless the task explicitly requires it.

Do not change database migrations unless the task is explicitly database-related.

Do not change GitHub Actions workflows unless the task explicitly requires it.

---

## 6. Standard checks

Run from repo root:

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

If `web/package.json` already has a test script:

```bash
cd web
npm test
cd ..
```

Do not invent that a check passed. Report the real result.

---

## 7. Privacy checks

Run before commit/PR:

```bash
git ls-files web/.env.local
git ls-files .env
git ls-files .env.local
git ls-files data/outputs/analysis_results.db
git ls-files data/resume/resume.txt
git ls-files data/jobs
git ls-files | grep DS_Store || true
git status --short | grep ".env" || true
```

Expected output:

```text
prints nothing
```

For resume/job/profile-related work, also run:

```bash
grep -Rni "resume_text\|raw_resume\|rawResume\|service_role\|SERVICE_ROLE\|SUPABASE_SERVICE\|sk_live\|password\|private key" web/src web/app web/components docs 2>/dev/null || true
```

Investigate any suspicious result.

---

## 8. Handling blockers

Stop and report if:

* required files are missing
* tests fail and fix is unclear
* dependencies are needed
* an env var or secret is needed
* Supabase dashboard action is needed
* production SQL is needed
* RLS policy needs to change
* task conflicts with privacy rules
* scope becomes larger than expected

Blocker report format:

```text
Blocker:
What happened:
Why it matters:
Files/commands involved:
Recommended human action:
Safe next step:
```

---

## 9. Supabase/RLS-sensitive steps

Agents may draft but must not execute production database actions.

Allowed:

* inspect migration files
* draft migration SQL
* draft RLS policies
* draft verification SQL
* add helper code that respects RLS
* add mock/unit tests

Human-only:

* applying SQL in Supabase SQL Editor
* changing RLS policies
* disabling/enabling RLS
* deleting/truncating production data
* changing Supabase dashboard settings
* handling service-role keys

For Supabase steps, include:

1. Pre-change SQL checks.
2. Migration/review notes.
3. Post-change SQL checks.
4. RLS policy checks.
5. Rollback-only simulated user test when possible.
6. Final row-count check.
7. Clear stop conditions.

Never include destructive SQL without clear human approval.

---

## 10. Docs-only steps

Docs-only tasks should not edit app code.

Allowed:

```text
AGENTS.md
README.md
docs/
LEARNING_LOG.md
```

Usually forbidden:

```text
api/
web/src/
web/app/
web/components/
web/database/migrations/
package.json
package-lock.json
requirements.txt
.env files
data/
```

Docs-only checks:

```bash
git status --short
git diff --stat
git diff
```

Run full tests/builds if docs changed product assumptions or if the task requires the standard workflow.

Always run privacy checks.

---

## 11. UI steps

For UI tasks:

* follow existing design/component patterns
* keep changes scoped
* preserve analysis flow unless explicitly changing it
* include empty/loading/error states
* use friendly error copy
* do not show raw database/API errors
* include manual browser verification

Manual UI verification should include:

* landing page
* sign-in
* dashboard
* changed UI area
* saved analyses
* analysis flow
* export/download
* comparison
* privacy/data-control area
* no secrets/tokens/stack traces/private raw text

For resume-profile UI:

* do not store raw resume text
* do not imply PDF/DOCX parsing
* do not imply AI extraction
* do not silently change analysis input behavior

---

## 12. Production hardening steps

Production hardening tasks may touch sensitive boundaries, so keep them narrow.

Examples:

* friendly error handling
* payload validation
* rate-limit design or implementation
* log cleanup
* no stack traces in UI
* privacy copy corrections
* RLS re-check docs

Agents may implement app-side hardening but must stop for:

* production env vars
* deployment settings
* provider dashboards
* database policy changes
* billing/security settings

---

## 13. Deployment/domain steps

Agents may prepare docs and checklists.

Human-only:

* custom domain setup
* DNS changes
* Vercel domain settings
* Render production settings
* Clerk production settings
* env var changes
* launch approval

Deployment task output should include:

* exact human steps
* verification commands
* rollback considerations
* what not to touch
* final smoke test checklist

---

## 14. Learning-log updates

When requested, add a concise entry to `LEARNING_LOG.md`.

Good entry pattern:

```markdown
## Dev X Step Y — Short title

- Implemented/verified ...
- Learned ...
- Confirmed ...
- Kept ... out of scope.
```

Do not paste huge command output.

Keep learning-log commits separate when practical.

---

## 15. Commit-ready output

Before commit/PR, report:

```text
Branch:
Files changed:
Summary:
Checks run:
Privacy checks:
Manual verification:
Skipped checks:
Blockers:
Suggested commit message:
```

Do not say “all checks passed” unless they actually passed.

---

## 16. Common mistakes to avoid

Do not:

* use `git add .`
* use `git add -A`
* edit `.env` files
* commit data/private files
* add `resume_text`
* store raw resume/job text
* use service-role keys in frontend
* bypass RLS
* make broad redesigns during sensitive tasks
* add dependencies without approval
* hide failing tests
* claim hosted verification without checking
* merge to `main` without passing checks
* run destructive SQL
* edit package lockfiles accidentally
* silently change analysis behavior