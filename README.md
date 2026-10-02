# Pathfinder

**Find your next book in the Horus Heresy.**

A personal reading companion for a story that branches across legions, campaigns, and parallel events. Explore the connections, choose a route, and keep track of the books you finish.

[**Open the reading atlas →**](https://samwiskow.github.io/horus-heresy/) · [Original map and inspiration](#inspiration-and-credit) · [Run locally](#run-locally)

[![Build and deploy Pages](https://github.com/samwiskow/horus-heresy/actions/workflows/pages.yml/badge.svg)](https://github.com/samwiskow/horus-heresy/actions/workflows/pages.yml)

## Inspiration and credit

Pathfinder is inspired by the community-created **[Horus Heresy series-order flowchart hosted on kylebb.com](https://www.kylebb.com/HH/HHSeriesOrder.svg)**. That map supplies the reading connections for the Reference flowchart option. Please visit the original: the work of connecting the stories is what made this experiment possible.

The **[interactive Horus Heresy timeline on gaming.kylebb.com](https://gaming.kylebb.com/hhtimeline/)** is a second reference for browsing the author's full branches. Pathfinder does not assign story arcs: the supplied references do not provide named memberships that the app can reproduce without interpretation. See the [source arc audit](docs/source-arc-audit.md).

Pathfinder adds its own interface, a selective catalogue, and local reading progress. It does not reproduce the original map artwork or claim ownership of it. The catalogue currently contains **62 books**; it is a selective guide, not an exhaustive replacement for the source map. The reference option follows the source arrows without adding bridges or ranking branches. Short stories outside the catalogue link to the original flowchart. The separate Black Library Saga option follows the publisher’s selection.

## A reading desk and a story atlas

- **Pick up where you left off.** See your current book and the next steps recorded by your chosen source.
- **Choose a source.** Follow Daunt’s reference flowchart, the official [Black Library: Horus Heresy Saga selection](https://www.warhammer-community.com/en-gb/articles/17oswfuf/world-championships-preview-experience-the-greatest-hits-of-the-horus-heresy-saga-in-a-new-curated-series/), or [Siege of Terra](https://www.blacklibrary.com/series/series-sot). Saga includes 12 books and ends at *Slaves to Darkness*. Siege follows the publisher's numbered main series, including all three final volumes. Progress is shared across the options.
- **Follow the branches.** Use the connection map to highlight source arrows and inspect book notes. Map positions are a browsing layout, not arc memberships or reading order.
- **Find your route.** Search by title or legion, or show the onward route from your current book.
- **Keep a reading library.** Mark books finished independently of your reading position, undo a progress change, and export progress as JSON.
- **Use the view that suits you.** Connection map and Book list are visible tabs on desktop and phones. Connection map opens first; the full-screen map remains available on phones. Reference titles appear alphabetically. Saga and Siege retain their publisher order.
- **Choose when to reveal details.** Story summaries sit behind a disclosure with a spoiler label. Titles and relationship labels remain visible, so this is not a fully spoiler-free guide.

The Annotated edition design uses warm paper colours, serif book titles, and red selection marks. Reading advice and the map share the screen.

## Your progress stays with you

No account or backend is required. Progress is stored in your browser’s `localStorage` under `heresy-pathfinder-progress`.

Progress is specific to the browser and site address. It does not sync between devices, and localhost progress does not move automatically to the published site. Clearing browser storage can remove it. Use **My library → Export progress** to save a JSON copy. Importing an exported file is not yet supported.

The fonts are served with the app. There are no analytics or AI service calls in the application.

## Run locally

Use Node.js 24 and pnpm 10.33.0, matching the deployment workflow.

```sh
git clone https://github.com/samwiskow/horus-heresy.git
cd horus-heresy
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1
```

Open the local address printed by Vite.

```sh
pnpm test     # Source routes, graph, and progress regression checks
pnpm build    # TypeScript check and production build in dist/
pnpm preview --host 127.0.0.1
```

## Project guide

| File | Purpose |
| --- | --- |
| [`src/data.ts`](src/data.ts) | Book catalogue and neutral map positions |
| [`src/reading-options.ts`](src/reading-options.ts) | Source connections and the publisher's Saga and Siege orders |
| [`src/logic.ts`](src/logic.ts) | Source-defined next steps and onward routes |
| [`src/progress.ts`](src/progress.ts) | Completion changes that preserve reading position |
| [`src/App.tsx`](src/App.tsx) | Map, library, book notes, and browser persistence |
| [`src/styles.css`](src/styles.css) | Annotated edition styles and responsive layouts |
| [`DESIGN.md`](DESIGN.md) | Design rules and tokens |

Built with **React, TypeScript, and Vite**, with icons from **Lucide**. [Libre Baskerville](https://github.com/google/fonts/tree/main/ofl/librebaskerville) is bundled under the [SIL Open Font License](public/fonts/OFL.txt).

## Publishing

[GitHub Actions](.github/workflows/pages.yml) installs the locked dependencies, runs the tests, and builds the site. Pull requests run the same checks. Changes merged into `main` deploy to GitHub Pages after the build passes.

The production build uses relative asset paths so it works under the repository’s `/horus-heresy/` address. In repository settings, **Pages → Build and deployment → Source** must be **GitHub Actions**.

## Corrections and contributions

If a connection is missing or misleading, [open an issue](https://github.com/samwiskow/horus-heresy/issues) with the book titles, the proposed relationship, and a source or explanation. Please flag spoilers clearly. Publication order, story chronology, and a suggested reading order are different things; a correction should say which it addresses.

---

This is an unofficial fan project. It is not affiliated with or endorsed by Games Workshop or Black Library. Horus Heresy, Warhammer, and related names belong to their respective owners. Original maps and linked reference material remain the work of their creators.

## Source data and coverage

`src/sources/reference-flowchart.json` contains the flowchart’s node titles and arrow identifiers, extracted from its embedded draw.io document on 1 October 2026. Version 0.9 is dated 2 July 2019. The snapshot includes 173 nodes, 192 resolved arrows, two unattached arrow endpoints, and the downloaded SVG’s SHA-256 digest. It does not copy the map artwork or cover images.

The current catalogue represents 40 source nodes. The map displays their 31 direct source connections. Other source steps remain explicit links to the original flowchart; the app never joins across missing stories. Anthology collections are not substituted for individual stories in those collections. The source’s “Vulcan Lives” spelling maps to the catalogue’s “Vulkan Lives”; other title matching ignores leading articles and parenthetical labels.

To reproduce the snapshot from a decoded copy of the reference SVG:

```sh
python3 scripts/import-reference.py /path/to/HHSeriesOrder.svg /tmp/reference-flowchart.json 2026-10-01
```

Black Library Saga is a separate publisher selection, not a replacement for the full branching guide. Its map lines indicate adjacent entries in the published list, not inferred sequel or prerequisite relationships. The app adds no continuation after its final title.

Explore ends with a separate Siege of Terra option. Its source record preserves
Black Library's book numbers and product URLs. See the [Siege source note](docs/siege-of-terra-source.md).
The reference's unresolved Solar War arrow remains unchanged; the continuation
uses the publisher's numbered main series. Supporting novellas and anthologies
remain available through the publisher's catalogue.
