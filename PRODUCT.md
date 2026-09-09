# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite + React + TypeScript with a static deployment target; a graph library is appropriate for the map interaction, with no backend in the first experiment.

## Users

The primary user is a Horus Heresy reader using the tool personally while deciding what to read next and tracking which books they have completed.

## Product Purpose

The product turns the Horus Heresy reading order into an explorable story graph. It should show where the reader is, preserve the branching nature of the fiction, and recommend an explainable next book based on the reader's current book and completed books.

## Positioning

This is a stateful reading companion rather than a static chronology: the graph changes meaning as the reader marks books read and follows an arc.

## Operating Context

The reader explores a dense flowchart, searches for a book or arc, selects a book for context, marks progress, and returns later to continue their route. The first version is local-first and personal; progress must survive reloads and remain exportable in a portable format.

## Capabilities and Constraints

- The campaign map is the core surface: zoom, pan, search, filter, inspect, and highlight a personal route.
- Recommendations are deterministic and explainable. They distinguish prerequisites, direct continuations, parallel arcs, and optional material.
- The first data set is core novels plus a curated set of important supporting stories, not an attempt to encode every short story immediately.
- Publication order, in-universe chronology, and recommended reading order are separate concepts.
- The experience should be spoiler-aware and avoid presenting one universal path as objectively correct.
- No accounts, server-side progress, or AI recommendation system are required for the first experiment.

## Brand Commitments

The visual direction is an original campaign-war-room system inspired by Warhammer and Space Marine themes: dark tactical surfaces, restrained faction colour, and pauldron-inspired path markers with original geometric insignia. Do not copy proprietary logos, exact chapter insignia, or unlicensed cover artwork into the product.

## Evidence on Hand

- Reference flowchart: https://www.kylebb.com/HH/HHSeriesOrder.svg
- Reference interactive timeline: https://gaming.kylebb.com/hhtimeline/
- The references are inspiration and evidence of the desired graph-like reading experience, not authoritative content for every relationship.

## Product Principles

- Make the next decision clear without hiding the branching story.
- Explain recommendations in plain language.
- Keep reading progress portable and local-first.
- Treat the data model as the product: layout must not encode meaning that the content cannot express.
- Preserve accessibility and a list-based alternative to the visual graph.

## Accessibility & Inclusion

The map cannot rely on colour alone for status or faction. Book nodes, filters, route controls, and the book detail surface must be keyboard reachable and screen-reader labelled. A linear list view is required for users who cannot use the canvas comfortably.
