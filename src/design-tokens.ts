// design-tokens.ts: the docs-site's ATLAS override layer on @curaos/design-
// tokens (UIGEN-27, ADR-0277).
//
// @curaos/design-tokens (curaos/frontend/packages/design-tokens) is now the
// single fleet-wide DTCG base token SOURCE (colors, type scale, radius,
// elevation, motion, spacing, breakpoints, z-index). This file no longer
// re-derives that catalog from scratch: it depends on the shared package
// (see package.json) and reads its tokens.json (SHARED_BASE below) as the
// foundation, then layers docs-specific overrides on top where the docs
// identity legitimately diverges from the fleet default, per ADR-0277's own
// scope note (docs-site keeps its "aurora"/"aqua" render pipeline, only the
// token SOURCE relationship changes; curaos-website is out of scope).
//
// Every ladder below (TYPE_SCALE, RADIUS, ELEVATION, MOTION, FONTS, the OKLCH
// palettes) is a DOCUMENTED OVERRIDE, not an accidental duplicate: the docs
// site's brand identity (fluid clamp() type on a perceptual OKLCH ramp,
// self-hosted variable fonts, brand-tinted elevation) is a different design
// language than the shared package's discrete px/hex scale, by design (see
// ADR-0277 "Scope note: curaos-website stays HSL, OKLCH deferred"), so the
// values are kept as-is to hold the site's VR baseline at diff=0. Where a
// docs value is genuinely IDENTICAL to the shared base (currently: the
// 48rem/768px breakpoint), it is sourced from SHARED_BASE directly instead of
// being re-typed as a second literal - see BREAKPOINT_MD_REM below.
//
// The module is intentionally framework-free and near-zero-dependency beyond
// the shared token package: it exports plain data (OKLCH color strings,
// numeric ladders) plus a couple of pure helpers. It emits NOTHING at import
// time beyond reading the shared JSON (no writes, no network), so a consumer
// can pick exactly the primitives it needs.
//
// DESIGN LAWS encoded here (so the output passes the "AI made that" test):
//   - Color is OKLCH, never #000/#fff. Neutrals are TINTED toward the brand hue
//     (a cool plum-grey), not pure grey. Light + dark are derived from the same
//     ramp, not two hand-picked palettes.
//   - A real type scale on a >=1.25 ratio (major-third leaning), not letter-
//     spacing tricks on stock sizes.
//   - A real elevation ladder (layered, low-alpha, brand-tinted shadows), not a
//     single 1px box-shadow.
//   - Motion is ease-out (no bounce/overshoot), short, and ALWAYS reduced-motion
//     guarded at the consumer.
//   - Two named THEME VARIANTS prove the source is parameterized: "aurora" is
//     the committed CuraOS docs identity (indigo-violet primary + warm coral
//     secondary, DE-TEALED); "aqua" is the legacy compatibility skin (the older
//     bluish-aqua identity) kept so the same generator can emit BOTH from one
//     config entry. Adding a third variant = adding one entry to THEME_VARIANTS,
//     never editing the emitter layout code.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/**
 * The shared fleet-wide DTCG token base (@curaos/design-tokens/tokens.json).
 * Resolved via the package's own `exports` map (not a hand-typed relative
 * path) so this keeps working if the shared package ever moves. Read once at
 * module load (data only, no side effects).
 */
const require_ = createRequire(import.meta.url);
export const SHARED_BASE = JSON.parse(
  readFileSync(require_.resolve("@curaos/design-tokens/tokens.json"), "utf8"),
) as {
  breakpoint: Record<string, { $value: string }>;
};

function pxToRem(px: string): string {
  const n = Number(px.replace(/px$/, ""));
  return `${n / 16}rem`;
}

/**
 * The one breakpoint where the docs site's pre-existing literal (48rem) is
 * byte-identical to the shared base (breakpoint.md = 768px = 48rem @ the
 * standard 16px root), so it is sourced from SHARED_BASE instead of kept as a
 * second hand-typed literal. The docs-only 60rem breakpoint (src/theme/emit.ts)
 * has no shared-scale equivalent (the fleet ladder jumps 768px -> 1024px) and
 * stays a documented docs-specific value.
 */
export const BREAKPOINT_MD_REM = pxToRem(SHARED_BASE.breakpoint.md!.$value);

/** An OKLCH-based perceptual color ramp, light + dark anchors per stop. */
export interface ColorStop {
  /** Light-scheme value (OKLCH). */
  readonly light: string;
  /** Dark-scheme value (OKLCH). */
  readonly dark: string;
}

export interface Palette {
  /** Brand primary (links, primary action, accents). */
  readonly primary: ColorStop;
  readonly primaryHover: ColorStop;
  /** Quiet primary wash (hero/CTA slab backgrounds). */
  readonly primaryQuiet: ColorStop;
  /** Readable primary text-on-surface (AA on --surface). */
  readonly primaryText: ColorStop;
  /** Foreground placed ON the primary fill (button label). */
  readonly onPrimary: ColorStop;
  /** Secondary brand hue: warm coral, used sparingly for overlay nodes + 1 accent. */
  readonly secondary: ColorStop;
  readonly secondaryQuiet: ColorStop;
  /** Tinted neutral ramp (plum-grey, NOT pure grey). */
  readonly bg: ColorStop;
  readonly bgElev: ColorStop;
  readonly surface: ColorStop;
  readonly surfaceRaised: ColorStop;
  readonly fg: ColorStop;
  readonly fgMuted: ColorStop;
  readonly fgSubtle: ColorStop;
  readonly border: ColorStop;
  readonly borderStrong: ColorStop;
  /** Flat focus ring (a11y: never color-mix, never lost on a no-JS kiosk). */
  readonly ring: ColorStop;
  /** Positive/"shipped" semantic (the honesty grid). */
  readonly positive: ColorStop;
}

export interface ThemeVariant {
  readonly key: string;
  readonly label: string;
  readonly palette: Palette;
}

// ---- Aurora: the committed CuraOS docs identity (DE-TEALED) ----------------
//
// Primary = indigo-violet (oklch ~0.55 0.19 282). Secondary = warm coral
// (oklch ~0.68 0.17 32) used ONLY for the overlay nodes + a single accent.
// Neutrals are tinted toward the plum hue (hue ~285, very low chroma) so the
// whole surface reads as the approved CuraOS navy+gold brand identity, never
// the generic teal-on-white / slate look the critique rejected.
const AURORA: Palette = {
  primary: { light: "oklch(0.40 0.15 264)", dark: "oklch(0.70 0.14 264)" },
  primaryHover: { light: "oklch(0.35 0.16 264)", dark: "oklch(0.78 0.11 264)" },
  primaryQuiet: { light: "oklch(0.96 0.02 264)", dark: "oklch(0.25 0.05 264)" },
  primaryText: { light: "oklch(0.35 0.15 264)", dark: "oklch(0.82 0.09 264)" },
  onPrimary: { light: "oklch(0.99 0.005 264)", dark: "oklch(0.16 0.03 264)" },
  secondary: { light: "oklch(0.72 0.16 80)", dark: "oklch(0.78 0.14 85)" },
  secondaryQuiet: { light: "oklch(0.96 0.03 80)", dark: "oklch(0.25 0.04 85)" },
  bg: { light: "oklch(0.985 0.004 264)", dark: "oklch(0.165 0.012 264)" },
  bgElev: { light: "oklch(0.965 0.006 264)", dark: "oklch(0.205 0.014 264)" },
  surface: { light: "oklch(1 0 0)", dark: "oklch(0.215 0.015 264)" },
  surfaceRaised: { light: "oklch(1 0 0)", dark: "oklch(0.255 0.018 264)" },
  fg: { light: "oklch(0.24 0.02 264)", dark: "oklch(0.94 0.006 264)" },
  fgMuted: { light: "oklch(0.46 0.02 264)", dark: "oklch(0.72 0.012 264)" },
  fgSubtle: { light: "oklch(0.58 0.018 264)", dark: "oklch(0.60 0.012 264)" },
  border: { light: "oklch(0.91 0.008 264)", dark: "oklch(0.30 0.016 264)" },
  borderStrong: { light: "oklch(0.84 0.012 264)", dark: "oklch(0.38 0.02 264)" },
  ring: { light: "oklch(0.40 0.15 264)", dark: "oklch(0.70 0.14 264)" },
  positive: { light: "oklch(0.55 0.13 155)", dark: "oklch(0.74 0.14 158)" },
};

// ---- Aqua: legacy compatibility skin (the older bluish-aqua identity) -------
//
// Kept so the SAME emitter can regenerate the prior look from one config entry,
// proving the source is parameterized (two keys -> two distinct correct CSS
// outputs). This is NOT the docs default; "aurora" is.
const AQUA: Palette = {
  primary: { light: "oklch(0.55 0.10 220)", dark: "oklch(0.74 0.11 220)" },
  primaryHover: { light: "oklch(0.47 0.10 222)", dark: "oklch(0.82 0.10 218)" },
  primaryQuiet: { light: "oklch(0.96 0.03 215)", dark: "oklch(0.28 0.06 222)" },
  primaryText: { light: "oklch(0.47 0.10 222)", dark: "oklch(0.84 0.09 216)" },
  onPrimary: { light: "oklch(0.99 0.005 220)", dark: "oklch(0.17 0.02 222)" },
  secondary: { light: "oklch(0.62 0.12 60)", dark: "oklch(0.78 0.12 70)" },
  secondaryQuiet: { light: "oklch(0.96 0.03 70)", dark: "oklch(0.27 0.04 60)" },
  bg: { light: "oklch(0.985 0.004 220)", dark: "oklch(0.165 0.012 220)" },
  bgElev: { light: "oklch(0.965 0.006 220)", dark: "oklch(0.205 0.014 220)" },
  surface: { light: "oklch(1 0 0)", dark: "oklch(0.215 0.015 220)" },
  surfaceRaised: { light: "oklch(1 0 0)", dark: "oklch(0.255 0.018 220)" },
  fg: { light: "oklch(0.24 0.018 220)", dark: "oklch(0.94 0.006 220)" },
  fgMuted: { light: "oklch(0.46 0.018 220)", dark: "oklch(0.72 0.012 220)" },
  fgSubtle: { light: "oklch(0.58 0.016 220)", dark: "oklch(0.60 0.012 220)" },
  border: { light: "oklch(0.91 0.008 220)", dark: "oklch(0.30 0.016 220)" },
  borderStrong: { light: "oklch(0.84 0.012 220)", dark: "oklch(0.38 0.02 220)" },
  ring: { light: "oklch(0.60 0.11 220)", dark: "oklch(0.74 0.11 220)" },
  positive: { light: "oklch(0.55 0.13 155)", dark: "oklch(0.74 0.14 158)" },
};

/** Named theme variants. Adding one = a new entry here, no layout edits. */
export const THEME_VARIANTS: Readonly<Record<string, ThemeVariant>> = {
  aurora: { key: "aurora", label: "Aurora (CuraOS docs default)", palette: AURORA },
  aqua: { key: "aqua", label: "Aqua (legacy compatibility)", palette: AQUA },
};

/** The default variant the docs site ships with. */
export const DEFAULT_VARIANT = "aurora";

/** Resolve a variant key, throwing on an unknown key (fail fast). */
export function resolveVariant(key: string): ThemeVariant {
  const v = THEME_VARIANTS[key];
  if (!v) {
    const known = Object.keys(THEME_VARIANTS).join(", ");
    throw new Error(`unknown theme variant: ${key} (known: ${known})`);
  }
  return v;
}

// ---- Type scale: a real ratio, not letter-spacing tricks -------------------
//
// 1.25 (major third) ratio, anchored at a 1rem (16px) body, expressed as fluid
// clamps so the hierarchy survives static system faces. Shared so docs headings
// and the marketing headline ride the same ladder.
export const TYPE_SCALE = {
  ratio: 1.25,
  display: "clamp(2.6rem, 1.6rem + 4.2vw, 4rem)",
  h1: "clamp(2rem, 1.5rem + 2vw, 2.75rem)",
  h2: "clamp(1.55rem, 1.25rem + 1.3vw, 2.1rem)",
  h3: "clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)",
  lead: "clamp(1.08rem, 1rem + 0.5vw, 1.3rem)",
  body: "1rem",
  small: "0.875rem",
  mono: "0.92rem",
} as const;

/** Radius ladder (px). */
export const RADIUS = { sm: 6, md: 10, lg: 16, xl: 24 } as const;

// ---- Elevation: layered, low-alpha, brand-tinted shadows -------------------
//
// Tinted toward the plum hue (rgb approximations of the neutral ink) so cards
// read as lifted off a tinted surface, not a flat 1px line. Light + dark pairs.
export const ELEVATION = {
  card: {
    light: "0 1px 2px rgba(42 36 64 / .06), 0 4px 12px rgba(42 36 64 / .05)",
    dark: "0 1px 2px rgba(0 0 0 / .4), 0 6px 16px rgba(0 0 0 / .35)",
  },
  raised: {
    light: "0 4px 10px rgba(42 36 64 / .08), 0 18px 38px rgba(42 36 64 / .10)",
    dark: "0 6px 14px rgba(0 0 0 / .5), 0 22px 48px rgba(0 0 0 / .5)",
  },
} as const;

// ---- Motion: ease-out, short, reduced-motion guarded at the consumer --------
export const MOTION = {
  fast: "120ms",
  base: "220ms",
  slow: "420ms",
  /** Ease-out, NO bounce/overshoot (design law). */
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
} as const;

// ---- Self-hosted font stack (zero-egress) ----------------------------------
//
// Renderers self-host these via @font-face pointing at the bundled woff2; the
// family NAMES + fallback stacks live here so docs, marketing, and apps declare
// the same families. Arabic family is pulled in for the RTL seam.
export const FONTS = {
  sans:
    '"Inter Variable","Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",system-ui,sans-serif',
  mono:
    '"JetBrains Mono Variable","JetBrains Mono",ui-monospace,"SF Mono","SFMono-Regular","Cascadia Code",Menlo,Consolas,monospace',
  arabic:
    '"IBM Plex Sans Arabic","Inter Variable","Segoe UI",Tahoma,sans-serif',
  /** woff2 file names as bundled under stylesheets/fonts/. */
  files: {
    interVariable: "fonts/inter-latin-variable.woff2",
    monoVariable: "fonts/jetbrains-mono-latin-variable.woff2",
    arabic400: "fonts/ibm-plex-arabic-400.woff2",
    arabic600: "fonts/ibm-plex-arabic-600.woff2",
  },
} as const;

/**
 * The inline-SVG illustration library (shared, currentColor-driven so they
 * theme automatically). Bodies are trusted in-code constants (NOT authored
 * copy), pasted as 24x24 line-icon path bodies plus two larger compositions.
 * Consumers wrap them in an <svg> with aria-hidden or an aria-label.
 */
export const ICON_PATHS: Readonly<Record<string, string>> = {
  layers:
    '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.4-3 7.6-7 10-4-2.4-7-5.6-7-10V6l7-3z"/>',
  puzzle:
    '<path d="M10 3h4a1 1 0 0 1 1 1v2a2 2 0 1 0 4 0V4h2a1 1 0 0 1 1 1v4h-2a2 2 0 1 0 0 4h2v4a1 1 0 0 1-1 1h-4v-2a2 2 0 1 0-4 0v2H4a1 1 0 0 1-1-1v-4h2a2 2 0 1 0 0-4H3V4a1 1 0 0 1 1-1h6z"/>',
  server:
    '<path d="M4 4h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M4 14h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"/><path d="M7 7h.01M7 17h.01"/>',
  lock:
    '<path d="M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  workflow:
    '<path d="M3 6h6v6H3z"/><path d="M15 12h6v6h-6z"/><path d="M9 9h3a3 3 0 0 1 3 3v3"/>',
  book:
    '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M19 17H6a2 2 0 0 0-2 2"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m15 9-3.5 1.5L10 14l3.5-1.5z"/>',
  network:
    '<path d="M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/><path d="M5 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 9v3M6.5 15l4-3M17.5 15l-4-3"/>',
  key: '<path d="M15 7a4 4 0 1 0-3.9 5L7 16v3h3v-2h2v-2h1.1A4 4 0 0 0 15 7z"/>',
  gauge:
    '<path d="M12 14l4-4"/><path d="M5.6 18a8 8 0 1 1 12.8 0"/><path d="M12 14h.01"/>',
};

/** The CuraOS brand mark: a layered-stack glyph (overlay tile over a core bar). */
export const BRAND_MARK_PATHS =
  '<rect x="6" y="3" width="12" height="6" rx="1.6"/><rect x="3" y="14" width="18" height="6" rx="1.8"/><path d="M9 9v3M15 9v3"/>';

/**
 * Literal sans stack for SVG <text> (CSS custom properties do NOT resolve in an
 * SVG font-family attribute). Single-quoted multiword names; double-quote the
 * whole value at the call site.
 */
export const SVG_FONT =
  "Inter Variable,Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
