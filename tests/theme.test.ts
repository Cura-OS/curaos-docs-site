import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { emitCss, heroSvg, architectureSvg } from "../src/theme/emit.ts";
import { emitHomeTemplate } from "../src/theme/home.ts";
import { THEME_VARIANTS, DEFAULT_VARIANT, resolveVariant } from "../src/design-tokens.ts";

const ROOT = join(import.meta.dir, "..");
const STYLES = join(ROOT, "examples", "content", "stylesheets");

describe("design-tokens - shared source", () => {
  test("ships at least two named theme variants", () => {
    expect(Object.keys(THEME_VARIANTS).length).toBeGreaterThanOrEqual(2);
    expect(THEME_VARIANTS[DEFAULT_VARIANT]).toBeDefined();
  });

  test("resolveVariant throws on an unknown key (fail fast)", () => {
    expect(() => resolveVariant("does-not-exist")).toThrow(/unknown theme variant/);
  });

  test("the default variant is de-tealed (indigo-violet hue, not teal)", () => {
    // Aurora primary sits at OKLCH hue ~283 (indigo-violet), NOT the teal band.
    const p = resolveVariant("aurora").palette.primary.light;
    const hue = Number(p.replace(/oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s*\)/, "$1"));
    expect(hue).toBeGreaterThan(270);
    expect(hue).toBeLessThan(300);
  });
});

describe("theme emitter - parameterized, two distinct outputs", () => {
  test("emits distinct CSS for two different variant keys", () => {
    const aurora = emitCss("aurora");
    const aqua = emitCss("aqua");
    expect(aurora).not.toBe(aqua);
    // Both must be real skins (token block + bridge + chrome), not stubs.
    for (const css of [aurora, aqua]) {
      expect(css).toContain("@font-face");
      expect(css).toContain(":root{");
      expect(css).toContain("--md-primary-fg-color");
      expect(css).toContain("prefers-reduced-motion");
    }
    // The brand hue differs between variants (283 vs 220 band).
    expect(aurora).toMatch(/--c-primary:light-dark\(oklch\(0\.\d+ 0\.\d+ 28\d/);
    expect(aqua).toMatch(/--c-primary:light-dark\(oklch\(0\.\d+ 0\.\d+ 2[12]\d/);
  });

  test("self-hosts woff2 with RELATIVE url() (zero-egress)", () => {
    const css = emitCss(DEFAULT_VARIANT);
    expect(css).toContain('url("fonts/inter-latin-variable.woff2")');
    expect(css).toContain('url("fonts/jetbrains-mono-latin-variable.woff2")');
    expect(css).toContain('url("fonts/ibm-plex-arabic-400.woff2")');
    // No remote font/CDN reference anywhere.
    expect(css).not.toMatch(/https?:\/\//);
  });

  test("emits RTL logical-property handling + dark scheme", () => {
    const css = emitCss(DEFAULT_VARIANT);
    expect(css).toContain("[dir=rtl]");
    expect(css).toContain('[data-md-color-scheme="slate"]');
    expect(css).toContain('[data-md-color-scheme="default"]');
  });

  test("uses OKLCH, never #000/#fff literals", () => {
    const css = emitCss(DEFAULT_VARIANT);
    expect(css).toContain("oklch(");
    expect(css).not.toMatch(/#000\b|#fff\b|#000000|#ffffff/);
  });

  test("keeps hero primary CTA text on the on-primary token", () => {
    const css = emitCss(DEFAULT_VARIANT);
    expect(css).toContain(
      ".md-typeset .hero-cta--primary,.md-typeset .hero-cta--primary:visited{background:var(--c-primary);color:var(--c-on-primary)!important}"
    );
    expect(css).toContain(
      ".md-typeset .hero-cta--primary:hover,.md-typeset .hero-cta--primary:focus-visible{background:var(--c-primary-hover);color:var(--c-on-primary)!important;transform:translateY(-1px)}"
    );
  });
});

describe("inline-SVG illustrations (the committed art, not a token spread)", () => {
  test("hero SVG is aria-labelled and currentColor-themed", () => {
    const svg = heroSvg({ coreLabel: "Neutral core", overlays: ["Health", "Education", "ERP"], label: "x" });
    expect(svg).toContain("<svg");
    expect(svg).toContain('role="img"');
    expect(svg).toContain("aria-label=");
    expect(svg).toContain("var(--c-primary)");
    expect(svg).toContain("float-a"); // the animated tile hook
  });

  test("architecture SVG draws the downward dependency (charter invariant)", () => {
    const svg = architectureSvg({ coreLabel: "Neutral core", overlays: ["Health", "ERP"], caption: "y" });
    expect(svg).toContain("marker-end"); // arrows overlay -> core
    expect(svg).toContain("FOUNDATION");
    expect(svg).toContain("var(--c-secondary)"); // overlay nodes in secondary hue
  });

  test("home template is a real hero landing (not stock grid cards)", () => {
    const html = emitHomeTemplate();
    expect(html).toContain('{% extends "main.html" %}');
    expect(html).toContain('class="hero"');
    expect(html).toContain('class="hero-art"');
    expect(html).toContain('class="home-cards"');
    expect(html).toContain("{{ page.content }}"); // authored prose still rendered
    expect(html).not.toContain("grid cards"); // the rejected stock pattern
  });
});

describe("generated artifacts are committed + in sync with the emitter", () => {
  test("the active extra.css matches a fresh emit of the default variant", () => {
    const onDisk = readFileSync(join(STYLES, "extra.css"), "utf8");
    expect(onDisk).toBe(emitCss(DEFAULT_VARIANT));
  });

  test("every variant has a committed sibling stylesheet", () => {
    for (const key of Object.keys(THEME_VARIANTS)) {
      const f = join(STYLES, `extra.${key}.css`);
      expect(existsSync(f)).toBe(true);
      expect(readFileSync(f, "utf8")).toBe(emitCss(key));
    }
  });

  test("the bundled woff2 font files exist (self-hosted, zero-egress)", () => {
    for (const f of [
      "inter-latin-variable.woff2",
      "jetbrains-mono-latin-variable.woff2",
      "ibm-plex-arabic-400.woff2",
      "ibm-plex-arabic-600.woff2",
    ]) {
      expect(existsSync(join(STYLES, "fonts", f))).toBe(true);
    }
  });
});
