import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowUpRight, BookOpen, Check, Download, Map, Minus, Plus, RotateCcw, Search, Target, X, ArrowRight, List } from 'lucide-react'
import { arcMeta, bookById, books, connections, type ArcId, type Book, type Connection } from './data'
import { toggleFinished } from './progress'
import { getReachableBookIds, getRecommendations } from './logic'

type View = 'map' | 'atlas' | 'library'
type MapMode = 'reference' | 'lanes' | 'tactical'
type Progress = { readIds: string[]; currentId: string }

const STORAGE_KEY = 'heresy-pathfinder-progress'
const NODE_WIDTH = 180
const NODE_HEIGHT = 74
const MAP_WIDTH = 1680
const MAP_HEIGHT = 1500
const FLOW_NODE_WIDTH = 194
const FLOW_NODE_HEIGHT = 90
const FLOW_EDGE_GAP = 8
const FLOW_EDGE_FAN = 18
const FLOW_EDGE_BAND_GAP = 24
const FLOW_CROSS_CHANNEL_GAP = 10
const FLOW_CROSS_TRACK_GAP = 22
const FLOW_EDGE_CURVE_THRESHOLD = 96
const knownBookIds = new Set(books.map((book) => book.id))

type FlowPosition = { x: number; y: number }
const FLOW_LEFT = 220
const FLOW_X_STEP = 240
const FLOW_TOP = 100
const FLOW_ROW_GAP = 155

type FlowRow = { id: ArcId; label: string; y: number; colour: string }
type FlowLayout = { positions: Record<string, FlowPosition>; width: number; height: number; rows: FlowRow[] }

const flowRows: FlowRow[] = Object.entries(arcMeta).map(([id, meta], index) => ({
  id: id as ArcId,
  label: meta.label.toUpperCase(),
  y: FLOW_TOP + index * FLOW_ROW_GAP,
  colour: meta.colour,
}))

function buildFlowLayout(visibleBooks?: Book[]): FlowLayout {
  const positions: Record<string, FlowPosition> = {}
  let maxBooksInRow = 0
  const visibleIds = visibleBooks ? new Set(visibleBooks.map((book) => book.id)) : null
  const rows = (visibleIds ? flowRows.filter((row) => books.some((book) => book.arc === row.id && visibleIds.has(book.id))) : flowRows).map((row, index) => ({
    ...row,
    y: FLOW_TOP + index * FLOW_ROW_GAP,
  }))
  rows.forEach((row) => {
    const arcBooks = orderFlowBooks(books.filter((book) => book.arc === row.id && (!visibleIds || visibleIds.has(book.id))))
    maxBooksInRow = Math.max(maxBooksInRow, arcBooks.length)
    arcBooks.forEach((book, index) => {
      positions[book.id] = { x: FLOW_LEFT + index * FLOW_X_STEP, y: row.y - FLOW_NODE_HEIGHT / 2 }
    })
  })
  return {
    positions,
    width: Math.max(1550, FLOW_LEFT + maxBooksInRow * FLOW_X_STEP + 40),
    height: (rows.at(-1)?.y ?? FLOW_TOP) + FLOW_NODE_HEIGHT + 42,
    rows,
  }
}

function isDirectionalConnection(kind: Connection['kind']) {
  return kind === 'sequel' || kind === 'recommended' || kind === 'prerequisite'
}

function isPrimaryConnection(kind: Connection['kind']) {
  return kind === 'sequel'
}

function flowEdgeBandOffset(kind: Connection['kind']) {
  if (isPrimaryConnection(kind)) return 0
  if (kind === 'recommended' || kind === 'prerequisite') return -FLOW_EDGE_BAND_GAP
  return FLOW_EDGE_BAND_GAP
}

function orderFlowBooks(arcBooks: Book[]) {
  const ordered = [...arcBooks]
  const allowedIds = new Set(ordered.map((book) => book.id))
  const directionalEdges = connections.filter((edge) => isDirectionalConnection(edge.kind) && allowedIds.has(edge.from) && allowedIds.has(edge.to))
  directionalEdges.forEach((edge) => {
    const fromIndex = ordered.findIndex((book) => book.id === edge.from)
    const toIndex = ordered.findIndex((book) => book.id === edge.to)
    if (fromIndex > toIndex) {
      const [book] = ordered.splice(fromIndex, 1)
      ordered.splice(toIndex, 0, book)
    }
  })
  return ordered
}

function loadProgress(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '') as Partial<Progress>
    const readIds = Array.isArray(saved.readIds)
      ? [...new Set(saved.readIds.filter((id): id is string => typeof id === 'string' && knownBookIds.has(id)))]
      : []
    const currentId = typeof saved.currentId === 'string' && knownBookIds.has(saved.currentId)
      ? saved.currentId
      : 'horus-rising'
    if (Array.isArray(saved.readIds)) return { currentId, readIds }
  } catch {
    // First run or malformed local storage should look like a clean campaign.
  }
  return { currentId: 'horus-rising', readIds: [] }
}

function splitTitle(title: string) {
  if (title.length < 20) return [title]
  const words = title.split(' ')
  const midpoint = Math.ceil(words.length / 2)
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')]
}

function edgePath(from: Book, to: Book) {
  const startX = from.x + NODE_WIDTH / 2
  const startY = from.y + NODE_HEIGHT / 2
  const endX = to.x + NODE_WIDTH / 2
  const endY = to.y + NODE_HEIGHT / 2
  const bendX = startX + (endX - startX) * 0.5
  return `M ${startX} ${startY} C ${bendX} ${startY}, ${bendX} ${endY}, ${endX} ${endY}`
}

function isFocusedConnection(edge: Connection, focusId: string | null) {
  return Boolean(focusId) && (edge.from === focusId || edge.to === focusId)
}

function getFocusedBookIds(edges: Connection[], focusId: string | null) {
  const ids = new Set<string>()
  if (!focusId) return ids
  ids.add(focusId)
  edges.forEach((edge) => {
    if (isFocusedConnection(edge, focusId)) {
      ids.add(edge.from)
      ids.add(edge.to)
    }
  })
  return ids
}

function IconButton({ label, onClick, children, disabled = false }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>
}

function StatusMark({ book, readIds, currentId }: { book: Book; readIds: Set<string>; currentId: string }) {
  if (readIds.has(book.id)) return <g className="status-mark read" transform={`translate(${NODE_WIDTH - 23} ${NODE_HEIGHT - 23})`} aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M -3 0 L -1 2.5 L 3 -2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>
  if (currentId === book.id) return <g className="status-mark current" transform={`translate(${NODE_WIDTH - 23} ${NODE_HEIGHT - 23})`} aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle r="2.1" fill="currentColor" /></g>
  return null
}

function BookNode({ book, selected, dimmed, readIds, currentId, recommended, onSelect }: { book: Book; selected: boolean; dimmed: boolean; readIds: Set<string>; currentId: string; recommended: boolean; onSelect: (book: Book) => void }) {
  const titleLines = splitTitle(book.shortTitle)
  const status = readIds.has(book.id) ? 'read' : currentId === book.id ? 'current' : recommended ? 'recommended' : ''
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(book)
    }
  }
  return (
    <g
      className={`map-node ${status} ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}
      transform={`translate(${book.x} ${book.y})`}
      role="button"
      tabIndex={0}
      aria-label={`${book.title}, ${readIds.has(book.id) ? 'read' : currentId === book.id ? 'current book' : 'unread'}`}
      onClick={() => onSelect(book)}
      onKeyDown={onKeyDown}
    >
      {selected && <rect className="node-focus-ring" x="-7" y="-7" width={NODE_WIDTH + 14} height={NODE_HEIGHT + 14} rx="15" />}
      <rect className="node-plate" width={NODE_WIDTH} height={NODE_HEIGHT} rx="12" />
      <path className="node-notch" d="M 0 12 L 10 0 L 22 0 L 30 12 L 22 24 L 10 24 Z" />
      <text className="node-faction" x="42" y="17">{book.faction.toUpperCase()}</text>
      {titleLines.map((line, index) => <text className="node-title" key={line} x="16" y={42 + index * 15}>{line}</text>)}
      <text className="node-meta" x="16" y="65">{book.kind} {book.seriesNumber ? `· ${String(book.seriesNumber).padStart(2, '0')}` : ''}</text>
      <StatusMark book={book} readIds={readIds} currentId={currentId} />
      {recommended && !readIds.has(book.id) && currentId !== book.id && <circle className="recommend-dot" cx={NODE_WIDTH - 14} cy={14} r="4" />}
    </g>
  )
}

function MapCanvas({
  selectedId, currentId, readIds, visibleBooks, routeIds, recommendedIds, onSelect, focusRevision,
}: {
  selectedId: string | null
  currentId: string
  readIds: Set<string>
  visibleBooks: Book[]
  routeIds: Set<string>
  focusRevision: number
  recommendedIds: Set<string>
  onSelect: (book: Book) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const visibleIds = new Set(visibleBooks.map((book) => book.id))
  const visibleConnections = connections.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
  const focusedBookIds = getFocusedBookIds(visibleConnections, selectedId)
  const focusPan = (book: Book, scale: number) => ({
    x: 230 + 470 * (book.x / MAP_WIDTH) - (book.x + NODE_WIDTH / 2) * scale,
    y: 160 + 270 * (book.y / MAP_HEIGHT) - (book.y + NODE_HEIGHT / 2) * scale,
  })

  useEffect(() => {
    const book = bookById[selectedId || currentId]
    setPan(focusPan(book, zoom))
  }, [focusRevision, currentId, zoom])

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest('[role=button]')) return
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const scale = Math.max(1000 / bounds.width, 600 / bounds.height)
    setPan({ x: drag.current.panX + (event.clientX - drag.current.x) * scale, y: drag.current.panY + (event.clientY - drag.current.y) * scale })
  }
  const stopDrag = () => { drag.current = null }

  return (
    <div className="map-canvas-shell">
      <svg
        className="map-canvas"
        viewBox="0 0 1000 600"
        role="group" aria-label="Campaign connections"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      >
        <defs>
          <pattern id="map-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(117, 151, 144, 0.08)" strokeWidth="1" />
            <circle cx="1" cy="1" r="1.2" fill="rgba(117, 151, 144, 0.14)" />
          </pattern>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--map-edge)" />
          </marker>
          <marker id="arrowhead-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--accent)" />
          </marker>
        </defs>
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="var(--sheet)" />
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#map-grid)" />
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          <text className="map-axis-label" x="70" y="45">THE CAMPAIGN MAP / SELECT A NODE TO INSPECT</text>
          <line className="map-axis" x1="70" y1="62" x2="1170" y2="62" />
          {visibleConnections.map((edge) => {
            const from = bookById[edge.from]
            const to = bookById[edge.to]
            const active = selectedId ? isFocusedConnection(edge, selectedId) : routeIds.has(edge.from) || routeIds.has(edge.to) || (edge.from === currentId)
            const dimmed = Boolean(selectedId) && !active
            const focused = Boolean(selectedId) && active
            return <path key={`${edge.from}-${edge.to}`} className={`map-edge ${active ? 'active' : ''} ${focused ? 'focused' : ''} ${dimmed ? 'dimmed' : ''} ${edge.kind}`} d={edgePath(from, to)} markerEnd={isDirectionalConnection(edge.kind) ? `url(#${active ? 'arrowhead-active' : 'arrowhead'})` : undefined} />
          })}
          {visibleBooks.map((book) => <BookNode key={book.id} book={book} selected={selectedId === book.id} dimmed={Boolean(selectedId) && !focusedBookIds.has(book.id)} readIds={readIds} currentId={currentId} recommended={recommendedIds.has(book.id)} onSelect={onSelect} />)}
        </g>
      </svg>
      <div className="map-controls" aria-label="Map controls">
        <IconButton label="Zoom out" onClick={() => setZoom((value) => Math.max(0.48, value - 0.08))}><Minus size={16} /></IconButton>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <IconButton label="Zoom in" onClick={() => setZoom((value) => Math.min(1.35, value + 0.08))}><Plus size={16} /></IconButton>
        <span className="control-rule" />
        <IconButton label="Reset map position" onClick={() => { setZoom(1); setPan(focusPan(bookById[currentId], 1)) }}><RotateCcw size={15} /></IconButton>
      </div>
      <div className="map-hint"><span className="drag-dot" /> Drag the map to scan the route</div>
    </div>
  )
}

function centredOffset(index: number, count: number, spacing: number) {
  return (index - (count - 1) / 2) * spacing
}

function flowRowIndex(position: FlowPosition) {
  return Math.round((position.y + FLOW_NODE_HEIGHT / 2 - FLOW_TOP) / FLOW_ROW_GAP)
}

function flowCorridorKey(from: FlowPosition, to: FlowPosition) {
  return String(Math.floor((flowRowIndex(from) + flowRowIndex(to)) / 2))
}

function flowLanePairKey(from: FlowPosition, to: FlowPosition) {
  return `${flowRowIndex(from)}:${flowRowIndex(to)}`
}

function flowEdgeMarkerId(mode: Exclude<MapMode, 'tactical'>, arc: ArcId, primary: boolean) {
  return `flow-arrow-${primary ? 'primary-' : ''}${mode}-${arc}`
}

function flowEdgeMarkerColour(colour: string) {
  return `color-mix(in srgb, ${colour} 40%, #292823)`
}

type FlowEdgeRoute = {
  sourceOffset: number
  targetOffset: number
  channelOffset: number
}

function flowEdgePath(from: FlowPosition, to: FlowPosition, route: FlowEdgeRoute) {
  if (from.y !== to.y) {
    const movesDown = to.y > from.y
    const startX = from.x + FLOW_NODE_WIDTH / 2 + route.sourceOffset
    const endX = to.x + FLOW_NODE_WIDTH / 2 + route.targetOffset
    const startY = movesDown ? from.y + FLOW_NODE_HEIGHT + FLOW_EDGE_GAP : from.y - FLOW_EDGE_GAP
    const endY = movesDown ? to.y - FLOW_EDGE_GAP : to.y + FLOW_NODE_HEIGHT + FLOW_EDGE_GAP
    const corridorRow = Number(flowCorridorKey(from, to))
    const channelY = FLOW_TOP + corridorRow * FLOW_ROW_GAP + FLOW_ROW_GAP / 2 + route.channelOffset
    return `M ${startX} ${startY} V ${channelY} H ${endX} V ${endY}`
  }

  const movesRight = to.x >= from.x
  const direction = movesRight ? 1 : -1
  const startX = movesRight ? from.x + FLOW_NODE_WIDTH + FLOW_EDGE_GAP : from.x - FLOW_EDGE_GAP
  const endX = movesRight ? to.x - FLOW_EDGE_GAP : to.x + FLOW_NODE_WIDTH + FLOW_EDGE_GAP
  const startY = from.y + FLOW_NODE_HEIGHT / 2 + route.sourceOffset
  const endY = to.y + FLOW_NODE_HEIGHT / 2 + route.targetOffset

  if (Math.abs(endX - startX) <= FLOW_EDGE_CURVE_THRESHOLD && startY === endY) {
    return `M ${startX} ${startY} H ${endX}`
  }
  const offset = (route.sourceOffset + route.targetOffset) / 2
  return `M ${startX} ${startY} C ${startX + direction * 42} ${startY + offset}, ${endX - direction * 42} ${endY + offset}, ${endX} ${endY}`
}

function FlowBookNode({ book, position, mode, selected, dimmed, readIds, currentId, recommended, onSelect }: {
  book: Book
  position: FlowPosition
  mode: Exclude<MapMode, 'tactical'>
  selected: boolean
  dimmed: boolean
  readIds: Set<string>
  currentId: string
  recommended: boolean
  onSelect: (book: Book) => void
}) {
  const titleLines = splitTitle(book.shortTitle).slice(0, 2)
  const status = readIds.has(book.id) ? 'read' : currentId === book.id ? 'current' : recommended ? 'recommended' : ''
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(book)
    }
  }
  return (
    <g
      data-book-id={book.id}
      className={`flow-node ${mode} arc-${book.arc} ${status} ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}
      style={{ '--flow-accent': book.accent } as CSSProperties}
      transform={`translate(${position.x} ${position.y})`}
      role="button"
      tabIndex={0}
      aria-label={`${book.title}, ${readIds.has(book.id) ? 'read' : currentId === book.id ? 'current book' : 'unread'}`}
      onClick={() => onSelect(book)}
      onKeyDown={onKeyDown}
    >
      {selected && <rect className="flow-node-focus-ring" x="-7" y="-7" width={FLOW_NODE_WIDTH + 14} height={FLOW_NODE_HEIGHT + 14} rx={mode === 'reference' ? 8 : 12} />}
      <rect className="flow-node-plate" width={FLOW_NODE_WIDTH} height={FLOW_NODE_HEIGHT} rx={mode === 'reference' ? 5 : 9} />
      <rect className="flow-node-accent" width="1" height={FLOW_NODE_HEIGHT} />
      <text className="flow-node-faction" x="14" y="17">{book.faction.toUpperCase()}</text>
      {titleLines.map((line, index) => <text className="flow-node-title" key={line} x="14" y={43 + index * 18}>{line}</text>)}
      <text className="flow-node-meta" x="14" y="79">{book.kind} {book.seriesNumber ? `· ${String(book.seriesNumber).padStart(2, '0')}` : ''}</text>
      {readIds.has(book.id) && <path className="flow-status read" d={`M ${FLOW_NODE_WIDTH - 22} 17 l 3 3 6 -7`} />}
      {currentId === book.id && <circle className="flow-status current" cx={FLOW_NODE_WIDTH - 16} cy="17" r="4" />}
      {recommended && !readIds.has(book.id) && currentId !== book.id && <circle className="flow-status recommended" cx={FLOW_NODE_WIDTH - 16} cy="17" r="4" />}
    </g>
  )
}

function FlowMapCanvas({
  mode, selectedId, currentId, readIds, visibleBooks, recommendedIds, onSelect,
}: {
  mode: Exclude<MapMode, 'tactical'>
  selectedId: string | null
  currentId: string
  readIds: Set<string>
  visibleBooks: Book[]
  recommendedIds: Set<string>
  onSelect: (book: Book) => void
}) {
  const { positions, width: flowWidth, height: flowHeight, rows } = buildFlowLayout(visibleBooks)
  const shellRef = useRef<HTMLDivElement>(null)
  const overviewWindowRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const shell = shellRef.current
    const windowMark = overviewWindowRef.current
    if (!shell || !windowMark) return
    const update = () => {
      windowMark.style.left = `${shell.scrollLeft / flowWidth * 100}%`
      windowMark.style.top = `${shell.scrollTop / flowHeight * 100}%`
      windowMark.style.width = `${Math.min(100, shell.clientWidth / flowWidth * 100)}%`
      windowMark.style.height = `${Math.min(100, shell.clientHeight / flowHeight * 100)}%`
    }
    const observer = new ResizeObserver(update)
    observer.observe(shell)
    shell.addEventListener('scroll', update)
    update()
    return () => { observer.disconnect(); shell.removeEventListener('scroll', update) }
  }, [flowWidth, flowHeight])
  const visibleIds = new Set(visibleBooks.map((book) => book.id))
  const visibleConnections = connections.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
  const focusedBookIds = getFocusedBookIds(visibleConnections, selectedId)
  const sameRowOutgoing = new globalThis.Map<string, string[]>()
  const sameRowIncoming = new globalThis.Map<string, string[]>()
  const crossLaneOutgoing = new globalThis.Map<string, string[]>()
  const crossLaneIncoming = new globalThis.Map<string, string[]>()
  const crossLaneChannels = new globalThis.Map<string, string[]>()
  const crossLaneTracks = new globalThis.Map<string, string[]>()
  visibleConnections.forEach((edge) => {
    const from = positions[edge.from]
    const to = positions[edge.to]
    const sameRow = from?.y === to?.y
    const outgoing = sameRow ? sameRowOutgoing : crossLaneOutgoing
    const incoming = sameRow ? sameRowIncoming : crossLaneIncoming
    outgoing.set(edge.from, [...(outgoing.get(edge.from) || []), edge.to])
    incoming.set(edge.to, [...(incoming.get(edge.to) || []), edge.from])
    if (!sameRow && from && to) {
      const corridorKey = flowCorridorKey(from, to)
      const lanePairKey = flowLanePairKey(from, to)
      const edgeKey = `${edge.from}:${edge.to}`
      crossLaneChannels.set(lanePairKey, [...(crossLaneChannels.get(lanePairKey) || []), edgeKey])
      const tracks = crossLaneTracks.get(corridorKey) || []
      if (!tracks.includes(lanePairKey)) crossLaneTracks.set(corridorKey, [...tracks, lanePairKey])
    }
  })
  const edgeRoutes = new globalThis.Map<string, FlowEdgeRoute>(visibleConnections.map((edge) => {
    const sameRow = positions[edge.from]?.y === positions[edge.to]?.y
    const outgoing = sameRow ? sameRowOutgoing : crossLaneOutgoing
    const incoming = sameRow ? sameRowIncoming : crossLaneIncoming
    const sourceTargets = outgoing.get(edge.from) || []
    const targetSources = incoming.get(edge.to) || []
    const sourceFanOffset = centredOffset(sourceTargets.indexOf(edge.to), sourceTargets.length, FLOW_EDGE_FAN)
    const targetFanOffset = centredOffset(targetSources.indexOf(edge.from), targetSources.length, FLOW_EDGE_FAN)
    const bandOffset = flowEdgeBandOffset(edge.kind)
    const sourceOffset = sameRow
      ? isPrimaryConnection(edge.kind) ? 0 : bandOffset + sourceFanOffset
      : sourceFanOffset
    const targetOffset = sameRow
      ? isPrimaryConnection(edge.kind) ? 0 : bandOffset + targetFanOffset
      : targetFanOffset
    const corridorKey = !sameRow && positions[edge.from] && positions[edge.to]
      ? flowCorridorKey(positions[edge.from], positions[edge.to])
      : ''
    const lanePairKey = !sameRow && positions[edge.from] && positions[edge.to]
      ? flowLanePairKey(positions[edge.from], positions[edge.to])
      : ''
    const channelEdges = crossLaneChannels.get(lanePairKey) || []
    const trackKeys = crossLaneTracks.get(corridorKey) || []
    const trackOffset = sameRow
      ? 0
      : centredOffset(trackKeys.indexOf(lanePairKey), trackKeys.length, FLOW_CROSS_TRACK_GAP)
    const channelOffset = sameRow
      ? 0
      : bandOffset + trackOffset + centredOffset(channelEdges.indexOf(`${edge.from}:${edge.to}`), channelEdges.length, FLOW_CROSS_CHANNEL_GAP)
    return [`${edge.from}:${edge.to}`, {
      sourceOffset,
      targetOffset,
      channelOffset,
    }] as const
  }))
  return (
    <div className="flow-map-layout">
    <div className={`flow-canvas-shell flow-${mode}`} ref={shellRef}>
      <svg className="flow-canvas" style={{ width: `${flowWidth}px`, height: `${flowHeight}px` }} viewBox={`0 0 ${flowWidth} ${flowHeight}`} role="group" aria-label="Story connections">
        <defs>
          {Object.entries(arcMeta).map(([arc, meta]) => <g key={arc}>
            <marker id={flowEdgeMarkerId(mode, arc as ArcId, false)} markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 8 4 L 0 8 Z" style={{ fill: flowEdgeMarkerColour(meta.colour) }} />
            </marker>
            <marker id={flowEdgeMarkerId(mode, arc as ArcId, true)} markerWidth="14" markerHeight="14" refX="11" refY="5.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 11 5.5 L 0 11 Z" style={{ fill: flowEdgeMarkerColour(meta.colour) }} />
            </marker>
          </g>)}
        </defs>
        <rect className="flow-surface" width={flowWidth} height={flowHeight} />
        {mode === 'reference' ? (
          <g className="flow-reference-guides">
            <text className="flow-title" x="45" y="33">READING ORDER</text>
            <text className="flow-direction" x={flowWidth - 35} y="33">READING CONNECTIONS</text>
            {Array.from({ length: Math.ceil(flowWidth / 380) - 1 }, (_, index) => <line key={index} x1={380 + index * 380} y1="55" x2={380 + index * 380} y2={flowHeight - 55} />)}
            <line x1="28" y1="55" x2={flowWidth - 28} y2="55" />
            {rows.map((row) => <g key={row.id}><line x1="28" y1={row.y + 58} x2={flowWidth - 28} y2={row.y + 58} /><text className="flow-column-label" x="38" y={row.y - 43}>{row.label}</text></g>)}
          </g>
        ) : (
          <g className="flow-lane-guides">
            <text className="flow-title" x="28" y="33">STORY ARCS</text>
            <text className="flow-direction" x={flowWidth - 35} y="33">READING CONNECTIONS</text>
            {rows.map((row) => <g key={row.id}><rect className="flow-lane-band" x="20" y={row.y - 58} width={flowWidth - 40} height="116" rx="5" style={{ '--lane-colour': row.colour } as CSSProperties} /><line className="flow-lane-rule" x1={FLOW_LEFT - 20} y1={row.y} x2={flowWidth - 30} y2={row.y} /><text className="flow-lane-label" x="38" y={row.y - 13}>{row.label}</text><text className="flow-lane-sub" x="38" y={row.y + 8}>{row.id === 'opening' ? 'ENTRY ROUTE' : row.id === 'siege' ? 'FINAL APPROACH' : 'BRANCH'}</text></g>)}
          </g>
        )}
        <g className="flow-edges">
          {visibleConnections.map((edge) => {
            const from = positions[edge.from]
            const to = positions[edge.to]
            if (!from || !to) return null
            const active = selectedId ? isFocusedConnection(edge, selectedId) : edge.from === currentId || edge.to === currentId
            const dimmed = Boolean(selectedId) && !active
            const focused = Boolean(selectedId) && active
            const marker = isDirectionalConnection(edge.kind)
              ? `url(#${flowEdgeMarkerId(mode, bookById[edge.from].arc, edge.kind === 'sequel')})`
              : undefined
            return <path key={`${edge.from}-${edge.to}`} className={`flow-edge ${active ? 'active' : ''} ${focused ? 'focused' : ''} ${dimmed ? 'dimmed' : ''} ${edge.kind}`} style={{ '--flow-edge-accent': arcMeta[bookById[edge.from].arc].colour } as CSSProperties} d={flowEdgePath(from, to, edgeRoutes.get(`${edge.from}:${edge.to}`) || { sourceOffset: 0, targetOffset: 0, channelOffset: 0 })} markerEnd={marker} />
          })}
        </g>
        <g className="flow-nodes">
          {visibleBooks.map((book) => <FlowBookNode key={book.id} book={book} position={positions[book.id] || { x: 20, y: 20 }} mode={mode} selected={selectedId === book.id} dimmed={Boolean(selectedId) && !focusedBookIds.has(book.id)} readIds={readIds} currentId={currentId} recommended={recommendedIds.has(book.id)} onSelect={onSelect} />)}
        </g>
      </svg>
    </div>
      <button className="atlas-overview" type="button" aria-label="Jump within the story atlas" onClick={(event) => {
        const shell = shellRef.current
        const chart = event.currentTarget.querySelector('.overview-chart')
        if (!shell || !chart) return
        const bounds = chart.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
        const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
        shell.scrollTo({ left: x * flowWidth - shell.clientWidth / 2, top: y * flowHeight - shell.clientHeight / 2, behavior: 'smooth' })
      }}>
        <span className="overview-label">Whole atlas · {rows.length} arcs</span>
        <span className="overview-chart" aria-hidden="true">
          {rows.map((row) => <span key={row.id} className="overview-lane" style={{ top: `${row.y / flowHeight * 100}%`, backgroundColor: row.colour }} />)}
          {positions[currentId] && <span className="overview-current" style={{ left: `${positions[currentId].x / flowWidth * 100}%`, top: `${positions[currentId].y / flowHeight * 100}%` }} />}
          <span className="overview-window" ref={overviewWindowRef} />
        </span>
      </button>
    </div>
  )
}


type BookActions = { readIds: Set<string>; currentId: string; onRead: (id: string) => void; onCurrent: (id: string) => void }

function ReadingActions({ book, readIds, currentId, onRead, onCurrent }: BookActions & { book: Book }) {
  return <div className="book-actions">
    <button className="primary-action" onClick={() => onCurrent(book.id)} disabled={currentId === book.id}><BookOpen size={16} />{currentId === book.id ? 'Currently reading' : 'Read this next'}</button>
    <button className="quiet-action" aria-pressed={readIds.has(book.id)} onClick={() => onRead(book.id)}>{readIds.has(book.id) ? <RotateCcw size={16} /> : <Check size={16} />}{readIds.has(book.id) ? 'Mark unread' : 'Mark finished'}</button>
  </div>
}

function BookNotes({ book, onSelect, onClose, ...actions }: BookActions & { book: Book; onSelect: (book: Book) => void; onClose: () => void }) {
  const incoming = connections.filter((edge) => edge.to === book.id && isDirectionalConnection(edge.kind))
  const outgoing = connections.filter((edge) => edge.from === book.id)
  const labels: Record<Connection['kind'], string> = { sequel: 'Direct continuation', recommended: 'Suggested route', prerequisite: 'Read before', parallel: 'Parallel story', optional: 'Optional story' }
  return <aside id="book-notes" className="book-notes" tabIndex={-1} aria-label="Book notes">
    <div className="notes-heading"><h2>Book notes</h2><IconButton label="Close book notes" onClick={onClose}><X size={18} /></IconButton></div>
    <div className="book-reference">{book.seriesNumber ? `Book ${String(book.seriesNumber).padStart(2, '0')}` : 'Supporting story'} <span>{book.kind}</span></div>
    <h3>{book.title}</h3>
    <p className="faction-name">{book.faction}</p>
    <p className="book-status">{actions.readIds.has(book.id) ? <Check size={15} /> : <BookOpen size={15} />}{actions.readIds.has(book.id) ? 'Finished' : book.id === actions.currentId ? 'Currently reading' : 'Unread'}</p>
    <ReadingActions book={book} {...actions} />
    <details className="story-details" key={book.id}><summary>Show story notes <span>{book.spoilerLevel} spoilers</span></summary><p>{book.summary}</p><p>{book.reason}</p></details>
    {incoming.length > 0 && <section className="connection-list"><h4>Before this book</h4>{incoming.map((edge) => <button key={edge.from} onClick={() => onSelect(bookById[edge.from])}><span>{bookById[edge.from].title}<small>{edge.kind === 'prerequisite' ? 'Prerequisite' : labels[edge.kind]}</small></span><ArrowRight size={15} /></button>)}</section>}
    {outgoing.length > 0 && <section className="connection-list"><h4>Where the story leads</h4>{outgoing.map((edge) => <button key={edge.to} onClick={() => onSelect(bookById[edge.to])}><span>{bookById[edge.to].title}<small>{labels[edge.kind]}</small></span><ArrowRight size={15} /></button>)}</section>}
    <p className="curation-note">A curated reading guide. Connections suggest a route; they do not define one official order.</p>
  </aside>
}

function BookList({ items, selectedId, onSelect, ...actions }: BookActions & { items: Book[]; selectedId: string; onSelect: (book: Book) => void }) {
  return <ol className="book-list">{items.map((book) => <li key={book.id} className={selectedId === book.id ? 'selected' : ''}>
    <span className="book-number">{book.seriesNumber ? String(book.seriesNumber).padStart(2, '0') : '—'}</span>
    <button className="list-book" aria-pressed={selectedId === book.id} onClick={() => onSelect(book)}><strong>{book.title}</strong><span>{arcMeta[book.arc].label}</span></button>
    <span className="list-status">{actions.readIds.has(book.id) ? <><Check size={15} />Finished</> : book.id === actions.currentId ? <><BookOpen size={15} />Reading</> : 'Unread'}</span>
    <button className="icon-button" aria-label={`${actions.readIds.has(book.id) ? 'Mark unread' : 'Mark finished'}: ${book.title}`} aria-pressed={actions.readIds.has(book.id)} onClick={() => actions.onRead(book.id)}>{actions.readIds.has(book.id) ? <RotateCcw size={17} /> : <Check size={17} />}</button>
  </li>)}</ol>
}

function Explore({ currentId, readIds, onRead, onCurrent, selectedId, onSelect }: BookActions & { selectedId: string; onSelect: (book: Book) => void }) {
  const [search, setSearch] = useState('')
  const [arcFilter, setArcFilter] = useState<ArcId | 'all'>('all')
  const [mode, setMode] = useState<MapMode | 'list'>('lanes')
  const [routeOnly, setRouteOnly] = useState(false)
  const [fullMobileMap, setFullMobileMap] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [focusRevision, setFocusRevision] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  const mobileMapToggleRef = useRef<HTMLButtonElement>(null)
  const mapCloseRef = useRef<HTMLButtonElement>(null)
  const notesTrigger = useRef<HTMLElement | null>(null)
  const recommendations = getRecommendations(currentId, readIds)
  const recommended = recommendations[0]
  const routeIds = getReachableBookIds(currentId, readIds)
  const actions = { currentId, readIds, onRead, onCurrent }
  const visibleBooks = books.filter((book) => (!search || `${book.title} ${book.faction} ${arcMeta[book.arc].label}`.toLowerCase().includes(search.toLowerCase())) && (arcFilter === 'all' || book.arc === arcFilter) && (!routeOnly || routeIds.has(book.id) || book.id === currentId))
  const openNotes = () => {
    if (!(document.activeElement as HTMLElement)?.closest('#book-notes')) notesTrigger.current = document.activeElement as HTMLElement
    setNotesOpen(true)
    requestAnimationFrame(() => document.getElementById('book-notes')?.focus())
  }
  const closeNotes = () => { setNotesOpen(false); requestAnimationFrame(() => notesTrigger.current?.focus()) }
  const closeFullMobileMap = () => { setFullMobileMap(false); requestAnimationFrame(() => mobileMapToggleRef.current?.focus()) }
  const selectAndShowNotes = (book: Book) => {
    onSelect(book)
    openNotes()
  }
  const revealBook = (book: Book, showNotes = true) => { setSearch(''); setArcFilter('all'); setRouteOnly(false); onSelect(book); setFocusRevision((value) => value + 1); if (showNotes) openNotes() }
  useEffect(() => {
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (notesOpen) closeNotes()
      else if (fullMobileMap) closeFullMobileMap()
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [notesOpen, fullMobileMap])
  useEffect(() => {
    if (!fullMobileMap || !window.matchMedia('(max-width: 760px)').matches) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    mapCloseRef.current?.focus()
    return () => { document.body.style.overflow = previousOverflow }
  }, [fullMobileMap])
  useEffect(() => {
    const shell = mapRef.current?.querySelector('.flow-canvas-shell')
    const node = mapRef.current?.querySelector(`[data-book-id="${selectedId}"]`)
    if (shell && node) {
      const bounds = node.getBoundingClientRect()
      const viewport = shell.getBoundingClientRect()
      shell.scrollTo({ left: (shell.scrollLeft + bounds.left - viewport.left <= FLOW_LEFT && viewport.width >= 440) ? 0 : Math.max(0, shell.scrollLeft + bounds.left - viewport.left - Math.max(24, (viewport.width - bounds.width) / 2)), top: shell.scrollTop + bounds.top - viewport.top - 85, behavior: 'instant' })
    }
  }, [focusRevision, mode, currentId, fullMobileMap])
  return <>
    <section className="reading-desk" aria-label="Your reading route">
      <div className="current-reading"><div className="section-label"><BookOpen size={17} /><h2>{readIds.has(currentId) ? 'Last finished' : 'Reading now'}</h2></div><button className="book-heading" onClick={() => revealBook(bookById[currentId])}>{bookById[currentId].title}</button><p>{arcMeta[bookById[currentId].arc].label}</p><button className="text-action" onClick={() => onRead(currentId)}>{readIds.has(currentId) ? <RotateCcw size={15} /> : <Check size={15} />}{readIds.has(currentId) ? 'Mark unread' : 'Mark finished'}</button></div>
      <div className="next-reading"><div className="section-label"><ArrowRight size={17} /><h2>Read next</h2></div>{recommended ? <><button className="book-heading" onClick={() => revealBook(recommended.book)}>{recommended.book.title}</button><p>{recommended.explanation}</p><div className="next-actions"><button className="primary-action" onClick={() => { onCurrent(recommended.book.id); revealBook(recommended.book) }}>Start reading <ArrowRight size={16} /></button><button className="text-action" onClick={() => { if (mode === 'list') setMode('lanes'); setFullMobileMap(true); revealBook(recommended.book, false); requestAnimationFrame(() => mapRef.current?.scrollIntoView({ block: 'center' })) }}>Show on map</button></div></> : <><h3>Every book finished.</h3><p>Explore the map to revisit a favourite.</p></>}</div>
      {recommendations.length > 1 && <div className="other-routes"><h2>Other routes</h2>{recommendations.slice(1).map((item) => <button key={item.book.id} onClick={() => revealBook(item.book)}>{item.book.title}<ArrowRight size={15} /></button>)}</div>}
    </section>
    <div className="explore-heading"><div><h1>The story atlas<span>.</span></h1><p>Follow a story. Find where it connects.</p></div><button className="text-action" onClick={() => revealBook(bookById[currentId])}><Target size={16} />Return to my book</button></div>
    <div className="atlas-toolbar">
      <label className="search-field"><Search size={17} /><input aria-label="Search books or legions" placeholder="Find a book or legion" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button className="icon-button" aria-label="Clear search" onClick={() => setSearch('')}><X size={16} /></button>}</label>
      <label className="select-field"><span>Story arc</span><select aria-label="Story arc" value={arcFilter} onChange={(event) => setArcFilter(event.target.value as ArcId | 'all')}><option value="all">All story arcs</option>{Object.entries(arcMeta).map(([id, meta]) => <option key={id} value={id}>{meta.label}</option>)}</select></label>
      <label className="route-checkbox"><input type="checkbox" checked={routeOnly} onChange={(event) => setRouteOnly(event.target.checked)} />My onward route</label>
      <label className="select-field view-select"><span>View</span><select aria-label="View" value={mode} onChange={(event) => setMode(event.target.value as MapMode | 'list')}><option value="lanes">Arc lanes</option><option value="reference">Reference flow</option><option value="tactical">Campaign map</option><option value="list">Book list</option></select></label>
    </div>
    <div className="atlas-workspace"><section className="atlas-main" aria-label="Reading map"><div className="map-meta"><span>{visibleBooks.length} books · {arcFilter === 'all' ? `${new Set(visibleBooks.map((book) => book.arc)).size} story arcs` : arcMeta[arcFilter].label}</span><details className="map-key"><summary>How to read the map</summary><div><p><b>Arrow:</b> a reading direction.</p><p><b>Bold line:</b> direct continuation.</p><p><b>Dashed line:</b> related or optional; no required order.</p><p>Select a book to highlight its connections. Scroll inside the map to explore. Use Book list for a linear view.</p></div></details></div>
      {visibleBooks.length === 0 ? <div className="empty-state"><h2>No books found</h2><p>Try another title, or clear the filters.</p><button className="quiet-action" onClick={() => { setSearch(''); setArcFilter('all'); setRouteOnly(false) }}>Clear filters</button></div> : <>
        <button ref={mobileMapToggleRef} className="mobile-map-toggle text-action" aria-expanded={fullMobileMap} onClick={() => { if (mode === 'list') setMode('lanes'); setFullMobileMap(!fullMobileMap) }}>{fullMobileMap ? <List size={17} /> : <Map size={17} />}{fullMobileMap ? 'Show book list' : 'Explore full map'}</button>
        {mode !== 'list' && <div ref={mapRef} className={`atlas-map ${fullMobileMap ? 'mobile-expanded' : ''}`}><button ref={mapCloseRef} className="map-fullscreen-close quiet-action" onClick={closeFullMobileMap}><List size={17} />Show book list</button>{mode === 'tactical' ? <MapCanvas focusRevision={focusRevision} selectedId={selectedId} currentId={currentId} readIds={readIds} visibleBooks={visibleBooks} routeIds={routeIds} recommendedIds={new Set(recommendations.map((item) => item.book.id))} onSelect={selectAndShowNotes} /> : <FlowMapCanvas mode={mode} selectedId={selectedId} currentId={currentId} readIds={readIds} visibleBooks={visibleBooks} recommendedIds={new Set(recommendations.map((item) => item.book.id))} onSelect={selectAndShowNotes} />}</div>}
        <div className={`${mode === 'list' ? 'list-view' : 'mobile-book-list'} ${fullMobileMap ? 'mobile-hidden' : ''}`}><BookList items={visibleBooks} selectedId={selectedId} onSelect={selectAndShowNotes} {...actions} /></div>
      </>}
      <div className="map-caption"><span><span className="status-sample selected" />Selected</span><span><BookOpen size={13} />Reading</span><span><Check size={13} />Finished</span><span className="caption-note">Select a book to read its notes.</span></div>
    </section>{notesOpen && <BookNotes book={bookById[selectedId]} onSelect={revealBook} onClose={closeNotes} {...actions} />}</div>
  </>
}

function Collection({ view, selectedId, onSelect, ...actions }: BookActions & { view: 'atlas' | 'library'; selectedId: string; onSelect: (book: Book) => void }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)
  const notesTrigger = useRef<HTMLElement | null>(null)
  const selectAndShowNotes = (book: Book) => {
    onSelect(book)
    if (!(document.activeElement as HTMLElement)?.closest('#book-notes')) notesTrigger.current = document.activeElement as HTMLElement
    setNotesOpen(true)
    requestAnimationFrame(() => document.getElementById('book-notes')?.focus())
  }
  const closeNotes = () => { setNotesOpen(false); requestAnimationFrame(() => notesTrigger.current?.focus()) }
  useEffect(() => {
    if (!notesOpen) return
    const onEscape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') closeNotes() }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [notesOpen])
  const items = books.filter((book) => (!query || `${book.title} ${book.faction}`.toLowerCase().includes(query.toLowerCase())) && (filter === 'all' || actions.readIds.has(book.id) === (filter === 'finished')))
  return <><div className="collection-heading"><h1>{view === 'atlas' ? 'Stories within the story.' : 'Your reading library.'}</h1><p>{view === 'atlas' ? 'Browse the nine story arcs. Each book has one primary grouping in this guide.' : `${actions.readIds.size} of ${books.length} books finished. Your progress stays in this browser.`}</p></div>
    <div className="atlas-toolbar"><label className="search-field"><Search size={17} /><input aria-label="Search collection" placeholder="Find a book or legion" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="select-field"><span>Status</span><select aria-label="Reading status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All books</option><option value="finished">Finished</option><option value="unread">Unread</option></select></label></div>
    <div className="atlas-workspace"><section className="collection-books">{items.length === 0 ? <div className="empty-state"><h2>No books here yet</h2><p>Change the status filter or search to see more books.</p><button className="quiet-action" onClick={() => { setQuery(''); setFilter('all') }}>Show all books</button></div> : view === 'library' ? <BookList items={items} selectedId={selectedId} onSelect={selectAndShowNotes} {...actions} /> : Object.entries(arcMeta).map(([id, meta]) => { const arcBooks = items.filter((book) => book.arc === id); return arcBooks.length > 0 && <section className="arc-section" key={id}><div className="arc-heading"><h2>{meta.label}</h2><span>{arcBooks.filter((book) => actions.readIds.has(book.id)).length}/{arcBooks.length} finished</span></div><BookList items={arcBooks} selectedId={selectedId} onSelect={selectAndShowNotes} {...actions} /></section> })}</section>{notesOpen && <BookNotes book={bookById[selectedId]} onSelect={selectAndShowNotes} onClose={closeNotes} {...actions} />}</div>
  </>
}

export function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [view, setView] = useState<View>('map')
  const [selectedId, setSelectedId] = useState(progress.currentId)
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [undo, setUndo] = useState<Progress | null>(null)
  const readIds = useMemo(() => new Set(progress.readIds), [progress.readIds])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setStorageError(false) } catch { setStorageError(true) } }, [progress])
  const onRead = (id: string) => { setUndo(progress); setProgress(toggleFinished(progress, id)); setNotice(`${bookById[id].title} marked ${readIds.has(id) ? 'unread' : 'finished'}.`) }
  const onCurrent = (id: string) => { setUndo(progress); setProgress({ ...progress, currentId: id }); setSelectedId(id); setNotice(`Now reading ${bookById[id].title}.`) }
  const onSelect = (book: Book) => { setSelectedId(book.id); setNotice(`Book notes: ${book.title}.`) }
  const exportRoute = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'heresy-pathfinder-route.json'; anchor.click(); URL.revokeObjectURL(url); setNotice('Reading progress exported.') }
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a><header className="topbar"><button className="brand-lockup" onClick={() => setView('map')} aria-label="Pathfinder home"><BookOpen size={25} strokeWidth={1.3} /><span>Pathfinder<small>A Horus Heresy reading companion</small></span></button><nav className="primary-nav" aria-label="Primary navigation">{([['map', 'Explore'], ['atlas', 'Story arcs'], ['library', 'My library']] as const).map(([id, label]) => <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{label}</button>)}</nav><div className="header-progress"><span>{readIds.size} / {books.length} finished</span><progress aria-label="Books finished" value={readIds.size} max={books.length} /></div></header>
    <main id="main">{storageError && <div className="storage-error" role="alert">Your browser could not save progress. Keep this page open and <button onClick={exportRoute}>export your progress</button>.</div>}{view === 'map' ? <Explore selectedId={selectedId} onSelect={onSelect} currentId={progress.currentId} readIds={readIds} onRead={onRead} onCurrent={onCurrent} /> : <Collection key={view} view={view} selectedId={selectedId} onSelect={onSelect} currentId={progress.currentId} readIds={readIds} onRead={onRead} onCurrent={onCurrent} />}
      <div className="notice-bar"><span role="status" aria-live="polite">{notice || 'Progress is saved on this device.'}</span>{undo && <button className="text-action" onClick={() => { setProgress(undo); setUndo(null); setNotice('Last progress change undone.') }}>Undo</button>}</div>
      {view === 'library' && <div className="library-tools"><button className="quiet-action" onClick={exportRoute}><Download size={16} />Export progress</button>{confirmReset ? <div className="reset-confirm"><span>Clear all reading progress?</span><button className="quiet-action" onClick={() => { setUndo(progress); setProgress({ readIds: [], currentId: 'horus-rising' }); setSelectedId('horus-rising'); setConfirmReset(false); setNotice('Progress cleared. You can undo this change.') }}>Clear progress</button><button className="text-action" onClick={() => setConfirmReset(false)}>Cancel</button></div> : <button className="text-action" onClick={() => setConfirmReset(true)}>Reset progress</button>}</div>}
    </main><footer className="site-footer"><span>Pathfinder <span className="footer-divider">/</span> A curated, unofficial guide</span><div><a href="https://www.kylebb.com/HH/HHSeriesOrder.svg" target="_blank" rel="noreferrer">Reference flowchart <ArrowUpRight size={13} /></a><a href="https://gaming.kylebb.com/hhtimeline/" target="_blank" rel="noreferrer">Reading timeline <ArrowUpRight size={13} /></a></div></footer></div>
}
