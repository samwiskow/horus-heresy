# Explore: Annotated edition

## Intent

Help the reader choose a next book and feel the scale of the branching story. The reading recommendation stays close to the map, while the map leads the Explore layout. A list and full-screen map toggle remain available on mobile.

## Implemented composition

- A compact reading strip gives Reading now or Last finished, Read next, and a short explanation before the atlas.
- The story atlas uses the full content width and most of the viewport height. Search, story arc, onward-route filtering, onward-path highlighting, and a desktop view selector sit above it. Arc lanes are the initial map view.
- A small overview shows the visible map window against the full set of arcs and marks the current book.
- Book notes open on selection in a temporary side panel with a close action. The map and book indexes keep their full width beneath it.
- At widths of 760px or less, the book list is the initial browsing view. Explore full map opens a screen-height map; Show book list returns to the list.
- Story summaries remain behind a disclosure with the spoiler level. Selected books expose reading actions and labelled connections.

## Product truth

The catalogue and curated connections supply all book content. Recommendations remain deterministic. Progress stays in local browser storage and can be exported from My library. The interface identifies itself as an unofficial guide and does not claim an exhaustive or official reading order.

## Evidence and limits

This brief records approved direction and the current source implementation. It is not an image comparison, browser test report, or accessibility certification. Runtime verification is reported separately by the implementation task.
