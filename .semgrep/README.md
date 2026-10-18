# Vendored Semgrep rules

Source packs: `p/secrets` and `p/javascript`, fetched from the Semgrep Registry on 2026-10-18.

- `secrets.yml` from `https://semgrep.dev/c/p/secrets`
- `javascript.yml` from `https://semgrep.dev/c/p/javascript`

These rules are under the Semgrep Rules License. The license text is in `LICENSE`.

`secrets.yml` includes two `# gitleaks:allow` comments, on the private-key pattern and the Slack webhook placeholder. Those lines are the patterns the rules detect, not credentials. The rest of each pack is the registry file.
