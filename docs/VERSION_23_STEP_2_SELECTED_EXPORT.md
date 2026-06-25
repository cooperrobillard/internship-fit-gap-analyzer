# Version 23 Step 2 — Selected saved-analysis CSV export

Version 23 Step 2 adds one bounded export action for checked saved analyses in the dashboard saved-analysis list. It reuses the Version 23 Step 1 transient multi-selection state and intentionally leaves bulk deletion, account-wide export, pagination, query changes, database work, and persistence out of scope.

## Scope

Implemented behavior:

- Adds **Export selected (CSV)** to the existing saved-analysis **Selection** area.
- Exports one CSV row per selected currently loaded analysis.
- Uses the established structured saved-analysis CSV schema and escaping behavior.
- Keeps the existing **Export loaded analyses** action separate and unchanged.

Not implemented:

- Selected deletion.
- Delete all.
- Account-wide export or account-wide management.
- Pagination, **Load more**, query-limit changes, or saved-analysis query changes.
- Supabase, database, schema, RLS, auth, API, dependency, taxonomy, or persistence changes.

## Relationship to Step 1 selection state

Step 1 introduced two distinct concepts:

- `selectedAnalysisId`: the one saved analysis opened in the detail pane.
- `checkedAnalysisIds` / `effectiveCheckedAnalysisIds`: the transient multi-selection set for checked saved analyses.

Step 2 uses only the checked multi-selection state for selected export. Opening or closing detail does not affect selected export eligibility.

## Selected-record derivation

The selected export derives records from loaded analyses, not from the visible filtered list:

```ts
allAnalyses.filter((analysis) =>
  effectiveCheckedAnalysisIds.has(analysis.id),
)
```

This means the export:

- includes checked analyses that are currently visible;
- includes checked analyses hidden by the current search or filter;
- excludes every unselected analysis;
- preserves the current `allAnalyses` newest-first ordering.

## Loaded-result boundary

The saved-analysis query still loads the current limited recent result set. Step 2 exports selected analyses from that already-loaded client-side set only. It does not fetch older account records and does not claim account-wide export coverage.

## CSV output

The selected CSV uses the same structured saved-analysis CSV builder as the loaded export. Columns remain exactly:

1. `saved_date`
2. `job_title`
3. `company`
4. `source_url`
5. `notes`
6. `matched_skill_count`
7. `missing_skill_count`
8. `matched_skills`
9. `missing_skills`

The export contains structured metadata and matched/missing skill rows only. It does not include raw resume body text or raw job-description body text.

## Filename behavior

Selected-export downloads use this filename pattern:

```text
selected-saved-analyses-<count>-YYYY-MM-DD.csv
```

Example:

```text
selected-saved-analyses-3-2026-06-25.csv
```

## Empty selection and no-op behavior

The **Export selected (CSV)** button remains visible but is natively disabled when no loaded selected analyses are available. The helper also returns immediately for an empty array, so direct empty calls are a no-op.

## Selection preservation

Exporting selected analyses does not mutate `checkedAnalysisIds`, search/filter state, detail state, or success messages. Selection remains in place after the browser download is triggered.

## Existing loaded export remains separate

The existing loaded export remains titled **Export loaded analyses** with the description **Exports every currently loaded analysis, regardless of selection, search, or filter.** Its button remains **Loaded analyses (CSV)** and it continues to pass `allAnalyses` to `downloadAllSavedAnalysesCsv`.

## Server and database boundary

Selected export is entirely client-side over already-loaded structured records. It performs no Supabase request, backend request, database query, schema change, RLS change, or auth change.

## Accessibility

- The selected export uses the existing native `ExportDownloadButton` component.
- Disabled state uses the native `disabled` attribute.
- The visible label is **Export selected (CSV)**.
- Visible focus behavior is preserved.
- Focus is not moved automatically after download.
- No unnecessary `aria-live` success message is added.
- The existing selected-count live status remains unchanged.

## Manual acceptance checklist

- Verify **Export selected (CSV)** is visible in the saved-analysis **Selection** area.
- Verify the button is disabled with no selected loaded analyses.
- Select one visible analysis and verify the CSV contains exactly that one row.
- Select multiple analyses and verify the CSV preserves newest-first loaded order.
- Select an analysis, hide it with search or filter, and verify the selected CSV still includes it.
- Verify unselected visible and hidden analyses are excluded.
- Verify exporting does not clear checked selections.
- Verify exporting does not change search/filter state.
- Verify exporting does not open or close the detail pane.
- Verify no fake saved-success message appears after export.
- Verify the loaded export still exports every loaded analysis regardless of selection, search, or filter.
- Verify the selected filename includes the selected count and current date.
- Verify no raw resume text, raw job-description text, secrets, tokens, raw stack traces, or database errors appear in the UI or CSV.

## Bulk deletion remains deferred

Selected deletion remains intentionally unimplemented. Version 23 Step 2 only adds selected CSV export.

## Next step

Version 23 Step 3 should be a carefully scoped selected deletion design and implementation step that preserves RLS, avoids account-wide claims unless explicitly implemented and verified, and keeps destructive actions reviewable.
