# ADR 0009: Attachments on a local volume, ClamAV quarantine-until-clean

**Status:** Accepted (Oct 6, 2026). Revised Oct 6, 2026 for Round 5 (B1–B10) and team decisions (T1–T10). Revised again Oct 6, 2026 for team decisions T18–T27 and the Doc Steward's consistency report.

## Context
Attachments both ways: images, PDF, text/log, ZIP; 10 MB/file, 5/message; must be malware-scanned before staff can open; kept for the life of the ticket (Q4). Self-hosted, no paid cloud.

## Decision
- Files stored on a Docker volume (`/data/attachments/quarantine` → `clean`), random UUID names, behind an `AttachmentStore` interface.
- **Over-limit requests are rejected whole (T7):** a file over `attachment_max_bytes`, more than `attachment_max_files` files, or an oversized body ends the request with `413 UPLOAD_LIMIT_EXCEEDED` (ADR 0004). Streaming stops at the first byte over the limit, partial files are deleted, and no ticket, message, or email is created.
- **Binary units (T21):** 10 MB = 10,485,760 bytes; the hard ceiling 25 MB = 26,214,400 bytes.
- Allow-list by extension **and** magic bytes (DESIGN OQ-9 list: png/jpg/jpeg/gif/webp/heic, pdf, txt/log, zip); no SVG/HTML; encrypted or oversized archives rejected.
- Worker streams each file to **ClamAV** (`clamav/clamav` container, clamd over TCP, signatures on a persistent volume, `ConcurrentDatabaseReload no`). Status `pending → clean | infected | error | rejected`. Infected files are deleted.
- Only `clean` files can be downloaded, through the API, with `Content-Disposition: attachment`, `application/octet-stream`, `nosniff`, sandbox CSP, `no-store`.

## Alternatives considered
- **Object storage (S3/B2/MinIO):** more setup or cost; can be added via the interface later.
- **Cloud scanning APIs (VirusTotal etc.):** privacy concerns (uploads customer data to third parties) and API keys.
- **Scan synchronously during upload:** slow uploads, and failures block customers; async with a quarantine state is more robust.

## Consequences
- ClamAV needs about 1.3 to 1.6 GB RAM (2 GB limit); this sets the minimum host size.
- Files show "scanning…" for a few seconds after upload.
- Attachments are included in nightly backups to the configured backup location (volume size grows with use; monitored on the health page).
