# GitHub Projects Board

Each task is a GitHub issue added to the project board. Its column is the board's `Status` field, changed with `gh project item-edit`.

---

## 1. Board Reference

> **TODO**: The Griffier repo and project board do not exist yet. Once created, replace every `<...>` placeholder below. Look up IDs with:
> `gh project list --owner <OWNER>` and `gh project field-list <PROJECT_NUMBER> --owner <OWNER> --format json`

* **Project Board URL**: `https://github.com/users/<OWNER>/projects/<PROJECT_NUMBER>`
* **Owner**: `<OWNER>`
* **Repository**: `<OWNER>/<REPO_NAME>`
* **Project ID**: `<PROJECT_ID>`
* **Status Field ID**: `<STATUS_FIELD_ID>`
  * `Backlog`: `<BACKLOG_OPTION_ID>`
  * `Ready`: `<READY_OPTION_ID>`
  * `In progress`: `<IN_PROGRESS_OPTION_ID>`
  * `In review`: `<IN_REVIEW_OPTION_ID>`
  * `Done`: `<DONE_OPTION_ID>`

Issue titles end with the phase (e.g. `Transcription Pipeline P1`, or `P-Unscheduled`). Dependencies are written in the issue body as `Depends on #11`.

---

## 2. Runbook

### Step 2.1: Pick and Start (Status -> In progress)
1. Find the project item ID for the target issue:
   ```bash
   gh project item-list <PROJECT_NUMBER> --owner <OWNER> --format json
   ```
2. Set status to `In progress`:
   ```bash
   gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<IN_PROGRESS_OPTION_ID>"
   ```

### Step 2.2: Branch
Create the branch from `SKILL.md` section 4, choosing the base as in `references/stacked-prs.md`.

### Step 2.3: Implement and Verify
Do the work and run `SKILL.md` section 5.

### Step 2.4: Commit, PR and Hand Off (Status -> In review)
1. Commit, e.g. `feat(p1): add Groq Whisper transcription pipeline`, with `Refs #12` in the body.
2. Push and open the PR right away per `references/stacked-prs.md` section 4, with `Resolves #12` in the body.
3. Set status to `In review`:
   ```bash
   gh project item-edit --id "<ITEM_ID>" --project-id "<PROJECT_ID>" --field-id "<STATUS_FIELD_ID>" --single-select-option-id "<IN_REVIEW_OPTION_ID>"
   ```

### Step 2.5: Changes Requested
Fix it as described in `references/stacked-prs.md` section 3. The card stays in `In review`. Leave a PR comment summarising the change.

### Step 2.6: After the User Merges (Status -> Done)
Move each merged issue's card to `Done` with `<DONE_OPTION_ID>`.

---

## 3. Creating a New Task

```bash
gh issue create --repo "<OWNER>/<REPO_NAME>" --title "Speaker Diarization P-Unscheduled" --body "<goal and acceptance criteria>"
gh project item-add <PROJECT_NUMBER> --owner <OWNER> --url "<ISSUE_URL>"
```

New cards start in `Backlog`.
