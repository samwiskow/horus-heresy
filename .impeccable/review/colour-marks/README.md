# Colour marks evidence

Captured on 1 October 2026 from the local build. The browser retained test
progress from the prior Siege checks: The Solar War finished, 1 of 62.
No finished IDs or current-book value were changed in these checks.

| Capture | Viewport | State |
| --- | --- | --- |
| list-desktop.jpg | 1280 × 900, full page | All 40 reference books, with marks and factions |
| map-desktop.jpg | 1280 × 900, full page | 40 source marks, 31 arrows, highlighting off |
| library-desktop.jpg | 1280 × 900, full page | 62 books, 40 marks; unreferenced books have none |
| library-mobile.jpg | 390 × 844, full page | Same library, long titles wrap |
| list-mobile.jpg | 390 × 844, full page | Reference list and Siege continuation |
| map-mobile.jpg | 390 × 844, viewport | Full map, Solar War focused and finished |
| map-tablet.jpg | 1024 × 900, full page | Highlighted map at intermediate width |

No horizontal page overflow or clipped list titles was found. Mobile full map
keeps the colour mark, faction text, selection border, and finished symbol.
Console warning and error logs were empty. Source routes and progress logic
were not changed. All 22 regression checks and the production build passed.

The detector ran once on the changed UI files. Its font-size advisories refer
to existing type sizes; this change adds no font sizes or interface palette.
The old navigation, arc, and map-mode text in the design notes is pre-existing
and is outside this change.
