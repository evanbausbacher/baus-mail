# Sync Logic Improvements Handoff

This document explains what is wrong with the current email sync logic and what an AI coding agent should change.

## Problem Summary

The current sync flow is slow for small inboxes because it does too much work per refresh:

1. It uses Resend cursor pagination incorrectly for incremental sync.
2. It fetches every email detail record individually on every sync page.
3. It writes emails to SQLite one row at a time.
4. It can spend repeated sync cycles walking pagination rather than just checking for new mail.

Relevant files:

- `src/lib/resend/client.ts`
- `src/lib/db/queries.ts`
- `src/app/api/emails/received/sync/route.ts`
- `src/app/api/emails/sent/sync/route.ts`
- `src/components/providers/PollingProvider.tsx`

## Current Issues

### 1. Cursor direction is wrong for incremental sync

The code stores `lastCursor` and passes it back to Resend as `after` during future syncs.

Current behavior in `src/lib/resend/client.ts`:

- initial sync: fetch latest page
- next sync: fetch older page via `after=lastCursor`
- next sync: fetch even older page
- eventually: stop when `has_more` is false, then reset cursor to `null`
- next sync after that: fetch latest page again

This is pagination traversal, not incremental sync.

Result:

- sync can feel slow even with very little current mail
- the app spends requests on historical pages instead of only checking for newer mail
- behavior is unstable once the cursor reaches the end of pagination

### 2. N+1 detail fetches

Current logic:

- `listReceivedEmails()` or `listSentEmails()` gets one page
- then the code calls `getReceivedEmail(id)` or `getSentEmail(id)` for every item in that page

That means one list request plus up to 100 detail requests. Even with concurrency `2`, that is very slow under a 2 req/sec API limit.

### 3. Serial DB writes

Current sync routes do:

```ts
for (const email of emails) {
  await upsertEmailRemote(email);
}
```

That adds another unnecessary per-email round trip through the database layer.

### 4. Duplicate expensive work for already-cached emails

The client re-fetches full bodies even for emails already stored locally with `html` or `text` present.

That should be avoided.

## Recommended Fixes

### Fix 1. Track the newest known email, not the last paginated page

The sync state should represent the newest email ID already known locally for each domain and type.

Recommended behavior:

- initial sync with no cursor: fetch the latest page only
- after storing that page, save the first item's ID as the sync checkpoint
- future syncs: request `before=<latestKnownId>` to fetch only items newer than the newest known email
- if no new items are returned, keep the existing checkpoint

This avoids walking old pages during normal polling.

Important: verify Resend pagination semantics before implementing. The local docs bundled in this repo indicate `after` is for moving forward through older pages and `before` is for moving backward toward newer items.

### Fix 2. Only fetch full detail for emails that are new or missing body content

Before making detail requests, query SQLite for the page of email IDs and determine whether each one already has body content.

Suggested helper in `src/lib/db/queries.ts`:

- input: `emailIds: string[]`
- output: map of `id -> hasContent`
- `hasContent` should be true if either `html` or `text` is present and non-empty

Then in `src/lib/resend/client.ts`:

- for emails already cached with content, use the list response directly
- only call the detail endpoint for new emails or incomplete cached rows

This cuts most of the slow path on recurring syncs.

### Fix 3. Batch upserts

Add a bulk upsert helper, for example:

- `upsertEmailRemotes(emails: Array<Omit<Email, 'syncedAt'>>): Promise<void>`

Implementation idea:

- build an array of insert rows
- execute one `insert(...).values([...]).onConflictDoUpdate(...)`

Then replace the per-email `for` loop in both sync routes with a single bulk call.

### Fix 4. Keep local metadata on conflict updates

When bulk-upserting remote email data, be careful not to overwrite local-only flags unless that is intentional.

Fields that should generally remain local:

- `isRead`
- `isStarred`
- `isSpam`
- `isDeleted`
- `labels`

Remote sync should update remote-derived fields like:

- `messageId`
- `from`
- `to`
- `subject`
- `html`
- `text`
- `headers`
- `attachments`
- `inReplyTo`
- `references`
- `threadId`
- `syncedAt`

### Fix 5. Do not treat `has_more` as a reason to continue on every poll

For polling, the goal is not full historical backfill every 30 seconds.

Recommended split:

- normal poll: incremental sync for new mail only
- optional manual backfill: explicit separate action if historical import is needed

If historical sync is desired, it should be implemented as a separate mode or endpoint, not mixed into the fast refresh path.

## Suggested Implementation Plan

1. Add a DB helper that returns content state for a list of email IDs.
2. Add a bulk upsert helper for remote emails.
3. Change both sync routes to use the bulk upsert helper.
4. Change `syncReceivedEmails()` and `syncSentEmails()` to:
   - use the sync state as the latest known ID
   - request `before=<latestKnownId>` for incremental sync
   - retain the prior checkpoint when no new rows are returned
   - fetch details only for emails not already cached with body content
5. Verify that polling remains fast when there are zero new emails.
6. Verify that a new incoming email appears after one poll cycle without re-walking old history.

## Verification Checklist

After implementation, test these cases:

1. Fresh domain with no local cache:
   - sync returns latest page
   - sync state stores newest known email ID

2. Immediate second sync with no new mail:
   - makes one list request
   - makes zero or near-zero detail requests
   - writes nothing or only minimal updates

3. New received email arrives:
   - next sync fetches only new items
   - newest email appears locally
   - sync state advances to the newest item

4. Cached email already has `html`/`text`:
   - sync does not refetch its detail endpoint

5. Sent mail sync behaves the same way as received mail sync.

6. Local flags remain intact after re-sync:
   - starred
   - read/unread
   - spam
   - deleted

## Nice-to-Have Follow-Ups

These are secondary and not required for the main fix:

- Add instrumentation around sync duration, API request counts, and rows upserted.
- Add a dedicated backfill endpoint for older history.
- Increase concurrency only if the Resend rate limit and retry behavior justify it.
- Reduce duplicate full refreshes on the client after sync if the UI can be updated incrementally.

## Bottom Line

The biggest wins are:

1. stop using `after` as an incremental checkpoint
2. stop fetching detail for every email every time
3. stop upserting one email at a time

Those three changes should make sync substantially faster, especially for low-volume inboxes.