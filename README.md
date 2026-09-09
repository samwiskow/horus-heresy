# Pathfinder

An interactive, local-first Horus Heresy reading map experiment.

## Run locally

```sh
pnpm install
pnpm dev
```

Then open the local Vite URL. `pnpm build` creates the production bundle.

`pnpm test` runs the recommendation-logic smoke tests.

## What is included

- Campaign map with pan, zoom, search, arc filters, and reachable-route mode
- Explainable next-book recommendations
- Book dossier inspector with current/read state
- Arc Atlas and personal Library views
- Local progress persistence plus JSON route export
- Expanded core catalogue in `src/data.ts`, covering the numbered Heresy route, major faction arcs, and the Siege of Terra sequence

Progress is stored in the browser under `heresy-pathfinder-progress`. The relationships are intentionally curated experiment data and should be expanded and sourced before treating the app as a complete public reading guide.

## Reference material

This experiment takes its structure and inspiration from these community-made Horus Heresy reading guides:

- [Horus Heresy series order flowchart](https://www.kylebb.com/HH/HHSeriesOrder.svg)
- [Story-arc driven Horus Heresy timeline](https://gaming.kylebb.com/hhtimeline/)

The Pathfinder map is an original interface and curated dataset. It is not a reproduction of either reference; the catalogue focuses on core novels, anthologies, novellas, and major arc anchors rather than every short story.
