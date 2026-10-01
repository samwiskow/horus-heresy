# Source-flow map and focus connections

Browser evidence captured on 1 October 2026 from the local Vite app. The local fixture has The Solar War finished, with 1 of 62 books finished. Map selection changes did not change that reading position or finished count.

The approved change uses a top-to-bottom source-flow layout for Connection map and an independent Focus connections toggle. Highlight next paths remains enabled by default. Book list remains the initial view. Positions arrange the source graph for browsing; they add no links, reading order, or story arc memberships.

| Capture | Browser viewport | State |
| --- | --- | --- |
| desktop.png | 1280 × 900 | Know No Fear, four books and three direct arrows, focus and highlight enabled |
| intermediate.png | 1024 × 900 | Same focused graph, wrapped toolbar |
| user-1280.png | 1280 × 720 | Same graph at the browser's default viewport; full-page capture |
| mobile.png | 390 × 844 | Full-screen focus, both controls available, four plates and three arrows |
| full-map.png | 1280 × 900 | All 40 reference books and 31 arrows after manual Fit all; 28% overview |

Desktop files are full-page captures from the document top. Mobile is a viewport capture of the full-screen map. Fit all is an overview; opening the full graph uses 90% around the selected book when fitting all books would reduce the scale below 60%.

## Verified behaviour

- Focus on Know No Fear shows Legion and Battle for the Abyss incoming, and Betrayer outgoing. It contains no links between unrelated neighbors.
- Selecting Betrayer by click or Enter changes focus to its three-book neighborhood. Space selects a neighbor too.
- Disabling Highlight next paths removes red outgoing emphasis while Focus connections still shows the direct graph. Each control retains its own state.
- Disabling focus restores the exact full-map SVG transform, including zoom. This passed on desktop and mobile, also after selecting another book while focused.
- Focus includes all direct source links even with a search filter. Turning focus off applies the full-map filters; Clear filters recovers an empty result.
- Mechanicum remains visible as one book with no catalogue arrows when focused.
- Saga has 11 full-map arrows; focus on False Gods has two. Siege has nine full-map arrows; focus on The Lost and the Damned has two. Switching reading options resets focus.
- Mobile opens with body scrolling locked. Closing the map restores scrolling and keyboard focus to Explore full map.
- No horizontal document overflow at the captured widths, and no browser console errors during the checks.

`pnpm test` passes 25 source, layout, focus, and progress checks. These verify top-to-bottom source arrows, separated book plates, no arrow through a book plate, no shared line segments between different arrows, direct-only focus, unchanged source graphs, and unchanged catalogue data. `pnpm build` passes.

The finish review requested removal of a duplicate mobile caption covered by the zoom controls. The duplicate caption is now hidden in the mobile full-screen map; controls and graph remain visible. The design detector reported advisory token-documentation differences in existing CSS; it reported no errors. Existing type and palette values remain in use.
