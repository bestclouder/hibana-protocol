# Hibana Protocol 火花

A paid course-community tool where students post wins (**Sparks**) and report blockers as tracked tickets (**Struggles**, `HIB-###`), organisers group repeated problems into **Common Pain clusters** (`COMMON-###`) and post one solution, and every affected student gets an email — then marks their ticket **Solved** or **Still stuck**.

Built from the committed plan in [`/docs`](docs/PRD.md). v1 is a single pilot course space, demo-first: the homepage **is** the working app, no login wall.

## The core loop

1. Student submits a Struggle → gets ticket `HIB-###` in the public feed
2. Peers click *I have this too* — clusters rank by affected students
3. Organiser links tickets into a Common Pain cluster (`/admin/clusters`)
4. Organiser posts a solution → confirm dialog → email to every linked author (Resend)
5. Student clicks the email link, reads the solution, marks Solved / Still stuck
6. Every step lands in `audit_logs`

## Stack

Next.js 15 (App Router, server actions) · Tailwind v4 · Supabase Postgres · Resend · Stripe Checkout · Vercel (deploys from `main`)

## Env & keys

`vercel link && vercel env pull .env.local`. Currently provisioned: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (v1 RLS is intentionally open, so the anon key covers all app writes).

**Not yet provisioned — features degrade loudly, not silently:**

| Key | Unlocks |
|---|---|
| `RESEND_API_KEY` (+ optional `RESEND_FROM`) | Solution notification emails (until then, sends are recorded as `failed` in `email_notifications` and the admin sees the error) |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (+ optional `STRIPE_PRICE_ID`) | `/pricing` checkout (until then the Buy button explains payments aren't configured) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sprint 7 lockdown + a storage bucket for image uploads (until then, uploads fall back to an image-URL field) |

## Sprint 7 — Lock it down (pending, deliberately)

Per the build rules, auth + per-user isolation ships **before real users/data**, after the pilot demo phase. The RLS migration is ready at [`supabase/migrations/0002_lock_it_down.sql`](supabase/migrations/0002_lock_it_down.sql) — read its header for the apply checklist (service-role key → auth UI + invite flow → apply). Applying it earlier would break anonymous demo posting on purpose.

## Local dev

```bash
npm install
npm run dev   # http://localhost:3000
```
