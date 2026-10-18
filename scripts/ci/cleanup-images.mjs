import { pathToFileURL } from "node:url";

export const IMAGE_NAMES = ["helpdesk-server", "helpdesk-web"];
export const SHA_KEEP = 30;

export function versionsToDelete(versions, keep = SHA_KEEP) {
  const shaOnly = versions.filter((version) => {
    const tags = version.metadata?.container?.tags ?? [];
    return tags.length > 0 && tags.every((tag) => tag.startsWith("sha-"));
  });
  shaOnly.sort(
    (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
  );
  return shaOnly.slice(keep);
}

async function api(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers ?? {}),
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(
      `GitHub ${response.status} ${path}: ${await response.text()}`,
    );
  }
  if (response.status === 204) return null;
  return response.json();
}

async function versions(token, owner, name) {
  const out = [];
  for (let page = 1; page < 20; page += 1) {
    const batch = await api(
      token,
      `/users/${owner}/packages/container/${name}/versions?per_page=100&page=${page}`,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const owner = (process.env.GITHUB_REPOSITORY ?? "").split("/")[0];
  if (!token || !owner) throw new Error("cleanup: missing GitHub context");
  for (const name of IMAGE_NAMES) {
    const found = await versions(token, owner, name);
    if (!found) {
      console.log(`cleanup: ${name} is not published yet`);
      continue;
    }
    const stale = versionsToDelete(found);
    for (const version of stale) {
      await api(
        token,
        `/users/${owner}/packages/container/${name}/versions/${version.id}`,
        { method: "DELETE" },
      );
      console.log(`cleanup: deleted ${name} version ${version.id}`);
    }
    console.log(`cleanup: ${name} removed ${stale.length} sha tag version(s)`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
