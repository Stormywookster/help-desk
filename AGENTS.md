# Agent rules

Read this before changing the repo. The source of these rules is [ADR 0019](docs/adr/0019-main-guard.md), [ADR 0018](docs/adr/0018-release-tagging.md), and [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) §5. Do not invent a rule that those documents do not state.

## Bot rules (ADR 0019)

- Every change goes through a pull request, including docs-only changes.
- Squash merge only when `pr-meta` is green and `fast` is green or skipped by the docs-only rule, on the latest commit. `full` is also required when the PR has the `full-ci` label. The branch is up to date with `main`. The required `REVIEW <role>: APPROVED` comments are present. The PR title is a Conventional Commit (below).
- Never push or force-push to `main`.
- Do not merge while a `main-red` or `main-guard` issue is open, except a `fix-main` PR whose body says `Fixes #N`.
- Create tags only through the ADR 0018 release procedure (below).
- Do not pass `--no-verify`. `main-guard.yml` detects a bypass after the fact; it does not make the bypass allowed.

## Branches (plan §5.1)

- Trunk-based: `main` stays releasable. Branches are short-lived. Pull requests target `main`.
- Branch name: `cursor/<task-id>-<short-slug>`, lower case, for example `cursor/m1-t03-db-schema`. A follow-up fix uses `cursor/fix-<task-id>-<slug>`. Dependabot keeps its `dependabot/…` names.
- One task = one branch = one PR. Do not start a task whose dependencies are not merged. Build on `main`, not on another open branch.

## Pull requests (plan §5.2)

- Title: `<type>(<scope>): <summary> [<task-id>]`. Types: `feat`, `fix`, `test`, `docs`, `ci`, `chore`, `refactor`. Example: `feat(api): ticket workflow endpoints [M1-T10]`.
- The title must match `^(feat|fix|test|docs|ci|chore|refactor)(\([a-z0-9-]+\))?!?: .+ \[(M\d-T\d\d[a-z]?|fix-M\d-T\d\d)\]$` before merge. With squash merge, the PR title becomes the commit on `main`.
- Use `.github/pull_request_template.md`. The body names the author role, for example `Author: Engineer`.
- Aim for 400 changed lines or fewer, excluding generated files (`openapi/openapi.json`, `package-lock.json`, `packages/api-client` output, Prisma migration SQL, snapshots). If a task passes about 800 lines, split it and tell the Project Lead.
- Required checks: `pr-meta` green, plus `fast` green or skipped by the docs-only rule, on the latest commit. `full` is also required when the PR has the `full-ci` label. That label is mandatory for tasks that touch attachments, ClamAV, E2E, Electron, Docker or compose, or backups. Windows does not run on pull requests.
- Keep the PR in draft until its definition of done is met, then mark it ready.

## Reviews (plan §5.3)

All bots share one GitHub identity, so GitHub approvals cannot be used. A review is a pull request comment:

- `REVIEW <role>: APPROVED`
- `REVIEW <role>: CHANGES REQUESTED: …`

`<role>` is Architect, QA, Designer, Support Ops, or Project Lead. The merging agent checks that the latest comment from each required role is `APPROVED`.

| Role         | Must approve when the PR touches                                                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architect    | auth, sessions, secure links, customer-visible responses or schemas, attachments, downloads, privacy export or erase, email correction, migrations on history tables, CORS, CSP, headers, Electron security, CI permissions or workflows, deploy, backup, secrets handling |
| QA           | every PR that delivers acceptance criteria                                                                                                                                                                                                                                 |
| Designer     | Portal, Console, or Windows UI                                                                                                                                                                                                                                             |
| Support Ops  | email templates, settings that affect email, runbooks                                                                                                                                                                                                                      |
| Project Lead | M0 tasks, any scope change, M8-T03                                                                                                                                                                                                                                         |
| Brandon      | never required                                                                                                                                                                                                                                                             |

`CODEOWNERS` is advisory. It records which role must comment. It does not request a GitHub review.

The Project Lead may hold any PR by adding the `blocked` label. A held PR does not merge (plan §5.5).

## Merge (plan §5.4)

- Squash merge only. The PR title is the commit message. Delete the branch after merge.
- Merge only when the checks in "Bot rules" above are green, the required review comments are present, and no `main-red` or `main-guard` issue is open (unless this PR is the `fix-main` exception).
- Rebase onto `main` before review and again before merging.
- The agent that wrote the PR merges it once those conditions hold.
- After merge, `full` runs on `main`. If it fails, the merging agent fixes or reverts it through a pull request in the same working session. Nothing is auto-reverted.

## Beta bugs (plan §5.5a, T32)

The Project Lead files a GitHub issue labelled `beta-bug` from Brandon's chat report. The issue uses plain words and never holds passwords, tokens, or customer data. The fix is a normal task PR with a test that fails before the fix. A patch tag ships it.

## Tags (ADR 0018, plan §5.8)

Only plain SemVer tags `vX.Y.Z` are releases. There are no release-candidate tags. Bots create a tag only by this procedure:

1. Pick the commit on `main`. If `ci.yml` `full` did not succeed on that exact commit, run `ci.yml` with `workflow_dispatch` and wait until it is green. A manual run always runs `full`. This includes a docs-only tip, where `full` was skipped.
2. If Windows code changed since the last release, run the manual `desktop-windows.yml` on that commit.
3. Merge the release-notes pull request. Notes come from the Conventional Commit titles merged since the last tag. While the version is `0.x`, `feat` and breaking changes bump the minor version and `fix` bumps the patch.
4. Tag `vX.Y.Z`. The `gate` job checks the tag, that the commit is on `main`, that `full` passed on that commit, that the version is higher than the last release, and that no `main-red` or `main-guard` issue is open. `stable` moves last.

Do not move `stable` backwards. A bad release is fixed forward with a new patch tag.

## Acceptance criteria tags

A test that covers an acceptance criterion has a title of the form `[AC-XXX-nn] …`. Example: `it("[AC-LC-07] Agent sets Open → In Progress")`.

## Secrets and hooks

No secret is committed. Real values stay in the server `.env` and in Brandon's password manager. `deploy/env.example` has placeholders only.

`npm ci` runs `prepare`, which runs `npm run hooks:install` (`git config core.hooksPath .githooks`).

- `.githooks/pre-commit` runs `gitleaks protect --staged`. A finding refuses the commit. If `gitleaks` is not on `PATH`, the hook refuses the commit.
- Install gitleaks with `bash scripts/ci/install-gitleaks.sh`. The script downloads a pinned release and checks its checksum before installing. Use that script in CI and locally.
- `.githooks/pre-push` refuses every push whose remote ref is `refs/heads/main`, including a force-push or a delete.

## Parallel work (plan §5.7)

Hot files: `openapi/openapi.json`, `package-lock.json`, `packages/api-client/**`, `prisma/migrations/**`, `packages/shared/src/copy/**`. On a conflict in a generated file, take `main`'s copy and regenerate it. Do not hand-merge it.

Before starting, comment `CLAIMED <task-id>` on the milestone issue, and open a draft pull request in the first working session.

## Coding conventions (ARCHITECTURE §16.4)

- Every endpoint needs an OpenAPI schema and an auth-matrix test.
- Never log secrets.
- After an API change, regenerate `openapi.json` and the client.
- Migrations expand, then contract.
- Commit titles on the branch should follow Conventional Commits. Only the squash commit is checked.

## CI minutes (plan §6.4)

The private repo has 2,000 Actions minutes a month. ARCHITECTURE §16.3 estimates about 1,820 (about 91%), including about 150 minutes for `pr-meta` and about 45 for `main-guard`. When usage reaches 75% (1,500 minutes), the Project Lead switches `full` on `main` from every push to every 3 hours. That saves about 300 minutes and brings the month to about 1,520. Run `npm run verify` before pushing, push once the work is ready, and add the `full-ci` label only where plan §5.2 requires it. Workflow `concurrency` cancels a run that a newer push replaces.
