# Version 23 Step 3 — Selected saved-analysis deletion

Version 23 Step 3 adds a carefully scoped destructive workflow for deleting checked saved analyses from the current loaded saved-analysis result set. It builds on the Version 23 Step 1 multi-selection foundation and Version 23 Step 2 selected CSV export.

## Loaded-record scope

Selected deletion applies only to checked analyses that are already loaded in the dashboard list. It includes checked records hidden by the current search or filter because targets are derived from the loaded `allAnalyses` list plus the transient checked IDs, not from the currently visible filtered subset.

It does not fetch older records, change the current recent-result limit, add pagination, add Load more, select by query, or perform account-wide deletion.

## Stable confirmation snapshot

Pressing **Delete selected** does not delete anything. It opens an inline confirmation section and creates a stable snapshot of target IDs and labels from the selected loaded analyses in newest-first loaded order.

The confirmation continues to show that snapshot even if search/filter state changes while it is open. The final destructive button deletes only those snapshot targets.

## Selection locking

While the confirmation is open or deletion is running:

- row checkboxes are disabled;
- **Select all visible** is disabled;
- **Clear selection** is disabled;
- the initial **Delete selected** button is disabled.

The detail-opening button remains available. **Export selected (CSV)** remains available while the confirmation is open and is disabled only while deletion is actively running.

## Sequential, non-transactional behavior

Deletion processes target IDs sequentially. It is not transactional and does not claim rollback behavior. If one target is deleted successfully and a later target fails, the successful deletion remains deleted.

## RLS preservation

The bulk helper reuses the existing `deleteSavedAnalysis` helper for each target. It does not duplicate Supabase deletion logic, create a service-role client, bypass row-level security, add a backend/admin endpoint, or fetch raw resume or job body text.

## Outcomes

The helper returns three aggregate outcomes:

- `deletedIds`: rows deleted successfully;
- `unavailableIds`: rows that were already unavailable or not found under the current RLS-scoped view;
- `failures`: rows that could not be deleted, with safe existing user-facing messages.

If Supabase is not configured, the helper marks the current and remaining IDs as failures with safe configuration copy and stops.

## Partial failure behavior

After completion:

- deleted and unavailable IDs are removed from checked selection;
- failed IDs remain selected so the user can retry or export the remaining selected records;
- defensive non-target selections are preserved;
- unavailable rows are treated as removed from selection because they are no longer available in the loaded user-owned list;
- the UI uses aggregate safe notices without exposing IDs, provider responses, SQL text, stack traces, tokens, or private text.

## Detail and Compare cleanup

If the active detail ID, first comparison ID, or second comparison ID was deleted or unavailable, that dependent selection is cleared. If a target fails, any active detail or comparison selection for that failed ID is preserved.

## Dependent refresh

When at least one target was deleted or unavailable, the completed saved-list fetch key is marked stale, the existing parent deletion callback is invoked once, the saved list reloads once, and recurring-gap statistics refresh through the existing parent refresh key. Compare reconciles against the refreshed loaded list.

The workflow does not refresh once per record.

## Accessibility

The destructive workflow uses native buttons and an inline labelled confirmation section rather than `window.confirm`. Opening confirmation focuses its heading with `tabIndex=-1` and does not trap focus. The confirmation sets `aria-busy` while deletion is running. Success and warning notices use polite status announcements; complete failure uses an alert.

## Privacy boundary

The workflow deletes structured saved-analysis records owned by the signed-in user under existing Clerk/Supabase RLS behavior. It does not add raw resume storage, raw job-description storage, service-role access, schema changes, RLS changes, persistence for selection, restore/undo, account-wide selection, or account-wide deletion.

## Manual acceptance checklist

- Verify **Delete selected** is disabled when no loaded analyses are checked.
- Verify pressing **Delete selected** opens confirmation and does not delete immediately.
- Verify **Cancel** closes confirmation, preserves checked IDs, preserves data, and returns focus to **Delete selected**.
- Verify checked records hidden by search/filter appear in the confirmation snapshot and are attempted.
- Verify only checked loaded snapshot targets are deleted; unselected visible and hidden records remain.
- Verify successful deleted and already-unavailable records are removed from selection.
- Verify failed records remain selected and can still be exported with **Export selected (CSV)**.
- Verify active detail and Compare selections clear only for deleted/unavailable IDs and remain for failed IDs.
- Verify saved list and recurring-gap statistics refresh once after a mixed successful/unavailable deletion result.
- Verify no **Delete all**, account-wide deletion, query deletion, older-record fetch, pagination, or Load more wording appears.
- Verify no raw resume text, raw job-description text, secrets, tokens, provider bodies, SQL text, IDs, or stack traces appear in notices.
- Clean up any synthetic records used for preview verification.

## Next step

Version 23 Step 4 should add accessible Load more or pagination for records beyond the current recent loaded saved-analysis set, without changing the selected deletion boundary or claiming account-wide controls.
