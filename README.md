# Pathfinder

**Find your next book in the Horus Heresy.**

A personal reading companion for a story that branches across legions, campaigns, and parallel events. Explore the connections, choose a route, and keep track of the books you finish.

[**Open the reading atlas →**](https://samwiskow.github.io/horus-heresy/) · [Original map and inspiration](#inspiration-and-credit) · [Run locally](#run-locally)

[![Build and deploy Pages](https://github.com/samwiskow/horus-heresy/actions/workflows/pages.yml/badge.svg)](https://github.com/samwiskow/horus-heresy/actions/workflows/pages.yml)

## Inspiration and credit

Pathfinder is inspired by the community-created **[Horus Heresy series-order flowchart hosted on kylebb.com](https://www.kylebb.com/HH/HHSeriesOrder.svg)**. That map is the starting reference for this project’s approach to branching reading routes. Please visit the original: the work of connecting the stories is what made this experiment possible.

The **[interactive Horus Heresy timeline on gaming.kylebb.com](https://gaming.kylebb.com/hhtimeline/)** is a second reference for exploring the series through its story arcs.

Pathfinder adds its own interface, curated catalogue, recommendation rules, and local reading progress. It does not reproduce the original map artwork or claim ownership of it. The catalogue currently contains **62 books across nine story arcs**; it is a selective guide, not an exhaustive replacement for the source map. Connections are suggestions, not one official reading order.

## A reading desk and a story atlas

- **Pick up where you left off.** See your current book and a suggested next book, with a short reason for the recommendation.
- **Follow the branches.** Explore arc lanes, a reference flow, or a campaign map. Select a book to highlight its connections and read its notes.
- **Find your route.** Search by title or legion, filter by story arc, or show the onward route from your current book.
- **Keep a reading library.** Mark books finished independently of your reading position, undo a progress change, and export progress as JSON.
- **Use the view that suits you.** A book list is available on desktop and is the default on phones; the full map remains available.
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
pnpm test     # Recommendation, graph, and progress regression checks
pnpm build    # TypeScript check and production build in dist/
pnpm preview --host 127.0.0.1
```

## Project guide

| File | Purpose |
| --- | --- |
| [`src/data.ts`](src/data.ts) | Books, story arcs, and curated connections |
| [`src/logic.ts`](src/logic.ts) | Deterministic recommendations and onward routes |
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
