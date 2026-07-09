# Architecture

## Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Postgres, RLS, Storage, Edge Functions)
- **Email**: Resend (triggered from Supabase Edge Function)
- **Payments**: Stripe Checkout (server-side session creation)
- **Hosting**: Vercel

## What's built now vs later
**Now**: public feed, Spark/Struggle submission, ticket auto-numbering, admin cluster + solution tools, email notification, Stripe checkout page.
**Later**: auth + per-user isolation, lesson reflections, featured sparks, multi-org, AI clustering.

## Key Action Flow — Struggle to Solution
1. Student fills Submit Struggle form → Next.js API route validates input
2. Supabase inserts row into `struggle_tickets`, generates `HIB-###` via count+1 in space
3. Ticket appears in `/feed` and `/admin/tickets`
4. Other students click *I have this too* → row inserted in `reactions`
5. Admin opens `/admin/clusters`, creates or selects a `common_pain_clusters` row
6. Admin links ticket → `struggle_tickets.cluster_id` updated
7. Admin posts solution → `solution_body` + `solution_posted_at` written to cluster row
8. Supabase Edge Function triggers on cluster update, queries all linked ticket authors, sends email via Resend, logs to `email_notifications`
9. Student clicks email link → `/tickets/[id]` shows solution panel
10. Student clicks Solved → `resolution_status = 'solved'` written to ticket row

## Layer Order
1. **Data**: tables + constraints + RLS policies (truth lives in Postgres)
2. **App logic**: Next.js server actions / API routes — ticket numbering, cluster linking, notification trigger
3. **Smart features (later)**: AI-assisted cluster suggestions, pain-point scoring

Core workflow runs completely without any AI layer.