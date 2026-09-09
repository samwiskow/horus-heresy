---
name: Pathfinder
description: A campaign-map reading companion for the Horus Heresy.
colors:
  ink: "#0a0d0f"
  ink-soft: "#0f1516"
  panel: "#11191a"
  panel-raised: "#172121"
  panel-line: "#2a3a39"
  paper: "#e8edeb"
  muted: "#879b96"
  subtle: "#6f8c84"
  teal: "#55b8b0"
  teal-deep: "#1d5755"
  gold: "#d2a85e"
  ember: "#e0815d"
  violet: "#a98dd6"
  blue: "#7da9d6"
typography:
  display:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(34px, 4.8vw, 64px)"
    fontWeight: 650
    lineHeight: 0.96
    letterSpacing: "-0.055em"
  body:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "SFMono-Regular, Consolas, monospace"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  sm: "5px"
  md: "9px"
  lg: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "13px"
  lg: "19px"
  xl: "34px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 11px"
    height: "35px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "0 11px"
    height: "35px"
  map-panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
    padding: "19px"
---

# Design System: Pathfinder

## Overview

**Creative North Star: "The Campaign Dossier"**

Pathfinder treats the reading order as a tactical map: dark enough to feel like a work surface, structured enough to make a dense graph legible, and marked with small heraldic signals that give each route identity. The visual language is original rather than a reproduction of proprietary Warhammer artwork or insignia.

The interface uses tonal layering instead of decorative gloss. Teal carries action and route state; gold marks current position; faction colours are reserved for arc identity. The map itself is the primary material and the surrounding controls behave like a field console around it.

**Key Characteristics:**
- Ink-black canvas with gunmetal map plates.
- Parchment-white type and restrained operational colour.
- Pauldron-like node notches and compact mono labels.
- Strong information hierarchy with minimal ornament.

## Colors

The palette is dark and cool by default, with a teal route signal and a gold current-position marker. Supporting faction colours appear as small semantic accents rather than surface-wide decoration.

### Primary
- **Signal Teal** (#55b8b0): Primary actions, reachable edges, read state, and the recommended route.
- **Current Gold** (#d2a85e): Current book, selected route position, and focused map state.

### Secondary
- **Warm Ember** (#e0815d): Warmaster arc identity.
- **Prospero Violet** (#a98dd6): Calth and Word Bearers arc identity.
- **Legion Blue** (#7da9d6): Legion-collision arc identity.

### Neutral
- **Ink Black** (#0a0d0f): Application background.
- **Ink Soft** (#0f1516): Recessed surfaces and map surroundings.
- **Gunmetal Panel** (#11191a): Primary panels and inspectors.
- **Raised Gunmetal** (#172121): Selected and hover surfaces.
- **Paper White** (#e8edeb): Headings and primary text.
- **Field Muted** (#879b96): Body text and secondary information.
- **Field Subtle** (#6f8c84): Metadata, dividers, and low-priority labels. This is intentionally brighter than the original metadata tone so secondary information remains legible on the ink and panel surfaces.

### Named Rules

**The Signal Scarcity Rule.** Teal and gold are for state and action. Do not use them as generic decoration.

### Semantic surface tokens

The CSS keeps the tactical map hierarchy explicit through semantic aliases rather than repeating raw colour values:

- **Field surfaces:** `--field-surface`, `--track-surface`, and `--map-surface` are recessed control, toggle, and map canvases.
- **Map structure:** `--map-axis`, `--map-grid`, `--map-edge`, and `--map-divider` are reserved for measurement and route scaffolding.
- **Node states:** `--node-surface`, `--node-hover`, `--node-selected`, `--node-read`, `--node-notch`, and `--node-current` preserve the visual distinction between spatial states.
- **Control states:** `--action-ink`, `--action-hover`, `--quiet-border`, and `--quiet-hover` keep action contrast consistent without flattening faction colours.

## Typography

**Display Font:** Avenir Next, with Segoe UI fallback  
**Body Font:** Avenir Next, with Segoe UI fallback  
**Label/Mono Font:** SFMono-Regular, Consolas, monospace

**Character:** Compact, operational, and slightly compressed through tight display tracking. Mono labels are reserved for system metadata, counts, and route annotations.

### Hierarchy
- **Display** (`--type-display`, 650, `clamp(34px, 4.8vw, 64px)`, `.96`): Route-opening statements and primary view titles.
- **Page title** (`--type-page-title`, `clamp(34px, 5vw, 57px)`): Atlas and library view titles.
- **Title** (`--type-title`, 600, `clamp(21px, 2.2vw, 28px)`, `1.04`): Book names and inspector titles.
- **Section heading** (`--type-section-title`, 20px): Arc headings and grouped content titles.
- **Body** (`--type-body` / `--type-body-small`, 11–12px, `1.5–1.65`): Explanations and book summaries.
- **Label** (`--type-label` / `--type-meta`, 700, 8–9px, `1.2`, tracked uppercase): Operational labels and map annotations.
- **Control** (`--type-control`, 10px): Compact actions and map controls.
- **Metric** (`--type-metric`, 24px): Library progress totals.

Typefaces are also tokenized as `--font-sans` and `--font-mono` so components do not repeat the font stack.

### Named Rules

**The Two-Register Rule.** Use expressive sans-serif type for meaning and mono type for measurement, status, or classification.

### Type and radius tokens

The radius vocabulary is intentionally small: `--radius-xs` for angular pauldron corners, `--radius-sm` for controls, `--radius-md` for fields and inset surfaces, `--radius-lg` for panels, and `--radius-pill` only for the toggle track. New components should choose from this vocabulary rather than introduce a one-off radius.

## Layout

The map screen uses a three-part desktop layout: a narrow route rail, a dominant centre canvas, and a right inspector. The centre map is the first-viewport thesis and should remain the largest element. Panels use a 13–14px gap and 14px outer radius.

At narrower widths the layout becomes vertical: route controls, map, then inspector. The canvas keeps its own large coordinate space so the graph remains explorable, while the accessible book list becomes visible as a keyboard-friendly companion below it. Secondary surfaces use a centred content measure of about 1180px.

## Elevation & Depth

Depth comes from tonal layering, a single soft ambient shadow under the map stage, and clear border strokes. Surfaces should feel like stacked plates rather than floating glass. Accent glow is reserved for the selected node and route signal.

### Shadow Vocabulary
- **Map stage ambient:** `0 22px 70px rgba(0, 0, 0, .24)`, used once under the central interactive canvas.
- **Selected node signal:** a restrained `drop-shadow` around the gold outline, only while selected.

## Shapes

Panels use gently curved 14px corners. Controls use 5–9px corners. Book nodes are rectangular plates with a small angular notch at the upper left, echoing a pauldron silhouette without copying a specific faction mark. Borders are thin and structural.

## Components

### Buttons
- **Shape:** compact 5–7px corners with clear text labels.
- **Primary:** signal teal surface with ink text, 35px height, and a short icon label.
- **Quiet:** transparent gunmetal control with a muted border and paper hover state.
- **Focus:** gold outline with visible offset; never remove the native focus treatment.

### Chips
- **Style:** small faction or arc markers use a translucent tint of the owning accent and a thin border.
- **State:** current and read statuses use different symbols and colours, so colour is not the only signal.

### Cards / Containers
- **Corner Style:** 14px for panels, 9px for inset explanation boxes.
- **Background:** gunmetal tonal steps over the ink canvas.
- **Border:** one thin structural border; avoid stacked borders.
- **Internal Padding:** 15–19px for inspectors and route controls.

### Inputs / Fields
- **Style:** dark recessed field, 1px gunmetal border, 9px radius, compact search icon.
- **Focus:** gold focus ring and preserved border contrast.

### Navigation
- **Style:** top navigation is compact and low-chrome. Active views use a teal underline and paper text; inactive views use muted text.
- **Mobile:** navigation wraps below the brand lockup and remains horizontally scrollable.

### Campaign Nodes

Nodes are SVG plates with a faction label, title, book metadata, and a pauldron-inspired notch. Read, current, selected, and recommended states alter the plate treatment and include distinct status marks.

## Do's and Don'ts

### Do:
- **Do** make the map, not a hero banner, the first thing the reader understands.
- **Do** reserve teal for progress, action, and reachable route state.
- **Do** use original geometric insignia and labelled faction data rather than copying proprietary marks.
- **Do** provide a list-based alternative whenever the graph is difficult to navigate.

### Don't:
- **Don't** turn the map into a generic dashboard of equal cards.
- **Don't** use gradients, neon glows, or colour as decoration without route meaning.
- **Don't** make the small operational kicker labels into a universal page-eyebrow pattern; they are currently map-specific metadata.
- **Don't** imply that the graph's curated relationships are an official or exhaustive reading order.
