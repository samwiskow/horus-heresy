# Source reading options: browser evidence

Captured from the local build on 1 October 2026. The demo has Horus Rising
finished and The First Heretic current. These are browser captures, not design
mock-ups.

| Capture | Viewport | Reading option |
| --- | --- | --- |
| [desktop.jpg](desktop.jpg) | 1280 × 1200 | Reference flowchart |
| [saga-desktop.jpg](saga-desktop.jpg) | 1280 × 720 | Black Library Saga |
| [reference-mobile.jpg](reference-mobile.jpg) | 390 × 844 | Reference flowchart |
| [mobile.jpg](mobile.jpg) | 390 × 844 | Black Library Saga |

The reference desktop capture uses a taller viewport so the browser's full-page
capture does not resize the existing viewport-based map height and cut off the
footer. The layout was also checked at 1280 × 720.

Manual browser checks passed:

- Saga selection and finished books remain saved after reload.
- Changing options retains finished books and the current book.
- The First Heretic shows Battle for the Abyss, Aurelian as an external source
  step, and Fear to Tread, without the former Know No Fear connection.
- Saga stops at Slaves to Darkness. Reference shows its source continuation.
- Mark The First Heretic finished in Reference, select Saga, then Undo: Saga
  stays selected, the finished count returns to 1/62, and The First Heretic stays
  current. Reload retains that state.

The independent review found one Undo defect. The reviewer scored that fix
resolved after the checks and captures above. The existing visual system was
retained.
