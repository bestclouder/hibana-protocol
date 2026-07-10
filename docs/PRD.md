# Hibana Protocol — PRD

## Problem
Online course students struggle alone: they don't know if others share their blockers, they get no structured follow-up, and course creators can't see where the cohort is stuck. Hibana fixes this by turning individual struggles into tracked tickets, grouping them into common pain clusters, and notifying students when the organiser posts a solution.

## Target Users
- **Students** (primary daily users): share wins (Sparks), report blockers (Struggles), follow their tickets, react to peers.
- **Course organiser / admin** (paying customer): reviews tickets, clusters repeated problems, posts solutions, emails affected students, reads analytics.

v1 is a single pilot course space.

## Core Objects
`CourseSpace` → `Lessons` → `SparkPosts` / `StruggleTickets` → `CommonPainClusters` → `EmailNotifications` → `Reactions` / `Comments` / `LessonReflections` / `AuditLogs`

## MVP Must-Haves
- [ ] Public feed shows Sparks and Struggles with lesson tags (no login wall)
- [ ] Submit Spark form persists to DB and appears in feed
- [ ] Submit Struggle form creates a HIB-### ticket and appears in feed
- [ ] Ticket detail page shows status, comments, reactions
- [ ] Reaction buttons (6 types) write to DB
- [ ] Admin dashboard: counts, ticket list, filter by lesson/status
- [ ] Admin creates Common Pain cluster and links tickets
- [ ] Admin posts solution to cluster
- [ ] Email sent to all students linked to that cluster (via Resend)
- [ ] Student marks ticket Solved or Still Stuck
- [ ] Basic analytics panel on admin dashboard
- [ ] Checkout page for the Pilot Plan (Stripe)

## Non-Goals (v1)
Multi-tenant SaaS, mobile app, LMS integrations, AI auto-clustering, gamification, DMs, video hosting, complex billing.

## Definition of Done
A student submits a Struggle, receives ticket HIB-###, the admin links it to a Common Pain cluster, posts a solution, the student receives an email, clicks the link, and marks it Solved — all actions visible in the DB and UI without a code change or manual seed.