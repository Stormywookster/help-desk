# Help Desk

Help Desk is a support tool for one company. A customer sends a ticket from a website. Staff read and answer tickets in a Windows app. The program runs on one Linux computer.

This repository holds that program. The pieces install together:

- `apps/api` is the server.
- `apps/portal` is the customer website.
- `apps/console` is the staff website.
- `apps/desktop` is the Windows app.
- `packages/shared` holds rules used by the server and the websites.
- `packages/api-client` is how the websites talk to the server.
- `packages/ui` holds shared website pieces.

Those folders are ready. The product itself is not built yet.

## What you need

[Node.js](https://nodejs.org/) 24. The file `.nvmrc` records that.

## Set up a development machine

```sh
bash scripts/dev-setup.sh
. ~/.helpdesk-node.sh
npm ci
npm run verify
```

`scripts/dev-setup.sh` installs and starts PostgreSQL 17 and Mailpit, and creates the `helpdesk` and `helpdesk_test` databases. It is safe to run again. `. ~/.helpdesk-node.sh` puts Node 24 on `PATH` (the script writes that file).

`npm run verify` checks style, types, unit tests, integration tests, the OpenAPI contract, the build, and branding. Until integration tests and `openapi/openapi.json` exist, those two steps pass and say they did nothing.

`npm run ac:report` prints which acceptance criteria have a tagged test. `node scripts/check-branding.mjs` fails if code, templates, or UI strings hard-code the site or company name.

Machines with Docker can start PostgreSQL, Mailpit, and ClamAV with `docker compose -f deploy/compose.dev.yaml up`. Cloud agents use the shell script.

`npm ci` installs the git hooks in `.githooks`. The pre-commit hook scans staged files with gitleaks. The pre-push hook refuses a push to `main`. Rules for agents are in `AGENTS.md`.

## Settings

`deploy/env.example` lists every setting, with placeholder values only. Do not commit a `.env` file. Real passwords stay on the server.

## Read more

The plan, the design, and the decisions are in `docs/`.
