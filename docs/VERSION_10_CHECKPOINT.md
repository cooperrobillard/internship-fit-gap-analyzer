# Version 10 Checkpoint

This document records what **Version 10** accomplished: **optional saved-analysis metadata** (`source_url` and `notes`) for the local Streamlit UI and SQLite database.

For the planning audit, see [`VERSION_10_PLAN.md`](VERSION_10_PLAN.md). For the Version 9 baseline, see [`VERSION_9_CHECKPOINT.md`](VERSION_9_CHECKPOINT.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md).

**Status:** Version 10 is **complete**. There is **no deployment**, **no authentication**, **no application status/tags**, and **no restore/import**.

---

## Version 10 goal

Make saved job analyses easier to remember and revisit during an internship search by storing **optional source URL and notes** per saved job result—without storing raw resume or job-description text and without building a full application tracker.

---

## Completed work

| Area | Delivered |
|------|-----------|
| **Database storage** | Nullable `source_url` and `notes` on `job_results` |
| **Migration** | Idempotent schema upgrade for existing local `.db` files; no data loss |
| **Streamlit inputs** | Optional **Source URL** and **Notes** near job title/company (and sample-workflow metadata expander) |
| **Save flow** | Metadata normalized and passed through `store_analysis_result()` into SQLite when saving is enabled |
| **Saved analyses UI** | Table columns and detail expander when metadata is present |
| **Search** | Saved-analysis search includes source URL and notes |
| **CSV export** | Saved analyses summary CSV includes `source_url` and `notes` columns |
| **Tests** | Database and Streamlit helper tests for migration, save, search, display, and export |

Plan reference: [`VERSION_10_PLAN.md`](VERSION_10_PLAN.md).

---

## Privacy boundaries

- **Source URL and notes are optional** — blank values are not stored as meaningful metadata.
- **Local SQLite only** — metadata is saved when the user enables **Save this analysis to local SQLite database** on the Analyze tab.
- **No raw resume text** in SQLite or exports.
- **No raw job-description text** in SQLite or exports.
- **User-provided metadata only** — URLs and notes are not auto-filled from posting body text.

---

## Current limitations

Version 10 does **not** add:

- application **status** fields (applied, rejected, etc.),
- **tags** or favorites,
- a full **application tracker**,
- **deployment**, **authentication**, or **cloud database**,
- **AI** or **semantic matching**,
- **post-save editing** of metadata from the UI,
- **restore/import** from SQLite backup.

---

## Suggested next version

**Version 11** should focus on **publish-readiness**, not more feature planning.

Possible scope (not committed):

- README / quickstart clarity,
- demo instructions and sample-data workflow,
- final privacy audit,
- local Streamlit launch polish.

Hosted deployment, auth, and semantic matching remain later concerns.

---

*Version 10 checkpoint — documentation only.*
