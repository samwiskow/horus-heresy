# Siege route evidence

Captured on 1 October 2026 from the local build.

| Capture | Viewport | State |
| --- | --- | --- |
| continuation-desktop.jpg | 1280 × 900, full page | Reference, Solar War search, continuation section |
| siege-desktop.jpg | 1280 × 900, full page | Siege list, Solar War finished |
| siege-mobile.jpg | 390 × 844, full page | Same Siege list and progress |
| siege-mobile-map.jpg | 390 × 844, viewport | Full map, Volume II focused, Volume III next |
| continuation-mobile.jpg | 390 × 844, full page | Reference Solar War endpoint and source handoff |
| library-desktop.jpg | 1280 × 900, full page | Horus Rising has no Siege number |
| library-mobile.jpg | 390 × 844, full page | Same corrected library label |

Test progress values are local browser values, not catalogue defaults.

Checks covered source handoff, the ten-volume publisher order, book numbers,
completion and reload, the final three volumes, and mobile map closure. The
map has ten nodes and nine publisher sequence arrows. Closing it restores body
scroll and focus to the opening button.

All 20 regression checks and the production build passed. Reference arrows and
the twelve-book Saga list remain unchanged.

The reviewer found that non-Siege library books had an undefined Siege number.
After the fix, all 62 library rows have zero undefined labels, and the ten
Siege volumes retain their correct numbers. All original captures were replaced
after this correction.
