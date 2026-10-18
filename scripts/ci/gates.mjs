// These match the job conditions in .github/workflows/ci.yml and scheduled.yml.
// ci.yml is the workflow source of truth; these functions are what the tests call.

export function fastRuns({ prMeta, docsOnly }) {
  return prMeta === "success" && docsOnly !== true;
}

export function fullRuns({ prMeta, docsOnly, event, isPrivate, fullCi }) {
  if (prMeta !== "success") return false;
  if (event === "workflow_dispatch") return true;
  if (docsOnly === true) return false;
  if (event === "push") return true;
  if (isPrivate !== true) return true;
  return fullCi === true;
}

export function scheduledRuns({ isPrivate, schedule }) {
  if (isPrivate !== true) return true;
  return schedule === "0 6 * * 0";
}
