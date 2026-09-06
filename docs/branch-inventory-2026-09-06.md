# Branch Inventory and Cleanup Policy

> Date: 2026-09-06  
> Issue: #252  
> Repository: skerishKang/10000-fm-stock

## 1. Current Branch Inventory

### 1.1 Merged branches (on `main`)

- `origin/main`
- `origin/HEAD -> origin/main`

**No remote branches are currently merged into `main`.**

### 1.2 Open PRs

| PR | Branch | State | Created |
|---|---|---|---|
| #254 | `docs/fmindex-strategy-and-backlog` | DRAFT | 2026-08-04 |

### 1.3 Unmerged remote branches (90+)

All remote branches are currently unmerged. The most recent activity is on `docs/fmindex-strategy-and-backlog` (2026-08-04). Full list is available via:

```bash
git branch -r --no-merged main
```

## 2. Preservation vs Deletion Candidates

### 2.1 Preservation criteria

A branch should be preserved if any of the following is true:

- It has an open PR.
- It contains commits not reachable from `main`.
- It is a long-lived integration branch (e.g., `main`, `develop`).
- It is explicitly marked as required by project documentation.

### 2.2 Current preservation list

| Branch | Reason |
|---|---|
| `docs/fmindex-strategy-and-backlog` | Open PR #254 |

### 2.3 Deletion candidates

**None at this time.** All unmerged branches have activity within the last 4 months and no branch is confirmed as obsolete.

## 3. Exact SHA Record

If deletion is approved later, record the exact HEAD SHA before removal:

```bash
git rev-parse origin/<branch-name>
```

Example for the open PR branch:

```bash
git rev-parse origin/docs/fmindex-strategy-and-backlog
```

## 4. Recovery Procedure

1. Before any deletion, tag the branch tip:
   ```bash
   git tag backup/issue-<N>-<branch> origin/<branch-name>
   git push origin backup/issue-<N>-<branch>
   ```
2. Keep the tag for at least 30 days.
3. To restore:
   ```bash
   git branch <branch-name> origin/<branch-name>
   # or from tag:
   git branch <branch-name> backup/issue-<N>-<branch>
   ```

## 5. Automatic Deletion Policy

### 5.1 GitHub setting

Enable **Automatically delete head branches** in repository settings:

- Path: `Settings` → `General` → `Merge button`
- Check: `Automatically delete head branches`

This prevents accumulation of merged branches after PR merge.

### 5.2 Branch naming convention

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/issue-<N>-<desc>` | `feature/issue-225-app-shell` |
| Fix | `fix/issue-<N>-<desc>` | `fix/issue-49-experts-dashboard` |
| Docs | `docs/issue-<N>-<desc>` | `docs/issue-252-branch-cleanup` |
| CI | `ci/issue-<N>-<desc>` | `ci/issue-134-data-validate-workflow` |
| Data | `data/issue-<N>-<desc>` | `data/issue-75-json-contract-validator` |
| Chore | `chore/issue-<N>-<desc>` | `chore/issue-178-standardize-asset-versions` |

Rules:
- Use lowercase English kebab-case.
- Include the issue number.
- Keep description 3–6 words.

### 5.3 Owner and purpose

- Each branch must trace to exactly one issue.
- The issue number in the branch name must match the linked issue.
- If a branch has no linked issue, it must be deleted or linked within 7 days.

## 6. Non-goals

- No code or data changes in this PR.
- No force push to `main`.
- No bulk deletion without human review.

## 7. Follow-up Actions

1. Enable **Automatically delete head branches** in GitHub settings.
2. Review `docs/fmindex-strategy-and-backlog` PR (#254) and merge or close it.
3. After merge, verify that the head branch is auto-deleted.
4. Schedule a quarterly branch audit (e.g., Jan, Apr, Jul, Oct).
