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
    fontSize: "clamp(20px, 1.6vw, 22px)"
    fontWeight: 400
    lineHeight: 1.25
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
  map-title:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "13px"
    fontWeight: 400
  map-type:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "10px"
  map-source-label:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "8px"
  note:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "12px"
  compact-control:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "11px"
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

**The Annotation Rule.** Use red to identify an action, location, or connection. Do not fill large content surfaces with it.

**The Reference Colour Rule.** Copy the reference book plate's fill and outline into a small square on map plates and book lists. Keep faction names visible and reading state explicit. Books absent from the reference have no mark. These colours are source data, not interface tokens or legion and story arc memberships.

## Typography

**Title Font:** Libre Baskerville, with Georgia and serif fallbacks. Normal and italic files are self-hosted under `public/fonts`, with their OFL licence. The loaded weight is regular; do not assume a bold face exists.

**Body and Control Font:** Avenir Next, with Segoe UI and sans-serif fallbacks. These are system fonts; no sans-serif font download is required.

Book titles and page titles use the serif. Navigation, metadata, descriptions, and actions use the sans-serif. The italic “Book notes” heading gives the notes column its annotation character.

### Hierarchy
- **Display:** collection page titles; the smaller atlas title keeps the map close to the top of Explore.
- **Reading title:** current and recommended books use 20–22px; mobile uses a fixed size (20px). The reading strip uses compact spacing and an outlined Start reading action with a minimum height of 44px.
- **Notes title:** the selected book in the notes panel.
- **List title:** books in the linear list. Full-width collection indexes use (17px) on desktop and (15px) on mobile.
- **Body:** reading explanations and story notes. Reading explanations have a maximum measure (56ch).
- **Control:** buttons and select inputs. Navigation and search use larger text (14px).
- **Map labels:** compact sans-serif metadata (8–11px) with serif book titles. This density is specific to the graph, not a default for body text.

**The Book Title Rule.** Use serif text for book names. Keep controls in sans-serif so actions remain easy to identify.

## Layout

The shell has a maximum width (1800px). Desktop content uses generous side margins. Explore starts with a compact reading route, then gives the map the full content width and a height tied to the viewport. At (1100px), margins reduce to (28px) and toolbars wrap. Book notes open in a temporary side panel from the Book notes action or a book index, so the map and book index retain their full width.

At (760px), navigation moves below the brand and content becomes one column. Connection map opens first, with Book list available through a visible tab; Expand map opens a screen-height map with a clear return to the inline map and a selected-book bar. Book notes cover the screen after the Book notes action or list selection and can be closed to return to the map or list. My library uses two columns on desktop and one on mobile.

Content groups use rules and space rather than separate cards for each item. Lists align book number, title, state, and action in columns. Preserve room for long titles and wrapping actions.

## Elevation & Depth

Paper and sheet tones, thin borders, and selected fills provide most depth. A soft offset shadow separates the temporary book-notes panel from the content beneath it. Highlighted map cards use a small offset shadow. The map key overlays the map area with a sheet background and a rule border.

## Shapes

Primary and quiet actions and select inputs have small corners. Other sections are mostly square and separated by straight rules. Novel map cards have rounded corners. Every other type has a folded upper-right corner within the same bounds. Type symbols and written labels identify Novel, Novella, Short story, Audio drama, Graphic novel, and Collection. Card shape expresses work type independently of reading status and source colour.

## Components

### Buttons

Actions are plain and explicit. Primary actions use red with sheet-coloured text. Quiet actions use a rule border; hover changes the border and text to red. Text actions have no enclosing surface and gain an underline on hover. Primary and quiet actions have a minimum height (44px).

Keyboard focus uses a red outline (2px) with an offset (4px). Disabled actions use disabled paper and muted text. Icon actions normally occupy (44px); the mobile list currently uses a narrower width (38px).

### Inputs / Fields

Search sits directly on the page surface with a search icon. Focus outlines the entire search group (2px), with an offset (2px). Select controls use a sheet background, a thin rule border, and the small control radius. Labels remain available to assistive technology when mobile hides their visible text. Explore uses visible Connection map and Book list tabs below the reading strip, with shared source and search controls. The matching book count sits beside search; Map key is available in the map controls.

### Navigation

Active navigation uses red text and a thin red underline. Inactive navigation uses pencil text, with red on hover. On mobile the three navigation actions occupy a full row below the brand.

### Book Rows

Book rows use a bottom rule and a selected-paper fill when selected. Serif titles lead, with the work type and any recorded faction beneath. State is written as Finished, Reading, or Unread; an icon action can change the finished state. Rows have a minimum height (76px).

### Book Notes

Notes use an italic serif heading and a larger serif book title. Reading actions precede expandable story notes. Spoiler level appears in the disclosure label. Connections are labelled as Reference arrow or Publisher’s listed order. No relationship meaning is added beyond the source. Map selection traces next paths, and an explicit Book notes action opens the temporary panel. Book indexes still open notes on selection. The map or list keeps its place beneath the panel.

### Story Maps

The Connection map uses sheet surfaces, compact book plates, source colour marks, and a four-book reference opening that runs left to right above the parallel streams. The full reference uses the source node centres, expanded by 2.35 horizontally and 3 vertically to fit the larger cards. The Thirteenth Wolf has a 26-unit horizontal clearance adjustment beside Thief of Revelation. Branch positions remain stable across All stories and Novels only. Source arrows may run sideways or join distant branches; their routes avoid card plates. Focus connections uses a compact local layout. Reference arrows and adjacent publisher entries use the same line treatment; the selected source supplies their meaning. Selected, current, finished, and recommended states use borders, fills, and symbols. Cards are 220 by 110 map units, with up to three title lines. Each has a monochrome type symbol and written type label. The full title remains in the accessible label and notes. The Reading option dropdown offers Reference map — all stories, Reference map — novels only, Saga, and Siege. All stories is the default. Novels only filters the map and list without joining across hidden works; a hidden-next-step notice offers Show all stories. Focus connections explicitly reveals all direct neighbours, including works hidden by Novels only. Publication format and availability stay in the notes. Focus connections fits the selected book and its direct incoming and outgoing source links; turning it off restores the full-map position and zoom. Highlight next paths is enabled by default and independently marks outgoing arrows in red and lists their destinations. Highlighted books keep solid plates and clear borders; other plates have reduced fill opacity. The full map opens around the selected book at (90%) when fitting all visible books would reduce the scale below (60%); Fit all provides an overview. Below 30% zoom, arrows and card borders retain thin screen-sized strokes so the branch arrangement remains visible. The map legend explains these marks in plain language. Positions do not define an additional reading order or story arc memberships. The only explicit transition is the flow edge stroke change (180ms ease-out); reduced-motion preferences disable transitions.

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
