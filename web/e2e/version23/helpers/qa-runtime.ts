import { resolve } from "node:path";

export const QA_RUNTIME_DIR_RELATIVE = ".qa-runtime/version23";

export const SETUP_RESULTS_RELATIVE = `${QA_RUNTIME_DIR_RELATIVE}/setup-results.json`;

export const PLAYWRIGHT_RUN_META_RELATIVE = `${QA_RUNTIME_DIR_RELATIVE}/playwright-run.json`;

export function qaRuntimePath(
  relativePath: string,
  webRoot = process.cwd(),
): string {
  return resolve(webRoot, relativePath);
}
