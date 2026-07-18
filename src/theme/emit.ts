// theme/emit.ts: the PARAMETERIZED docs-theme generator.
//
// This module IS the docs theme generator. Given a theme-variant key it emits,
// from the SHARED design-token source (../design-tokens.ts), the three artifacts
// the MkDocs Material override theme consumes:
//
//   1. extra.css         - the full skin: @font-face (self-hosted woff2),
//                          OKLCH token model mapped onto Material's CSS vars,
//                          a real elevation + motion + type system, the custom
//                          home/hero landing styles, and RTL logical-property
//                          handling. Light + dark from one ramp.
//   2. hero SVG          - the inline hero illustration (a layered-core + opt-in
//                          overlays composition with depth + a quiet aurora
//                          wash), aria-labelled, currentColor-themed.
//   3. architecture SVG  - the layered-stack architecture diagram (overlays
//                          depend DOWNWARD into the neutral core: the charter
//                          invariant, drawn truthfully).
//
// Re-running the emitter REGENERATES the designed output; switching the variant
// key produces a DISTINCT correct skin (proven by tests + emit-theme.ts writing
// both aurora + aqua). Adding a variant = a new entry in THEME_VARIANTS, never
// an edit to this layout code. The marketing site + app fleet can import the
// same ../design-tokens primitives, so there is one design source of truth.
//
// ZERO-EGRESS: every asset reference is RELATIVE (the @font-face url() points at
// the bundled woff2 under stylesheets/fonts/); no remote <link>/<script>/font is
// emitted, so the strict CSP + air-gap hold and offline-smoke passes.

import {
  resolveVariant,
  type Palette,
  TYPE_SCALE,
  RADIUS,
  ELEVATION,
  MOTION,
  FONTS,
  ICON_PATHS,
  BRAND_MARK_PATHS,
  SVG_FONT,
} from "../design-tokens.ts";

/** Emit a `light-dark()` value from a ColorStop-bearing palette key. */
function ld(p: Palette, key: keyof Palette): string {
  const stop = p[key];
  return `light-dark(${stop.light}, ${stop.dark})`;
}

/**
 * Build the @font-face block for the self-hosted woff2 (zero-egress). Inter +
 * JetBrains Mono are VARIABLE faces (one file, weight 100..900); IBM Plex Sans
 * Arabic covers the RTL seam at 400/600. `font-display:swap` keeps first paint
 * fast; `unicode-range` on the Arabic face scopes it to Arabic codepoints so the
 * latin faces still win for Latin text.
 */
function fontFaces(): string {
  const f = FONTS.files;
  return [
    `@font-face{font-family:"Inter Variable";font-style:normal;font-weight:100 900;font-display:swap;src:url("${f.interVariable}") format("woff2-variations")}`,
    `@font-face{font-family:"JetBrains Mono Variable";font-style:normal;font-weight:100 800;font-display:swap;src:url("${f.monoVariable}") format("woff2-variations")}`,
    `@font-face{font-family:"IBM Plex Sans Arabic";font-style:normal;font-weight:400;font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;src:url("${f.arabic400}") format("woff2")}`,
    `@font-face{font-family:"IBM Plex Sans Arabic";font-style:normal;font-weight:600;font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;src:url("${f.arabic600}") format("woff2")}`,
  ].join("\n");
}

/**
 * Map the palette + ladders onto a single :root token block. Colors use
 * `light-dark()` (exactly two color args, valid); the two shadow tokens do
 * NOT - `light-dark()` cannot hold a multi-layer (comma-separated) box-shadow
 * value, so wrapping one produces invalid CSS the browser drops (UIGEN-52 /
 * ADR-0277). Shadows emit the light value here; the dark override lives in
 * the `[data-md-color-scheme="slate"]` block in materialBridge(), the same
 * selector this repo already uses for its light-vs-dark theme mechanism.
 */
function tokenRoot(p: Palette): string {
  return `:root{
  color-scheme:light dark;
  --c-bg:${ld(p, "bg")};
  --c-bg-elev:${ld(p, "bgElev")};
  --c-surface:${ld(p, "surface")};
  --c-surface-raised:${ld(p, "surfaceRaised")};
  --c-fg:${ld(p, "fg")};
  --c-fg-muted:${ld(p, "fgMuted")};
  --c-fg-subtle:${ld(p, "fgSubtle")};
  --c-border:${ld(p, "border")};
  --c-border-strong:${ld(p, "borderStrong")};
  --c-primary:${ld(p, "primary")};
  --c-primary-hover:${ld(p, "primaryHover")};
  --c-primary-quiet:${ld(p, "primaryQuiet")};
  --c-primary-text:${ld(p, "primaryText")};
  --c-on-primary:${ld(p, "onPrimary")};
  --c-secondary:${ld(p, "secondary")};
  --c-secondary-quiet:${ld(p, "secondaryQuiet")};
  --c-ring:${ld(p, "ring")};
  --c-positive:${ld(p, "positive")};
  --radius-sm:${RADIUS.sm}px;
  --radius-md:${RADIUS.md}px;
  --radius-lg:${RADIUS.lg}px;
  --radius-xl:${RADIUS.xl}px;
  --shadow-card:${ELEVATION.card.light};
  --shadow-raised:${ELEVATION.raised.light};
  --motion-fast:${MOTION.fast};
  --motion-base:${MOTION.base};
  --motion-slow:${MOTION.slow};
  --motion-ease:${MOTION.ease};
  --font-sans:${FONTS.sans};
  --font-mono:${FONTS.mono};
  --font-arabic:${FONTS.arabic};
  --ts-display:${TYPE_SCALE.display};
  --ts-h1:${TYPE_SCALE.h1};
  --ts-h2:${TYPE_SCALE.h2};
  --ts-h3:${TYPE_SCALE.h3};
  --ts-lead:${TYPE_SCALE.lead};
}`;
}

/**
 * Map our tokens onto Material's own CSS custom properties for BOTH schemes, so
 * the stock chrome (header, sidebar, footer, typeset) inherits the new identity
 * even outside our custom home template. Material reads --md-primary-fg-color,
 * --md-default-bg-color, etc.; we drive them from --c-* so there is one source.
 */
function materialBridge(): string {
  return `[data-md-color-scheme="default"]{
  --md-primary-fg-color:var(--c-primary);
  --md-primary-fg-color--light:var(--c-primary-hover);
  --md-primary-fg-color--dark:var(--c-primary-hover);
  --md-primary-bg-color:var(--c-on-primary);
  --md-primary-bg-color--light:var(--c-on-primary);
  --md-accent-fg-color:var(--c-primary-hover);
  --md-default-bg-color:var(--c-bg);
  --md-default-fg-color:var(--c-fg);
  --md-default-fg-color--light:var(--c-fg-muted);
  --md-default-fg-color--lighter:var(--c-fg-subtle);
  --md-default-fg-color--lightest:var(--c-border);
  --md-typeset-color:var(--c-fg);
  --md-typeset-a-color:var(--c-primary-text);
  --md-code-bg-color:var(--c-bg-elev);
  --md-code-fg-color:var(--c-fg);
  --md-footer-bg-color:var(--c-bg-elev);
  --md-footer-fg-color:var(--c-fg);
}
[data-md-color-scheme="slate"]{
  color-scheme:dark;
  --shadow-card:${ELEVATION.card.dark};
  --shadow-raised:${ELEVATION.raised.dark};
  --md-primary-fg-color:var(--c-primary);
  --md-primary-fg-color--light:var(--c-primary-hover);
  --md-primary-fg-color--dark:var(--c-primary-hover);
  --md-primary-bg-color:var(--c-on-primary);
  --md-accent-fg-color:var(--c-primary-hover);
  --md-default-bg-color:var(--c-bg);
  --md-default-fg-color:var(--c-fg);
  --md-default-fg-color--light:var(--c-fg-muted);
  --md-default-fg-color--lighter:var(--c-fg-subtle);
  --md-default-fg-color--lightest:var(--c-border);
  --md-typeset-color:var(--c-fg);
  --md-typeset-a-color:var(--c-primary-text);
  --md-code-bg-color:var(--c-bg-elev);
  --md-code-fg-color:var(--c-fg);
  --md-footer-bg-color:var(--c-bg-elev);
  --md-footer-fg-color:var(--c-fg);
}`;
}

/** Material chrome polish + the custom home/hero landing styles + RTL. */
function chromeAndHome(): string {
  return `
/* ---- Base typography ride the shared scale, not letter-spacing tricks ---- */
body,.md-typeset{font-family:var(--font-sans);font-feature-settings:"kern","liga","cv05";-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.md-typeset h1{font-size:var(--ts-h1);font-weight:680;line-height:1.1;letter-spacing:-0.02em}
.md-typeset h2{font-size:var(--ts-h2);font-weight:640;line-height:1.18;letter-spacing:-0.012em;margin-top:2.2em}
.md-typeset h3{font-size:var(--ts-h3);font-weight:620;line-height:1.25;letter-spacing:-0.008em}
.md-typeset code,.md-typeset pre>code,.highlight,.md-typeset kbd{font-family:var(--font-mono)}
.md-typeset code{font-size:var(--ts-h3, .92em);font-size:0.88em;border-radius:var(--radius-sm);background:var(--c-bg-elev);padding:.12em .4em}
.md-typeset pre>code,.md-typeset .highlight,.md-typeset .admonition,.md-typeset details{border-radius:var(--radius-lg)}
.md-typeset pre>code{box-shadow:var(--shadow-card)}

/* Header: tinted, not a flat teal bar; hairline border + subtle elevation. */
.md-header{background:var(--c-surface);color:var(--c-fg);box-shadow:0 1px 0 var(--c-border);transition:box-shadow var(--motion-base) var(--motion-ease)}
.md-header--shadow{box-shadow:var(--shadow-card)}
.md-header__title{font-weight:640;letter-spacing:-.01em}
.md-tabs{background:var(--c-surface);color:var(--c-fg)}
.md-tabs__link{opacity:.78}
.md-tabs__link--active,.md-tabs__link:hover{opacity:1;color:var(--c-primary-text)}

/* Nav + sidebar links pick up the primary identity on the active leaf. */
.md-nav__link--active,.md-nav__link:focus,.md-nav__link:hover{color:var(--c-primary-text)}
.md-nav__item .md-nav__link--active{font-weight:620}

/* Tables: real card chrome (border + layered shadow), not a single 1px line. */
.md-typeset table:not([class]){border:1px solid var(--c-border);border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-card)}
.md-typeset table:not([class]) th{background:var(--c-bg-elev);font-weight:620}

/* Buttons read as the app primary; secondary hue reserved for one accent. */
.md-typeset .md-button{border-radius:var(--radius-md);font-weight:620;transition:background var(--motion-fast) var(--motion-ease),border-color var(--motion-fast) var(--motion-ease),transform var(--motion-fast) var(--motion-ease)}
.md-typeset .md-button:hover{transform:translateY(-1px)}
.md-typeset .md-button--primary{background:var(--c-primary);border-color:var(--c-primary);color:var(--c-on-primary)}
.md-typeset .md-button--primary:hover{background:var(--c-primary-hover);border-color:var(--c-primary-hover);color:var(--c-on-primary)}

/* a11y: a real focus-visible ring everywhere, flat color (never lost on kiosk). */
a:focus-visible,.md-typeset .md-button:focus-visible,.md-nav__link:focus-visible,.md-header__button:focus-visible,.hero-cta:focus-visible,.home-card:focus-visible{outline:2px solid var(--c-ring);outline-offset:3px;border-radius:var(--radius-sm)}

/* ---- Custom HOME / hero landing (rendered by overrides/home.html) -------- */
/* Break the landing out of Material's constrained .md-content padding so the
   hero + sections own the full content width. The home page hides nav + toc
   (front matter), so .md-main__inner is full width here. */
.cura-home{max-width:none;margin:0}
.md-content:has(.cura-home){margin:0}
.md-content:has(.cura-home) .md-content__inner{margin:0;padding:0}
.md-content:has(.cura-home) .md-content__inner::before{display:none}
.cura-home .md-typeset__inner{max-width:none}
.hero{position:relative;overflow:clip;padding-block:clamp(3.5rem,8vw,6.5rem) clamp(2.5rem,6vw,4.5rem);padding-inline:clamp(1.25rem,5vw,4rem)}
/* The image-rich background: layered radial aurora washes (primary + secondary)
   over the tinted bg, NOT a flat slate. Pure CSS, zero asset. */
.hero::before{content:"";position:absolute;inset:0;z-index:-1;background:
  radial-gradient(60% 70% at 18% 8%, var(--c-primary-quiet), transparent 60%),
  radial-gradient(50% 60% at 92% 0%, var(--c-secondary-quiet), transparent 55%),
  linear-gradient(180deg,var(--c-bg-elev),var(--c-bg) 72%)}
/* A faint dotted grid texture, masked to fade out: depth without an image. */
.hero::after{content:"";position:absolute;inset:0;z-index:-1;opacity:.5;
  background-image:radial-gradient(var(--c-border-strong) 1px,transparent 1.4px);
  background-size:26px 26px;
  -webkit-mask-image:radial-gradient(70% 60% at 30% 10%,black,transparent 75%);
          mask-image:radial-gradient(70% 60% at 30% 10%,black,transparent 75%)}
.hero-inner{max-width:72rem;margin-inline:auto;display:grid;gap:clamp(2rem,5vw,3.5rem);grid-template-columns:minmax(0,1.05fr) minmax(0,0.95fr);align-items:center}
@media (max-width:60rem){.hero-inner{grid-template-columns:1fr}}
.hero-eyebrow{font-family:var(--font-mono);font-size:.74rem;font-weight:560;letter-spacing:.14em;text-transform:uppercase;color:var(--c-primary-text);margin:0 0 .9rem;display:inline-flex;align-items:center;gap:.5rem}
.hero-eyebrow .dot{width:7px;height:7px;border-radius:999px;background:var(--c-positive);box-shadow:0 0 0 4px var(--c-primary-quiet)}
.hero h1{font-family:var(--font-sans);font-size:clamp(2.1rem,1.4rem + 2.6vw,3.4rem);line-height:1.07;letter-spacing:-0.025em;font-weight:720;margin:0;text-wrap:balance;max-width:18ch;overflow-wrap:break-word;hyphens:none}
.hero .sub{font-size:var(--ts-lead);color:var(--c-fg-muted);line-height:1.5;max-width:52ch;margin:1.15rem 0 0}
.hero-cta-row{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:1.9rem}
.hero-cta{display:inline-flex;align-items:center;gap:.5rem;padding:.72rem 1.2rem;border-radius:var(--radius-md);font-weight:620;font-size:.96rem;text-decoration:none;border:1px solid transparent;transition:background var(--motion-fast) var(--motion-ease),border-color var(--motion-fast) var(--motion-ease),transform var(--motion-fast) var(--motion-ease)}
.md-typeset .hero-cta--primary,.md-typeset .hero-cta--primary:visited{background:var(--c-primary);color:var(--c-on-primary)!important}
.md-typeset .hero-cta--primary:hover,.md-typeset .hero-cta--primary:focus-visible{background:var(--c-primary-hover);color:var(--c-on-primary)!important;transform:translateY(-1px)}
.hero-cta--ghost{background:var(--c-surface);color:var(--c-fg);border-color:var(--c-border-strong)}
.hero-cta--ghost:hover{border-color:var(--c-primary);color:var(--c-primary-text);transform:translateY(-1px)}
.hero-cta .ar{transition:transform var(--motion-fast) var(--motion-ease)}
.hero-cta:hover .ar{transform:translateX(2px)}
[dir=rtl] .hero-cta:hover .ar{transform:translateX(-2px)}

/* Hero illustration panel: the SVG sits on a raised, bordered card. */
.hero-art{position:relative;border:1px solid var(--c-border);border-radius:var(--radius-xl);background:var(--c-surface);box-shadow:var(--shadow-raised);padding:clamp(1rem,3vw,1.75rem);color:var(--c-fg-subtle)}
.hero-art svg{display:block;width:100%;height:auto}
/* Gentle, ease-out, looped float on the overlay tiles - reduced-motion guarded below. */
.hero-art .float-a{animation:cura-float 7s var(--motion-ease) infinite alternate}
.hero-art .float-b{animation:cura-float 9s var(--motion-ease) infinite alternate-reverse}
@keyframes cura-float{from{transform:translateY(0)}to{transform:translateY(-6px)}}

/* Stat strip: live verifiable counts, mono numerals, hairline-split. */
.hero-stats{display:flex;flex-wrap:wrap;gap:1.5rem 2.5rem;margin:2.4rem 0 0;padding:0;list-style:none}
.hero-stats li{display:flex;flex-direction:column;gap:.1rem}
.hero-stats .n{font-family:var(--font-mono);font-size:clamp(1.6rem,1.3rem + 1vw,2.1rem);font-weight:680;letter-spacing:-.02em;color:var(--c-primary-text)}
.hero-stats .l{font-size:.82rem;color:var(--c-fg-muted)}

/* Home section blocks below the hero. */
.home-section{max-width:72rem;margin-inline:auto;padding-block:clamp(2.5rem,6vw,4rem);padding-inline:clamp(1.25rem,5vw,4rem)}
.home-section + .home-section{border-top:1px solid var(--c-border)}
.home-section > .eyebrow{font-family:var(--font-mono);font-size:.72rem;font-weight:560;letter-spacing:.13em;text-transform:uppercase;color:var(--c-primary-text);margin:0 0 .5rem}
.home-section > h2{font-size:var(--ts-h2);font-weight:660;letter-spacing:-.015em;margin:0 0 .4rem;line-height:1.15}
.home-section > .section-lead{color:var(--c-fg-muted);font-size:var(--ts-lead);max-width:54ch;margin:0 0 2rem}

/* Start-here cards: varied, NOT an identical icon-heading-text grid. The first
   card spans wide as a feature lede; the rest are compact. Distinct rhythm. */
.home-cards{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))}
.home-card{display:flex;flex-direction:column;gap:.4rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.25rem 1.3rem;text-decoration:none;color:inherit;box-shadow:var(--shadow-card);transition:border-color var(--motion-fast) var(--motion-ease),transform var(--motion-fast) var(--motion-ease),box-shadow var(--motion-fast) var(--motion-ease)}
.home-card:hover{border-color:var(--c-primary);transform:translateY(-2px);box-shadow:var(--shadow-raised);color:inherit}
.home-card .ic{width:26px;height:26px;color:var(--c-primary)}
.home-card.is-feature{grid-column:1/-1;flex-direction:row;align-items:center;gap:1.25rem;background:linear-gradient(135deg,var(--c-primary-quiet),var(--c-surface) 70%)}
.home-card.is-feature .ic{width:34px;height:34px;flex:none}
.home-card h3{font-size:1.08rem;font-weight:640;margin:.3rem 0 0;letter-spacing:-.01em}
.home-card.is-feature h3{font-size:1.3rem;margin:0}
.home-card p{margin:0;color:var(--c-fg-muted);font-size:.93rem;line-height:1.5}
.home-card .go{margin-top:.5rem;font-size:.85rem;font-weight:600;color:var(--c-primary-text);display:inline-flex;align-items:center;gap:.35rem}

/* Overview prose region: the authored Markdown body, constrained for reading. */
.home-prose .md-typeset{max-width:62ch;font-size:1rem}
.home-prose .md-typeset h2:first-child{margin-top:0}

/* Architecture figure on the home page. */
.home-arch{margin:0;display:flex;flex-direction:column;gap:1rem;align-items:flex-start}
.home-arch svg{width:100%;max-width:46rem;height:auto;color:var(--c-fg-subtle)}
.home-arch figcaption{color:var(--c-fg-muted);font-size:.93rem;max-width:60ch;margin:0}

/* Honesty strip: shipped vs roadmap, two tinted panels, semantic dots. */
.home-status{display:grid;gap:1px;grid-template-columns:1fr 1fr;background:var(--c-border);border:1px solid var(--c-border);border-radius:var(--radius-lg);overflow:hidden}
@media (max-width:48rem){.home-status{grid-template-columns:1fr}}
.home-status .col{background:var(--c-surface);padding:1.4rem 1.5rem}
.home-status .col h3{font-family:var(--font-mono);font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;display:flex;align-items:center;gap:.5rem;margin:0 0 1rem}
.home-status .col h3 .dot{width:8px;height:8px;border-radius:50%;flex:none}
.home-status .col.shipped h3 .dot{background:var(--c-positive)}
.home-status .col.road h3 .dot{background:var(--c-secondary)}
.home-status ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.7rem}
.home-status li{display:grid;grid-template-columns:1.1rem 1fr;gap:.55rem;font-size:.92rem;line-height:1.45;align-items:start}
.home-status .col.shipped li svg{color:var(--c-positive)}
.home-status .col.road li svg{color:var(--c-secondary)}
.home-status li svg{width:1.05rem;height:1.05rem;margin-top:.12rem;flex:none}

/* ---- RTL: logical properties + explicit mirror for the few physical bits -- */
[dir=rtl] body,[dir=rtl] .md-typeset{font-family:var(--font-arabic)}
[dir=rtl] .hero h1,[dir=rtl] .hero .sub,[dir=rtl] .home-section>h2,[dir=rtl] .home-section>.section-lead{text-align:right}
[dir=rtl] .hero-art .float-a,[dir=rtl] .hero-art .float-b{}
[dir=rtl] .home-card .go .ar,[dir=rtl] .hero-cta .ar{transform:scaleX(-1)}
[dir=rtl] .home-status li{grid-template-columns:1.1rem 1fr}

/* ---- Reduced motion: kill animation + transitions (design law) ----------- */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;scroll-behavior:auto !important}
  .hero-art .float-a,.hero-art .float-b{animation:none !important;transform:none !important}
}`;
}

/** Compose the full extra.css for a resolved variant. */
export function emitCss(variantKey: string): string {
  const v = resolveVariant(variantKey);
  return [
    `/* CuraOS docs theme - GENERATED by src/theme/emit.ts (variant: ${v.key} - ${v.label}).`,
    ` * Do NOT hand-edit: re-run \`bun run emit:theme\` after changing src/design-tokens.ts.`,
    ` * Self-hosted woff2 + OKLCH tokens + elevation/motion system + RTL. Zero-egress. */`,
    fontFaces(),
    tokenRoot(v.palette),
    materialBridge(),
    chromeAndHome(),
    "",
  ].join("\n");
}

// ---- Inline SVG illustrations (shared icon library + two compositions) ------

function svgIcon(key: string): string {
  const body = ICON_PATHS[key] ?? ICON_PATHS.puzzle;
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export function brandMark(): string {
  return `<svg class="brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${BRAND_MARK_PATHS}</svg>`;
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The HERO illustration: a depth composition of opt-in overlay tiles floating
 * above one wide neutral-core foundation, with downward dependency arrows (the
 * charter invariant) and a soft aurora glow. currentColor-themed, aria-labelled.
 * This is the "image" the critique demanded - a committed inline SVG artwork,
 * not a token spread. The floating tiles carry float-a/float-b classes the CSS
 * animates (reduced-motion guarded).
 */
export function heroSvg(opts: {
  readonly coreLabel: string;
  readonly overlays: readonly string[];
  readonly label: string;
}): string {
  const W = 520;
  const H = 360;
  const overlays = opts.overlays.slice(0, 3);
  const n = Math.max(overlays.length, 1);
  const tileW = 150;
  const tileH = 64;
  const gap = 26;
  const totalW = tileW * n + gap * (n - 1);
  const startX = (W - totalW) / 2;
  const tileY = 54;
  const coreY = 232;
  const coreH = 70;
  const coreX = 40;
  const coreW = W - 80;

  const tiles = overlays
    .map((label, i) => {
      const x = startX + i * (tileW + gap);
      const midX = x + tileW / 2;
      const cls = i % 2 === 0 ? "float-a" : "float-b";
      const arrow =
        `<line x1="${midX}" y1="${tileY + tileH + 6}" x2="${midX}" y2="${coreY - 8}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 4" marker-end="url(#cura-arr)"/>`;
      const tile =
        `<g class="${cls}">` +
        `<rect x="${x}" y="${tileY}" width="${tileW}" height="${tileH}" rx="14" fill="var(--c-secondary-quiet)" stroke="var(--c-secondary)" stroke-width="1.6"/>` +
        `<text x="${midX}" y="${tileY + tileH / 2 + 5}" text-anchor="middle" font-size="15" font-weight="600" font-family="${SVG_FONT}" fill="var(--c-secondary)">${esc(label)}</text>` +
        `</g>`;
      return arrow + tile;
    })
    .join("");

  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label)}" preserveAspectRatio="xMidYMid meet">` +
    `<title>${esc(opts.label)}</title>` +
    `<defs>` +
    `<marker id="cura-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker>` +
    `<radialGradient id="cura-glow" cx="50%" cy="100%" r="80%"><stop offset="0%" stop-color="var(--c-primary)" stop-opacity="0.18"/><stop offset="100%" stop-color="var(--c-primary)" stop-opacity="0"/></radialGradient>` +
    `</defs>` +
    `<rect x="0" y="120" width="${W}" height="${H - 120}" fill="url(#cura-glow)"/>` +
    `<text x="${startX}" y="${tileY - 16}" font-size="11" font-weight="560" letter-spacing="0.1em" font-family="${SVG_FONT}" fill="currentColor" opacity=".7">OPT-IN OVERLAYS</text>` +
    tiles +
    `<text x="${coreX}" y="${coreY - 14}" font-size="11" font-weight="560" letter-spacing="0.1em" font-family="${SVG_FONT}" fill="currentColor" opacity=".7">NEUTRAL FOUNDATION</text>` +
    `<g><rect x="${coreX}" y="${coreY}" width="${coreW}" height="${coreH}" rx="16" fill="var(--c-primary-quiet)" stroke="var(--c-primary)" stroke-width="2"/>` +
    `<text x="${coreX + coreW / 2}" y="${coreY + coreH / 2 + 6}" text-anchor="middle" font-size="18" font-weight="700" font-family="${SVG_FONT}" fill="var(--c-primary-text)">${esc(opts.coreLabel)}</text></g>` +
    `</svg>`
  );
}

/**
 * The ARCHITECTURE diagram (home page figure): the same layered-stack mental
 * model drawn in a wider, flatter form for the explainer section. Overlays
 * depend DOWNWARD into the core. aria-labelled.
 */
export function architectureSvg(opts: {
  readonly coreLabel: string;
  readonly overlays: readonly string[];
  readonly caption: string;
}): string {
  const W = 640;
  const H = 280;
  const padX = 24;
  const overlays = opts.overlays;
  const n = Math.max(overlays.length, 1);
  const ovH = 54;
  const ovY = 44;
  const gap = 18;
  const rowW = W - padX * 2;
  const ovW = Math.min(170, (rowW - gap * (n - 1)) / n);
  const usedW = ovW * n + gap * (n - 1);
  const startX = (W - usedW) / 2;
  const coreH = 62;
  const coreY = H - coreH - 40;
  const coreX = padX;
  const coreW = W - padX * 2;

  const tiles = overlays
    .map((label, i) => {
      const x = startX + i * (ovW + gap);
      const midX = x + ovW / 2;
      return (
        `<line x1="${midX.toFixed(1)}" y1="${ovY + ovH + 4}" x2="${midX.toFixed(1)}" y2="${coreY - 6}" stroke="currentColor" stroke-width="1.5" marker-end="url(#cura-arr2)"/>` +
        `<g><rect x="${x.toFixed(1)}" y="${ovY}" width="${ovW.toFixed(1)}" height="${ovH}" rx="11" fill="var(--c-secondary-quiet)" stroke="var(--c-secondary)" stroke-width="1.5"/>` +
        `<text x="${midX.toFixed(1)}" y="${ovY + ovH / 2 + 5}" text-anchor="middle" font-size="14" font-weight="600" font-family="${SVG_FONT}" fill="var(--c-secondary)">${esc(label)}</text></g>`
      );
    })
    .join("");

  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.caption)}" preserveAspectRatio="xMidYMid meet">` +
    `<title>${esc(opts.caption)}</title><desc>${esc(opts.caption)}</desc>` +
    `<defs><marker id="cura-arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>` +
    `<text x="${startX}" y="${ovY - 14}" font-size="11" font-weight="560" letter-spacing="0.08em" font-family="${SVG_FONT}" fill="currentColor" opacity=".7">VERTICAL OVERLAYS (OPT-IN)</text>` +
    tiles +
    `<text x="${coreX}" y="${coreY - 12}" font-size="11" font-weight="560" letter-spacing="0.08em" font-family="${SVG_FONT}" fill="currentColor" opacity=".7">FOUNDATION</text>` +
    `<g><rect x="${coreX}" y="${coreY}" width="${coreW}" height="${coreH}" rx="13" fill="var(--c-primary-quiet)" stroke="var(--c-primary)" stroke-width="2"/>` +
    `<text x="${(coreX + coreW / 2).toFixed(1)}" y="${(coreY + coreH / 2 + 6).toFixed(1)}" text-anchor="middle" font-size="17" font-weight="700" font-family="${SVG_FONT}" fill="var(--c-primary-text)">${esc(opts.coreLabel)}</text></g>` +
    `</svg>`
  );
}

/** A small icon helper re-exported for the home template builder. */
export { svgIcon };
