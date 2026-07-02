import { loadQaConfig } from "../version23/helpers/config";
import { cleanupVersion25Profiles } from "./helpers/profile-admin";
import { version25ManifestPath } from "./helpers/profile-manifest";

export default async function globalTeardown(): Promise<void> {
  if (process.env.QA_SKIP_VERSION25_GLOBAL_TEARDOWN_CLEANUP === "1") return;
  try {
    const config = loadQaConfig();
    await cleanupVersion25Profiles(config, version25ManifestPath(config.runId));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Version 25 cleanup failed.");
    throw error;
  }
}
