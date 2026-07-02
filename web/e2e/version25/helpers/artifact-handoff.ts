import { existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

export const VERSION23_RESULTS_RELATIVE = "test-results/version23-results.json";
export const VERSION25_RESULTS_RELATIVE = "test-results/version25-results.json";
export const VERSION25_REPORT_SUMMARY_RELATIVE = "test-results/version25-report-summary.json";
export const VERSION25_PLAYWRIGHT_OUTPUT_DIR = "test-results/version25-playwright-artifacts";

export type Version23ArtifactPhase = "after-version23" | "after-version25";

export function version23ResultsPath(webRoot: string): string {
  return resolve(webRoot, VERSION23_RESULTS_RELATIVE);
}

export function version25ResultsPath(webRoot: string): string {
  return resolve(webRoot, VERSION25_RESULTS_RELATIVE);
}

export function version25PlaywrightOutputDir(webRoot: string): string {
  return resolve(webRoot, VERSION25_PLAYWRIGHT_OUTPUT_DIR);
}

export function version23ArtifactMissingMessage(phase: Version23ArtifactPhase): string {
  if (phase === "after-version23") {
    return "Version 23 machine artifact missing immediately after Version 23 completed successfully.";
  }
  return "Version 23 machine artifact was removed during the Version 25 handoff.";
}

export function assertVersion23ResultsArtifact(
  webRoot: string,
  phase: Version23ArtifactPhase,
): void {
  if (!existsSync(version23ResultsPath(webRoot))) {
    throw new Error(version23ArtifactMissingMessage(phase));
  }
}

export function isVersion25OutputDirIsolatedFromVersion23Json(): boolean {
  const outputDir: string = VERSION25_PLAYWRIGHT_OUTPUT_DIR;
  const version23Json = VERSION23_RESULTS_RELATIVE;
  if (outputDir === "test-results") {
    return false;
  }
  if (!outputDir.startsWith("test-results/")) {
    return false;
  }
  return version23Json !== join(outputDir, "version23-results.json");
}

export function simulatePlaywrightOutputDirReset(outputDir: string): void {
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

export const REQUIRED_COMBINED_RUNNER_OUTPUTS = [
  VERSION23_RESULTS_RELATIVE,
  VERSION25_RESULTS_RELATIVE,
  VERSION25_REPORT_SUMMARY_RELATIVE,
] as const;
