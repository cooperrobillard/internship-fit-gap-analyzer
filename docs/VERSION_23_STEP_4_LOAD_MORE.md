# Version 23 Step 4 — Saved-analysis load more

Version 23 Step 4 adds manual progressive pagination to saved-analysis history without making account-wide claims. Actions still operate on records currently loaded in the browser.

## Contract

- Page size is 10 (`SAVED_ANALYSES_PAGE_SIZE`).
- The list query selects only existing safe saved-analysis list fields: metadata, counts, timestamps, and structured matched/missing skill rows. It does not select raw resume text or raw job body text.
- Query ordering is stable newest-first: `created_at` descending, then `id` descending.
- Offset is normalized to a nonnegative integer. Page size is normalized to a positive integer with 10 as fallback.
- The Supabase query uses `range(offset, offset + pageSize)`. Supabase range ends are inclusive, so the query asks for one extra row.
- `hasMore` is detected when more than `pageSize` rows return.
- Only the first `pageSize` rows are consumed.
- `nextOffset` is `offset + consumedRows`.
- No exact-count query is used.

## Loading behavior

- Initial session load requests the first 10 saved analyses.
- **Load more analyses** requests the next page of up to 10 older records.
- Incremental pages append to the already loaded rows and de-duplicate by ID.
- Existing rows remain first and new page order is preserved, keeping newest-first order across loaded pages.
- Current rows remain visible while incremental loading runs.
- A partial final page is allowed; the button is removed when no further page is detected.

## Preserved refresh depth

After additional pages have loaded, individual or selected deletion refreshes the previously loaded server window instead of collapsing to 10. If 20 server positions had been loaded, the refresh requests the first 20 current rows so older rows can fill deleted positions. Clerk session changes reset depth to 10.

## Stale-request and session protection

The panel uses request-generation and session guards. Incremental responses are ignored if a full refresh starts afterward, the Clerk session changes, or the component is no longer using that generation. A stale prior-session page must never append into a new session.

## Search, selection, export, delete, and compare

- Search and filters remain client-side and apply only to currently loaded rows. Loading more may reveal additional matches.
- Select all visible derives from filtered loaded rows and never selects unloaded records.
- Existing checked IDs remain selected when more pages append.
- Hidden selected counts still refer to loaded selections hidden by search/filter.
- Export selected uses checked loaded rows, including additional pages.
- Export loaded analyses uses every currently loaded row, including additional pages, regardless of selection, search, or filter.
- Selected deletion can target checked rows from additional pages while preserving the existing confirmation snapshot, sequential RLS-scoped deletion, partial-failure handling, and one dependent refresh.
- Detail and Compare use the accumulated loaded rows only.

## Incremental errors

Load-more failure preserves current rows and dependent state, shows a safe inline `role=alert` message, and keeps the button available for retry. It does not replace the panel with the initial-load error view.

## Accessibility

- Manual button only; no infinite scrolling or automatic IntersectionObserver loading.
- Native `button type="button"`, native disabled state, visible focus, and helper/status descriptions.
- Polite live-region status for loaded-count and no-more messages.
- `role=alert` for incremental failure.
- No focus jump to newly appended records.

## Manual acceptance checklist

- Initial page shows 10 saved analyses when more exist.
- Load more appends the next page while preserving search, selection, detail, Compare, notices, and exports.
- Partial final page appends and then shows the no-more state.
- Load-more failure preserves current rows and offers retry.
- Search/filter after more pages load includes matching loaded rows only.
- Select all visible never selects unloaded rows.
- Selected CSV, loaded CSV, and selected deletion work across loaded pages.
- Deletion refresh preserves loaded depth.
- Session switch resets to first page and stale prior-session responses do not append.
- Synthetic test records are cleaned up.

## Next step

Version 23 Step 5 is the Version 23 checkpoint and end-to-end data-control QA. Account-wide one-click controls remain unimplemented.
