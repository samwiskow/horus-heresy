import type { Book } from './data'
import { NODE_HEIGHT, NODE_WIDTH } from './map-layout'

export type MapView = { zoom: number; pan: { x: number; y: number } }
export type MapRect = { left: number; top: number; right: number; bottom: number }

const directions = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

export function isMapDirection(key: string): key is keyof typeof directions {
  return Object.hasOwn(directions, key)
}

export function getDirectionalBook(origin: Book, books: Book[], direction: keyof typeof directions) {
  const [horizontal, vertical] = directions[direction]
  let best: Book | undefined
  let bestScore = Infinity
  for (const book of books) {
    const dx = book.x - origin.x
    const dy = book.y - origin.y
    const ahead = horizontal * dx + vertical * dy
    if (ahead <= 0) continue
    const sideways = horizontal * dy - vertical * dx
    const score = ahead ** 2 + 4 * sideways ** 2
    if (!best || score < bestScore || (score === bestScore && book.id < best.id)) {
      best = book
      bestScore = score
    }
  }
  return best
}

function subtract(rect: MapRect, overlay: MapRect): MapRect[] {
  if (overlay.left >= rect.right || overlay.right <= rect.left || overlay.top >= rect.bottom || overlay.bottom <= rect.top) return [rect]
  return [
    { ...rect, right: overlay.left },
    { ...rect, left: overlay.right },
    { ...rect, bottom: overlay.top },
    { ...rect, top: overlay.bottom },
  ].filter((part) => part.right > part.left && part.bottom > part.top)
}

export function revealMapBook(book: Book, view: MapView, canvas: MapRect, overlays: MapRect[]) {
  const gap = 10
  let best: MapView | undefined
  let bestDistance = Infinity
  for (const area of overlays.reduce((areas, overlay) => areas.flatMap((rect) => subtract(rect, overlay)), [canvas])) {
    const zoom = Math.min(view.zoom, (area.right - area.left - 2 * gap) / NODE_WIDTH, (area.bottom - area.top - 2 * gap) / NODE_HEIGHT)
    if (zoom <= 0 || (best && zoom < best.zoom)) continue
    const x = Math.max(area.left + gap - book.x * zoom, Math.min(view.pan.x, area.right - gap - (book.x + NODE_WIDTH) * zoom))
    const y = Math.max(area.top + gap - book.y * zoom, Math.min(view.pan.y, area.bottom - gap - (book.y + NODE_HEIGHT) * zoom))
    const distance = (x - view.pan.x) ** 2 + (y - view.pan.y) ** 2
    if (!best || zoom > best.zoom || distance < bestDistance) {
      best = { zoom, pan: { x, y } }
      bestDistance = distance
    }
  }
  return best
}
