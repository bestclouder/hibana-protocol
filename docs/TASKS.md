# Tasks

## Sprint 1 — Database, seed data, public feed
**Goal**: App renders real data for anonymous visitors. No dead screens.

- [ ] Apply migration SQL to Supabase (tables, RLS, seed rows)
- [ ] Scaffold Next.js 14 project, install Tailwind + shadcn/ui, connect Supabase client
- [ ] `/feed` page: fetch and render Spark cards + Struggle ticket cards, lesson filter sidebar
- [ ] Loading skeleton, empty state ("Be the first to post!"), error state ("Could not load feed")
- [ ] Deploy to Vercel; confirm feed loads with seed data

**Definition of Done**: visiting `/feed` on the deployed URL shows the seed Sparks and Struggles without logging in.

---

## Sprint 2 — Core engine: Spark + Struggle submission
**Goal**: Any visitor can submit a Spark or Struggle; data persists and appears in feed.

- [ ] Submit Spark form: title, description, lesson select, image upload (Supabase Storage)
- [ ] Submit Struggle form: title, description, lesson select, optional image upload
- [ ] Server action auto-generates `HIB-###` ticket number (count + 1 in space)
- [ ] `/tickets/[id]` detail page: full ticket, status badge, comments, reactions
- [ ] Reaction buttons (6 types) write to `reactions` table on click; count updates live
- [ ] Comment form on Spark and Struggle detail pages; persists to `comments`
- [ ] All form states: loading spinner, success message, validation error, server error

**Definition of Done**: submit a Struggle → ticket HIB-### appears in feed → open detail page → click *I have this too* → count increments in DB and UI without refresh.

---

## Sprint 3 — Admin dashboard and Common Pain clustering
**Goal**: Admin can see all tickets and group them into clusters.

- [ ] `/admin` dashboard: Spark count, Struggle count, open ticket list, tickets by lesson
- [ ] `/admin/tickets`: full table, filter by status and lesson, link to ticket detail
- [ ] Create Common Pain cluster form: title, summary, lesson, auto-generates COMMON-###
- [ ] Link tickets to cluster: multi-select on cluster detail page → updates `cluster_id` on tickets
- [ ] Cluster detail page: linked tickets, affected student count, status, solution panel (empty)
- [ ] All admin pages: loading, empty, error states

**Definition of Done**: admin creates cluster COMMON-001, links HIB-001 and HIB-002, both tickets show `cluster_id` in DB and appear on cluster detail page.

---

## Sprint 4 — Solution posting + email notification ★ v1 functional milestone
**Goal**: End-to-end core workflow works in production.

- [ ] Admin posts solution on cluster detail page (rich text + optional link) → writes `solution_body`, `solution_posted_at`, updates cluster `status` to `solution_posted`
- [ ] Supabase Edge Function `send_solution_email`: triggered by admin action, queries linked ticket authors, sends email via Resend, writes `email_notifications` rows and `audit_logs` entry
- [ ] Email template: subject "A solution has been posted for your issue [HIB-###]", body with link to `/tickets/[id]`
- [ ] `/tickets/[id]` shows solution panel when `solution_posted_at` is set
- [ ] Student clicks Solved or Still Stuck → writes `resolution_status` to ticket, updates status
- [ ] Confirmation dialog before sending: shows recipient count, requires admin click to confirm

**Definition of Done**: full flow from ticket creation → cluster → solution → email → student resolves runs without manual DB intervention and is visible in the UI and `audit_logs`.

---

## Sprint 5 — Checkout page
**Goal**: Course creator can pay for access from day one.

- [ ] `/pricing` page: plan name "Hibana Protocol — Pilot Plan", price, feature list, Buy Now button
- [ ] Next.js API route creates Stripe Checkout session (secret key server-side only)
- [ ] Success page `/checkout/success` and cancel page `/checkout/cancel`
- [ ] Stripe webhook handler verifies signature, logs to `audit_logs`
- [ ] No Stripe secret key in client bundle — confirmed via bundle analysis

**Definition of Done**: clicking Buy Now opens Stripe Checkout; completing test payment logs event in `audit_logs`; cancelling returns to `/pricing`.

---

## Sprint 6 — Lesson Reflections and feed polish
**Goal**: Reflections visible; admin can feature top Sparks.

- [ ] Lesson Reflection form: lesson, main takeaway, what was confusing, confidence rating (1–5)
- [ ] Reflections tab on lesson detail page `/lessons/[id]`
- [ ] Admin toggle: mark Spark as featured → appears pinned at top of feed
- [ ] Lesson detail page: Sparks, Struggles, Reflections counts and lists

**Definition of Done**: submit reflection → appears on lesson page; admin marks Spark featured → it renders first in feed.

---

## Sprint 7 — Lock it down (auth + per-user isolation)
**Goal**: Real users can sign up; data is owner-scoped; admin routes are protected.

- [ ] Supabase Auth: email/password signup and login for students and organiser
- [ ] Replace all v1 open RLS policies with `auth.uid() = user_id` owner-scoped policies
- [ ] Attach `user_id` to all inserts after login
- [ ] Protect `/admin/*` routes: only users with `role = 'admin'` may access
- [ ] Invite link flow: student visits `/join/[invite_code]` → prompted to sign up → added to space
- [ ] Student profile `/profile`: post history, tickets reported, issues followed

**Definition of Done**: logged-out user cannot write to DB via API; admin route returns 403 for non-admin; two different student accounts cannot see each other's private data.

---

## Gantt (sprint → weeks)
```
Sprint 1  — Week 1
Sprint 2  — Week 1
Sprint 3  — Week 2
Sprint 4  — Week 2  ★ v1 functional
Sprint 5  — Week 3
Sprint 6  — Week 3
Sprint 7  — Week 4
```