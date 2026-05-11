---
name: commit-msg
description: Draft a concise, conventional-style git commit message from the currently staged changes. Use when the user asks for help writing a commit message, says "/commit-msg", or wants to commit but hasn't decided on wording.
---

# commit-msg

Help the user craft a high-quality commit message for what is currently staged.

## Steps

1. Run `git status --short` and `git diff --staged --stat` in parallel to see what is staged.
2. If nothing is staged, tell the user and stop — do **not** auto-stage with `git add .`.
3. Run `git diff --staged` to read the actual changes.
4. Run `git log -n 10 --oneline` to learn the repo's commit-message style (prefix conventions, length, language).
5. Draft a message:
   - **Subject line**: imperative mood, ≤ 72 chars, optionally prefixed with a conventional type (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`).
   - **Body** (optional, only if non-trivial): wrap at 72 chars; explain *why* the change exists, not *what* the diff already shows.
   - Match the language of recent commits (English vs Chinese).
6. Show the draft to the user in a fenced block. **Do not run `git commit` yourself** unless the user explicitly approves.

## Output format

```
<subject>

<optional body>
```

## Rules

- Never invent changes that aren't in the diff.
- Never bundle unrelated changes into one message — if the diff spans multiple concerns, point this out and suggest splitting the commit.
- Do not add `Co-Authored-By` lines unless the user asks for them.
- Do not include emojis unless the recent log uses them.
