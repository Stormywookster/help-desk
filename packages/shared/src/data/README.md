# Common-password list

Offline list for the staff password check (ARCHITECTURE §7, TM-4). `password.ts` imports `COMMON_PASSWORDS` from `common-passwords.ts`.

## Source

SecLists, Common-Credentials, xato-net top 1,000,000:

https://github.com/danielmiessler/SecLists/blob/c205c36a445bff37f8e58a9ec829105cd4975c58/Passwords/Common-Credentials/xato-net-10-million-passwords-1000000.txt

- Repository commit: `c205c36a445bff37f8e58a9ec829105cd4975c58` (2025-05-08), the commit that placed this file in `Passwords/Common-Credentials`.
- Fetched: 2026-10-22.
- Source file sha256: `424a3e03a17df0a2bc2b3ca749d81b04e79d59cb7aeec8876a5a3f308d0caf51`.

The published top 100,000 cut is a prefix of this file (`xato-net-10-million-passwords-100000.txt`, formerly also named `10-million-password-list-top-100000.txt`). SecLists removed that duplicate name in commit `4ff3ff8ef6b1c429db800e4a9b9deeac7425c5b6` (2025-05-08). After the filter below, the top 100,000 cut has 70 entries. This bundle uses the top 1,000,000 cut of the same list so the filtered set stays large enough for the check.

## License

MIT. Copyright (c) 2018 Daniel Miessler. The license text is in `LICENSE` next to the data file.

## Filter

Applied in source order, with no added entries:

- Drop blank lines.
- Keep an entry when its length is 15 to 128 characters. Length is JavaScript UTF-16 code units, the same length `checkPassword` uses.
- Deduplicate case-insensitively, keeping the first spelling in the source. `checkPassword` lowercases both the password and these entries before comparing, so a different-case spelling of a kept entry is rejected.

## Count

10,898 entries.
