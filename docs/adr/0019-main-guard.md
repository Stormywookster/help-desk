# ADR 0019: `main-guard.yml` detects and alerts; it doesn't auto-revert

**Status:** Accepted (Oct 6, 2026). Answers IMPLEMENTATION_PLAN Q-P4 (architect decision, with the Project Lead). Revised Oct 6, 2026 for Doc Steward CR-35 (always-on `pr-meta`; docs-only PRs accepted only after re-classification).

## Context
- The repo is private on GitHub Free, so branch protection and rulesets aren't available (H-4). The merge gate is a convention in `AGENTS.md` plus a local `pre-push` hook. A hook can be skipped (`--no-verify`, a fresh clone without `npm ci`, a web-UI edit).
- All bots act through one GitHub identity (T31), so a check can't tell bots apart. It can still tell whether a commit came from a merged PR with a green check.
- The CI budget is about 2,000 minutes a month on the private repo (ARCHITECTURE §16.3), so the guard has to be cheap.

## Decision
- **`main-guard.yml`, two small jobs, no secrets** (`GITHUB_TOKEN` with `contents: read`, `pull-requests: read`, `checks: read`, `actions: read`, `issues: write`):
  1. **`provenance`** (on every `push` to `main`, no path filter, about 1 billed minute): for each pushed commit, it requires a merged PR whose merge commit is that commit (`GET /commits/{sha}/pulls`), with, on the PR's last head commit, **`pr-meta` green** and **`fast` green, or `fast` skipped and the PR docs-only**. For a skipped `fast`, `provenance` re-fetches the merged PR's file list from the API (`GET /pulls/{n}/files`) and classifies it with the same `scripts/ci/docs-only.mjs` and `.github/docs-only-paths.txt` that `pr-meta` uses. It doesn't trust the run's own output, so code can't pass as docs-only. A change to the list file is never docs-only. It also checks that the required `REVIEW <role>: APPROVED` comments are on the merged PR. This check lives here, after the merge, because comments arrive after CI has run, and re-running a job on every comment would cost minutes. It also flags force pushes (`forced: true`) and pushes that delete or rewrite history. On a violation it fails loudly and opens (or comments on) one issue labelled **`main-guard`**, naming the commit, the problem, and the fix: revert through a PR, or confirm and close.
  2. **`status`** (on `workflow_run` of `ci.yml` completing on `main`; runs **only when the conclusion is `failure`**): it opens or updates one issue labelled **`main-red`**, with the failed job and run link. The fix PR says `Fixes #N`, so the issue closes when it merges. If the next `main` run fails again, the issue reopens.
- **Release block:** `release.yml`'s `gate` job refuses to publish while any `main-red` or `main-guard` issue is open (ADR 0018).
- **No auto-revert.** A bot pushing a revert to `main` would itself be a direct push (tripping the guard), would need `contents: write`, and would revert good work on a flaky test. The plan already makes the merging agent fix or revert through a PR within its session (IMPLEMENTATION_PLAN §5.4).
- **Bot-side rule (`AGENTS.md`):**
  - Every change goes through a PR, docs-only changes included.
  - Squash merge only when **`pr-meta` is green and `fast` is green or skipped by the docs-only rule** on the latest commit (and `full` too when the PR has the `full-ci` label), the branch is up to date, and the required `REVIEW <role>: APPROVED` comments are present (T31).
  - Never push or force-push to `main`.
  - Don't merge while a `main-red` or `main-guard` issue is open, except the fix itself (label `fix-main`, body `Fixes #N`).
  - Create tags only through the release procedure (ADR 0018).
  - PR titles follow Conventional Commits (T30). The always-on `pr-meta` job checks the title, so docs-only PRs are checked too (CR-35).
- **`pr-meta` (in `ci.yml`, CR-35):** runs on every PR event and `main` push with no path filter and no condition. It does the title check (T30), gitleaks on the diff (B1), and docs-only classification; `fast` and `full` need it. The docs-only list is defined only in `.github/docs-only-paths.txt` (ARCHITECTURE §16.3).
- **Cost:** `provenance` about 40 pushes × 1 minute, plus `status` about 5 failures × 1 minute, so **about 45 minutes a month**. `pr-meta` adds about 150 minutes a month (ARCHITECTURE §16.3). Skipped jobs aren't billed.

## Alternatives considered
- **Auto-revert on failure:** rejected for the reasons above.
- **Fold the guard into `ci.yml`:** the check would run inside the workflow it's checking, and would need `issues: write` there. A separate workflow keeps the permissions apart.
- **Only accept a skipped `fast` without re-checking the files (CR-35, first idea):** a mislabelled or hand-edited run could pass code off as docs-only.
- **Run `status` on every CI completion so it can close issues itself:** about 40 more minutes a month for something `Fixes #N` does for free.

## Consequences
- A bypass or a red `main` is visible within minutes as an issue, and releases stop until it's handled. Nothing is ever pushed by the guard itself.
- If the repo becomes public (or moves to a paid plan), H-4 adds a real ruleset. The guard stays as a cheap second check.

## Addendum (2026-10-18): bootstrap rule
`provenance` skips commits that are ancestors of, or equal to, a fixed bootstrap commit: the tip of `main` just before PR #6 merges (currently `0cf10a91`; if `main` moves first, update it in the PR). That SHA is recorded once in `.github/main-guard-bootstrap.txt`, and the check is `git merge-base --is-ancestor <commit> <bootstrap>`. This covers the M0 commits from before CI (#1 to #4). PR #6's own merge commit is not skipped: it has `pr-meta`, `fast` and REVIEW comments, so it is checked normally and serves as the guard's first real test.
The rule "skip when the parent has no `main-guard.yml`" is rejected. Under it, a commit that deletes or renames the guard would make every later commit skip, which is a permanent silent bypass (TM-35).
The bootstrap file is never docs-only, and only a reviewed PR may change it. Any change to it after the first merge opens a `main-guard` issue. If `main-guard.yml` disappears from `main`, `provenance` can no longer run, so the release gate (ADR 0018) refuses to tag while the file is missing.
