import type { Book } from './data'
import { NODE_HEIGHT, NODE_WIDTH } from './map-layout'

type Point = { x: number; y: number }
type Viewport = { width: number; height: number }

export type MapPosition = Point & { zoom: number }
export type MapCamera = MapPosition | { bookId: string } | { focus: true }

export function fitMap(books: Book[], viewport: Viewport, padding: number): MapPosition {
  if (!books.length) return { x: 0, y: 0, zoom: 1 }

  const left = Math.min(...books.map((book) => book.x))
  const top = Math.min(...books.map((book) => book.y))
  const width = Math.max(...books.map((book) => book.x + NODE_WIDTH)) - left
  const height = Math.max(...books.map((book) => book.y + NODE_HEIGHT)) - top
  const zoom = Math.min(1, Math.max(1, viewport.width - padding) / width, Math.max(1, viewport.height - padding) / height)

  return { x: left + width / 2, y: top + height / 2, zoom }
}

export function centreOnBook(book: Book): MapPosition {
  return { x: book.x + NODE_WIDTH / 2, y: book.y + NODE_HEIGHT / 2, zoom: 1 }
}

export function mapShowsBook(books: Book[], viewport: Viewport, view: MapPosition) {
  const halfWidth = viewport.width / (2 * view.zoom)
  const halfHeight = viewport.height / (2 * view.zoom)
  return books.some((book) =>
    book.x < view.x + halfWidth && book.x + NODE_WIDTH > view.x - halfWidth &&
    book.y < view.y + halfHeight && book.y + NODE_HEIGHT > view.y - halfHeight
  )
}

export function stepMapZoom(zoom: number, direction: 1 | -1, fitZoom: number) {
  const step = 1.28
  return direction === 1 ? Math.min(1.5, zoom * step) : Math.min(zoom, Math.max(fitZoom, zoom / step))
}
