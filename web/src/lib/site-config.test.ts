import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  absoluteSiteUrl,
  HOME_DESCRIPTION,
  HOME_TWITTER_METADATA,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_URL,
  TWITTER_CARD,
} from "./site-config";
import { metadata as homepageMetadata } from "@/app/page";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const homepageSource = readFileSync(join(webRoot, "app/page.tsx"), "utf8");

test("canonical site origin is fixed to the Production custom hostname", () => {
  assert.equal(SITE_ORIGIN, "https://jobfit.cooperrobillard.com");
  assert.equal(SITE_URL.protocol, "https:");
  assert.equal(SITE_URL.pathname, "/");
  assert.equal(SITE_URL.search, "");
  assert.equal(SITE_URL.hash, "");
});

const forbiddenHostFragments = [
  "internship-fit-gap-analyzer.vercel.app",
  "localhost",
  "127.0.0.1",
  "vercel.app",
  "*",
];

test("HOME_DESCRIPTION is the shared homepage metadata source", () => {
  assert.ok(HOME_DESCRIPTION.length > 0);
  assert.equal(
    HOME_DESCRIPTION,
    "Compare résumé skills with job descriptions, review explicit matched and missing skills, and save structured results in a rule-based career planning workspace.",
  );
  assert.notEqual(HOME_DESCRIPTION, SITE_DESCRIPTION);
});

test("HOME_TWITTER_METADATA is the shared homepage Twitter metadata source", () => {
  assert.equal(TWITTER_CARD, "summary_large_image");
  assert.deepEqual(HOME_TWITTER_METADATA, {
    card: "summary_large_image",
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
  });
});

test("homepage metadata export includes required Twitter fields", () => {
  assert.deepEqual(homepageMetadata.twitter, HOME_TWITTER_METADATA);
});

test("homepage metadata source uses HOME_DESCRIPTION for all public descriptions", () => {
  assert.match(homepageSource, /import \{[^}]*HOME_TWITTER_METADATA[^}]*\} from "@\/lib\/site-config"/);
  assert.match(homepageSource, /description: HOME_DESCRIPTION/);
  assert.match(homepageSource, /openGraph:\s*\{[\s\S]*description: HOME_DESCRIPTION/);
  assert.match(homepageSource, /twitter: HOME_TWITTER_METADATA/);
  assert.equal(homepageSource.includes("homeDescription"), false);
  assert.equal(homepageSource.includes("SITE_NAME"), true);
});

test("absoluteSiteUrl resolves supported public metadata paths canonically", () => {
  assert.equal(absoluteSiteUrl("/"), "https://jobfit.cooperrobillard.com/");
  assert.equal(
    absoluteSiteUrl("/?source=qa#controls"),
    "https://jobfit.cooperrobillard.com/?source=qa#controls",
  );
  assert.equal(absoluteSiteUrl("/privacy"), "https://jobfit.cooperrobillard.com/privacy");
  assert.equal(absoluteSiteUrl("/privacy/"), "https://jobfit.cooperrobillard.com/privacy");
  assert.equal(
    absoluteSiteUrl("/privacy?source=qa#controls"),
    "https://jobfit.cooperrobillard.com/privacy?source=qa#controls",
  );
  assert.equal(absoluteSiteUrl("/sitemap.xml"), "https://jobfit.cooperrobillard.com/sitemap.xml");
  assert.equal(absoluteSiteUrl("/robots.txt"), "https://jobfit.cooperrobillard.com/robots.txt");
});

test("homepage canonical and Open Graph URLs use the trailing-slash root", () => {
  const root = absoluteSiteUrl("/");
  assert.equal(root, "https://jobfit.cooperrobillard.com/");
  assert.equal(homepageMetadata.alternates?.canonical, root);
  assert.equal(homepageMetadata.openGraph?.url, root);
});

test("absoluteSiteUrl cannot emit old, local, Preview, or wildcard hosts", () => {
  const outputs = [absoluteSiteUrl("/"), absoluteSiteUrl("/privacy"), absoluteSiteUrl("/sitemap.xml"), absoluteSiteUrl("/robots.txt")];

  for (const output of outputs) {
    for (const forbidden of forbiddenHostFragments) {
      assert.equal(output.includes(forbidden), false, `${output} must not include ${forbidden}`);
    }
  }
});

test("sitemap contains exactly the canonical public indexable routes", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.deepEqual(urls, ["https://jobfit.cooperrobillard.com/", "https://jobfit.cooperrobillard.com/privacy"]);
  assert.equal(entries.length, 2);
  assert.equal(urls.some((url) => url.includes("/dashboard")), false);
  assert.equal(urls.some((url) => url.includes("/sign-in")), false);
  assert.equal(urls.some((url) => url.includes("/sign-up")), false);
  assert.equal(urls.some((url) => url.includes("internship-fit-gap-analyzer.vercel.app")), false);
});

test("robots points to canonical metadata and excludes application routes", () => {
  const route = robots();
  const disallow = Array.isArray(route.rules) ? route.rules.flatMap((rule) => rule.disallow ?? []) : route.rules.disallow ?? [];

  assert.equal(route.sitemap, "https://jobfit.cooperrobillard.com/sitemap.xml");
  assert.equal(route.host, "https://jobfit.cooperrobillard.com");
  assert.ok(disallow.includes("/dashboard"));
  assert.ok(disallow.includes("/api/"));
  assert.ok(disallow.includes("/sign-in"));
  assert.ok(disallow.includes("/sign-up"));
  assert.ok(disallow.includes("/__clerk/"));
  assert.equal(disallow.includes("/privacy"), false);
});
