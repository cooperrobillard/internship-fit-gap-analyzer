import type { QaConfig } from "./config";
import {
  loadClerkQaUserIdsFromEnv,
  setClerkQaUserIdsInEnv,
  verifyClerkPrecheck,
  type ClerkQaUserIds,
} from "./clerk-precheck";
import { writeReport, writeSetupResult } from "./report";
import { verifyVercel } from "./vercel";

export async function verifyRender(url: string): Promise<string> {
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

export type SetupStageDeps = {
  verifyVercel: (config: QaConfig) => Promise<{ testedCommit: string }>;
  verifyRender: (url: string) => Promise<string>;
  verifyClerkPrecheck: (config: QaConfig) => Promise<ClerkQaUserIds>;
  seedAdminRecords: (config: QaConfig) => Promise<void>;
};

export async function runSetupStages(
  config: QaConfig,
  deps: SetupStageDeps,
): Promise<{
  testedCommit: string;
  renderHealth: string;
  clerkUserIds: ClerkQaUserIds;
}> {
  const reportExtra: Record<string, string> = {};

  try {
    const vercel = await deps.verifyVercel(config);
    writeSetupResult(
      "Vercel production commit",
      "PASS",
      `Ready ${vercel.testedCommit}`,
    );
    reportExtra.testedCommit = vercel.testedCommit;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown failure";
    writeSetupResult("Vercel production commit", "FAIL", message);
    writeSetupResult("Render health", "NOT RUN", "");
    writeSetupResult("Clerk authentication precheck", "NOT RUN", "");
    writeSetupResult("Synthetic data setup", "NOT RUN", "");
    writeReport(config, reportExtra);
    throw error;
  }

  try {
    const renderHealth = await deps.verifyRender(config.renderHealthUrl);
    writeSetupResult("Render health", "PASS", renderHealth);
    reportExtra.renderHealth = renderHealth;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown failure";
    writeSetupResult("Render health", "FAIL", message);
    writeSetupResult("Clerk authentication precheck", "NOT RUN", "");
    writeSetupResult("Synthetic data setup", "NOT RUN", "");
    writeReport(config, reportExtra);
    throw error;
  }

  try {
    const clerkUserIds = await deps.verifyClerkPrecheck(config);
    setClerkQaUserIdsInEnv(clerkUserIds);
    writeSetupResult(
      "Clerk authentication precheck",
      "PASS",
      "QA users verified",
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown failure";
    writeSetupResult("Clerk authentication precheck", "FAIL", message);
    writeSetupResult("Synthetic data setup", "NOT RUN", "");
    writeReport(config, reportExtra);
    throw error;
  }

  try {
    await deps.seedAdminRecords(config);
    writeSetupResult(
      "Synthetic data setup",
      "PASS",
      "Created current-run synthetic records only",
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown failure";
    writeSetupResult("Synthetic data setup", "FAIL", message);
    writeReport(config, reportExtra);
    throw error;
  }

  const clerkUserIds = loadClerkQaUserIdsFromEnv();

  return {
    testedCommit: reportExtra.testedCommit,
    renderHealth: reportExtra.renderHealth,
    clerkUserIds,
  };
}

export function defaultSetupStageDeps(
  seedAdminRecords: (config: QaConfig) => Promise<void>,
): SetupStageDeps {
  return {
    verifyVercel: (config) => verifyVercel(config),
    verifyRender,
    verifyClerkPrecheck: (config) => verifyClerkPrecheck(config),
    seedAdminRecords,
  };
}
