# Stacked PRs

Dependent tasks form a stack. Each branch is based on the one before it, and each PR targets the branch below it, so every PR shows only its own task's changes:

```
main ── chore/p1-project-scaffolding ── feat/p1-transcription-pipeline ── feat/p1-claim-extraction
```

The board-specific parts (when to open PRs, what to put in titles) are in the active board file.

---

## 1. Choosing the Base

* **Depends on a task that isn't merged yet**: stack it on that task's branch (if several, the most recent one in the chain).
* **Independent**: base it on `main`.

## 2. Creating the Branch

* **Root task**:
  ```bash
  git switch main
  git pull origin main
  git switch -c chore/p1-project-scaffolding
  ```
* **Downstream stacked task**:
  ```bash
  git switch chore/p1-project-scaffolding
  git switch -c feat/p1-transcription-pipeline
  ```

---

## 3. Cascading Rebase (Changing an Earlier Task)

When review feedback or anything else needs a change to a branch lower in the stack:

1. Switch to that branch and add the fix as a **new commit** there, never on a branch above it. Don't amend or rewrite its existing commits: the rebase below relies on them staying the same.
   ```bash
   git switch chore/p1-project-scaffolding
   # make changes, run the SKILL.md section 5 checks
   git commit -m "fix(<task ref>): <what changed>"
   ```
2. From the **top** branch, rebase onto the changed branch. `--update-refs` moves every branch in between along with it:
   ```bash
   git switch feat/p1-claim-extraction        # top of the stack
   git rebase --update-refs chore/p1-project-scaffolding
   ```
   If the changed branch's history was rewritten anyway (amend or rebase), use its old tip from the reflog:
   ```bash
   git rebase --update-refs --onto chore/p1-project-scaffolding <old tip sha>
   ```
3. Resolve conflicts commit by commit, then run the `SKILL.md` section 5 checks on the top branch.
4. If the branches were already pushed, push every one of them:
   ```bash
   git push --force-with-lease origin chore/p1-project-scaffolding feat/p1-transcription-pipeline feat/p1-claim-extraction
   ```
5. Record the change on the board (the board file says how).

If the stack's base moved (e.g. `main` got new commits), use the same `git rebase --update-refs main` from the top branch.

---

## 4. Opening the PRs

Starting at the bottom of the stack:

1. Make sure the stack is rebased on its current base and the checks pass on the top branch.
2. Push every branch: `git push -u origin <branch>` (`--force-with-lease` if it was rebased after an earlier push).
3. Open one PR per task. The bottom PR targets `main`; each one above targets the branch below it:
   ```bash
   gh pr create \
     --repo "<OWNER>/<REPO_NAME>" \
     --base "chore/p1-project-scaffolding" \
     --head "feat/p1-transcription-pipeline" \
     --title "feat(p1): Transcription Pipeline P1" \
     --body "<goal, changes, verification>. Stacked on #<parent PR>."
   ```
4. Report the PRs to the user in merge order (bottom first).

---

## 5. Merging (User Only)

* **The user merges the stack.** PR approval, retargeting, and merging are strictly executed by the USER. The agent must never merge pull requests.
* GitHub native stacks refuse `gh pr merge` on PRs inside the stack and refuse retargeting them (422). The user merges from the top PR, which merges every PR below it into the stack's base.
* **Post-merge sync**: once the user confirms the merge, run `git switch main && git pull origin main`, rebase any remaining stack onto `main` (`git rebase --update-refs --onto main <merged bottom branch>` from its top branch), update the `base` of the next task, and continue from the clean baseline.
