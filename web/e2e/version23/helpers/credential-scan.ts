import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type CredentialFinding = {
  category: string;
  filePath: string;
  lineNumber?: number;
};

const FORBIDDEN_TRACKED_PATHS = [
  "web/.env.local",
  ".env",
  ".env.local",
  "web/.env.qa.local",
  "data/outputs/analysis_results.db",
  "data/resume/resume.txt",
] as const;

const FORBIDDEN_TRACKED_PREFIXES = ["data/jobs/"] as const;

const CONTENT_SCAN_SKIP_PATHS = new Set([
  "web/.env.qa.example",
  "LEARNING_LOG.md",
]);

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".zip",
  ".db",
  ".sqlite",
  ".sqlite3",
  ".pdf",
  ".bin",
  ".exe",
  ".dmg",
  ".mp4",
  ".webm",
]);

const CLERK_LIVE_SECRET = /sk_live_[A-Za-z0-9]{20,}/g;
const SUPABASE_SECRET = /sb_secret_[A-Za-z0-9_-]{20,}/g;
const PRIVATE_KEY_LINE = /-----BEGIN (?:RSA )?PRIVATE KEY-----/;
const JWT_PATTERN =
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

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

function isBinaryFile(absolutePath: string): boolean {
  const extension = absolutePath.slice(absolutePath.lastIndexOf(".")).toLowerCase();
  if (BINARY_EXTENSIONS.has(extension)) {
    return true;
  }
  try {
    const sample = readFileSync(absolutePath).subarray(0, 8192);
    return sample.includes(0);
  } catch {
    return true;
  }
}

function shouldSkipContentScan(relativePath: string): boolean {
  if (CONTENT_SCAN_SKIP_PATHS.has(relativePath)) {
    return true;
  }
  if (relativePath.startsWith("docs/")) {
    return true;
  }
  return false;
}

function scanLineForCredentials(
  line: string,
  relativePath: string,
  lineNumber: number,
): CredentialFinding[] {
  const findings: CredentialFinding[] = [];

  for (const match of line.matchAll(CLERK_LIVE_SECRET)) {
    if (match[0].length >= 28) {
      findings.push({
        category: "Clerk live secret key material",
        filePath: relativePath,
        lineNumber,
      });
      break;
    }
  }

  for (const match of line.matchAll(SUPABASE_SECRET)) {
    if (match[0].length >= 30) {
      findings.push({
        category: "Supabase secret key material",
        filePath: relativePath,
        lineNumber,
      });
      break;
    }
  }

  if (PRIVATE_KEY_LINE.test(line)) {
    findings.push({
      category: "Private key block",
      filePath: relativePath,
      lineNumber,
    });
  }

  for (const match of line.matchAll(JWT_PATTERN)) {
    const payload = decodeJwtPayload(match[0]);
    if (payload?.role === "service_role") {
      findings.push({
        category: "Service-role JWT material",
        filePath: relativePath,
        lineNumber,
      });
      break;
    }
  }

  return findings;
}

export function scanTextContent(
  relativePath: string,
  content: string,
): CredentialFinding[] {
  if (shouldSkipContentScan(relativePath)) {
    return [];
  }

  const findings: CredentialFinding[] = [];
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    findings.push(
      ...scanLineForCredentials(lines[index]!, relativePath, index + 1),
    );
  }
  return findings;
}

export function scanFileAtPath(
  repoRoot: string,
  relativePath: string,
): CredentialFinding[] {
  if (shouldSkipContentScan(relativePath)) {
    return [];
  }

  const absolutePath = join(repoRoot, relativePath);
  if (isBinaryFile(absolutePath)) {
    return [];
  }

  const content = readFileSync(absolutePath, "utf8");
  return scanTextContent(relativePath, content);
}

export function listTrackedFiles(repoRoot: string): string[] {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .split("\0")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function checkForbiddenTrackedPaths(repoRoot: string): CredentialFinding[] {
  const findings: CredentialFinding[] = [];

  for (const relativePath of FORBIDDEN_TRACKED_PATHS) {
    const tracked = execFileSync("git", ["ls-files", relativePath], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    if (tracked) {
      findings.push({
        category: "Tracked private or local-only file",
        filePath: tracked,
      });
    }
  }

  const jobsTracked = execFileSync("git", ["ls-files", "data/jobs"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const relativePath of jobsTracked) {
    if (FORBIDDEN_TRACKED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
      findings.push({
        category: "Tracked private or local-only file",
        filePath: relativePath,
      });
    }
  }

  return findings;
}

export function scanTrackedRepository(repoRoot: string): CredentialFinding[] {
  const findings = checkForbiddenTrackedPaths(repoRoot);

  for (const relativePath of listTrackedFiles(repoRoot)) {
    findings.push(...scanFileAtPath(repoRoot, relativePath));
  }

  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.category}:${finding.filePath}:${finding.lineNumber ?? 0}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function printCredentialFindings(findings: CredentialFinding[]): void {
  for (const finding of findings) {
    const location =
      finding.lineNumber !== undefined
        ? `${finding.filePath}:${finding.lineNumber}`
        : finding.filePath;
    console.error(
      `Credential scan finding [${finding.category}] at ${location}`,
    );
  }
}
