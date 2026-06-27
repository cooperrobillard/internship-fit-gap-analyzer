import { existsSync, readFileSync } from "node:fs";
import { loadQaConfig } from "./helpers/config";
import { cleanupCurrentRun } from "./helpers/supabase-admin";
import { writeReport } from "./helpers/report";

export default async function globalTeardown(): Promise<void> {
  const config = loadQaConfig({ requireMutationAck: false });
  const extra: Record<string, string> = {};

  if (existsSync("test-results/version23-runtime.json")) {
    Object.assign(
      extra,
      JSON.parse(readFileSync("test-results/version23-runtime.json", "utf8")) as Record<
        string,
        string
      >,
    );
  }

  if (process.env.QA_SKIP_GLOBAL_TEARDOWN_CLEANUP === "1") {
    writeReport(config, extra);
    return;
  }

  try {
    await cleanupCurrentRun(config);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "unknown cleanup failure",
    );
  }

  writeReport(config, extra);
}
