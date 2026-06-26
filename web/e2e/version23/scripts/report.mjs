#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadQaConfig } from "../helpers/config.ts";
import { writeReport } from "../helpers/report.ts";

const config = loadQaConfig({ requireMutationAck: false });
const runtimePath = resolve(process.cwd(), "test-results/version23-runtime.json");
const extra = existsSync(runtimePath)
  ? (JSON.parse(readFileSync(runtimePath, "utf8")) as Record<string, string>)
  : {};

writeReport(config, extra);
