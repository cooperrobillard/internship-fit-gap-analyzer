import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type ProfileOwnerLabel = "A" | "B";

export type CreatedProfileRecord = {
  id: string;
  ownerLabel: ProfileOwnerLabel;
  expectedOwnerId: string;
  profileName: string;
  createdAt: string;
};

export type ProfileManifest = {
  runId: string;
  records: CreatedProfileRecord[];
  cleanupStatus?: "PASS" | "FAIL";
};

export function version25ManifestPath(runId: string, cwd = process.cwd()): string {
  return resolve(cwd, `test-results/version25-profile-manifest-${runId}.json`);
}

export function emptyProfileManifest(runId: string): ProfileManifest {
  return { runId, records: [] };
}

export function readProfileManifest(path: string, runId: string): ProfileManifest {
  if (!existsSync(path)) {
    return emptyProfileManifest(runId);
  }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as ProfileManifest;
  if (parsed.runId !== runId) {
    throw new Error("Profile manifest run ID does not match the current run.");
  }
  return { ...parsed, records: Array.isArray(parsed.records) ? parsed.records : [] };
}

export function saveProfileManifest(path: string, manifest: ProfileManifest): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}

export function appendProfileRecord(path: string, runId: string, record: CreatedProfileRecord): void {
  const manifest = readProfileManifest(path, runId);
  if (!record.profileName.startsWith(`V25 QA ${runId} `)) {
    throw new Error("Refusing to track a profile that does not belong to the current Version 25 run.");
  }
  if (manifest.records.some((existing) => existing.id === record.id)) {
    return;
  }
  manifest.records.push(record);
  saveProfileManifest(path, manifest);
}

export function removeProfileRecord(path: string, runId: string, id: string): void {
  const manifest = readProfileManifest(path, runId);
  saveProfileManifest(path, {
    ...manifest,
    records: manifest.records.filter((record) => record.id !== id),
  });
}
