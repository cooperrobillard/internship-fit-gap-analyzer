import { config as loadDotenv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const ACK = "CREATE_AND_DELETE_SYNTHETIC_V23_QA_DATA";
export const STALE_CLEANUP_ACK = "DELETE_STALE_V23_QA_DATA";

const RUN_META_RELATIVE = "test-results/version23-run-meta.json";

export type QaConfig = {
  baseUrl: string;
  baseHost: string;
  renderHealthUrl: string;
  expectedCommit: string;
  clerkPublishableKey: string;
  clerkSecretKey: string;
  userAEmail: string;
  userBEmail: string;
  supabaseUrl: string;
  supabaseElevatedKey: string;
  vercelToken: string;
  vercelTeamId?: string;
  seedMode: "admin" | "ui";
  runId: string;
  manifestPath: string;
  reportPath: string;
  resultsPath: string;
  runMetaPath: string;
};

function req(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required QA configuration: ${name}`);
  }
  return value;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

export function isBrowserSupabaseKey(value: string): boolean {
  if (value.startsWith("sb_publishable_")) {
    return true;
  }
  if (!value.startsWith("eyJ")) {
    return false;
  }
  const payload = decodeJwtPayload(value);
  if (!payload) {
    return false;
  }
  const role = typeof payload.role === "string" ? payload.role : "";
  return role === "anon" || role === "authenticated";
}

export function isElevatedSupabaseKey(value: string): boolean {
  if (value.startsWith("sb_secret_")) {
    return true;
  }
  if (!value.startsWith("eyJ")) {
    return false;
  }
  const payload = decodeJwtPayload(value);
  if (!payload) {
    return false;
  }
  return payload.role === "service_role";
}

function generateRunId(): string {
  return `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readPersistedRunId(runMetaPath: string): string | undefined {
  if (!existsSync(runMetaPath)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(readFileSync(runMetaPath, "utf8")) as {
      runId?: string;
    };
    return parsed.runId?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export type LoadQaConfigOptions = {
  requireMutationAck?: boolean;
};

export function loadQaConfig(options: LoadQaConfigOptions = {}): QaConfig {
  const requireMutationAck = options.requireMutationAck ?? true;
  const envPath = resolve(process.cwd(), ".env.qa.local");
  if (existsSync(envPath)) {
    loadDotenv({ path: envPath, override: false });
  }

  if (process.env.QA_ENV_TRACKED) {
    throw new Error(".env.qa.local appears to be tracked; refusing to run.");
  }

  const baseUrl = req("QA_BASE_URL");
  const renderHealthUrl = req("QA_RENDER_HEALTH_URL");
  const expectedCommit = req("QA_EXPECTED_COMMIT");
  const seedMode = (process.env.QA_SEED_MODE?.trim() || "admin") as
    | "admin"
    | "ui";

  if (!baseUrl.startsWith("https://")) {
    throw new Error("QA_BASE_URL must be HTTPS.");
  }
  if (!renderHealthUrl.startsWith("https://")) {
    throw new Error("QA_RENDER_HEALTH_URL must be HTTPS.");
  }

  const host = new URL(baseUrl).hostname;
  if (["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error("QA_BASE_URL must not resolve to localhost in production mode.");
  }

  if (
    requireMutationAck &&
    process.env.QA_CONFIRM_PRODUCTION_MUTATION !== ACK
  ) {
    throw new Error(
      "QA_CONFIRM_PRODUCTION_MUTATION acknowledgement is missing or incorrect.",
    );
  }

  const userAEmail = req("QA_USER_A_EMAIL");
  const userBEmail = req("QA_USER_B_EMAIL");
  if (userAEmail.toLowerCase() === userBEmail.toLowerCase()) {
    throw new Error("QA users must use different email addresses.");
  }

  const elevated = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();

  if (seedMode === "admin" && !elevated) {
    throw new Error(
      "Admin seed mode requires SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (elevated) {
    if (isBrowserSupabaseKey(elevated)) {
      throw new Error(
        "Elevated Supabase credential looks publishable or browser-safe; refusing to run.",
      );
    }
    if (!isElevatedSupabaseKey(elevated)) {
      throw new Error(
        "Supabase credential is not a supported elevated key (sb_secret_... or legacy service_role JWT).",
      );
    }
  }

  const runMetaPath = resolve(process.cwd(), RUN_META_RELATIVE);
  const runId =
    process.env.QA_RUN_ID?.trim() ||
    readPersistedRunId(runMetaPath) ||
    generateRunId();

  return {
    baseUrl,
    baseHost: host,
    renderHealthUrl,
    expectedCommit,
    clerkPublishableKey: req("CLERK_PUBLISHABLE_KEY"),
    clerkSecretKey: req("CLERK_SECRET_KEY"),
    userAEmail,
    userBEmail,
    supabaseUrl: req("SUPABASE_URL"),
    supabaseElevatedKey: elevated,
    vercelToken: req("VERCEL_TOKEN"),
    vercelTeamId: process.env.VERCEL_TEAM_ID?.trim() || undefined,
    seedMode,
    runId,
    manifestPath: resolve(
      process.cwd(),
      `test-results/version23-manifest-${runId}.json`,
    ),
    reportPath: "/tmp/version23-data-control-qa.md",
    resultsPath: resolve(process.cwd(), "test-results/version23-results.json"),
    runMetaPath,
  };
}

export function safeConfigSummary(config: QaConfig) {
  return {
    baseHost: config.baseHost,
    renderHealthHost: new URL(config.renderHealthUrl).hostname,
    expectedCommit: config.expectedCommit,
    userLabels: ["A", "B"],
    seedMode: config.seedMode,
    vercelTeamIdPresent: Boolean(config.vercelTeamId),
    runId: config.runId,
  };
}
