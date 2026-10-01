# Explore: Annotated edition

## Intent

Help the reader choose a next book and feel the scale of the branching story. The reading recommendation stays close to the map, while the map leads the Explore layout. A list and full-screen map toggle remain available on mobile.

## Implemented composition

- A compact reading strip gives Reading now or Last finished, Read next, and a short explanation before the atlas.
- The story atlas uses the full content width and most of the viewport height. Search, onward-route filtering, Highlight next paths, Focus connections, and a desktop view selector sit above the Connection map. Book list is the initial browsing view at all widths; Connection map uses the Source-flow layout with arrows from top to bottom.
- The full map opens around the selected book at 90% when fitting all visible books would reduce the scale below 60%. Fit all provides an overview. Drag and zoom controls let the reader inspect the full map.
- Focus connections is off by default. It fits the selected book and all direct incoming and outgoing catalogue neighbours from the selected source, even when filters exclude them. It shows only links to or from the selected book. Selecting a neighbour updates this view. Turning focus off restores the full-map position and zoom and applies the full-map filters.
- Highlight next paths is enabled by default and is independent of Focus connections. It marks outgoing arrows in red and lists their destinations. An explicit Book notes action opens the temporary side panel. Book indexes still open notes on selection.
- Highlighted books keep solid plates and clear borders; other plates have reduced fill opacity. The map and book indexes keep their full width beneath the notes panel.
- At widths of 760px or less, Explore full map opens a screen-height map with separate Next paths and Focus connections controls and a selected-book bar. Show book list returns to the list. The duplicate map caption and rule are hidden to keep the zoom controls clear.
- Story summaries remain behind a disclosure with the spoiler level. Selected books expose reading actions and labelled connections.

## Product truth

The catalogue and the selected reading source supply the books and connections. Source-flow positions arrange the graph for browsing; they add no connections, reading order, or story arc memberships. Missing catalogue stories remain links to the source and are not bypassed by map arrows. Siege of Terra remains a separate publisher option. Recommendations remain deterministic. Progress stays in local browser storage and can be exported from My library. The interface identifies itself as an unofficial guide and does not claim an exhaustive or official reading order.

## Evidence and limits

This brief records approved direction and the current source implementation. It is not an image comparison, browser test report, or accessibility certification. Runtime verification is reported separately by the implementation task.
