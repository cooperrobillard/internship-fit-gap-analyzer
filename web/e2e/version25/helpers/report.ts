import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type VerificationStatus = "PASS" | "FAIL" | "SKIPPED" | "PENDING";

export type Version25ReportInput = {
  runId: string;
  version23Status: VerificationStatus;
  version25Status: VerificationStatus;
  cleanupStatus: VerificationStatus;
  outputPath?: string;
  machineOutputPath?: string;
  details?: string[];
};

const MANUAL_ROWS = [
  ["Manual accessibility result", "PENDING"],
  ["Manual Production sign-up result", "PENDING"],
  ["Manual Google OAuth result", "PENDING"],
  ["Manual account-portal result", "PENDING"],
  ["Sentry observation", "PENDING"],
  ["UptimeRobot observation", "PENDING"],
  ["Rollback-readiness review", "PENDING"],
] as const;

function automatedVerdict(input: Version25ReportInput): VerificationStatus {
  if ([input.version23Status, input.version25Status, input.cleanupStatus].includes("FAIL")) return "FAIL";
  if ([input.version23Status, input.version25Status, input.cleanupStatus].includes("SKIPPED")) return "SKIPPED";
  return "PASS";
}

export function buildVersion25Report(input: Version25ReportInput): string {
  const verdict = automatedVerdict(input);
  const details = input.details?.length ? input.details.map((detail) => `- ${detail}`).join("\n") : "- No additional sanitized details recorded.";
  return `# Version 25 Production launch-verification automated report\n\nRun label: Version 25 QA current run\n\nThis report is intentionally bounded to automated Step 6A/6B launch-verification evidence. It does not declare final public-launch readiness. Final Step 6 PASS/FAIL is determined only after Version 25 Step 6B human verification is complete.\n\n| Area | Result |\n| --- | --- |\n| Version 23 automated result | ${input.version23Status} |\n| Version 25 automated result | ${input.version25Status} |\n| Version 25 cleanup result | ${input.cleanupStatus} |\n${MANUAL_ROWS.map(([label, status]) => `| ${label} | ${status} |`).join("\n")}\n| Overall automated verdict | ${verdict} |\n\n## Sanitized details\n\n${details}\n\n## Boundary\n\nThe automated verdict is not a final public-launch PASS. Manual authentication, accessibility, observability, monitoring, cleanup, and rollback-readiness checks remain pending until Step 6B.\n`;
}

export function writeVersion25Report(input: Version25ReportInput): void {
  const outputPath = input.outputPath ?? "/tmp/version25-production-verification.md";
  const machineOutputPath = input.machineOutputPath ?? resolve(process.cwd(), "test-results/version25-report-summary.json");
  const markdown = buildVersion25Report(input);
  writeFileSync(outputPath, markdown);
  mkdirSync(dirname(machineOutputPath), { recursive: true });
  writeFileSync(
    machineOutputPath,
    JSON.stringify(
      {
        version23Status: input.version23Status,
        version25Status: input.version25Status,
        cleanupStatus: input.cleanupStatus,
        manualChecks: Object.fromEntries(MANUAL_ROWS),
        overallAutomatedVerdict: automatedVerdict(input),
        finalPublicLaunchReadiness: "PENDING_STEP_6B_HUMAN_VERIFICATION",
      },
      null,
      2,
    ),
  );
}

export function statusFromResultsFile(path: string): VerificationStatus {
  if (!existsSync(path)) return "FAIL";
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { stats?: { unexpected?: number; expected?: number } };
    return (parsed.stats?.unexpected ?? 1) === 0 ? "PASS" : "FAIL";
  } catch {
    return "FAIL";
  }
}
