import type { Book } from './data'

export const NODE_WIDTH = 180
export const NODE_HEIGHT = 74
export const COLUMN_STEP = 235
export const ROW_STEP = 150

type Point = { x: number; y: number }

export function getEdgeRoute(from: Book, to: Book): Point[] {
  const sourceY = from.y + NODE_HEIGHT / 2
  if (from.y === to.y && Math.abs(to.x - from.x) <= COLUMN_STEP) {
    const right = to.x > from.x
    return [
      { x: right ? from.x + NODE_WIDTH + 8 : from.x - 8, y: sourceY },
      { x: right ? to.x - 8 : to.x + NODE_WIDTH + 8, y: sourceY },
    ]
  }
  const targetX = to.x + NODE_WIDTH / 2
  const corridorY = to.y - (ROW_STEP - NODE_HEIGHT) / 2
  if (from.y === to.y) {
    const sourceX = from.x + NODE_WIDTH / 2
    return [
      { x: sourceX, y: from.y - 8 },
      { x: sourceX, y: corridorY },
      { x: targetX, y: corridorY },
      { x: targetX, y: to.y - 8 },
    ]
  }
  const channelX = from.x + NODE_WIDTH + (COLUMN_STEP - NODE_WIDTH) / 2
  return [
    { x: from.x + NODE_WIDTH + 8, y: sourceY },
    { x: channelX, y: sourceY },
    { x: channelX, y: corridorY },
    { x: targetX, y: corridorY },
    { x: targetX, y: to.y - 8 },
  ]
}

export function edgePath(from: Book, to: Book) {
  return getEdgeRoute(from, to).map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}
