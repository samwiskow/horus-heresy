# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite + React + TypeScript with a static deployment target; a graph library is appropriate for the map interaction, with no backend in the first experiment.

## Users

The primary user is a Horus Heresy reader using the tool personally while deciding what to read next and tracking which books they have completed.

## Product Purpose

The product turns the Horus Heresy reading order into an explorable story graph. It should show where the reader is, preserve the branching nature of the fiction, and show source-defined next steps based on the reader's current book and completed books.

## Positioning

This is a stateful reading companion rather than a static chronology: the graph changes meaning as the reader marks books read and follows a source route.

## Operating Context

The reader explores a dense flowchart, searches for a book or legion, selects a book for context, marks progress, and returns later to continue their route. The first version is local-first and personal; progress must survive reloads and remain exportable in a portable format.

## Capabilities and Constraints

- Explore is the core exploration surface: browse a book list, search, filter the onward route, inspect books, and follow source arrows from top to bottom on the Connection map. Book list is the default. Focus connections shows the selected book and its direct incoming and outgoing source links, including catalogue neighbours excluded by filters; turning it off restores the full-map position and zoom. Highlight next paths is independent and enabled by default. Reference titles are alphabetical; Saga retains the publisher's listed order.
- Colour marks copy the fill and outline from the reference book plates. They appear in the map and book lists beside visible faction names. Books absent from the reference have no mark; colours do not define legion or story arc memberships.
- No story arc memberships are assigned. The reference uses coloured branches but does not supply named memberships that can be reproduced without interpretation. The app does not infer arcs from colours, factions, or shared arrows. Map positions are for browsing only.
- Reading connections follow Daunt’s reference flowchart, version 0.9. Each map arrow has a source identifier. The app does not add connections or rank source branches. Missing catalogue stories remain source links instead of being bypassed.
- Black Library: Horus Heresy Saga is a separate 12-book option in the publisher’s listed order. It stops at Slaves to Darkness. Route selection is saved; finished books and the current reading position are shared.
- Siege of Terra is a separate publisher option at the end of Explore. It follows Black Library's numbered main series, with all three parts of book 8. The 2019 reference stops at The Solar War; its unresolved endpoint and the twelve-book Saga selection remain unchanged.
- The first data set is core novels plus a curated set of important supporting stories, not an attempt to encode every short story immediately.
- Publication order, in-universe chronology, and recommended reading order are separate concepts.
- The experience should be spoiler-aware and avoid presenting one universal path as objectively correct.
- No accounts, server-side progress, or AI recommendation system are required for the first experiment.

## Brand Commitments

The approved visual direction is Annotated edition: warm off-white surfaces, charcoal text, muted red annotations, and self-hosted Libre Baskerville book titles with sans-serif controls. The interface should feel like a calm reading companion. Reading recommendations and the branching story both need clear access. Do not copy proprietary logos, exact chapter insignia, or unlicensed cover artwork into the product.

## Evidence on Hand

- Reference flowchart: https://www.kylebb.com/HH/HHSeriesOrder.svg
- Reference interactive timeline: https://gaming.kylebb.com/hhtimeline/
- The flowchart is the authority for the reference option. Its 2 July 2019 source snapshot and two unattached arrow endpoints are recorded under `src/sources/reference-flowchart.json`.
- Official Saga selection: https://www.warhammer-community.com/en-gb/articles/17oswfuf/world-championships-preview-experience-the-greatest-hits-of-the-horus-heresy-saga-in-a-new-curated-series/

## Product Principles

- Make the next decision clear without hiding the branching story.
- Explain recommendations in plain language.
- Keep reading progress portable and local-first.
- Treat the data model as the product: layout must not encode meaning that the content cannot express.
- Preserve accessibility and a list-based alternative to the visual graph.

## Accessibility & Inclusion

The map cannot rely on colour alone for status or faction. Book nodes, filters, route controls, and the book detail surface must be keyboard reachable and screen-reader labelled. A linear list view is required for users who cannot use the canvas comfortably.
