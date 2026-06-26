import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import type { QaConfig } from "./config";
import { readManifest } from "./manifest";

type PlaywrightJsonReport = {
  suites?: PlaywrightSuite[];
  errors?: Array<{ message?: string }>;
};

type PlaywrightSuite = {
  title?: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
};

type PlaywrightSpec = {
  title?: string;
  tests?: PlaywrightTest[];
};

type PlaywrightTest = {
  status?: string;
  results?: Array<{ status?: string; error?: { message?: string } }>;
};

export type QaSectionResult = {
  name: string;
  status: "PASS" | "FAIL" | "CONDITIONAL" | "NOT REPRODUCED" | "NOT RUN";
  detail: string;
};

const QA_SECTIONS = [
  "Vercel production commit",
  "Render health",
  "Synthetic data setup",
  "Authentication and two-user RLS isolation",
  "Structured save and detail",
  "Pagination",
  "Incremental failure and retry",
  "Search and filters across pages",
  "Selection",
  "Selected CSV",
  "Loaded CSV",
  "Selected-deletion cancel path",
  "Selected-deletion success path",
  "Already-unavailable target",
  "True partial deletion failure",
  "Complete deletion failure",
  "Individual deletion regression",
  "Keyboard accessibility",
  "Responsive",
  "Cleanup",
] as const;

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function collectSpecs(
  suites: PlaywrightSuite[] | undefined,
  prefix = "",
): Array<{ title: string; status: string; detail: string }> {
  const rows: Array<{ title: string; status: string; detail: string }> = [];
  for (const suite of suites ?? []) {
    const nextPrefix = prefix
      ? `${prefix} › ${suite.title ?? ""}`
      : (suite.title ?? "");
    rows.push(...collectSpecs(suite.suites, nextPrefix));
    for (const spec of suite.specs ?? []) {
      const title = [nextPrefix, spec.title].filter(Boolean).join(" › ");
      const test = spec.tests?.[0];
      const result = test?.results?.[test.results.length - 1];
      const status = result?.status ?? test?.status ?? "unknown";
      const detail = result?.error?.message?.split("\n")[0] ?? "";
      rows.push({ title, status, detail });
    }
  }
  return rows;
}

function mapPlaywrightStatus(status: string): QaSectionResult["status"] {
  if (status === "passed" || status === "expected") {
    return "PASS";
  }
  if (status === "skipped") {
    return "FAIL";
  }
  if (status === "timedOut" || status === "failed" || status === "interrupted") {
    return "FAIL";
  }
  return "FAIL";
}

function sectionFromSpecTitle(title: string): string | null {
  const normalized = title.toLowerCase();
  for (const section of QA_SECTIONS) {
    if (normalized.includes(section.toLowerCase())) {
      return section;
    }
  }
  if (normalized.includes("authentication") && normalized.includes("rls")) {
    return "Authentication and two-user RLS isolation";
  }
  if (normalized.includes("structured save")) {
    return "Structured save and detail";
  }
  if (normalized.includes("pagination")) {
    return "Pagination";
  }
  if (normalized.includes("incremental failure")) {
    return "Incremental failure and retry";
  }
  if (normalized.includes("search and filters")) {
    return "Search and filters across pages";
  }
  if (normalized.includes("selection")) {
    return "Selection";
  }
  if (normalized.includes("selected csv")) {
    return "Selected CSV";
  }
  if (normalized.includes("loaded csv")) {
    return "Loaded CSV";
  }
  if (normalized.includes("deletion cancel")) {
    return "Selected-deletion cancel path";
  }
  if (normalized.includes("deletion success")) {
    return "Selected-deletion success path";
  }
  if (normalized.includes("already-unavailable")) {
    return "Already-unavailable target";
  }
  if (normalized.includes("partial deletion")) {
    return "True partial deletion failure";
  }
  if (normalized.includes("complete deletion failure")) {
    return "Complete deletion failure";
  }
  if (normalized.includes("individual deletion")) {
    return "Individual deletion regression";
  }
  if (normalized.includes("keyboard")) {
    return "Keyboard accessibility";
  }
  if (normalized.includes("responsive")) {
    return "Responsive";
  }
  return null;
}

function getToolVersions(): { chromium: string; playwright: string } {
  try {
    const webRoot = process.cwd();
    const playwrightVersion = JSON.parse(
      readFileSync(
        resolve(webRoot, "node_modules/@playwright/test/package.json"),
        "utf8",
      ),
    ).version as string;
    const chromiumRevision = JSON.parse(
      readFileSync(
        resolve(webRoot, "node_modules/playwright-core/package.json"),
        "utf8",
      ),
    ).version as string;
    return {
      playwright: playwrightVersion,
      chromium: chromiumRevision,
    };
  } catch {
    return { chromium: "unknown", playwright: "unknown" };
  }
}

export function buildReportSections(
  config: QaConfig,
  extra: Record<string, string> = {},
): QaSectionResult[] {
  const setup = readJson<Record<string, QaSectionResult>>(
    "test-results/version23-setup-results.json",
  );
  const playwright = readJson<PlaywrightJsonReport>(config.resultsPath);
  const manifest = readManifest(config.manifestPath);
  const sections = new Map<string, QaSectionResult>();

  for (const name of QA_SECTIONS) {
    sections.set(name, { name, status: "NOT RUN", detail: "" });
  }

  for (const [name, value] of Object.entries(setup ?? {})) {
    sections.set(name, value);
  }

  for (const spec of collectSpecs(playwright?.suites)) {
    const section = sectionFromSpecTitle(spec.title);
    if (!section) {
      continue;
    }
    const mapped = mapPlaywrightStatus(spec.status);
    const existing = sections.get(section);
    if (!existing || existing.status === "NOT RUN" || mapped === "FAIL") {
      sections.set(section, {
        name: section,
        status: mapped,
        detail: spec.detail,
      });
    }
  }

  if (playwright?.errors?.length) {
    sections.set("Synthetic data setup", {
      name: "Synthetic data setup",
      status: "FAIL",
      detail: playwright.errors[0]?.message ?? "Playwright runner error",
    });
  }

  const cleanupStatus = manifest.cleanupStatus ?? extra.cleanupStatus ?? "NOT RUN";
  sections.set("Cleanup", {
    name: "Cleanup",
    status:
      cleanupStatus === "PASS"
        ? "PASS"
        : cleanupStatus === "FAIL"
          ? "FAIL"
          : "NOT RUN",
    detail:
      cleanupStatus === "PASS"
        ? "All current-run synthetic IDs removed"
        : cleanupStatus === "FAIL"
          ? "Cleanup did not remove all current-run IDs"
          : "",
  });

  return QA_SECTIONS.map((name) => sections.get(name)!).filter(Boolean);
}

export function computeVerdict(sections: QaSectionResult[]): "PASS" | "CONDITIONAL" | "FAIL" {
  if (sections.some((section) => section.status === "FAIL")) {
    return "FAIL";
  }
  if (
    sections.some(
      (section) =>
        section.status === "CONDITIONAL" || section.status === "NOT REPRODUCED",
    )
  ) {
    return "CONDITIONAL";
  }
  if (sections.some((section) => section.status === "NOT RUN")) {
    return "FAIL";
  }
  return "PASS";
}

export function writeReport(
  config: QaConfig,
  extra: Record<string, string> = {},
): "PASS" | "CONDITIONAL" | "FAIL" {
  mkdirSync(dirname(config.reportPath), { recursive: true });
  const sections = buildReportSections(config, extra);
  const verdict = computeVerdict(sections);
  const versions = getToolVersions();
  const lines = [
    "# Version 23 saved-analysis data-control production QA",
    "",
    `- UTC timestamp: ${new Date().toISOString()}`,
    `- QA_BASE_URL hostname: ${config.baseHost}`,
    `- Expected production commit: ${config.expectedCommit}`,
    `- Tested Vercel production commit: ${extra.testedCommit ?? "not recorded"}`,
    `- Render health result: ${extra.renderHealth ?? "not recorded"}`,
    `- Operating system: ${os.type()} ${os.release()} ${os.platform()} ${os.arch()}`,
    `- Chromium version: ${versions.chromium}`,
    `- Playwright version: ${versions.playwright}`,
    `- Test-run ID: ${config.runId}`,
    `- Seed mode: ${config.seedMode}`,
    `- Cleanup result: ${sections.find((section) => section.name === "Cleanup")?.status ?? "NOT RUN"}`,
    `- Final verdict: ${verdict}`,
    "",
    "## Results",
    ...sections.map(
      (section) =>
        `- **${section.name}**: ${section.status}${section.detail ? ` — ${section.detail}` : ""}`,
    ),
    "",
    "## Generated artifacts",
    "- Machine-readable report: web/test-results/version23-results.json",
    "- HTML report: web/playwright-report/index.html",
    "- Markdown evidence: /tmp/version23-data-control-qa.md",
    "",
  ];

  if (extra.scaleTechnique) {
    lines.splice(
      lines.indexOf("## Results"),
      0,
      `- 200% scale technique: ${extra.scaleTechnique}`,
      "",
    );
  }

  writeFileSync(config.reportPath, lines.join("\n"));
  console.log(`Version 23 QA report: ${config.reportPath}`);
  return verdict;
}

export function writeSetupResult(
  name: string,
  status: QaSectionResult["status"],
  detail = "",
): void {
  const path = "test-results/version23-setup-results.json";
  const current = readJson<Record<string, QaSectionResult>>(path) ?? {};
  current[name] = { name, status, detail };
  mkdirSync("test-results", { recursive: true });
  writeFileSync(path, JSON.stringify(current, null, 2));
}

export function gitShortCommit(): string | undefined {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}
