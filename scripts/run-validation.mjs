/**
 * One-command browser validation.
 *
 * 1. Builds the production app (unless --no-build).
 * 2. Finds a free port (starting at 3100; a foreign process is never killed).
 * 3. Starts `next start`, waits for a real HTTP response.
 * 4. Runs the 3D hero scroll, page, and preloader suites against it.
 * 5. Always tears the server down.
 *
 * Usage:
 *   npm run validate
 *   npm run validate -- --no-build
 *   TEST_URL=http://localhost:3000 npm run validate -- --no-build
 *
 * Playwright is intentionally not a package.json dependency (see README).
 * Install it ephemerally when missing:
 *   npm install --no-save playwright
 */
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const root = process.cwd();
const args = new Set(process.argv.slice(2));
const shouldBuild = !args.has("--no-build");
const externalBase = process.env.TEST_URL;

const suites = [
  ["3D hero scroll", "scripts/validate-scroll.mjs"],
  ["pages/mobile/RTL", "scripts/validate-desktop-mobile.mjs"],
  ["preloader/brand", "scripts/validate-preloader.mjs"],
];

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

try {
  require.resolve("playwright");
} catch {
  fail(
    "Playwright is not installed. Run `npm install --no-save playwright` (Chrome is used when available), then retry.",
  );
}

let nextBin;
try {
  nextBin = require.resolve("next/dist/bin/next");
} catch {
  fail("Could not resolve Next.js. Run `npm install` first.");
}

function getFreePort(start = 3100) {
  return new Promise((resolve, reject) => {
    const attempt = (port) => {
      const server = createServer();
      server.unref();
      server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          attempt(port + 1);
        } else {
          reject(error);
        }
      });
      server.listen(port, "127.0.0.1", () => {
        const { port: bound } = server.address();
        server.close(() => resolve(bound));
      });
    };
    attempt(start);
  });
}

function runSuite(label, script, env) {
  console.log(`\n=== ${label} (${script}) ===`);
  const result = spawnSync(process.execPath, [join(root, script)], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`Could not run ${script}: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

async function waitForServer(url, child, timeoutMs = 60000) {
  const started = Date.now();
  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += String(chunk);
    if (output.length > 4000) output = output.slice(-4000);
  });
  child.stderr?.on("data", (chunk) => {
    output += String(chunk);
    if (output.length > 4000) output = output.slice(-4000);
  });

  while (Date.now() - started < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited with code ${child.exitCode}.\n${output}`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms.\n${output}`);
}

function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

let server = null;
const statuses = [];
const startedAt = Date.now();

try {
  if (!externalBase) {
    if (shouldBuild) {
      console.log("=== production build ===");
      const build = spawnSync(process.execPath, [nextBin, "build"], {
        cwd: root,
        stdio: "inherit",
      });
      if (build.status !== 0) fail(`Production build failed (exit ${build.status}).`);
    } else if (!existsSync(join(root, ".next", "BUILD_ID"))) {
      fail("No production build found. Run `npm run build` (or omit --no-build).");
    }

    const port = await getFreePort(3100);
    const base = `http://127.0.0.1:${port}`;
    console.log(`\n=== starting production server on ${base} ===`);
    server = spawn(process.execPath, [nextBin, "start", "-p", String(port), "-H", "127.0.0.1"], {
      cwd: root,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    await waitForServer(base, server);
    process.env.TEST_URL = base;
  } else {
    console.log(`=== using existing server at ${externalBase} ===`);
    process.env.TEST_URL = externalBase;
  }

  for (const [label, script] of suites) {
    statuses.push([label, runSuite(label, script, process.env)]);
  }
} catch (error) {
  console.error(`\n✗ Validation runner failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  stopServer(server);
}

const failed = statuses.filter(([, code]) => code !== 0);
const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
if (failed.length) {
  console.log("\nVALIDATION FAILED:");
  failed.forEach(([label, code]) => console.log(` - ${label} (exit ${code})`));
  process.exitCode = 1;
} else if (statuses.length) {
  console.log(`\nALL BROWSER SUITES PASSED in ${seconds}s.`);
}
