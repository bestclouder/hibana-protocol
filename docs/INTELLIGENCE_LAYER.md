# Intelligence Layer

## Messy inputs
- Free-text struggle descriptions with inconsistent vocabulary
- Students choosing wrong or no lesson
- Duplicate reports of the same issue worded differently

## v1: Rule-based structure (no AI)
- Ticket number auto-assigned: `count(tickets in space) + 1`, zero-padded to HIB-###
- Cluster number auto-assigned: COMMON-### same way
- `affected_student_count` = count of `i_have_this_too` reactions on linked tickets + 1 (reporter)
- `resolution_rate` = resolved tickets / total linked tickets × 100
- Admin dashboard ranks clusters by `affected_student_count` descending

## Events to track (feed into analytics)
- `ticket.created` — lesson, author, timestamp
- `reaction.i_have_this_too` — ticket, lesson, count
- `cluster.solution_posted` — lesson, affected count, time-to-resolve
- `ticket.resolution_status` set — solved vs still_stuck rate

## Later: AI layer
```json
{
  "ticket_id": "HIB-005",
  "title": "API key rejected on step 4",
  "cluster_suggestion": "COMMON-001",
  "cluster_suggestion_source": "openai/gpt-4o",
  "cluster_suggestion_confidence": 0.91,
  "cluster_suggestion_review_status": "unreviewed"
}
```
Admin reviews suggestion → approves or rejects → `review_status` updated → action logged.

## Ranking (v1)
Admin ticket list sorts by: unresolved first, then `i_have_this_too` count descending, then created_at ascending.