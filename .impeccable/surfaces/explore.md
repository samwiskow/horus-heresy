# Explore: Annotated edition

## Intent

Help the reader choose a next book and understand its place in the branching story. The user approved equal emphasis on the reading recommendation and the story map, with a list and map toggle on mobile.

## Implemented composition

- The reading area leads with Reading now or Last finished, followed by Read next and a short explanation. Other routes appear when available on wide screens.
- The story atlas follows with search, story arc, onward-route filtering, and a desktop view selector. Arc lanes are the initial map view.
- Book notes sit beside the map on desktop and below the list or map on mobile.
- At widths of 760px or less, the book list is the initial browsing view. Explore full map switches to the map; Show book list switches back.
- Story summaries remain behind a disclosure with the spoiler level. Selected books expose reading actions and labelled connections.

## Product truth

The catalogue and curated connections supply all book content. Recommendations remain deterministic. Progress stays in local browser storage and can be exported from My library. The interface identifies itself as an unofficial guide and does not claim an exhaustive or official reading order.

## Evidence and limits

This brief records approved direction and the current source implementation. It is not an image comparison, browser test report, or accessibility certification. Runtime verification is reported separately by the implementation task.
