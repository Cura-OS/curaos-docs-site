---
# The home page renders through the GENERATED hero landing template
# (overrides/home.html, emitted by src/theme/emit-theme.ts), not the stock
# Material grid-cards. Authored COPY lives here in front matter so the layout +
# inline-SVG art stay generated while the words stay in content.
template: home.html
title: CuraOS Documentation
# The landing is full-bleed: hide the left nav tree + right TOC so the hero and
# generated sections own the full content width (Material reads `hide`).
hide:
  - navigation
  - toc
hero_eyebrow: Pre-1.0 / active buildout
hero_headline: Documentation for a composable, self-hosted-first care platform
hero_sub: >-
  CuraOS is a generic neutral core with opt-in vertical overlays. Run it on your
  own infrastructure, compose only the pieces you need, and extend it through
  documented seams instead of forking it.
stats:
  - value: "19"
    label: Frontend apps live
  - value: "~60"
    label: Backend services deployed
  - value: "4"
    label: Deployment models
  - value: "0"
    label: Required cloud dependencies
---

## What CuraOS is

CuraOS (Care Oriented Stack) is a composable, self-hosted-first platform: a
generic neutral core with opt-in vertical overlays (Health, Education, ERP). It
is built so you run it on your own infrastructure, compose only the pieces you
need, and extend it through documented seams instead of forking it.

This is the customer and operator documentation: how to install it, how it is
put together, what the apps do, how to call the API, how to wire up auth, and
how to operate it day to day.

Use the cards above to find your path in, or jump straight to
[Getting started](getting-started/index.md).

## Charter, in one paragraph

Self-hosted first, generic before vertical, composable, builder-led, and
event-led. Multi-tenant from one codebase, with tenant data isolation as a
core boundary: PHI and PII stay in overlay schemas, never in the neutral core.
Every deployment model (cloud SaaS, on-prem, hybrid, home-lab/air-gap) is meant
to ship from the same artifacts.

The full architecture and the principles behind it are in
[Architecture](architecture/index.md).
