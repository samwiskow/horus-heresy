import type { Book, Connection } from './data'

export const NODE_WIDTH = 220
export const NODE_HEIGHT = 110
export const COLUMN_STEP = 275
export const ROW_STEP = 190

type Point = { x: number; y: number }

export function getConnectionFocus(connections: Connection[], selectedId: string) {
  const edges = connections.filter((edge) => edge.from === selectedId || edge.to === selectedId)
  return { edges, ids: new Set([selectedId, ...edges.flatMap((edge) => [edge.from, edge.to])]) }
}

export function layoutSourceFlow(items: Book[], connections: Connection[]): Book[] {
  const ids = new Set(items.map((book) => book.id))
  const edges = connections.filter((edge) => ids.has(edge.from) && ids.has(edge.to))
  const openingIds = ['horus-rising', 'false-gods', 'galaxy-in-flames', 'flight-eisenstein']
  const opening = edges.some((edge) => edge.kind === 'reference') ? openingIds.filter((id) => ids.has(id)) : []
  const parallelRank = opening.length ? 1 : 0
  const ranks = new Map(items.map((book) => [book.id, opening.includes(book.id) ? 0 : parallelRank]))
  for (let pass = 0; pass < items.length; pass++) {
    let changed = false
    for (const edge of edges) {
      if (opening.includes(edge.to)) continue
      const rank = ranks.get(edge.from)! + 1
      if (rank > ranks.get(edge.to)!) { ranks.set(edge.to, rank); changed = true }
    }
    if (!changed) break
  }
  const connectedIds = new Set(connections.flatMap((edge) => [edge.from, edge.to]))
  const positions = new Map<string, Point>(opening.map((id, index) => [id, { x: 70 + index * COLUMN_STEP, y: 100 }]))
  const lastRank = Math.max(0, ...ranks.values())
  for (let rank = 0; rank <= lastRank; rank++) {
    const layer = items.filter((book) => connectedIds.has(book.id) && !positions.has(book.id) && ranks.get(book.id) === rank)
    const parentColumn = (id: string) => {
      const parents = edges.filter((edge) => edge.to === id && !opening.includes(edge.from)).map((edge) => positions.get(edge.from)!.x)
      return parents.length ? parents.reduce((sum, x) => sum + x, 0) / parents.length : 70
    }
    layer.sort((a, b) => parentColumn(a.id) - parentColumn(b.id))
    const used = new Set<number>()
    for (const book of layer) {
      let column = Math.round((parentColumn(book.id) - 70) / COLUMN_STEP)
      while (used.has(column)) column++
      used.add(column)
      positions.set(book.id, { x: 70 + column * COLUMN_STEP, y: 100 + rank * ROW_STEP })
    }
  }
  items.filter((book) => !connectedIds.has(book.id) && !positions.has(book.id)).forEach((book, index) => {
    positions.set(book.id, { x: 70 + (index % 5) * COLUMN_STEP, y: 100 + (lastRank + 1 + Math.floor(index / 5)) * ROW_STEP })
  })
  return items.map((book) => ({ ...book, ...positions.get(book.id)! }))
}

export function getEdgeRoute(from: Book, to: Book, connections: Connection[], items: Book[]): Point[] {
  if (from.y === to.y && to.x > from.x) {
    return [{ x: from.x + NODE_WIDTH + 8, y: from.y + NODE_HEIGHT / 2 }, { x: to.x - 8, y: to.y + NODE_HEIGHT / 2 }]
  }
  const index = connections.findIndex((edge) => edge.from === from.id && edge.to === to.id)
  const port = 16 + (NODE_WIDTH - 32) * (index + 1) / (connections.length + 1)
  const sourceX = from.x + port
  const targetX = to.x + port
  const start = { x: sourceX, y: from.y + NODE_HEIGHT + 8 }
  const end = { x: targetX, y: to.y - 8 }
  const lane = index / Math.max(1, connections.length) * ((ROW_STEP - NODE_HEIGHT - 40) / 2 - 4)
  const sourceY = from.y + NODE_HEIGHT + 20 + lane
  if (to.y - from.y === ROW_STEP) {
    return [start, { x: sourceX, y: sourceY }, { x: targetX, y: sourceY }, end]
  }
  const channelX = Math.max(...items.map((book) => book.x + NODE_WIDTH)) + 30 + index * 12
  const targetY = to.y - 20 - lane
  return [start, { x: sourceX, y: sourceY }, { x: channelX, y: sourceY }, { x: channelX, y: targetY }, { x: targetX, y: targetY }, end]
}

export function edgePath(from: Book, to: Book, connections: Connection[], items: Book[]) {
  return getEdgeRoute(from, to, connections, items).map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}
