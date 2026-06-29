import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { QaConfig } from "./config";

export type CreatedRecord = {
  id: string;
  ownerLabel: "A" | "B";
  title: string;
  company: string;
  created_at?: string;
};

export type RunManifest = {
  runId: string;
  records: CreatedRecord[];
  uiRecordId?: string;
  cleanupStatus?: "PASS" | "FAIL" | "NOT RUN";
};

export function readManifest(path: string): RunManifest {
  if (!existsSync(path)) {
    return { runId: "", records: [] };
  }
  return JSON.parse(readFileSync(path, "utf8")) as RunManifest;
}

export function saveManifest(path: string, manifest: RunManifest): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}

export function recordsForOwner(
  manifest: RunManifest,
  owner: "A" | "B",
): CreatedRecord[] {
  return manifest.records.filter((record) => record.ownerLabel === owner);
}

export function userATitles(config: QaConfig): string[] {
  return recordsForOwner(readManifest(config.manifestPath), "A").map(
    (record) => record.title,
  );
}

export function userAIds(config: QaConfig): string[] {
  return recordsForOwner(readManifest(config.manifestPath), "A").map(
    (record) => record.id,
  );
}

export function titleForUserA(config: QaConfig, index: number): string {
  const record = recordsForOwner(readManifest(config.manifestPath), "A")[index];
  if (!record) {
    throw new Error(`Missing seeded User A record at index ${index}.`);
  }
  return record.title;
}

export function appendManifestRecord(
  config: QaConfig,
  record: CreatedRecord,
): void {
  const manifest = readManifest(config.manifestPath);
  if (manifest.records.some((existing) => existing.id === record.id)) {
    return;
  }
  manifest.records.push(record);
  if (record.title.includes("UI saved analysis")) {
    manifest.uiRecordId = record.id;
  }
  saveManifest(config.manifestPath, manifest);
}

export function persistRunMeta(config: QaConfig): void {
  mkdirSync(dirname(config.runMetaPath), { recursive: true });
  writeFileSync(
    config.runMetaPath,
    JSON.stringify(
      {
        runId: config.runId,
        manifestPath: config.manifestPath,
        reportPath: config.reportPath,
        resultsPath: config.resultsPath,
      },
      null,
      2,
    ),
  );
}
