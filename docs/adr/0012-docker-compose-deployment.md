# ADR 0012: Docker Compose on a shared host, Caddy, pull-based updates from GHCR

**Status:** Accepted (Oct 6, 2026; amended Oct 6, 2026: private repo / private images). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T10). Revised Oct 6, 2026 for ADR 0018 (release tags, forward-only updates, pinning) and T32 (`hd support-bundle`). Revised Oct 6, 2026 for beta SSH setup.

## Context
Self-hosted in Docker on Linux (Q5). **The beta runs on Brandon's home Ubuntu VM (behind NAT), not on the VPS** (B4); the beta machine has enough RAM for ClamAV. Production on a VPS **shared with other services** (H2) is a future go-live step, with VPS sizing re-checked first. No Kubernetes. Minimal human steps. The repo `Stormywookster/help-desk` is **private** (it may become public, decision D1), so its files can't be downloaded anonymously and its GHCR images are private.

## Decision
- One **docker compose** project named `helpdesk` (namespaced containers, networks, volumes; no fixed container names), services: `web` (Caddy), `api`, `worker`, `migrate`, `backup`, `db`, `clamav`.
- Only `web` publishes a port, by default **`127.0.0.1:8380`**. DB, scanner, and API are never published. Memory/CPU limits and log rotation on every service.
- TLS modes: **A** behind the host's existing proxy (snippets for nginx/Caddy/Traefik, or join a Docker proxy network); **B** bundled Caddy owns 80/443 with automatic Let's Encrypt; **C** LAN-only HTTP for the beta on the Ubuntu VM (B4).
- CI publishes images to **GHCR**: `edge` + `sha-*` from green `main` commits; `X.Y.Z` + `stable` only from plain SemVer tags `vX.Y.Z`, with `stable` moved last (ADR 0018). Servers **pull** updates via `hd update` (pre-update backup, migrations, health check, rollback). The **beta VM tracks the `stable` channel** (each release is a beta milestone) and auto-updates hourly via a systemd timer running `hd update --auto`, which only moves forward and only to plain `X.Y.Z` versions; `sudo hd update X.Y.Z` pins a version for rollback and `sudo hd update stable` un-pins (ADR 0018), so server and matching Windows installer always arrive together (installers are built only on releases, B1). `edge` remains for bots' own test servers. Production (future) updates manually at first.
- **Beta VM SSH (Project Lead approval):** in Beta mode `install.sh` installs and enables `openssh-server`, adds `/etc/ssh/sshd_config.d/10-helpdesk.conf` (`PermitRootLogin no`, `MaxAuthTries 4`, `LoginGraceTime 30`, `X11Forwarding no`, `AllowUsers` the installing user; password login kept for the beta, key-only optional via `hd configure ssh --keys-only`), allows 22/tcp in ufw only from RFC1918 ranges, and offers a fail2ban `sshd` jail (recommended). `sshd -t` runs before every reload; `hd configure ssh --off` undoes it. The future VPS's SSH is already there, key-only, and isn't touched (ARCHITECTURE §12.6, TM-36).
- **Support bundle (T32):** `sudo hd support-bundle` writes one already-redacted file with a fixed name, `helpdesk-support-bundle.zip` (overwritten each run; creation time and versions inside), to the home folder of the user who ran `sudo` (owned by them, `0600`), or to an optional `SUPPORT_BUNDLE_DIR` (or `--to` folder) that is never inside the backup target, checked after resolving both paths with `realpath` so symlinks can't get around it, and refused at startup and at run time (T39), because that folder holds only encrypted restic data. Contents: versions, health, and the last 24 h of logs with secrets redacted and email addresses hashed; no database, attachments, or ticket text. Brandon copies it to his desktop (`scp` or SFTP) and attaches it in chat when the Project Lead asks (ARCHITECTURE §12.5, H-22, TM-34).
- **Private registry access:** each server logs in to `ghcr.io` once with a GitHub **classic** personal access token that has only `read:packages` (GHCR doesn't accept fine-grained tokens). It lives only in root's Docker config; `install.sh` prompts for it if pulls fail, `hd registry-login` replaces it, and `hd update` failures from a rejected token are emailed to admins. If the repo becomes public, packages are made public once and the token becomes unnecessary.
- **Bootstrap from the image, not from GitHub raw files:** the deploy bundle (`install.sh`, `hd`, compose files, proxy snippets) ships inside `helpdesk-server`; `docker run … helpdesk-server:<tag> export-deploy` writes it to `/opt/helpdesk`. The same commands work for private and public repos.

## Alternatives considered
- **Push deploys via SSH from GitHub Actions:** needs inbound SSH and stored server keys; impossible for the home VM without tunnels.
- **Watchtower:** unmaintained-risk, needs Docker socket access, no migration/backup hooks.
- **Kubernetes / k3s, PaaS (Coolify, Dokku):** more to learn and maintain than one admin needs.
- **`curl` the installer from raw.githubusercontent.com:** only works for public repos (or puts a repo-reading token on the command line).
- **Fine-grained read-only token:** preferred in principle, but GHCR only supports classic tokens; a classic token scoped to `read:packages` is the least privilege available.
- **Another registry (Docker Hub, self-hosted):** more accounts or more to run; GHCR is free (currently including private images) and tied to the repo.

## Consequences
- Coexists with other services without port conflicts; easy to remove (`docker compose down` + volumes).
- Brandon runs one installer command per machine; later updates need no human (staging) or one command (production).
- Requires about 4 GB free RAM on the host (mostly ClamAV).
- While private: one extra human step (H-6a, create the download token) and a token to renew if it was given an expiry. The token can only read our container images, which contain no secrets.
