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

export function layoutSourceFlow(items: Book[], connections: Connection[], sourcePositions?: Record<string, Point>): Book[] {
  if (sourcePositions) return items.map((book) => ({ ...book, ...sourcePositions[book.id] }))
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

export function getEdgeRoute(from: Book, to: Book, connections: Connection[], items: Book[], referenceLayout = false): Point[] {
  if (referenceLayout) return routeSpatialEdge(from, to, connections, items)
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

export function edgePath(points: Point[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function routeSpatialEdge(from: Book, to: Book, connections: Connection[], items: Book[]): Point[] {
  const lane = (connections.findIndex((edge) => edge.from === from.id && edge.to === to.id) + 1) / (connections.length + 1)
  const horizontal = Math.abs(to.y - from.y) < NODE_HEIGHT + 40
  const direction = horizontal ? Math.sign(to.x - from.x) : Math.sign(to.y - from.y)
  const port = (lane - 0.5) * (horizontal ? 36 : 72)
  const anchor = (book: Book, outgoing: boolean, gap: number): Point => {
    const side = direction * (outgoing ? 1 : -1)
    return horizontal
      ? { x: book.x + (side > 0 ? NODE_WIDTH + gap : -gap), y: book.y + NODE_HEIGHT / 2 + port }
      : { x: book.x + NODE_WIDTH / 2 + port, y: book.y + (side > 0 ? NODE_HEIGHT + gap : -gap) }
  }
  const start = anchor(from, true, 16 + lane * 8)
  const end = anchor(to, false, 16 + lane * 8)
  const clearance = 10 + lane * 4
  const obstacles = items.map((book) => ({ left: book.x - clearance, right: book.x + NODE_WIDTH + clearance, top: book.y - clearance, bottom: book.y + NODE_HEIGHT + clearance }))
  const clearSegment = (a: Point, b: Point) => obstacles.every((box) => a.y === b.y
    ? a.y <= box.top || a.y >= box.bottom || Math.max(a.x, b.x) <= box.left || Math.min(a.x, b.x) >= box.right
    : a.x <= box.left || a.x >= box.right || Math.max(a.y, b.y) <= box.top || Math.min(a.y, b.y) >= box.bottom)
  const simple = [
    [start, { x: end.x, y: start.y }, end],
    [start, { x: start.x, y: end.y }, end],
    [start, { x: start.x, y: (start.y + end.y) / 2 + lane * 4 }, { x: end.x, y: (start.y + end.y) / 2 + lane * 4 }, end],
    [start, { x: (start.x + end.x) / 2 + lane * 4, y: start.y }, { x: (start.x + end.x) / 2 + lane * 4, y: end.y }, end],
  ].find((points) => points.slice(1).every((point, index) => clearSegment(points[index], point)))
  const route = simple ?? findSpatialRoute(start, end, obstacles)
  const points = [anchor(from, true, 8), ...route, anchor(to, false, 8)]
  return points.filter((point, index) => {
    const before = points[index - 1]
    const after = points[index + 1]
    return !before || !after || !((before.x === point.x && point.x === after.x) || (before.y === point.y && point.y === after.y))
  })
}

function findSpatialRoute(start: Point, end: Point, obstacles: { left: number; right: number; top: number; bottom: number }[]): Point[] {
  const xs = [...new Set([start.x, end.x, ...obstacles.flatMap((box) => [box.left, box.right])])].sort((a, b) => a - b)
  const ys = [...new Set([start.y, end.y, ...obstacles.flatMap((box) => [box.top, box.bottom])])].sort((a, b) => a - b)
  const startX = xs.indexOf(start.x)
  const startY = ys.indexOf(start.y)
  const endX = xs.indexOf(end.x)
  const endY = ys.indexOf(end.y)
  const valid = new Map<number, boolean>()
  const costs = new Map<number, number>()
  const previous = new Map<number, number>()
  const queue: { key: number; x: number; y: number; direction: number; cost: number; score: number }[] = []
  const push = (item: typeof queue[number]) => {
    queue.push(item)
    let index = queue.length - 1
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (queue[parent].score <= item.score) break
      queue[index] = queue[parent]
      index = parent
    }
    queue[index] = item
  }
  const pop = () => {
    const first = queue[0]
    const last = queue.pop()!
    if (queue.length) {
      let index = 0
      while (index * 2 + 1 < queue.length) {
        let child = index * 2 + 1
        if (child + 1 < queue.length && queue[child + 1].score < queue[child].score) child++
        if (queue[child].score >= last.score) break
        queue[index] = queue[child]
        index = child
      }
      queue[index] = last
    }
    return first
  }
  const firstKey = (startY * xs.length + startX) * 2
  costs.set(firstKey, 0)
  push({ key: firstKey, x: startX, y: startY, direction: 0, cost: 0, score: Math.abs(start.x - end.x) + Math.abs(start.y - end.y) })
  while (queue.length) {
    const current = pop()
    if (current.cost !== costs.get(current.key)) continue
    if (current.x === endX && current.y === endY) {
      const route: Point[] = []
      let key: number | undefined = current.key
      while (key !== undefined) {
        const cell = Math.floor(key / 2)
        route.push({ x: xs[cell % xs.length], y: ys[Math.floor(cell / xs.length)] })
        key = previous.get(key)
      }
      return route.reverse()
    }
    for (const [dx, dy, direction] of [[1, 0, 0], [-1, 0, 0], [0, 1, 1], [0, -1, 1]]) {
      const x = current.x + dx
      const y = current.y + dy
      if (x < 0 || x >= xs.length || y < 0 || y >= ys.length) continue
      const cell = y * xs.length + x
      if (!valid.has(cell)) valid.set(cell, obstacles.every((box) => xs[x] <= box.left || xs[x] >= box.right || ys[y] <= box.top || ys[y] >= box.bottom))
      if (!valid.get(cell)) continue
      const middleX = (xs[x] + xs[current.x]) / 2
      const middleY = (ys[y] + ys[current.y]) / 2
      if (obstacles.some((box) => middleX > box.left && middleX < box.right && middleY > box.top && middleY < box.bottom)) continue
      const key = cell * 2 + direction
      const cost = current.cost + Math.abs(xs[x] - xs[current.x]) + Math.abs(ys[y] - ys[current.y]) + (direction !== current.direction ? 24 : 0)
      if (cost >= (costs.get(key) ?? Infinity)) continue
      costs.set(key, cost)
      previous.set(key, current.key)
      push({ key, x, y, direction, cost, score: cost + Math.abs(xs[x] - end.x) + Math.abs(ys[y] - end.y) })
    }
  }
  throw new Error('No route between reference cards')
}
