export type VercelDeployment = {
  url?: string;
  alias?: string[];
  readyState?: string;
  state?: string;
  target?: string;
  meta?: Record<string, string | undefined>;
  gitSource?: { sha?: string };
};

export type VerifyVercelConfig = {
  baseHost: string;
  expectedCommit: string;
  vercelToken: string;
  vercelTeamId?: string;
};

export type VerifyVercelResult = {
  testedCommit: string;
};

export function deploymentMatchesHost(
  deployment: VercelDeployment,
  baseHost: string,
): boolean {
  return (
    deployment.url === baseHost || Boolean(deployment.alias?.includes(baseHost))
  );
}

export function extractDeploymentCommitSha(
  deployment: VercelDeployment,
): string | undefined {
  return (
    deployment.meta?.githubCommitSha ||
    deployment.gitSource?.sha ||
    deployment.meta?.gitlabCommitSha ||
    deployment.meta?.bitbucketCommitSha
  );
}

export function deploymentIsReady(deployment: VercelDeployment): boolean {
  if (deployment.readyState === "READY") {
    return true;
  }
  if (deployment.readyState === undefined && deployment.state === "READY") {
    return true;
  }
  return false;
}

export function buildVercelDeploymentLookupUrl(config: VerifyVercelConfig): string {
  const query = new URLSearchParams({
    withGitRepoInfo: "true",
  });
  if (config.vercelTeamId) {
    query.set("teamId", config.vercelTeamId);
  }
  return `https://api.vercel.com/v13/deployments/${encodeURIComponent(
    config.baseHost,
  )}?${query.toString()}`;
}

export async function verifyVercel(
  config: VerifyVercelConfig,
  fetchFn: typeof fetch = fetch,
): Promise<VerifyVercelResult> {
  const response = await fetchFn(buildVercelDeploymentLookupUrl(config), {
    headers: {
      Authorization: `Bearer ${config.vercelToken}`,
    },
  });

  if (response.status !== 200) {
    throw new Error(
      `Vercel deployment lookup failed with HTTP ${response.status}`,
    );
  }

  const deployment = (await response.json()) as VercelDeployment;

  if (!deploymentMatchesHost(deployment, config.baseHost)) {
    throw new Error(
      "Vercel deployment URL or alias does not match QA_BASE_URL hostname.",
    );
  }

  if (!deploymentIsReady(deployment)) {
    const state = deployment.readyState ?? deployment.state ?? "unknown";
    throw new Error(`Vercel deployment is not Ready: ${state}`);
  }

  if (deployment.target !== "production") {
    throw new Error(
      `Vercel deployment target is not production: ${deployment.target ?? "unknown"}`,
    );
  }

  const testedCommit = extractDeploymentCommitSha(deployment);
  if (!testedCommit) {
    throw new Error("Vercel deployment did not expose a Git commit SHA.");
  }

  if (testedCommit !== config.expectedCommit) {
    throw new Error(
      `Vercel commit mismatch: tested ${testedCommit}, expected ${config.expectedCommit}`,
    );
  }

  return { testedCommit };
}
