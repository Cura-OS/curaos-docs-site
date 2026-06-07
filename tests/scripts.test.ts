import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = join(import.meta.dir, "..");

function sh(script: string, args: string[] = []) {
  return spawnSync("bash", [join(ROOT, script), ...args], { cwd: ROOT, encoding: "utf8" });
}

describe("scripts/lib.sh - flag + content-dir resolution", () => {
  test("parse_flag reads --name VALUE and --name=VALUE", () => {
    const r = spawnSync(
      "bash",
      ["-c", `source "${join(ROOT, "scripts/lib.sh")}"; parse_flag out --foo bar --out hello --baz qux; echo; parse_flag out --out=world`],
      { encoding: "utf8" },
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("hello");
    expect(r.stdout).toContain("world");
  });

  test("resolve_content_dir falls back to the in-repo fixture when none supplied", () => {
    const r = spawnSync(
      "bash",
      ["-c", `source "${join(ROOT, "scripts/lib.sh")}"; resolve_content_dir ""`],
      { cwd: ROOT, encoding: "utf8" },
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("examples/content");
  });

  test("resolve_content_dir dies on a missing supplied dir", () => {
    const r = spawnSync(
      "bash",
      ["-c", `source "${join(ROOT, "scripts/lib.sh")}"; resolve_content_dir /no/such/dir`],
      { cwd: ROOT, encoding: "utf8" },
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("content dir not found");
  });
});

describe("scripts/pin-guard.sh - supply-chain pins", () => {
  test("passes on the committed tree (actions SHA-pinned, image digest-pinned, python ==)", () => {
    const r = sh("scripts/pin-guard.sh");
    expect(r.stdout + r.stderr).toContain("pin-guard: PASS");
    expect(r.status).toBe(0);
  });
});

describe("hosting - air-gap invariants", () => {
  test("nginx Dockerfile base image is digest-pinned", () => {
    const df = readFileSync(join(ROOT, "hosting/nginx/Dockerfile"), "utf8");
    expect(df).toMatch(/FROM nginx:[^@]+@sha256:[0-9a-f]{64}/);
  });

  test("GitHub workflows are workflow_dispatch-only (no push/pr/schedule auto-trigger)", () => {
    const wf = readFileSync(join(ROOT, ".github/workflows/pages.yml"), "utf8");
    expect(wf).toMatch(/on:\s*\n\s*workflow_dispatch:/);
    expect(wf).not.toMatch(/^\s*push:/m);
    expect(wf).not.toMatch(/^\s*pull_request:/m);
    expect(wf).not.toMatch(/^\s*schedule:/m);
  });

  test("all GitHub Actions are SHA-pinned", () => {
    const wf = readFileSync(join(ROOT, ".github/workflows/pages.yml"), "utf8");
    const uses = [...wf.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]!);
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) {
      expect(u).toMatch(/@[0-9a-f]{40}$/);
    }
  });
});

describe("scripts/build-all.sh - --api-out is honored without --api-entry", () => {
  // Regression for the path-mismatch bug: the else branch (no --api-entry) used
  // to hardcode the API stage dir, ignoring --api-out, while the external build
  // was pointed at --api-out → the builder couldn't find the API docs. Both the
  // build-api-docs --out and the build-external --api-dir must resolve to the
  // SAME caller-supplied --api-out.
  function runWithStubs(extraArgs: string[]) {
    const work = mkdtempSync(join(tmpdir(), "build-all-"));
    const scripts = join(work, "scripts");
    mkdirSync(scripts, { recursive: true });
    // Real lib.sh (REPO_ROOT resolves to the temp tree) + real entrypoint.
    writeFileSync(join(scripts, "lib.sh"), readFileSync(join(ROOT, "scripts/lib.sh"), "utf8"));
    writeFileSync(join(scripts, "build-all.sh"), readFileSync(join(ROOT, "scripts/build-all.sh"), "utf8"));
    // Stubs record the flags they were invoked with, then exit 0.
    const log = join(work, "calls.log");
    const stub = (name: string) =>
      `#!/usr/bin/env bash\nprintf '${name} %s\\n' "$*" >> "${log}"\nexit 0\n`;
    for (const s of ["build-api-docs.sh", "build-external.sh", "build-techdocs.sh"]) {
      writeFileSync(join(scripts, s), stub(s), { mode: 0o755 });
    }
    const r = spawnSync("bash", [join(scripts, "build-all.sh"), ...extraArgs], {
      cwd: work,
      encoding: "utf8",
    });
    const calls = existsSync(log) ? readFileSync(log, "utf8") : "";
    rmSync(work, { recursive: true, force: true });
    return { r, calls };
  }

  test("else branch passes --out=<api-out> to build-api-docs and --api-dir=<api-out> to build-external", () => {
    const { r, calls } = runWithStubs(["--api-out", "/tmp/custom-api-out"]);
    expect(r.status).toBe(0);
    // build-api-docs must be told to WRITE to the custom dir (the bug wrote to the stage dir).
    expect(calls).toMatch(/build-api-docs\.sh .*--out \/tmp\/custom-api-out/);
    // build-external must be told to READ from the SAME custom dir.
    expect(calls).toMatch(/build-external\.sh .*--api-dir \/tmp\/custom-api-out/);
    // No --entry: this exercises the else branch specifically.
    expect(calls).not.toMatch(/build-api-docs\.sh .*--entry/);
  });

  test("default (no --api-out) routes both sides to the in-repo stage dir", () => {
    const { r, calls } = runWithStubs([]);
    expect(r.status).toBe(0);
    expect(calls).toMatch(/build-api-docs\.sh .*--out \S*\.build-workspace\/api/);
    expect(calls).toMatch(/build-external\.sh .*--api-dir \S*\.build-workspace\/api/);
  });
});

describe("scripts/build-api-docs.sh - TypeDoc Markdown emit (in-repo fixture)", () => {
  test("emits a Markdown index for the fixture package", () => {
    // Requires `bun install` to have populated node_modules/.bin/typedoc.
    if (!existsSync(join(ROOT, "node_modules/.bin/typedoc"))) {
      console.log("SKIP: typedoc not installed (run bun install)");
      return;
    }
    const out = mkdtempSync(join(tmpdir(), "api-docs-"));
    try {
      const r = sh("scripts/build-api-docs.sh", ["--out", out]);
      expect(r.stdout + r.stderr).toContain("build-api-docs: PASS");
      expect(existsSync(join(out, "index.md"))).toBe(true);
      const idx = readFileSync(join(out, "index.md"), "utf8");
      expect(idx).toMatch(/isAirGapSafe|DeploymentProfile|DocsHostingOptions/);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});

describe("scripts/offline-smoke.sh - rejects remote-CDN output", () => {
  test("fails when index.html references a remote CDN asset", () => {
    const site = mkdtempSync(join(tmpdir(), "site-"));
    try {
      mkdirSync(join(site, "assets"), { recursive: true });
      mkdirSync(join(site, "search"), { recursive: true });
      writeFileSync(join(site, "search/search_index.json"), JSON.stringify({ docs: [{ location: "", title: "x", text: "y" }] }));
      writeFileSync(
        join(site, "index.html"),
        `<head><script src="https://cdn.example.com/x.js"></script></head>`,
      );
      const r = sh("scripts/offline-smoke.sh", ["--site", site]);
      expect(r.status).not.toBe(0);
      expect(r.stdout + r.stderr).toMatch(/remote CDN asset references/);
    } finally {
      rmSync(site, { recursive: true, force: true });
    }
  });

  test("passes on a self-contained site with a non-empty search index", () => {
    const site = mkdtempSync(join(tmpdir(), "site-ok-"));
    try {
      mkdirSync(join(site, "assets"), { recursive: true });
      mkdirSync(join(site, "search"), { recursive: true });
      writeFileSync(join(site, "search/search_index.json"), JSON.stringify({ docs: [{ location: "", title: "Home", text: "CuraOS" }] }));
      writeFileSync(join(site, "index.html"), `<head><link rel="stylesheet" href="assets/main.css"></head><body>CuraOS</body>`);
      const r = sh("scripts/offline-smoke.sh", ["--site", site]);
      expect(r.stdout + r.stderr).toContain("offline-smoke: PASS");
      expect(r.status).toBe(0);
    } finally {
      rmSync(site, { recursive: true, force: true });
    }
  });
});
