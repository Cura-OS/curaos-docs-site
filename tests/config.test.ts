import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

describe("mkdocs.yml (external site config)", () => {
  const yml = readFileSync(join(ROOT, "mkdocs.yml"), "utf8");

  test("uses the Material theme", () => {
    expect(yml).toMatch(/name:\s*material/);
  });

  test("enables strict build (fail on broken refs)", () => {
    expect(yml).toMatch(/^strict:\s*true/m);
  });

  test("enables client-side search (browser-side search works offline)", () => {
    expect(yml).toMatch(/^\s*-\s*search\s*$/m);
  });

  test("disables remote Google Fonts (zero-egress air-gap render)", () => {
    expect(yml).toMatch(/^\s*font:\s*false/m);
  });

  test("builds from the staged build workspace, not a committed docs/ dir", () => {
    expect(yml).toMatch(/docs_dir:\s*\.build-workspace\/docs/);
  });

  test("declares the four top-level nav anchors", () => {
    for (const anchor of ["install/index.md", "integration/index.md", "operations/index.md", "api/index.md"]) {
      expect(yml).toContain(anchor);
    }
  });
});

describe("requirements.txt (python toolchain)", () => {
  const reqs = readFileSync(join(ROOT, "requirements.txt"), "utf8");

  test("pins mkdocs + mkdocs-material exactly (==)", () => {
    expect(reqs).toMatch(/mkdocs==\d+\.\d+\.\d+/);
    expect(reqs).toMatch(/mkdocs-material==\d+\.\d+\.\d+/);
  });

  test("uses no floating ranges", () => {
    expect(reqs).not.toMatch(/>=|~=|\*|\^/);
  });
});

describe("package.json (node toolchain)", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

  test("pins typedoc + typedoc-plugin-markdown exactly", () => {
    expect(pkg.devDependencies.typedoc).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.devDependencies["typedoc-plugin-markdown"]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("exposes the build scripts", () => {
    for (const s of ["ci", "build:external", "build:techdocs", "build:api", "build"]) {
      expect(pkg.scripts[s]).toBeDefined();
    }
  });
});
