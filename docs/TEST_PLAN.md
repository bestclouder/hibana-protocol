# Test Plan

## Success scenario (manual, end-to-end)
1. Visit `/feed` without logging in → Sparks and Struggle cards visible, no login prompt
2. Click **Share a Struggle** → form opens
3. Fill title: "API key rejected", description: "I get a 401 error", select Lesson 3, submit
4. Confirm toast "Your ticket HIB-### has been created"
5. Find the ticket in `/feed` — ticket number matches
6. Open `/tickets/[id]` → status shows `open`, reaction counts visible
7. Click **I have this too** → count increments; row in `reactions` table confirmed
8. Visit `/admin/tickets` → new ticket visible
9. Click **New Cluster** → create COMMON-002, link the new ticket
10. Open cluster detail → linked ticket appears, affected count = 1
11. Click **Post Solution** → enter solution text, click **Notify Students** → confirm dialog shows 1 recipient
12. Click **Confirm** → success message; `email_notifications` row status = `sent`; `audit_logs` row created
13. Open email client for reporter → email received with correct subject and link
14. Click link → `/tickets/[id]` shows solution panel
15. Click **Solved** → ticket `resolution_status = 'solved'`, status = `resolved` in DB and UI

## Empty states
- `/feed` with no posts → shows "No posts yet. Be the first to share a Spark or Struggle."
- `/admin/tickets` with no tickets → shows "No struggles reported yet."
- Cluster detail with no linked tickets → shows "Link tickets from the ticket list to get started."

## Error states
- Submit Struggle with empty title → inline validation error, form not submitted
- Submit Struggle with network offline → error toast "Could not save. Please try again."
- Admin posts solution with no solution text → inline error "Solution cannot be empty"
- Email send fails (Resend error) → `email_notifications` row status = `failed`; admin sees error message; no silent failure

## Security checks
- Inspect browser network tab: confirm `STRIPE_SECRET_KEY` and `RESEND_API_KEY` are not present in any response
- Confirm `audit_logs` has a row for every email send and every payment event
- (Sprint 7) Confirm a logged-out POST to `/api/tickets` returns 401 after lock-down sprint