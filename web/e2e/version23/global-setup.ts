import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { loadQaConfig, safeConfigSummary } from "./helpers/config";
import { persistRunMeta } from "./helpers/manifest";
import { writeReport, writeSetupResult } from "./helpers/report";
import { seedAdminRecords } from "./helpers/supabase-admin";

async function verifyRender(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = (await response.json().catch(() => null)) as {
      status?: string;
    } | null;
    if (response.status !== 200 || body?.status !== "ok") {
      throw new Error(`Render health failed with HTTP ${response.status}`);
    }
    return `HTTP ${response.status} status ok`;
  } finally {
    clearTimeout(timer);
  }
}

async function verifyVercel(config: ReturnType<typeof loadQaConfig>) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.vercelToken}`,
  };
  if (config.vercelTeamId) {
    headers["x-vercel-team-id"] = config.vercelTeamId;
  }

  const query = new URLSearchParams({
    target: "production",
    limit: "20",
    app: config.baseHost,
  });
  if (config.vercelTeamId) {
    query.set("teamId", config.vercelTeamId);
  }

  const response = await fetch(
    `https://api.vercel.com/v6/deployments?${query.toString()}`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(`Vercel deployment lookup failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    deployments?: Array<{
      url?: string;
      alias?: string[];
      state?: string;
      meta?: Record<string, string | undefined>;
    }>;
  };

  const deployment = data.deployments?.find(
    (item) =>
      item.url === config.baseHost || item.alias?.includes?.(config.baseHost),
  );
  if (!deployment) {
    throw new Error("No Vercel production deployment matched QA_BASE_URL hostname.");
  }
  if (deployment.state !== "READY") {
    throw new Error(`Vercel deployment is not Ready: ${deployment.state}`);
  }

  const testedCommit =
    deployment.meta?.githubCommitSha ||
    deployment.meta?.gitlabCommitSha ||
    deployment.meta?.bitbucketCommitSha ||
    deployment.meta?.githubCommitRef;

  if (testedCommit !== config.expectedCommit) {
    throw new Error(
      `Vercel commit mismatch: tested ${testedCommit}, expected ${config.expectedCommit}`,
    );
  }

  return { testedCommit, state: deployment.state };
}

export default async function globalSetup(): Promise<void> {
  const config = loadQaConfig();
  mkdirSync("test-results", { recursive: true });
  persistRunMeta(config);
  writeFileSync(
    "test-results/version23-config-summary.json",
    JSON.stringify(safeConfigSummary(config), null, 2),
  );
  console.log("Version 23 QA safe config:", safeConfigSummary(config));

  try {
    if (
      execFileSync("git", ["ls-files", "web/.env.qa.local"], {
        stdio: "pipe",
      })
        .toString()
        .trim()
    ) {
      throw new Error("web/.env.qa.local is tracked");
    }

    const vercel = await verifyVercel(config);
    writeSetupResult(
      "Vercel production commit",
      "PASS",
      `Ready ${vercel.testedCommit}`,
    );

    const renderHealth = await verifyRender(config.renderHealthUrl);
    writeSetupResult("Render health", "PASS", renderHealth);

    await seedAdminRecords(config);
    writeSetupResult(
      "Synthetic data setup",
      "PASS",
      "Created current-run synthetic records only",
    );

    writeFileSync(
      "test-results/version23-runtime.json",
      JSON.stringify(
        {
          runId: config.runId,
          manifestPath: config.manifestPath,
          reportPath: config.reportPath,
          testedCommit: vercel.testedCommit,
          renderHealth,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    writeSetupResult(
      "Synthetic data setup",
      "FAIL",
      error instanceof Error ? error.message : "unknown failure",
    );
    writeReport(config);
    throw error;
  }
}
