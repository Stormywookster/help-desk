# ADR 0013: Nightly encrypted backups with restic to a location Brandon controls; weekly automatic restore test

**Status:** Accepted (Oct 6, 2026). Revised Oct 6, 2026 for Round 5 (B2).

## Context
H4 (LOCKED): nightly backup of database + attachments to a second location Brandon controls. B2 (LOCKED): for the beta, Brandon handles and stores backups himself. The system must back up automatically on a schedule to a **configurable location** (for example a local path or mounted drive). An off-site target such as Backblaze B2 is optional and comes later. Default retention is 7 daily / 4 weekly / 12 monthly, configurable. Brandon can't debug a broken restore, so restores must be proven automatically.

## Decision
- A `backup` container (same server image, with `postgresql-client` and `restic`) runs at 03:00 ET (`BACKUP_CRON`). It writes `pg_dump -Fc` + clean attachments + branding logo + `.env` into a **restic** repository, encrypted client-side with `RESTIC_PASSWORD`. It also runs before every `hd update` and on `hd backup-now`.
- **Primary target: `BACKUP_TARGET_DIR`** (default `/var/backups/helpdesk`) bind-mounted into the container, holding the repository at `<dir>/restic`. It can be a folder, a mounted drive, or an SMB/NFS share that `hd configure backup` mounts (credentials root-only).
- **Safety checks:**
  - A marker file `.helpdesk-backup-target` must exist, so an unmounted drive makes the backup fail loudly instead of filling the VM's disk.
  - Same-filesystem-as-data warning.
  - Free-space alert below 10%.
  - 26-hour no-backup alert.
- **Optional off-site copy (later):** `BACKUP_OFFSITE_REPOSITORY` (B2/S3 or SFTP) plus credentials via `hd configure backup-offsite`. After each local backup, `restic copy` replicates the snapshots; the local flow is unchanged.
- **Retention:** `BACKUP_KEEP_DAILY/WEEKLY/MONTHLY` = 7/4/12 by default, configurable, applied with `restic forget --prune` to every repository.
- `hd restore` performs a guided full restore.
- **Weekly automatic restore test** from the local repository into a throwaway database, with row-count and file-hash checks. If an off-site repository exists, the first test each month uses it. Results go to `backup_runs` and failures are emailed. CI tests the round trip against a local repository.

## Alternatives considered
- **Backblaze B2 as the default target** (draft 2): needs an account and keys up front; B2 makes it optional and later.
- **Plain tar/rsync to the path:** no deduplication, encryption, or retention logic; restic gives all three for local and remote targets alike.
- **VPS provider snapshots:** not "a location Brandon controls", provider-specific, and not available for the home VM.
- **Borg:** excellent, but its remote side needs a Borg server; restic handles local paths, SFTP, and S3/B2 with one tool.

## Consequences
- The beta needs no cloud account. Protection against a disk failure depends on Brandon choosing (or copying to) a separate drive; the installer and health page say so plainly.
- Losing `RESTIC_PASSWORD` makes backups unreadable, so a human must store it off-server.
- Erased personal data persists in backups until it ages out (up to 12 months at the defaults).
- Moving from the VM to the future VPS means installing, pointing at the same location or the off-site copy, and running `hd restore latest`.
