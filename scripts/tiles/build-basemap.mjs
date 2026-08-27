#!/usr/bin/env node
/**
 * Builds the self-hosted basemap archive — a single regional PMTiles vector
 * tile file — and uploads it to the public R2 bucket that ~/lib/mapStyles.ts
 * reads at runtime.
 *
 * Ported from flockoffmn (scripts/tiles/build-basemap.mjs), which arrived at
 * this after MapTiler's free tier hit its request/session ceiling within a
 * normal month of traffic. See TILES.md for the full runbook, including the
 * three things that go wrong on the Cloudflare side (r2.dev is not a production
 * host; `.pmtiles` needs a zone Cache Rule; Cache-Control is object metadata
 * that every re-upload drops) and the one thing you must NOT do (proxy tiles
 * through a Worker).
 *
 * WHAT THIS DOES NOT DO: scrape live tiles from OSM's tile servers. OSM's tile
 * usage policy explicitly asks apps not to bulk-download from
 * tile.openstreetmap.org. Instead this downloads a regional *data* extract from
 * Geofabrik — a mirror explicitly intended for bulk regional download — and
 * renders tiles from that data locally, with planetiler.
 *
 * Deliberately NOT in scripts/ingest/, which is dependency-free Node a
 * contributor can run with nothing but `npm run data`. This needs a real
 * external tool (planetiler, a Java program) and downloads gigabytes, so it
 * stays a separate, explicitly-invoked step.
 *
 * Requires:
 *   - Java 17+ on PATH (`brew install openjdk` on macOS).
 *   - `npx wrangler` authenticated against the account owning the bucket
 *     (only for --upload).
 *
 * Usage:
 *   node scripts/tiles/build-basemap.mjs                      # build only
 *   node scripts/tiles/build-basemap.mjs --upload             # build + publish
 *   TILES_AREA=wisconsin TILES_BUCKET=foo-tiles node ...      # override
 *
 * Rebuild cadence: manual, ad hoc. There is no cron, on purpose — a road
 * network does not change fast enough to justify an unattended write path into
 * a production bucket. Re-run by hand when the map visibly drifts, or roughly
 * annually.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCOPE = "build-basemap";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BUILD_DIR = path.join(ROOT, ".tiles-build");
const PLANETILER_JAR = path.join(BUILD_DIR, "planetiler.jar");
const PLANETILER_URL =
  "https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar";

// TEMPLATE: set these for your project, or pass them in the environment.
// A Geofabrik area name — planetiler resolves it to the right extract.
const AREA = process.env.TILES_AREA ?? "minnesota";
// `npx wrangler r2 bucket list` to find it. Account-specific, so nothing in the
// app code should have to know it — only this script does.
const BUCKET = process.env.TILES_BUCKET ?? "REPLACE-ME-tiles";

const OUTPUT = path.join(BUILD_DIR, `${AREA}.pmtiles`);
const UPLOAD = process.argv.includes("--upload");

/**
 * Real data maxzoom. MapLibre overzooms past this by scaling vector geometry
 * rather than blurring pixels the way raster does, so the camera's own maxZoom
 * can stay higher than this without looking broken. z14 gets soft at true
 * building-identification zoom but covers ordinary neighbourhood-level reading
 * everywhere in the region, at a build size (~150–350 MB) that stays
 * comfortably inside R2's free tier.
 */
const MAXZOOM = Number(process.env.TILES_MAXZOOM ?? 14);

const log = (message) => console.log(`[${SCOPE}] ${message}`);

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * One retry, because this is a one-time-per-machine ~90 MB download with no
 * resume and GitHub Releases occasionally blips. A transient failure should not
 * hard-fail the whole build on attempt one.
 */
async function fetchWithRetry(url, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        const wait = 2 ** i * 1000;
        log(`fetch failed (${error.message}), retrying in ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastError;
}

async function main() {
  if (BUCKET.startsWith("REPLACE-ME") && UPLOAD) {
    console.error(
      `[${SCOPE}] Set TILES_BUCKET (or edit BUCKET in this file) before uploading.\n` +
        "  Find it with: npx wrangler r2 bucket list",
    );
    process.exit(1);
  }

  mkdirSync(BUILD_DIR, { recursive: true });

  try {
    execFileSync("java", ["-version"], { stdio: "ignore" });
  } catch {
    console.error(
      `[${SCOPE}] Java not found on PATH. planetiler is a Java program — install a JDK ` +
        "(e.g. `brew install openjdk` on macOS) and ensure `java -version` works.",
    );
    process.exit(1);
  }

  if (!existsSync(PLANETILER_JAR)) {
    log("Downloading planetiler...");
    const res = await fetchWithRetry(PLANETILER_URL);
    writeFileSync(PLANETILER_JAR, Buffer.from(await res.arrayBuffer()));
  }

  log(`Building ${OUTPUT} (area=${AREA}, maxzoom=${MAXZOOM})...`);
  const result = spawnSync(
    "java",
    [
      "-Xmx4g",
      "-jar",
      PLANETILER_JAR,
      "--download",
      `--area=${AREA}`,
      `--maxzoom=${MAXZOOM}`,
      `--output=${OUTPUT}`,
      "--force",
    ],
    { cwd: BUILD_DIR, stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error(`planetiler exited with status ${result.status}`);

  // Provenance travels with the artifact, same as any other ingested dataset:
  // what it was built from, with what, when, and a hash to prove which build a
  // given archive is.
  const size = statSync(OUTPUT).size;
  const hash = await sha256(OUTPUT);
  writeFileSync(
    path.join(BUILD_DIR, `${AREA}.pmtiles.provenance.json`),
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        source: `https://download.geofabrik.de/ (area: ${AREA})`,
        tool: "planetiler",
        maxzoom: MAXZOOM,
        sizeBytes: size,
        sha256: hash,
      },
      null,
      2,
    ),
  );
  log(`Built ${(size / 1024 / 1024).toFixed(0)}MB, sha256 ${hash.slice(0, 12)}...`);

  /*
    --content-type and --cache-control are not cosmetic: R2 sets neither by
    default, and without a Cache-Control header nothing downstream — a zone
    Cache Rule included — has anything to key an edge-cache decision on.
    Confirmed live in the source repo: the first upload omitted both and served
    with no cache headers at all until re-uploaded with these flags.

    --remote is not optional either. wrangler's r2 commands default to the local
    simulator and will report success while changing nothing in production.
  */
  const uploadArgs = [
    "wrangler",
    "r2",
    "object",
    "put",
    `${BUCKET}/${AREA}.pmtiles`,
    `--file=${OUTPUT}`,
    "--content-type=application/octet-stream",
    "--cache-control=public, max-age=3600, stale-while-revalidate=86400",
    "--remote",
  ];

  if (UPLOAD) {
    log(`Uploading to R2 bucket '${BUCKET}'...`);
    execFileSync("npx", uploadArgs, { cwd: ROOT, stdio: "inherit" });
    log("Uploaded. The live site picks this up immediately — R2 is the source of truth, nothing to redeploy.");
    log("If this is a new bucket, finish the two dashboard steps in TILES.md (custom domain + Cache Rule).");
  } else {
    log("Built without uploading. Re-run with --upload, or upload manually:");
    log(`  npx ${uploadArgs.join(" ")}`);
  }
}

main().catch((error) => {
  console.error(`[${SCOPE}] Failed:`, error);
  process.exit(1);
});
