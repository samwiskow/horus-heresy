# Complete reference map review

Verified on 5 October 2026 in installed Google Chrome against the local Vite
preview. Screenshots use sample reading progress in an isolated browser context.
Phone screenshots use a 390 × 844 viewport; this is browser emulation, not a
physical-device test. Desktop uses 1440 × 1080; 900 × 1000 was also checked.

## Evidence

- `desktop.png`: full desktop page and reference dropdown.
- `vertical-overview.png`: complete map with the source branch arrangement.
- `opening-gap-40-percent.png`: shorter opening gap at the user’s zoom level.
- `opening-gap-phone.png`: updated full-map overview at a phone viewport.
- `mobile-overview.png`: the same overview at a phone viewport.
- `card-types.png`: novel and novella cards, source arrows, and type symbols.
- `graphic-and-audio.png`: graphic novel and audio drama cards.
- `mobile.png`: full phone page.
- `mobile-expanded.png`: expanded phone map and return control.
- `browser-checks.json`: 17 passing browser checks, including saved progress,
  independent completion, hidden-story navigation, filters, keyboard selection,
  fixed reference positions when supporting works are hidden, and the unchanged publisher lists.

`pnpm test` passed all 38 route, layout, catalogue, and progress checks.
`pnpm build` passed TypeScript and the production build. A source reimport matched
the saved reference JSON, including its original arrows and unresolved endpoints.
`git diff --check` passed.

No application errors occurred. Chrome requested the existing missing
`favicon.ico`, which returned 404; the browser report records that resource
warning separately. No application change was made for that unrelated asset.

The complete reference is the 2019 source, not a claim to cover every later
Horus Heresy publication. Two unresolved source endpoints remain unresolved.
See `docs/reference-catalogue.md` for the publication evidence and scope.

The full reference retains original source node centres, with extra vertical
space for readable cards. Arrow bends are recalculated around the cards; their
endpoints are unchanged. All stories and Novels only keep the same positions.
The overview uses thin screen-sized strokes below 30% zoom. Focus connections
keeps the previous compact local arrangement.

## Spacing trial

The first trial used 2.5 horizontally and 3.2 vertically: about 9% and 20%
less distance than the earlier 2.75 by 4 layout. The central paths still looked
too spread out at 90% zoom, so a second trial used 2.35 by 3: about 15% less
horizontal distance and 25% less vertical distance. Card sizes are unchanged.
The Thirteenth Wolf has a 26-unit horizontal clearance adjustment beside
Thief of Revelation. Both views retain these positions.

`spacing-first-detail.png` and `spacing-first-overview.png` record the first
trial. `spacing-detail.png` and `spacing-audio-pair.png` show the final spacing
at normal zoom. `vertical-overview.png` and `mobile-overview.png` show the
final full-map arrangement. Phone evidence uses browser viewport emulation.

The branch section moves upward by 400 map units to shorten the opening gap.
The gap before Fulgrim falls from 763 to 363 map units. Positions within the
branches and all arrow endpoints remain unchanged. The nearest branch card
leaves 69 map units below the opening cards. The layout and browser checks
verify this space and preserve clearance for all 192 arrow routes.
