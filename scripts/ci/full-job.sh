#!/bin/sh
# Later milestones fill these in. Each step runs the real command when the
# repo has that code, and otherwise prints a placeholder and succeeds.
set -eu

echo "full: real ClamAV tests are not in the repo yet"
echo "full: web end-to-end and accessibility tests are not in the repo yet"
echo "full: Electron end-to-end tests are not in the repo yet"
echo "full: Dockerfiles are not in the repo yet, so there is no image build or compose smoke"
echo "full: backup and restore tests are not in the repo yet"

if [ "${GITHUB_EVENT_NAME:-}" = "push" ] && [ "${GITHUB_REF:-}" = "refs/heads/main" ]; then
  echo "full: edge and sha-* image push waits until the images exist"
fi
