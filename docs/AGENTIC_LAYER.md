# Agentic Layer

## Risk levels

### Low — auto (no approval)
- Generate ticket number HIB-### on insert
- Calculate `affected_student_count` on reaction insert
- Update `last_updated_at` on ticket change

### Medium — light approval (admin confirms)
- Suggest cluster assignment for a ticket (AI, later)
- Draft solution body from linked ticket descriptions (AI, later)
- Update ticket status to `linked_to_cluster` when admin links it

### High — admin must explicitly submit
- **Send email notifications**: admin clicks "Post Solution & Notify Students" → confirmation dialog shows recipient count → admin confirms → Edge Function sends emails → `email_notifications` rows written → `audit_logs` entry created
- Stripe Checkout session creation

### Critical — human only, never automated
- Delete a ticket or cluster
- Refund a payment
- Bulk-close all tickets

## Named tools (v1)
- `send_solution_email(cluster_id)` — Supabase Edge Function, server-side only, logs every send
- `create_stripe_checkout_session(plan_id)` — Next.js API route, secret key server-side only

## Audit log fields
`action` | `target_type` | `target_id` | `actor_email` | `metadata` (JSON: recipient count, cluster_id, plan) | `created_at`

## v1 vs later
v1: only `send_solution_email` is agentic. Later: AI cluster suggestion pipeline with draft → approval → assign flow.