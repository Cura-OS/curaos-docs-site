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
  generate,
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
  test("shipped config publishes nothing until UD-8", () => {
    const cfg = loadTierConfig(join(ROOT, "config", "api-tiers.json"));
    expect(cfg.defaultTier).toBe("internal");
    expect(cfg.http.public).toEqual([]);
    expect(cfg.events.public).toEqual([]);
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
  test("openapi lists operations", () => {
    const md = renderOpenApi({ info: { title: "T", version: "1" }, paths: { "/x": { get: { operationId: "X_get", summary: "s" } } } });
    expect(md).toContain("| GET | `/x` | `X_get` | s |");
  });
  test("asyncapi lists channels", () => {
    const md = renderAsyncApi({ info: { title: "T" }, channels: { c: { address: "a.v1", messages: { M: {} } } } });
    expect(md).toContain("| `c` | `a.v1` | M |");
  });
  test("strips em/en dashes from source descriptions", () => {
    const md = renderOpenApi({ info: { title: "T", description: "a \u2014 b \u2013 c" }, paths: {} });
    expect(md).not.toMatch(/[\u2014\u2013]/);
  });
});

describe("generate (end-to-end deny-by-default)", () => {
  const out = join(import.meta.dir, "_gen-out");
  test("publishes public surface, denies internal surface", () => {
    rmSync(out, { recursive: true, force: true });
    const cfg = loadTierConfig(join(FIXTURE, "api-tiers.json"));
    const res = generate(SPECS, out, cfg);

    expect(res.published.map((s) => s.key).sort()).toEqual(["public-thing-service", "public-thing-service"]);
    expect(res.denied.every((s) => s.key === "secret-admin-service")).toBe(true);
    expect(res.denied.length).toBe(2);

    expect(existsSync(join(out, "api", "services", "public-thing-service.md"))).toBe(true);
    expect(existsSync(join(out, "events", "services", "public-thing-service.md"))).toBe(true);
    // The security assertion: nothing internal on disk, at all.
    expect(existsSync(join(out, "api", "services", "secret-admin-service.md"))).toBe(false);
    expect(existsSync(join(out, "events", "services", "secret-admin-service.md"))).toBe(false);

    const allText = readdirSync(join(out, "api", "services"))
      .concat(readdirSync(join(out, "events", "services")))
      .map((f) => f)
      .join("\n");
    expect(allText).not.toContain("secret");

    rmSync(out, { recursive: true, force: true });
  });

  test("empty allowlist publishes nothing (deny all)", () => {
    rmSync(out, { recursive: true, force: true });
    const cfg: TierConfig = { defaultTier: "internal", http: { public: [] }, events: { public: [] } };
    const res = generate(SPECS, out, cfg);
    expect(res.published.length).toBe(0);
    expect(res.denied.length).toBe(4);
    rmSync(out, { recursive: true, force: true });
  });
});
