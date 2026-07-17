// Deny-by-default is the security property under test: an internal surface must
// NEVER reach generated output, and a garbled/empty allowlist must publish
// nothing (fail closed).
import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  loadTierConfig,
  isPublic,
  discoverSpecs,
  surfaceKey,
  renderOpenApi,
  renderAsyncApi,
  authForOp,
  generate,
  listVersions,
  switcherPage,
  type TierConfig,
} from "../scripts/public-api-docs.ts";

const ROOT = join(import.meta.dir, "..");
const FIXTURE = join(ROOT, "examples", "public-api-fixture");
const SPECS = join(FIXTURE, "specs");

describe("isPublic (deny-by-default)", () => {
  const cfg: TierConfig = { defaultTier: "internal", http: { public: ["a"] }, events: { public: ["b"] } };
  test("only allowlisted key is public", () => {
    expect(isPublic("http", "a", cfg)).toBe(true);
    expect(isPublic("http", "b", cfg)).toBe(false); // b is events-only
    expect(isPublic("events", "b", cfg)).toBe(true);
    expect(isPublic("http", "unknown", cfg)).toBe(false);
  });
});

describe("loadTierConfig fails closed", () => {
  test("garbled allowlists collapse to empty (deny all)", async () => {
    const p = join(import.meta.dir, "_bad-tier.json");
    await Bun.write(p, JSON.stringify({ defaultTier: "internal", http: "oops", events: null }));
    const cfg = loadTierConfig(p);
    expect(cfg.http.public).toEqual([]);
    expect(cfg.events.public).toEqual([]);
    rmSync(p, { force: true });
  });
  test("shipped config: UD-8-approved neutral GA surface only, deny-by-default preserved", () => {
    const cfg = loadTierConfig(join(ROOT, "config", "api-tiers.json"));
    // Deny-by-default default tier is preserved: anything not allowlisted is internal.
    expect(cfg.defaultTier).toBe("internal");
    // UD-8 (2026-07-17) approved ONLY the neutral core service contracts.
    expect(cfg.http.public).toEqual(["tenancy-core-service", "party-core-service"]);
    expect(cfg.events.public).toEqual(["tenancy-core-service", "party-core-service"]);
    // Invariant: NO PHI/healthstack/identity/admin key may ever enter the allowlist.
    const all = [...cfg.http.public, ...cfg.events.public];
    for (const key of all) {
      expect(key).not.toMatch(/healthstack|patient|identity|auth|admin|clinical|encounter|ops/i);
    }
  });
});

describe("discovery", () => {
  test("finds both spec kinds keyed by service dir", () => {
    const specs = discoverSpecs(SPECS);
    const http = specs.filter((s) => s.kind === "http").map((s) => s.key).sort();
    const events = specs.filter((s) => s.kind === "events").map((s) => s.key).sort();
    expect(http).toEqual(["public-thing-service", "secret-admin-service"]);
    expect(events).toEqual(["public-thing-service", "secret-admin-service"]);
  });
  test("surfaceKey is the first path segment under root", () => {
    expect(surfaceKey(SPECS, join(SPECS, "public-thing-service", "dist", "openapi.yaml"))).toBe("public-thing-service");
  });
});

describe("render", () => {
  test("openapi lists operations with a derived Auth column", () => {
    const md = renderOpenApi({ info: { title: "T", version: "1" }, paths: { "/x": { get: { operationId: "X_get", summary: "s" } } } });
    // No declared 401/403 on this op -> unauthenticated probe -> Public.
    expect(md).toContain("| GET | `/x` | `X_get` | Public | s |");
  });
  test("asyncapi lists channels", () => {
    const md = renderAsyncApi({ info: { title: "T" }, channels: { c: { address: "a.v1", messages: { M: {} } } } });
    expect(md).toContain("| `c` | `a.v1` | M |");
  });
  test("strips em/en dashes from source descriptions", () => {
    const md = renderOpenApi({ info: { title: "T", description: "a \u2014 b \u2013 c" }, paths: {} });
    expect(md).not.toMatch(/[\u2014\u2013]/);
  });
  test("renders the gateway base path from the spec servers", () => {
    const md = renderOpenApi({
      info: { title: "T" },
      servers: [{ url: "http://localhost:3000" }, { url: "https://{host}/api/v1/thing" }],
      paths: {},
    });
    expect(md).toContain("Gateway base path: `https://{host}/api/v1/thing`");
  });
});

describe("deny-by-default auth note (security posture, derived from responses)", () => {
  test("authForOp derives requirement from declared error responses", () => {
    // 403 present -> role-gated; 401 only -> token required; neither -> Public.
    expect(authForOp({ responses: { "200": {}, "401": {}, "403": {} } })).toBe("Bearer + role");
    expect(authForOp({ responses: { "200": {}, "401": {} } })).toBe("Bearer");
    expect(authForOp({ responses: { "200": {} } })).toBe("Public");
    expect(authForOp({})).toBe("Public");
  });
  test("every generated http/event page carries the deny-by-default auth note", () => {
    const NOTE = "Deny-by-default authentication";
    const http = renderOpenApi({ info: { title: "T" }, paths: { "/h": { get: { operationId: "H", summary: "s", responses: { "401": {} } } } } });
    const evt = renderAsyncApi({ info: { title: "T" }, channels: { c: { address: "a.v1", messages: { M: {} } } } });
    expect(http).toContain(NOTE);
    expect(http).toContain("`Authorization: Bearer");
    expect(evt).toContain(NOTE);
    // A mold-shaped op (401 + 403) renders as role-gated in the Auth column.
    expect(http).toContain("| GET | `/h` | `H` | Bearer | s |");
  });
  test("switcher and index pages also carry the auth note", () => {
    expect(switcherPage("http", ["v1.2"])).toContain("Deny-by-default authentication");
  });
});

describe("generate (end-to-end deny-by-default, versioned)", () => {
  const out = join(import.meta.dir, "_gen-out");
  const V = "v9.9";
  test("publishes public surface under version dir, denies internal surface", () => {
    rmSync(out, { recursive: true, force: true });
    const cfg = loadTierConfig(join(FIXTURE, "api-tiers.json"));
    const res = generate(SPECS, out, cfg, V);

    expect(res.published.map((s) => s.key).sort()).toEqual(["public-thing-service", "public-thing-service"]);
    expect(res.denied.every((s) => s.key === "secret-admin-service")).toBe(true);
    expect(res.denied.length).toBe(2);

    expect(existsSync(join(out, "api", V, "services", "public-thing-service.md"))).toBe(true);
    expect(existsSync(join(out, "events", V, "services", "public-thing-service.md"))).toBe(true);
    // The security assertion: nothing internal on disk, at all.
    expect(existsSync(join(out, "api", V, "services", "secret-admin-service.md"))).toBe(false);
    expect(existsSync(join(out, "events", V, "services", "secret-admin-service.md"))).toBe(false);

    const allText = readdirSync(join(out, "api", V, "services"))
      .concat(readdirSync(join(out, "events", V, "services")))
      .join("\n");
    expect(allText).not.toContain("secret");

    // Version switcher links the emitted version, marked current.
    const httpSwitcher = readFileSync(join(out, "api", "index.md"), "utf8");
    expect(httpSwitcher).toContain(`[${V} (current)](${V}/index.md)`);
    // Per-version index links down into services/.
    const httpIndex = readFileSync(join(out, "api", V, "index.md"), "utf8");
    expect(httpIndex).toContain("[public-thing-service](services/public-thing-service.md)");

    rmSync(out, { recursive: true, force: true });
  });

  test("switcher accumulates multiple versions, newest first", () => {
    rmSync(out, { recursive: true, force: true });
    const cfg: TierConfig = { defaultTier: "internal", http: { public: [] }, events: { public: [] } };
    generate(SPECS, out, cfg, "v1.1");
    generate(SPECS, out, cfg, "v1.2");
    const switcher = readFileSync(join(out, "api", "index.md"), "utf8");
    const iCur = switcher.indexOf("v1.2");
    const iPrev = switcher.indexOf("v1.1");
    expect(iCur).toBeGreaterThanOrEqual(0);
    expect(iPrev).toBeGreaterThan(iCur); // newest listed first
    rmSync(out, { recursive: true, force: true });
  });

  test("listVersions is numeric-aware: v1.10 outranks v1.9 (not lexicographic)", () => {
    expect(listVersions(["v1.2", "v1.9", "v1.10"])).toEqual(["v1.10", "v1.9", "v1.2"]);
    // switcher marks the true-latest current, not the lexicographic max.
    const page = switcherPage("http", listVersions(["v1.2", "v1.9", "v1.10"]));
    expect(page).toContain("[v1.10 (current)](v1.10/index.md)");
    expect(page).not.toContain("v1.9 (current)");
  });

  test("empty allowlist publishes nothing (deny all)", () => {
    rmSync(out, { recursive: true, force: true });
    const cfg: TierConfig = { defaultTier: "internal", http: { public: [] }, events: { public: [] } };
    const res = generate(SPECS, out, cfg, V);
    expect(res.published.length).toBe(0);
    expect(res.denied.length).toBe(4);
    rmSync(out, { recursive: true, force: true });
  });
});
