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

## Check that the project is wired up

```sh
npm ci
npm run verify
```

`npm run verify` checks style, types, and tests. It does not start the server.

`npm ci` installs the git hooks in `.githooks`. The pre-commit hook scans staged files with gitleaks. The pre-push hook refuses a push to `main`. Rules for agents are in `AGENTS.md`.

## Settings

`deploy/env.example` lists every setting, with placeholder values only. Do not commit a `.env` file. Real passwords stay on the server.

## Read more

The plan, the design, and the decisions are in `docs/`.
