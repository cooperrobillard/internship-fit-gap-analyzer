import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";

const REPORT_ARTIFACTS = [
  "test-results/version23-results.json",
  "test-results/version23-setup-results.json",
  "test-results/version23-runtime.json",
  "test-results/version23-playwright-run.json",
  "test-results/version23-config-summary.json",
] as const;

export function resetQaReportArtifacts(webRoot: string): void {
  const absoluteWebRoot = resolve(webRoot);

  for (const relativePath of REPORT_ARTIFACTS) {
    const absolutePath = join(absoluteWebRoot, relativePath);
    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }
  }

  const markdownReport = "/tmp/version23-data-control-qa.md";
  if (existsSync(markdownReport)) {
    unlinkSync(markdownReport);
  }

  const playwrightReportDir = join(absoluteWebRoot, "playwright-report");
  if (existsSync(playwrightReportDir)) {
    for (const entry of readdirSync(playwrightReportDir)) {
      rmSync(join(playwrightReportDir, entry), {
        recursive: true,
        force: true,
      });
    }
  }

  mkdirSync(join(absoluteWebRoot, "test-results"), { recursive: true });
}

export function isManifestArtifact(fileName: string): boolean {
  return /^version23-manifest-.*\.json$/.test(fileName);
}
