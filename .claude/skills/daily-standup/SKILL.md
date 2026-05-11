---
name: daily-standup
description: Generate a daily standup-style summary from the user's recent git activity across the current repo. Use when the user says "/daily-standup", asks "what did I do yesterday/today", or needs a quick report of recent work for a standup meeting.
---

# daily-standup

Produce a short standup report — *Yesterday / Today / Blockers* — grounded in real git activity.

## Steps

1. Resolve the user's git identity: `git config user.name` and `git config user.email`.
2. Pull recent activity (last 2 days by default; adjust if the user gives a window):
   - `git log --author="<user>" --since="2 days ago" --pretty=format:"%h %s" --no-merges`
   - `git log --author="<user>" --since="2 days ago" --stat --no-merges` (for file context)
3. Also check uncommitted work: `git status --short` and `git diff --stat`.
4. Group commits by day. Collapse near-duplicates ("fix typo", "address review") into the parent feature.
5. Draft the report in this format:

   ```
   **Yesterday**
   - <one-line per finished/in-flight item, past tense>

   **Today**
   - <one-line per planned item — infer from uncommitted work + obvious next steps; mark inferences with "(planned)">

   **Blockers**
   - <none / list>
   ```

6. Keep each bullet under ~15 words. The whole report should fit in a Slack message.

## Rules

- Only report what git actually shows; do **not** invent tickets, PRs, or meetings.
- If there's no activity in the window, say so plainly instead of padding.
- If the user works in multiple repos, ask which one to summarize — do not silently pick.
- Default to the language of the repo's commit log (English vs Chinese).
