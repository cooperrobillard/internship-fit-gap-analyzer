# Version 23 Step 1 — Saved-analysis multi-selection foundation

Version 23 Step 1 adds an accessible, transient multi-selection foundation to the saved-analysis list. It prepares the UI for later bulk actions while intentionally avoiding selected export, selected deletion, query changes, pagination, persistence, and database work.

## Scope

Implemented in the saved analyses dashboard list only:

- A native checkbox for each visible saved-analysis row.
- A native **Select all visible** checkbox.
- Checked, unchecked, and native indeterminate select-all states.
- A polite selected-count status.
- Hidden-selected count when the current search or filter hides checked rows.
- A **Clear selection** control.
- Cleanup after session changes, successful reloads, and individual deletion.
- Clarified copy for the existing loaded-analysis CSV export.

## Active detail selection vs. multi-selection

The existing `selectedAnalysisId` state remains the single saved analysis opened in the detail panel. It controls the active-detail visual cue, `aria-pressed` state on the row's **Open** button, and the detail panel content.

The new `checkedAnalysisIds` state is a separate in-memory set for rows marked for future bulk actions. Checking or unchecking a row does not open detail. Opening detail does not check or uncheck a row.

## What “visible” means

“Visible” means the current `filteredAnalyses` subset of the saved analyses that are currently loaded in the browser. Search text and the list filter determine that subset.

The list still loads the existing recent saved-analysis result set. Version 23 Step 1 does not change the current ten-record loading limit, add pagination, add **Load more**, or select analyses that are not currently loaded.

## Select-all and indeterminate semantics

The **Select all visible** checkbox uses the visible IDs from `filteredAnalyses`:

- If no visible analyses are selected, activating it adds all visible IDs.
- If some visible analyses are selected, the native checkbox is set to `indeterminate`; activating it adds all visible IDs and preserves hidden selections.
- If all visible analyses are selected, activating it removes only visible IDs and preserves hidden selections.
- If no analyses are visible, the control is disabled.

The indeterminate state is set through the checkbox ref and the native `HTMLInputElement.indeterminate` property, not through visual styling alone.

## Hidden-selection behavior

Checked IDs are preserved while search text changes, while the list filter changes, when the existing search **Clear** action is used, when switching between Analyses, Insights, and Compare, and while opening or closing detail.

When selected rows are hidden by search or filter, the live status reports the total selected count and how many selected rows are hidden by the current search or filter.

## Session, refresh, and delete cleanup

- Clerk session changes, including the session becoming unavailable, clear `checkedAnalysisIds` so selection never carries between account sessions.
- A successful saved-analysis reload removes checked IDs that no longer exist in the loaded result and preserves checked IDs that still exist.
- Individual deletion of the currently opened analysis removes that analysis ID from `checkedAnalysisIds` while preserving any other checked IDs.

## Accessibility decisions

- Row selection uses native checkboxes.
- Opening detail remains a native button.
- Each row contains sibling interactive controls: the checkbox and the detail-opening button are not nested inside each other.
- Checkbox labels distinguish **Select** from **Open** and include title, company, and saved-date context.
- The detail button preserves the existing title, company, date, matched count, missing count, active-detail styling, and `aria-pressed` behavior.
- The selection count uses `aria-live="polite"`.
- Focus remains visible and is not moved automatically after selection changes.
- A labelled grouping is used for selection controls; no `role="toolbar"` behavior was introduced.
- Controls keep comfortable touch targets for mobile use.

## Transient/no-persistence boundary

Selection is UI-only, in-memory state. A full page reload may clear selection.

Version 23 Step 1 does not use localStorage, sessionStorage, cookies, URL parameters, Supabase, or database persistence for selection.

## Existing export remains selection-independent

The existing loaded-analysis CSV export remains based on all currently loaded analyses. The display copy now says:

- Title: **Export loaded analyses**
- Description: **Exports every currently loaded analysis, regardless of selection, search, or filter.**
- Button: **Loaded analyses (CSV)**

The implementation still calls the existing loaded-analysis exporter with `allAnalyses` and is not selection-aware.

## Intentionally not implemented

- Selected CSV export.
- Selected deletion.
- Delete all.
- Account-wide selection or account-wide export claims.
- Query-limit changes.
- Pagination or **Load more**.
- Supabase, database, schema, RLS, auth, API, dependency, taxonomy, Insights, or Compare behavior changes.

## Manual acceptance checklist

- At 320 px, 390 px, 768 px, desktop width, and 200% zoom, verify no page-wide horizontal scrolling.
- Verify each row checkbox toggles only multi-selection and never opens detail.
- Verify each row detail button opens only detail and never changes checkbox selection.
- Verify **Select all visible** selects all visible rows from the current filtered subset.
- Verify the indeterminate state appears when only some visible rows are checked.
- Verify activating the indeterminate select-all control adds remaining visible rows and preserves hidden checked rows.
- Verify activating select-all when all visible rows are checked removes only visible rows and preserves hidden checked rows.
- Verify **Select all visible** is disabled when no analyses match the current search/filter.
- Verify selected counts use correct singular/plural copy.
- Verify hidden-selected count appears when filters hide checked rows.
- Verify **Clear selection** clears visible and hidden checked rows.
- Verify search Clear does not clear multi-selection.
- Verify switching Analyses, Insights, and Compare preserves multi-selection.
- Verify opening and closing detail preserves multi-selection.
- Verify deleting the opened analysis removes only that deleted ID from selection and preserves the existing success message.
- Verify signing out or switching Clerk sessions clears selection.
- Verify the loaded-analysis CSV export still exports every loaded analysis regardless of selection, search, or filter.
- Verify no secrets, tokens, raw stack traces, or private raw resume/job text are visible.

## Next step

Version 23 Step 2 should implement selected CSV export using `checkedAnalysisIds` while preserving the current privacy model, RLS boundaries, and loaded-analysis export behavior.
