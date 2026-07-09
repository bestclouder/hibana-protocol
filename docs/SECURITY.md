# Security

## Secrets
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` — server-side only (Vercel env vars, never in client bundle or exposed via API routes)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_URL` are the only keys safe in the browser
- No secret is logged, returned in API responses, or committed to git

## Permission model (v1)
- All tables have RLS enabled with open v1 policies — read and write allowed for all
- Admin routes (`/admin/*`) are protected by a simple role check: `role = 'admin'` on the session cookie (or env-flag for pilot); non-admin visitors are redirected to `/feed`
- Lock-down sprint replaces open RLS with `auth.uid() = user_id` owner policies

## Approved tools rule
- Only `send_solution_email` and `create_stripe_checkout_session` may perform external side-effects
- No `eval`, `run_any`, or `send_any` patterns; no dynamic tool selection
- Every call to either tool writes an `audit_logs` row before returning

## Audit principle
- Every state-changing action (ticket create, cluster link, solution post, email send, payment) writes to `audit_logs` with actor, target, and metadata
- Audit rows are append-only; no delete policy on `audit_logs`

## Payment security
- Stripe webhook signature verified server-side before any DB write
- Stop and get a human for any refund, dispute, or charge-back handling — do not automate