---
name: Pathfinder — Annotated edition
description: A calm reading companion with book titles, story connections, and reader notes.
colors:
  paper: "#f5f2e9"
  sheet: "#fcfaf4"
  ink: "#302e29"
  muted: "#686358"
  line: "#d4cfc2"
  accent: "#873d32"
  accent-hover: "#6d2e26"
  selected: "#f0e3d5"
  green: "#416450"
  read-surface: "#e9eee6"
  disabled: "#e9e5db"
typography:
  display:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "clamp(28px, 3vw, 40px)"
    fontWeight: 400
    letterSpacing: "-.025em"
  reading-title:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "clamp(21px, 2vw, 27px)"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-.025em"
  atlas-title:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "clamp(25px, 2.3vw, 32px)"
    fontWeight: 400
    letterSpacing: "-.025em"
  notes-title:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-.025em"
  list-title:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  collection-title:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "13px"
    lineHeight: 1.6
  control:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "13px"
  navigation:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "14px"
rounded:
  control: "3px"
spacing:
  compact: "8px"
  related: "12px"
  group: "18px"
  mobile-gutter: "20px"
  desktop-gutter: "44px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.sheet}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.sheet}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-text:
    textColor: "{colors.accent}"
    typography: "{typography.control}"
    padding: "8px 0"
  search-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "44px"
  book-row-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.ink}"
    padding: "8px"
  map-surface:
    backgroundColor: "{colors.sheet}"
    width: "100%"
    height: "clamp(580px, 75vh, 900px)"
---

# Design System: Pathfinder

## Overview

**Creative North Star: "Annotated edition"**

Pathfinder uses the visual language of a reading guide: warm paper, charcoal text, serif book titles, and small red annotations. The interface gives readers a clear next step while keeping the branching story visible. It is calm, readable, and personal.

Rules and open space separate content. Controls use plain sans-serif text. Book notes sit beside the material they explain. This approved direction replaces the former dark campaign-war-room style.

**Key Characteristics:**
- Warm off-white surfaces and charcoal text.
- Self-hosted serif book titles with sans-serif controls.
- Muted red for actions, selection, and reading direction.
- Thin rules and flat surfaces with little ornament.

This document records the implementation in `src/styles.css` and `src/App.tsx`. It does not claim a completed visual or accessibility audit. The Explore composition is recorded separately in `.impeccable/surfaces/explore.md`.

## Colors

The palette combines warm neutral surfaces with one muted red action colour. Green identifies reading progress.

### Primary
- **Annotation Red** (`accent`): actions, active navigation, focus outlines, and selected connections.
- **Deep Annotation Red** (`accent-hover`): primary button hover.

### Secondary
- **Reading Green** (`green`): finished marks and recommendation marks. Labels and symbols must also communicate state.

### Neutral
- **Paper** (`paper`): application background.
- **Sheet** (`sheet`): map canvas and select controls; also text on primary actions.
- **Charcoal** (`ink`): headings, book titles, and primary text.
- **Pencil** (`muted`): metadata, explanations, and inactive navigation.
- **Rule** (`line`): dividers, field borders, and map structure.
- **Selected Paper** (`selected`): selected books and icon hover surfaces.
- **Read Paper** (`read-surface`): finished map nodes.
- **Disabled Paper** (`disabled`): unavailable actions.

**The Annotation Rule.** Use red to identify an action, location, or connection. Do not fill large content surfaces with it. Arc colours remain small data-specific signals in the maps; they are not a second interface palette.

## Typography

**Title Font:** Libre Baskerville, with Georgia and serif fallbacks. Normal and italic files are self-hosted under `public/fonts`, with their OFL licence. The loaded weight is regular; do not assume a bold face exists.

**Body and Control Font:** Avenir Next, with Segoe UI and sans-serif fallbacks. These are system fonts; no sans-serif font download is required.

Book titles and page titles use the serif. Navigation, metadata, descriptions, and actions use the sans-serif. The italic “Book notes” heading gives the notes column its annotation character.

### Hierarchy
- **Display:** collection page titles; the smaller atlas title keeps the map close to the top of Explore.
- **Reading title:** current and recommended books; mobile uses a fixed size (23px).
- **Notes title:** the selected book in the notes panel.
- **List title:** books in the linear list. Full-width collection indexes use (17px) on desktop and (15px) on mobile.
- **Body:** reading explanations and story notes. Reading explanations have a maximum measure (56ch).
- **Control:** buttons and select inputs. Navigation and search use larger text (14px).
- **Map labels:** compact sans-serif metadata (8–11px) with serif book titles. This density is specific to the graph, not a default for body text.

**The Book Title Rule.** Use serif text for book names. Keep controls in sans-serif so actions remain easy to identify.

## Layout

The shell has a maximum width (1800px). Desktop content uses generous side margins. Explore starts with a compact reading route, then gives the map the full content width and a height tied to the viewport. At (1100px), margins reduce to (28px) and toolbars wrap. Book notes open in a temporary side panel after selection, so the map and book index retain their full width.

At (760px), navigation moves below the brand and content becomes one column. The mobile list remains the initial Explore view; Explore full map opens a screen-height map with a clear return to the list. Book notes cover the screen after selection and can be closed to return to the map or list. The full-width Story arcs and My library indexes use two book columns on desktop and one on mobile.

Content groups use rules and space rather than separate cards for each item. Lists align book number, title, state, and action in columns. Preserve room for long titles and wrapping actions.

## Elevation & Depth

Paper and sheet tones, thin borders, and selected fills provide most depth. A soft offset shadow separates the temporary book-notes panel and atlas overview from the content beneath them. The map key overlays the map area with a sheet background and a rule border.

## Shapes

Primary and quiet actions and select inputs have small corners. Other sections are mostly square and separated by straight rules. Map nodes retain the geometry of each map view; do not promote the campaign node notch into a general interface motif.

## Components

### Buttons

Actions are plain and explicit. Primary actions use red with sheet-coloured text. Quiet actions use a rule border; hover changes the border and text to red. Text actions have no enclosing surface and gain an underline on hover. Primary and quiet actions have a minimum height (44px).

Keyboard focus uses a red outline (2px) with an offset (4px). Disabled actions use disabled paper and muted text. Icon actions normally occupy (44px); the mobile list currently uses a narrower width (38px).

### Inputs / Fields

Search sits directly on the page surface with a search icon. Focus outlines the entire search group (2px), with an offset (2px). Select controls use a sheet background, a thin rule border, and the small control radius. Labels remain available to assistive technology when mobile hides their visible text.

### Navigation

Active navigation uses red text and a thin red underline. Inactive navigation uses pencil text, with red on hover. On mobile the three navigation actions occupy a full row below the brand.

### Book Rows

Book rows use a bottom rule and a selected-paper fill when selected. Serif titles lead, with arc metadata beneath. State is written as Finished, Reading, or Unread; an icon action can change the finished state. Rows have a minimum height (76px).

### Book Notes

Notes use an italic serif heading and a larger serif book title. Reading actions precede expandable story notes. Spoiler level appears in the disclosure label. Connections remain labelled as direct continuations, prerequisites, parallel stories, or optional stories. Notes open on selection in a temporary panel with a close action; the map or list keeps its place beneath it.

### Story Maps

Maps use sheet surfaces, compact book plates, and red connection emphasis. Solid, bold, and dashed lines distinguish relationship types. Selected, current, finished, and recommended states use borders, fills, and symbols. Arc lanes and Reference flow include a small overview that shows all visible arcs, the current book, and the current map window. The Campaign map first fits all visible books, with controls to fit again or focus the current book. A toggle highlights onward connections and lists their destinations. The map legend explains these marks in plain language. The only explicit transition is the flow edge stroke change (180ms ease-out); reduced-motion preferences disable transitions.

## Do's and Don'ts

### Do:
- **Do** keep book titles readable and controls explicit.
- **Do** use rules and space to separate related content.
- **Do** pair colour with labels or symbols for reading state.
- **Do** keep a linear alternative to each graph-based browsing journey.
- **Do** retain the distinction between curated suggestions and an official reading order.

### Don't:
- **Don't** restore the dark war-room palette or decorative glow.
- **Don't** use campaign insignia as general control decoration.
- **Don't** copy unlicensed cover art or proprietary logos into the interface.
- **Don't** conceal story spoilers inside an always-open visual summary.
