# Explore: Annotated edition

## Intent

Help the reader choose a next book and feel the scale of the branching story. The reading recommendation stays close to the map, while the map leads the Explore layout. Visible map and list tabs and a full-screen map action remain available on mobile.

## Implemented composition

- The reading strip gives Reading now or Last finished and the next source steps. It sits above the atlas on desktop and below the browsing views on phones.
- Connection map opens first. The map and Book list use the full content width and visible tabs. They share the reading option, search and onward-route filter. Search filters the list and shows the same matches above the map. Choosing a map result selects and locates the book, including in focus mode. Tab changes preserve the source, search, selection and camera.
- The full reference preserves the source node positions, with extra vertical space for readable cards. Its four-book opening runs left to right above the original branch arrangement.
- The atlas opens at 100% around the selected book. Fit all provides an overview and the zoom buttons step proportionally from that scale. Show selected book and Return to my book are separate camera controls.
- Focus connections shows direct incoming and outgoing source links, including catalogue neighbours excluded by atlas filters. It fits the group at 100% when possible and centres the selected book at 100% for larger groups. Fit connections shows the whole group. Back to atlas restores the previous centre and zoom with the active filters.
- Highlight next paths is independent of focus and is on by default. Outgoing arrows are red and their destinations appear under the selected-book strip. Book notes opens from the map or on selection in the list.
- At widths of 760px or less, Expand map sits by the tabs. Reading option stays visible beside Filters, which contains the source note and secondary controls. The expanded map uses the same camera and selected-book strip. Back to map returns to the inline view.
- Reading option offers the complete reference and novels-only views, alongside Saga and Siege. The option persists across reloads and applies to map and list. A hidden-next-step notice reveals the complete reference. Focus connections explicitly includes supporting neighbours.
- Novel cards are rounded; other types have a folded upper-right corner. A monochrome symbol and written label identify each of the six types. Cards have shared 220 by 110 bounds with room for three title lines. Source labels, eBook and exclusive descriptions, and collection links appear in Book notes.
- Story summaries remain behind a disclosure with the spoiler level. Selected books expose reading actions and labelled connections.

## Product truth

The catalogue and the selected reading source supply the books and connections. Reference positions approximate the original diagram and stay stable when supporting works are hidden; they add no connections, reading order, or story arc memberships. All 173 source nodes are represented. The two unresolved endpoints retain source links. Novels only hides supporting works without adding map arrows across them. Siege of Terra remains a separate publisher option. Recommendations remain deterministic. Progress stays in local browser storage and can be exported from My library. The interface identifies itself as an unofficial guide and does not claim an exhaustive or official reading order.

## Evidence and limits

This brief records approved direction and the current source implementation. It is not an image comparison, browser test report, or accessibility certification. Runtime verification is reported separately by the implementation task.
