# CLAUDE.md

**`AGENTS.md` is the authoritative project rulebook. Read it first.**
**Also read `docs/AGENT_OPERATING_RUNBOOK.md` before starting any task.**

Before acting on a PR or issue, read the full issue body, PR description, all changed files, every unresolved review comment, and the current check status.

Keep every task small, branch-scoped, and reviewable.

---

## Hard stops — never do these

- Read or edit `.env`, `.env.local`, or `web/.env.local`
- Touch private or generated `data/`
- Add `resume_text` or any raw resume or job-description text storage
- Use a Supabase service-role key in browser or client code
- Bypass or disable RLS
- Run production SQL
- Change Supabase, Clerk, Vercel, Render, DNS, billing, or production deployment settings
- Add dependencies without explicit human approval
- Perform destructive database or filesystem operations (`DROP TABLE`, `TRUNCATE`, `rm -rf`, unscoped `DELETE FROM`)
- Merge a pull request

## Stop and report instead of continuing when

- Secrets, API tokens, or env vars are needed
- Production database access is required
- Schema or RLS changes are required
- Provider settings (Supabase, Clerk, Vercel, Render) are required
- Dependency installation is needed
- A destructive action would be required to proceed
- The change conflicts with the privacy rules above
- The task scope is materially larger than requested
- An ambiguous privacy, security, or product decision is reached

---

## Automatic review mode

Used by the `claude-code-review.yml` workflow on every non-draft PR. **Read-only. Do not edit, commit, or push any files.**

- Read `AGENTS.md` and `docs/AGENT_OPERATING_RUNBOOK.md` before reviewing.
- Compare the implementation against the PR scope, `AGENTS.md`, and the runbook.
- Prefix every concrete merge-blocking inline finding with `BLOCKER:`.
- Post a concise top-level summary comment.
- When there are no blocking findings, end the summary with exactly: `No blocking findings from the automated Claude review.`
- Do not invent failures. Do not claim hosted behavior was verified unless it was actually checked.

## Implementation / fixer mode

Used only when an authorized human explicitly triggers `@claude` in an issue comment, PR conversation comment, or PR inline review comment.

- Read `AGENTS.md` and `docs/AGENT_OPERATING_RUNBOOK.md` before acting.
- For an existing PR, update the existing PR branch. Do not open a second PR.
- Address only valid, in-scope findings.
- Run the standard checks and privacy checks from `AGENTS.md` before reporting done.
- Report blockers instead of crossing any sensitive boundary listed above.
- Never merge.
