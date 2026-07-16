// public-api-docs.ts: generate PUBLIC API reference Markdown from the services'
// OpenAPI (HTTP) + AsyncAPI (durable events) specs, DENY-BY-DEFAULT.
//
// ADR-0262 / V12-GA-SURFACE-API-DOCS. The tier config (config/api-tiers.json)
// is an ALLOWLIST: a service surface is published ONLY if its key appears in
// http.public (OpenAPI) or events.public (AsyncAPI). Anything else -- every
// internal, admin, and PHI surface -- is denied by construction, so a forgotten
// flag never leaks a blueprint. The public arrays are UD-8-gated (see the config
// note); the deny-default FRAMEWORK ships now, the final public list lands with
// UD-8.
//
// Repo-boundary rule: specs live in the workspace, NOT this repo. The caller
// passes --specs-root; we never hardcode a workspace path. With no --specs-root
// we fall back to examples/public-api-fixture so the generator is exercisable
// standalone in the local CI gate.
//
// Reuses the docs-site generation shape: emits Markdown into --out so
// build-external.sh stages it alongside the TypeDoc api/ output for MkDocs.
//
// Usage:
//   bun scripts/public-api-docs.ts [--specs-root DIR] [--out DIR] [--config PATH]
import { parse as parseYaml } from "yaml";
import { readdirSync, statSync, readFileSync, existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";

const REPO_ROOT = dirname(import.meta.dir);

export type Tier = "public" | "internal";
export interface TierConfig {
  defaultTier: Tier;
  http: { public: string[] };
  events: { public: string[] };
}

export interface DiscoveredSpec {
  kind: "http" | "events";
  key: string; // surface key: service dir name
  file: string;
}

export interface GenResult {
  published: DiscoveredSpec[];
  denied: DiscoveredSpec[];
}

export function loadTierConfig(path: string): TierConfig {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  // Deny-by-default: a missing/garbled allowlist must expose NOTHING, never all.
  return {
    defaultTier: raw.defaultTier === "public" ? "public" : "internal",
    http: { public: Array.isArray(raw?.http?.public) ? raw.http.public : [] },
    events: { public: Array.isArray(raw?.events?.public) ? raw.events.public : [] },
  };
}

// A surface is published ONLY when its key is in the matching allowlist.
// defaultTier is honored so a deployment MAY opt into publish-by-default, but the
// shipped config sets it to "internal" -- the safe default.
export function isPublic(kind: "http" | "events", key: string, cfg: TierConfig): boolean {
  const allow = kind === "http" ? cfg.http.public : cfg.events.public;
  if (allow.includes(key)) return true;
  return cfg.defaultTier === "public";
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// Surface key = the service directory name. specs live at
// <root>/<service>/{dist/openapi.yaml, specs/*.asyncapi.yaml}. We take the first
// path segment under the specs root so both spec kinds resolve to one key.
export function surfaceKey(root: string, file: string): string {
  const rel = file.slice(root.length).replace(/^[/\\]+/, "");
  const seg = rel.split(/[/\\]/)[0];
  return seg ?? basename(file);
}

export function discoverSpecs(root: string): DiscoveredSpec[] {
  if (!existsSync(root)) return [];
  const specs: DiscoveredSpec[] = [];
  for (const file of walk(root)) {
    if (/\.asyncapi\.ya?ml$/.test(file)) {
      specs.push({ kind: "events", key: surfaceKey(root, file), file });
    } else if (/(^|[/\\])openapi\.(ya?ml|json)$/.test(file)) {
      specs.push({ kind: "http", key: surfaceKey(root, file), file });
    }
  }
  return specs;
}

function readDoc(file: string): any {
  const text = readFileSync(file, "utf8");
  return file.endsWith(".json") ? JSON.parse(text) : parseYaml(text);
}

// Strip em/en dashes so generated Markdown never trips the no-em-dash gate even
// when a source spec description contains one.
function clean(s: unknown): string {
  return String(s ?? "").replace(/[\u2014\u2013]/g, "-");
}

export function renderOpenApi(doc: any): string {
  const info = doc?.info ?? {};
  const lines = [`# ${clean(info.title) || "HTTP API"}`, ""];
  if (info.version) lines.push(`Version: \`${clean(info.version)}\``, "");
  if (info.description) lines.push(clean(info.description), "");
  lines.push("## Operations", "");
  const paths = doc?.paths ?? {};
  const rows: string[] = ["| Method | Path | Operation | Summary |", "| --- | --- | --- | --- |"];
  for (const [path, item] of Object.entries<any>(paths)) {
    for (const method of ["get", "post", "put", "patch", "delete", "options", "head"]) {
      const op = item?.[method];
      if (!op) continue;
      const summary = clean(op.summary || op.description || "").split("\n")[0];
      rows.push(`| ${method.toUpperCase()} | \`${clean(path)}\` | \`${clean(op.operationId) || "-"}\` | ${summary} |`);
    }
  }
  lines.push(rows.length > 2 ? rows.join("\n") : "_No operations._", "");
  return lines.join("\n") + "\n";
}

export function renderAsyncApi(doc: any): string {
  const info = doc?.info ?? {};
  const lines = [`# ${clean(info.title) || "Event contract"}`, ""];
  if (info.version) lines.push(`Version: \`${clean(info.version)}\``, "");
  if (info.description) lines.push(clean(info.description), "");
  lines.push("## Channels", "");
  const channels = doc?.channels ?? {};
  const rows: string[] = ["| Channel | Address | Messages |", "| --- | --- | --- |"];
  for (const [name, ch] of Object.entries<any>(channels)) {
    const msgs = Object.keys(ch?.messages ?? {}).map(clean).join(", ");
    rows.push(`| \`${clean(name)}\` | \`${clean(ch?.address) || "-"}\` | ${msgs || "-"} |`);
  }
  lines.push(rows.length > 2 ? rows.join("\n") : "_No channels._", "");
  return lines.join("\n") + "\n";
}

// Per-version surface index (lives at <kind>/<version>/index.md). Links point
// down into services/<key>.md, relative to this version dir.
function indexPage(kind: "http" | "events", version: string, published: DiscoveredSpec[]): string {
  const title = kind === "http" ? "Public HTTP API reference" : "Public event contracts";
  const lines = [`# ${title} (${version})`, ""];
  lines.push(
    "Generated from the services' " + (kind === "http" ? "OpenAPI" : "AsyncAPI") + " specs.",
    "DENY-BY-DEFAULT: only surfaces in the public tier of `config/api-tiers.json` appear here.",
    ""
  );
  if (published.length === 0) {
    lines.push(
      "_No surface is currently published in this tier._ The public list is",
      "UD-8-gated; add a service key to the allowlist once the public surface is",
      "approved.",
      ""
    );
    return lines.join("\n") + "\n";
  }
  lines.push("## Published surfaces", "");
  for (const s of published) lines.push(`- [${s.key}](services/${s.key}.md)`);
  lines.push("");
  return lines.join("\n") + "\n";
}

// Existing version dirs under a kind root (dirs whose name is not "index.md").
function versionDirs(kindRoot: string): string[] {
  if (!existsSync(kindRoot)) return [];
  return readdirSync(kindRoot).filter((name) =>
    statSync(join(kindRoot, name)).isDirectory()
  );
}

// Newest-first (descending), numeric/semver-aware. A plain lexicographic
// .sort().reverse() mislabels once minors go double-digit: 'v1.10' sorts
// before 'v1.9', so the switcher would mark the wrong version (current).
// Strip the leading 'v', split on '.', compare each component numerically.
export function listVersions(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const pa = a.replace(/^v/, "").split(".").map(Number);
    const pb = b.replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const da = pa[i] ?? 0;
      const db = pb[i] ?? 0;
      if (da !== db) return db - da; // descending
    }
    return 0;
  });
}

// Version switcher (lives at <kind>/index.md): the real "version switcher"
// deliverable. It links to every published API version present on disk. How MANY
// versions are retained is the UD-8 retention pick; the switcher covers whatever
// is emitted, so retention is a build-input, not a code change.
export function switcherPage(kind: "http" | "events", versions: string[]): string {
  const title = kind === "http" ? "HTTP API reference" : "Event contracts";
  const lines = [`# ${title}`, "", "Select an API version:", ""];
  if (versions.length === 0) {
    lines.push("_No versions published yet._", "");
    return lines.join("\n") + "\n";
  }
  versions.forEach((v, i) => {
    const label = i === 0 ? `${v} (current)` : v;
    lines.push(`- [${label}](${v}/index.md)`);
  });
  lines.push("");
  return lines.join("\n") + "\n";
}

function topIndexPage(): string {
  return [
    "# API and event reference",
    "",
    "Versioned, generated from the CuraOS contract pipeline (TypeSpec -> OpenAPI /",
    "AsyncAPI). Reference surfaces are DENY-BY-DEFAULT: a service appears only when",
    "its key is in the public tier of `config/api-tiers.json`.",
    "",
    "- [HTTP API reference](api/index.md)",
    "- [Event contracts](events/index.md)",
    "",
  ].join("\n") + "\n";
}

export function generate(
  specsRoot: string,
  outDir: string,
  cfg: TierConfig,
  apiVersion = "v1.2",
): GenResult {
  const specs = discoverSpecs(specsRoot);
  const published: DiscoveredSpec[] = [];
  const denied: DiscoveredSpec[] = [];
  const httpDir = join(outDir, "api", apiVersion, "services");
  const eventsDir = join(outDir, "events", apiVersion, "services");
  // Idempotent per version: clear only THIS version's subtree so a later build of
  // another version publishes alongside it (multi-version switcher) rather than
  // wiping it.
  rmSync(join(outDir, "api", apiVersion), { recursive: true, force: true });
  rmSync(join(outDir, "events", apiVersion), { recursive: true, force: true });
  mkdirSync(httpDir, { recursive: true });
  mkdirSync(eventsDir, { recursive: true });

  for (const spec of specs) {
    if (!isPublic(spec.kind, spec.key, cfg)) {
      denied.push(spec);
      continue;
    }
    const doc = readDoc(spec.file);
    const md = spec.kind === "http" ? renderOpenApi(doc) : renderAsyncApi(doc);
    const dir = spec.kind === "http" ? httpDir : eventsDir;
    writeFileSync(join(dir, `${spec.key}.md`), md);
    published.push(spec);
  }
  writeFileSync(
    join(outDir, "api", apiVersion, "index.md"),
    indexPage("http", apiVersion, published.filter((s) => s.kind === "http")),
  );
  writeFileSync(
    join(outDir, "events", apiVersion, "index.md"),
    indexPage("events", apiVersion, published.filter((s) => s.kind === "events")),
  );
  // Rebuild the switchers by scanning every version dir present (this build's +
  // any prior versions kept in outDir).
  writeFileSync(join(outDir, "api", "index.md"), switcherPage("http", listVersions(versionDirs(join(outDir, "api")))));
  writeFileSync(join(outDir, "events", "index.md"), switcherPage("events", listVersions(versionDirs(join(outDir, "events")))));
  writeFileSync(join(outDir, "index.md"), topIndexPage());
  return { published, denied };
}

function flag(name: string, argv: string[]): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : undefined;
}

function main() {
  const argv = Bun.argv.slice(2);
  let specsRoot = flag("specs-root", argv);
  if (!specsRoot) {
    console.error("no --specs-root supplied; using examples/public-api-fixture/specs");
    specsRoot = join(REPO_ROOT, "examples", "public-api-fixture", "specs");
  }
  // Default OUTSIDE .build-workspace: build-external.sh wipes .build-workspace at
  // the start of its run, so the reference is staged from .build-ref to survive
  // and get copied into the site under reference/.
  const outDir = flag("out", argv) ?? join(REPO_ROOT, ".build-ref", "public-api");
  const configPath =
    flag("config", argv) ??
    (existsSync(join(REPO_ROOT, "examples", "public-api-fixture", "api-tiers.json")) && !flag("specs-root", argv)
      ? join(REPO_ROOT, "examples", "public-api-fixture", "api-tiers.json")
      : join(REPO_ROOT, "config", "api-tiers.json"));

  const apiVersion = flag("api-version", argv) ?? "v1.2";
  const cfg = loadTierConfig(configPath);
  const { published, denied } = generate(specsRoot, outDir, cfg, apiVersion);
  console.error(`config: ${configPath}`);
  console.error(`api version: ${apiVersion}`);
  console.error(`published (public tier): ${published.length} -> ${outDir}`);
  for (const s of published) console.error(`  PUBLISH ${s.kind} ${s.key}`);
  console.error(`denied (deny-by-default): ${denied.length}`);
  for (const s of denied) console.error(`  DENY    ${s.kind} ${s.key}`);
  console.log("public-api-docs: PASS");
}

if (import.meta.main) main();
