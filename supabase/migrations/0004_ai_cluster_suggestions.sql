-- AI cluster suggestions (docs/INTELLIGENCE_LAYER.md "Later: AI layer").
-- Suggestions are advisory only: the organiser approves or rejects each one
-- (docs/AGENTIC_LAYER.md medium-risk), and approval uses the normal
-- cluster-linking path.
alter table struggle_tickets
  add column if not exists cluster_suggestion text,
  add column if not exists cluster_suggestion_source text,
  add column if not exists cluster_suggestion_confidence numeric,
  add column if not exists cluster_suggestion_reason text,
  add column if not exists cluster_suggestion_review_status text not null default 'unreviewed';
