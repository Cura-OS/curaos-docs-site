// emit-theme.ts: CLI driver that REGENERATES the docs theme artifacts.
//
// Run: `bun run emit:theme` (or `bun src/theme/emit-theme.ts [--variant KEY]`).
//
// Writes, from the shared design tokens + the parameterized emitter:
//   examples/content/stylesheets/extra.css   (the active skin; default variant)
//   overrides/main.html                       (thin Material override parent)
//   overrides/home.html                       (the generated hero landing)
//
// It ALSO proves the source is parameterized by writing the non-default variant
// CSS to a sibling file (extra.<variant>.css) for every known variant, so the
// "two keys -> two distinct outputs" property is demonstrable on disk and the
// tests can diff them. Switching the active variant = `--variant aqua`; adding a
// variant = a new entry in design-tokens THEME_VARIANTS (no edit here).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { emitCss } from "./emit.ts";
import { emitHomeTemplate, emitMainTemplate } from "./home.ts";
import { THEME_VARIANTS, DEFAULT_VARIANT } from "../design-tokens.ts";

const REPO = join(import.meta.dir, "..", "..");
const STYLES = join(REPO, "examples", "content", "stylesheets");
const OVERRIDES = join(REPO, "overrides");

function flag(name: string, fallback: string): string {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1] as string;
  return fallback;
}

export function emitAll(activeVariant: string): string[] {
  mkdirSync(STYLES, { recursive: true });
  mkdirSync(OVERRIDES, { recursive: true });
  const written: string[] = [];

  // The ACTIVE skin (what mkdocs loads via extra_css).
  const active = join(STYLES, "extra.css");
  writeFileSync(active, emitCss(activeVariant));
  written.push(active);

  // Every known variant as a sibling, proving distinct correct emission.
  for (const key of Object.keys(THEME_VARIANTS)) {
    const f = join(STYLES, `extra.${key}.css`);
    writeFileSync(f, emitCss(key));
    written.push(f);
  }

  // Generated Material override templates (the real hero landing).
  const mainHtml = join(OVERRIDES, "main.html");
  writeFileSync(mainHtml, emitMainTemplate());
  written.push(mainHtml);

  const homeHtml = join(OVERRIDES, "home.html");
  writeFileSync(homeHtml, emitHomeTemplate());
  written.push(homeHtml);

  return written;
}

if (import.meta.main) {
  const variant = flag("variant", DEFAULT_VARIANT);
  if (!THEME_VARIANTS[variant]) {
    process.stderr.write(
      `unknown variant: ${variant} (known: ${Object.keys(THEME_VARIANTS).join(", ")})\n`,
    );
    process.exit(1);
  }
  const written = emitAll(variant);
  process.stdout.write(
    `emit:theme: variant=${variant}, wrote ${written.length} files:\n` +
      written.map((w) => `  ${w.replace(REPO + "/", "")}`).join("\n") +
      "\n",
  );
}
