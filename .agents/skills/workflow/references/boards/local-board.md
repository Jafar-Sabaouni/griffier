# Local Board

The board lives in `.agents/project_board/`. Each task is one markdown file. Its column is the folder it sits in:

```
backlog/  →  ready/  →  in_progress/  →  review/  →  done/
```

- **backlog**: not ready to work on. Don't pick these up.
- **ready**: available. The agent picks tasks from here.
- **in_progress**: being worked on. At most one task at a time.
- **review**: work is done and waiting for the user.
- **done**: approved by the user. Only the user moves tasks here (or tells the agent to).

Move a task with `mv` between folders. Never copy it. Every folder keeps a `.gitkeep` so empty columns survive.

---

## 1. Task File Format

Filename: `T-NNN-short-slug.md`. New tasks use the next free `T-NNN` id across all folders.

```markdown
---
id: T-012
title: Short title
phase: p1                # p1, p2, ... or p-unscheduled
depends_on: [T-011]      # task ids this builds on; [] if none
branch:                  # filled in by the agent
base:                    # branch this was cut from; filled in by the agent
pr:                      # PR URL once opened
---

## Goal
What should be true when this is done.

## Acceptance
- [ ] Concrete, checkable items

## Notes
Agent log, dated: decisions, open questions, what was verified.
```

---

## 2. Runbook

### Step 2.1: Pick and Start
1. Choose from `ready/`, lowest id first, unless the user names a task.
2. Skip a task whose `depends_on` includes a task still in `backlog/` or `ready/`.
3. Start it:
   ```bash
   mv .agents/project_board/ready/T-012-*.md .agents/project_board/in_progress/
   ```

### Step 2.2: Branch
Create the branch from `SKILL.md` section 4, choosing the base as in `references/stacked-prs.md`. Write `branch` and `base` into the frontmatter.

### Step 2.3: Implement and Verify
Do the work and run `SKILL.md` section 5. Tick the acceptance items that are met.

### Step 2.4: Independent Agent Review
Invoke a separate reviewer subagent per `SKILL.md` section 5.1. Resolve any blocking findings and re-run verification until the reviewer returns `APPROVE`.

### Step 2.5: Commit and Hand Off
1. Commit on the task branch with the task id, e.g. `feat(T-012): add transcription pipeline`.
2. Add a dated Notes entry: what changed, how it was verified, reviewer verdict (and fixes made), and any open questions.
3. Move it to review:
   ```bash
   mv .agents/project_board/in_progress/T-012-*.md .agents/project_board/review/
   ```
4. Go back to Step 2.1.

### Step 2.6: Changes Requested
Move the task back to `in_progress/`, make the fix as described in `references/stacked-prs.md` section 3, re-run verification and reviewer check, then move it back to `review/` with a Notes line. Tasks stacked above it stay in `review/` with a Notes line saying they were rebased.

---

## 3. Pull Requests

PRs are only opened for tasks in `done/`, and only when the user asks:

1. Group the tasks in `done/` into stacks using their `depends_on` / `base` chain. An independent task is a stack of one.
2. **Only open PRs for a stack when every task in it is in `done/`.** Otherwise open none for that stack and tell the user which tasks are holding it up.
3. Open the PRs per `references/stacked-prs.md` section 4, using the title `T-012: <title>` and a body built from the task's Goal and Notes.
4. Write each PR URL into the task's `pr` field.
