import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type WheelEvent } from 'react'
import {
  ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, Compass, Download, Filter, LibraryBig,
  Map, Minus, Plus, RotateCcw, Search, Shield, SlidersHorizontal, Sparkles, Target, X,
} from 'lucide-react'
import { arcMeta, bookById, books, connections, type ArcId, type Book, type Connection } from './data'
import { getReachableBookIds, getRecommendations, type Recommendation } from './logic'

type View = 'map' | 'atlas' | 'library'
type MapMode = 'reference' | 'lanes' | 'tactical'
type Progress = { readIds: string[]; currentId: string }

const STORAGE_KEY = 'heresy-pathfinder-progress'
const NODE_WIDTH = 180
const NODE_HEIGHT = 74
const MAP_WIDTH = 1680
const MAP_HEIGHT = 1500
const FLOW_NODE_WIDTH = 154
const FLOW_NODE_HEIGHT = 70
const FLOW_EDGE_GAP = 8
const FLOW_EDGE_FAN = 18
const FLOW_EDGE_CURVE_THRESHOLD = 96
const knownBookIds = new Set(books.map((book) => book.id))

type FlowPosition = { x: number; y: number }
const FLOW_LEFT = 188
const FLOW_X_STEP = 190
const FLOW_TOP = 100
const FLOW_ROW_GAP = 170

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

function IconButton({ label, onClick, children, disabled = false }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>
}

function StatusMark({ book, readIds, currentId }: { book: Book; readIds: Set<string>; currentId: string }) {
  if (readIds.has(book.id)) return <g className="status-mark read" transform={`translate(${NODE_WIDTH - 23} ${NODE_HEIGHT - 23})`} aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M -3 0 L -1 2.5 L 3 -2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>
  if (currentId === book.id) return <g className="status-mark current" transform={`translate(${NODE_WIDTH - 23} ${NODE_HEIGHT - 23})`} aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle r="2.1" fill="currentColor" /></g>
  return null
}

function BookNode({ book, selected, readIds, currentId, recommended, onSelect }: { book: Book; selected: boolean; readIds: Set<string>; currentId: string; recommended: boolean; onSelect: (book: Book) => void }) {
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
      className={`map-node ${status} ${selected ? 'selected' : ''}`}
      transform={`translate(${book.x} ${book.y})`}
      role="button"
      tabIndex={0}
      aria-label={`${book.title}, ${readIds.has(book.id) ? 'read' : currentId === book.id ? 'current book' : 'unread'}`}
      onClick={() => onSelect(book)}
      onKeyDown={onKeyDown}
    >
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
  selectedId, currentId, readIds, visibleBooks, routeIds, recommendedIds, onSelect,
}: {
  selectedId: string | null
  currentId: string
  readIds: Set<string>
  visibleBooks: Book[]
  routeIds: Set<string>
  recommendedIds: Set<string>
  onSelect: (book: Book) => void
}) {
  const [zoom, setZoom] = useState(0.74)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const visibleIds = new Set(visibleBooks.map((book) => book.id))
  const visibleConnections = connections.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    setPan({ x: drag.current.panX + event.clientX - drag.current.x, y: drag.current.panY + event.clientY - drag.current.y })
  }
  const stopDrag = () => { drag.current = null }
  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    setZoom((value) => Math.min(1.35, Math.max(0.48, value + (event.deltaY > 0 ? -0.05 : 0.05))))
  }

  return (
    <div className="map-canvas-shell">
      <svg
        className="map-canvas"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="map-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(117, 151, 144, 0.08)" strokeWidth="1" />
            <circle cx="1" cy="1" r="1.2" fill="rgba(117, 151, 144, 0.14)" />
          </pattern>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#526660" />
          </marker>
          <marker id="arrowhead-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#55b8b0" />
          </marker>
        </defs>
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0d1415" />
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#map-grid)" />
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          <text className="map-axis-label" x="70" y="45">THE CAMPAIGN MAP / SELECT A NODE TO INSPECT</text>
          <line className="map-axis" x1="70" y1="62" x2="1170" y2="62" />
          {visibleConnections.map((edge) => {
            const from = bookById[edge.from]
            const to = bookById[edge.to]
            const active = routeIds.has(edge.from) || routeIds.has(edge.to) || (edge.from === currentId)
            return <path key={`${edge.from}-${edge.to}`} className={`map-edge ${active ? 'active' : ''} ${edge.kind}`} d={edgePath(from, to)} markerEnd={isDirectionalConnection(edge.kind) ? `url(#${active ? 'arrowhead-active' : 'arrowhead'})` : undefined} />
          })}
          {visibleBooks.map((book) => <BookNode key={book.id} book={book} selected={selectedId === book.id} readIds={readIds} currentId={currentId} recommended={recommendedIds.has(book.id)} onSelect={onSelect} />)}
        </g>
      </svg>
      <div className="map-controls" aria-label="Map controls">
        <IconButton label="Zoom out" onClick={() => setZoom((value) => Math.max(0.48, value - 0.08))}><Minus size={16} /></IconButton>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <IconButton label="Zoom in" onClick={() => setZoom((value) => Math.min(1.35, value + 0.08))}><Plus size={16} /></IconButton>
        <span className="control-rule" />
        <IconButton label="Reset map position" onClick={() => { setZoom(0.74); setPan({ x: 0, y: 0 }) }}><RotateCcw size={15} /></IconButton>
      </div>
      <div className="map-hint"><span className="drag-dot" /> Drag the map to scan the route</div>
      <div className="map-accessible-list" aria-label="Books in the campaign map">
        <h2 className="sr-only">Campaign books</h2>
        <p className="sr-only">Use this keyboard-accessible list to inspect a book without navigating the visual map.</p>
        <ol>
          {visibleBooks.map((book) => {
            const status = readIds.has(book.id) ? 'read' : currentId === book.id ? 'current book' : recommendedIds.has(book.id) ? 'recommended next' : 'unread'
            return <li key={book.id}><button type="button" onClick={() => onSelect(book)}>{book.title} — {status}</button></li>
          })}
        </ol>
      </div>
    </div>
  )
}

function centredOffset(index: number, count: number, spacing: number) {
  return (index - (count - 1) / 2) * spacing
}

type FlowEdgeRoute = {
  sourceOffset: number
  targetOffset: number
  channelOffset: number
}

function flowEdgePath(from: FlowPosition, to: FlowPosition, route: FlowEdgeRoute) {
  if (from.y !== to.y) {
    const movesDown = to.y > from.y
    const direction = movesDown ? 1 : -1
    const startX = from.x + FLOW_NODE_WIDTH / 2 + route.sourceOffset
    const endX = to.x + FLOW_NODE_WIDTH / 2 + route.targetOffset
    const startY = movesDown ? from.y + FLOW_NODE_HEIGHT + FLOW_EDGE_GAP : from.y - FLOW_EDGE_GAP
    const endY = movesDown ? to.y - FLOW_EDGE_GAP : to.y + FLOW_NODE_HEIGHT + FLOW_EDGE_GAP
    const channelY = startY + (endY - startY) * 0.5 + route.channelOffset
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

function FlowBookNode({ book, position, mode, selected, readIds, currentId, recommended, onSelect }: {
  book: Book
  position: FlowPosition
  mode: Exclude<MapMode, 'tactical'>
  selected: boolean
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
      className={`flow-node ${mode} arc-${book.arc} ${status} ${selected ? 'selected' : ''}`}
      style={{ '--flow-accent': book.accent } as CSSProperties}
      transform={`translate(${position.x} ${position.y})`}
      role="button"
      tabIndex={0}
      aria-label={`${book.title}, ${readIds.has(book.id) ? 'read' : currentId === book.id ? 'current book' : 'unread'}`}
      onClick={() => onSelect(book)}
      onKeyDown={onKeyDown}
    >
      <rect className="flow-node-plate" width={FLOW_NODE_WIDTH} height={FLOW_NODE_HEIGHT} rx={mode === 'reference' ? 5 : 9} />
      <rect className="flow-node-accent" width="5" height={FLOW_NODE_HEIGHT} rx="2" />
      <text className="flow-node-faction" x="14" y="17">{book.faction.toUpperCase()}</text>
      {titleLines.map((line, index) => <text className="flow-node-title" key={line} x="14" y={39 + index * 13}>{line}</text>)}
      <text className="flow-node-meta" x="14" y="62">{book.kind} {book.seriesNumber ? `· ${String(book.seriesNumber).padStart(2, '0')}` : ''}</text>
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
  const visibleIds = new Set(visibleBooks.map((book) => book.id))
  const visibleConnections = connections.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
  const sameRowOutgoing = new globalThis.Map<string, string[]>()
  const sameRowIncoming = new globalThis.Map<string, string[]>()
  const crossLaneOutgoing = new globalThis.Map<string, string[]>()
  const crossLaneIncoming = new globalThis.Map<string, string[]>()
  visibleConnections.forEach((edge) => {
    const sameRow = positions[edge.from]?.y === positions[edge.to]?.y
    const outgoing = sameRow ? sameRowOutgoing : crossLaneOutgoing
    const incoming = sameRow ? sameRowIncoming : crossLaneIncoming
    outgoing.set(edge.from, [...(outgoing.get(edge.from) || []), edge.to])
    incoming.set(edge.to, [...(incoming.get(edge.to) || []), edge.from])
  })
  const edgeRoutes = new globalThis.Map<string, FlowEdgeRoute>(visibleConnections.map((edge, index) => {
    const sameRow = positions[edge.from]?.y === positions[edge.to]?.y
    const outgoing = sameRow ? sameRowOutgoing : crossLaneOutgoing
    const incoming = sameRow ? sameRowIncoming : crossLaneIncoming
    const sourceTargets = outgoing.get(edge.from) || []
    const targetSources = incoming.get(edge.to) || []
    const sourceOffset = sameRow && isDirectionalConnection(edge.kind)
      ? 0
      : centredOffset(sourceTargets.indexOf(edge.to), sourceTargets.length, FLOW_EDGE_FAN)
    const targetOffset = sameRow && isDirectionalConnection(edge.kind)
      ? 0
      : centredOffset(targetSources.indexOf(edge.from), targetSources.length, FLOW_EDGE_FAN)
    return [`${edge.from}:${edge.to}`, {
      sourceOffset,
      targetOffset,
      channelOffset: sourceOffset + targetOffset * 0.7 + (index % 3 - 1) * 4,
    }] as const
  }))
  return (
    <div className={`flow-canvas-shell flow-${mode}`}>
      <div className="flow-canvas-key" role="note" aria-label="Connection key"><span className="flow-key-direction">Solid arrows end at the destination</span><span className="flow-key-item"><span className="connection-key-line solid" />Solid direct / suggested</span><span className="flow-key-item"><span className="connection-key-line dashed" />Dashed related / no order</span></div>
      <svg className="flow-canvas" style={{ width: `${flowWidth}px`, height: `${flowHeight}px` }} viewBox={`0 0 ${flowWidth} ${flowHeight}`} aria-hidden="true">
        <defs>
          <marker id={`flow-arrow-${mode}`} markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 Z" />
          </marker>
        </defs>
        <rect className="flow-surface" width={flowWidth} height={flowHeight} />
        {mode === 'reference' ? (
          <g className="flow-reference-guides">
            <text className="flow-title" x="45" y="33">HORUS HERESY / READING ORDER</text>
            <text className="flow-direction" x={flowWidth - 35} y="33">ARROWHEADS DEFINE DIRECTION</text>
            {Array.from({ length: Math.ceil(flowWidth / 380) - 1 }, (_, index) => <line key={index} x1={380 + index * 380} y1="55" x2={380 + index * 380} y2={flowHeight - 55} />)}
            <line x1="28" y1="55" x2={flowWidth - 28} y2="55" />
            {rows.map((row) => <g key={row.id}><line x1="28" y1={row.y + 58} x2={flowWidth - 28} y2={row.y + 58} /><text className="flow-column-label" x="38" y={row.y - 43}>{row.label}</text></g>)}
          </g>
        ) : (
          <g className="flow-lane-guides">
            <text className="flow-title" x="28" y="33">ARC LANES / STORY ARCS</text>
            <text className="flow-direction" x={flowWidth - 35} y="33">ARROWHEADS DEFINE DIRECTION</text>
            {rows.map((row) => <g key={row.id}><rect className="flow-lane-band" x="20" y={row.y - 58} width={flowWidth - 40} height="116" rx="5" style={{ '--lane-colour': row.colour } as CSSProperties} /><line className="flow-lane-rule" x1={FLOW_LEFT - 20} y1={row.y} x2={flowWidth - 30} y2={row.y} /><text className="flow-lane-label" x="38" y={row.y - 13}>{row.label}</text><text className="flow-lane-sub" x="38" y={row.y + 8}>{row.id === 'opening' ? 'ENTRY ROUTE' : row.id === 'siege' ? 'FINAL APPROACH' : 'BRANCH'}</text></g>)}
          </g>
        )}
        <g className="flow-edges">
          {visibleConnections.map((edge) => {
            const from = positions[edge.from]
            const to = positions[edge.to]
            if (!from || !to) return null
            const active = edge.from === currentId || edge.to === currentId || edge.from === selectedId || edge.to === selectedId
            return <path key={`${edge.from}-${edge.to}`} className={`flow-edge ${active ? 'active' : ''} ${edge.kind}`} d={flowEdgePath(from, to, edgeRoutes.get(`${edge.from}:${edge.to}`) || { sourceOffset: 0, targetOffset: 0, channelOffset: 0 })} markerEnd={isDirectionalConnection(edge.kind) ? `url(#flow-arrow-${mode})` : undefined} />
          })}
        </g>
        <g className="flow-nodes">
          {visibleBooks.map((book) => <FlowBookNode key={book.id} book={book} position={positions[book.id] || { x: 20, y: 20 }} mode={mode} selected={selectedId === book.id} readIds={readIds} currentId={currentId} recommended={recommendedIds.has(book.id)} onSelect={onSelect} />)}
        </g>
      </svg>
      <div className="flow-canvas-note">{mode === 'reference' ? 'Solid arrows enter the destination card; dashed lines show related books without order.' : 'Solid cross-lane arrows enter the destination; dashed lines show related books without order.'}</div>
      <div className="map-accessible-list" aria-label="Books in the campaign map">
        <h2 className="sr-only">Campaign books</h2>
        <p className="sr-only">Use this keyboard-accessible list to inspect a book without navigating the visual map.</p>
        <ol>
          {visibleBooks.map((book) => {
            const status = readIds.has(book.id) ? 'read' : currentId === book.id ? 'current book' : recommendedIds.has(book.id) ? 'recommended next' : 'unread'
            return <li key={book.id}><button type="button" onClick={() => onSelect(book)}>{book.title} — {status}</button></li>
          })}
        </ol>
      </div>
    </div>
  )
}

function RecommendationPanel({ recommendation, recommendations, onSelect, onRead, onCurrent }: { recommendation: Recommendation | undefined; recommendations: Recommendation[]; onSelect: (book: Book) => void; onRead: (id: string) => void; onCurrent: (id: string) => void }) {
  if (!recommendation) return <div className="empty-panel"><Sparkles size={20} /><strong>Route complete</strong><p>You have cleared this branch. Choose another node on the map to continue.</p></div>
  const book = recommendation.book
  return (
    <div className="recommend-panel">
      <div className="panel-title-row"><span className="panel-kicker"><Sparkles size={13} /> NEXT MOVE</span><span className="confidence">ROUTE FIT {recommendation.score}%</span></div>
      <button className="recommendation-title" type="button" onClick={() => onSelect(book)}>
        <span>{book.title}</span><ArrowUpRight size={17} />
      </button>
      <p className="recommendation-why">{recommendation.explanation}</p>
      <div className="recommendation-meta"><span className="pauldron-chip" style={{ '--chip-colour': book.accent } as CSSProperties}>{book.faction}</span><span>{arcMeta[book.arc].label}</span></div>
      <div className="recommendation-actions"><button className="primary-action" type="button" onClick={() => onRead(book.id)}><Check size={15} /> Mark read</button><button className="quiet-action" type="button" onClick={() => onCurrent(book.id)}>Set current</button></div>
      {recommendations.length > 1 && <div className="alternatives"><span className="alternative-label">ALTERNATIVES</span>{recommendations.slice(1).map((item) => <button key={item.book.id} type="button" onClick={() => onSelect(item.book)}><span>{item.book.shortTitle}</span><ChevronRight size={14} /></button>)}</div>}
    </div>
  )
}

function BookDetail({ book, readIds, currentId, onClose, onRead, onCurrent }: { book: Book; readIds: Set<string>; currentId: string; onClose: () => void; onRead: (id: string) => void; onCurrent: (id: string) => void }) {
  const isRead = readIds.has(book.id)
  const isCurrent = currentId === book.id
  return (
    <div className="detail-panel">
      <div className="detail-topline"><span className="panel-kicker"><BookOpen size={13} /> BOOK DOSSIER</span><button className="close-button" type="button" aria-label="Close book dossier" onClick={onClose}><X size={18} /></button></div>
      <div className="detail-pauldron" style={{ '--pauldron-colour': book.accent } as CSSProperties}><Shield size={28} strokeWidth={1.4} /><span>{book.faction}</span></div>
      <h2>{book.title}</h2>
      <div className="detail-meta"><span>{book.kind}</span><span>{book.seriesNumber ? `Book ${book.seriesNumber}` : 'Unnumbered'}</span><span>{arcMeta[book.arc].label}</span></div>
      <p className="detail-summary">{book.summary}</p>
      <div className="reason-box"><span>WHY IT IS HERE</span><p>{book.reason}</p></div>
      <div className="detail-state"><span className={`state-dot ${isRead ? 'read' : isCurrent ? 'current' : ''}`} /> {isRead ? 'Read' : isCurrent ? 'Current book' : 'Unread'}<span className="detail-spoiler">Spoiler level: {book.spoilerLevel}</span></div>
      <div className="detail-actions"><button className="primary-action" type="button" onClick={() => onRead(book.id)}>{isRead ? <RotateCcw size={15} /> : <Check size={15} />}{isRead ? 'Mark unread' : 'Mark read'}</button><button className="quiet-action" type="button" onClick={() => onCurrent(book.id)} disabled={isCurrent}>{isCurrent ? 'Current book' : 'Set as current'}</button></div>
      <div className="source-note"><CircleHelp size={15} /><span>Curated core catalogue based on the reference flowchart. Arc membership is a navigational aid, not a claim of one official order.</span></div>
    </div>
  )
}

function MapView({ mode, onModeChange, currentId, selectedId, readIds, search, arcFilter, routeOnly, onSelect, onSearch, onArcFilter, onRouteOnly, onRead, onCurrent }: {
  mode: MapMode; onModeChange: (mode: MapMode) => void; currentId: string; selectedId: string | null; readIds: Set<string>; search: string; arcFilter: ArcId | 'all'; routeOnly: boolean; onSelect: (book: Book | null) => void; onSearch: (value: string) => void; onArcFilter: (value: ArcId | 'all') => void; onRouteOnly: (value: boolean) => void; onRead: (id: string) => void; onCurrent: (id: string) => void
}) {
  const recommendations = useMemo(() => getRecommendations(currentId, readIds), [currentId, readIds])
  const routeIds = useMemo(() => getReachableBookIds(currentId, readIds), [currentId, readIds])
  const recommendedIds = new Set(recommendations.map((item) => item.book.id))
  const visibleBooks = books.filter((book) => {
    const matchesSearch = !search || `${book.title} ${book.faction} ${arcMeta[book.arc].label}`.toLowerCase().includes(search.toLowerCase())
    const matchesArc = arcFilter === 'all' || book.arc === arcFilter
    const matchesRoute = !routeOnly || routeIds.has(book.id) || book.id === currentId || readIds.has(book.id)
    return matchesSearch && matchesArc && matchesRoute
  })
  const selected = selectedId ? bookById[selectedId] : undefined
  return (
    <>
      <div className="map-mode-picker" role="group" aria-label="Map display options">
        <div className="mode-picker-copy"><strong>Try a different map grammar</strong><span>Same route data. Three ways to read the branching.</span></div>
        <div className="mode-options">
          <button className={mode === 'reference' ? 'active' : ''} type="button" onClick={() => onModeChange('reference')}><span>Reference flow</span><small>orthogonal · dense</small></button>
          <button className={mode === 'lanes' ? 'active' : ''} type="button" onClick={() => onModeChange('lanes')}><span>Arc lanes</span><small>grouped · legible</small></button>
          <button className={mode === 'tactical' ? 'active' : ''} type="button" onClick={() => onModeChange('tactical')}><span>Campaign map</span><small>spatial · current</small></button>
        </div>
      </div>
      <div className={`map-layout map-mode-${mode}`}>
      <aside className="route-rail">
        <div className="rail-heading"><div><span className="panel-kicker">ROUTE CONTROL</span><h2>Campaign map</h2></div><SlidersHorizontal size={18} /></div>
        <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search books or legions" aria-label="Search books or legions" />{search && <button type="button" onClick={() => onSearch('')} aria-label="Clear search"><X size={14} /></button>}</label>
        <div className="filter-section"><div className="filter-heading"><span><Filter size={14} /> Story arcs</span><span>{visibleBooks.length}/{books.length}</span></div><div className="arc-list"><button className={`arc-filter ${arcFilter === 'all' ? 'active' : ''}`} type="button" onClick={() => onArcFilter('all')}><span className="arc-swatch all" />All routes</button>{Object.entries(arcMeta).map(([id, meta]) => <button key={id} className={`arc-filter ${arcFilter === id ? 'active' : ''}`} type="button" onClick={() => onArcFilter(id as ArcId)}><span className="arc-swatch" style={{ background: meta.colour }} />{meta.label}</button>)}</div></div>
        <label className="toggle-row"><span><Compass size={15} />Show reachable route</span><input type="checkbox" checked={routeOnly} onChange={(event) => onRouteOnly(event.target.checked)} /><span className="toggle-track" /></label>
        <div className="rail-note"><Target size={15} /><p><strong>Current position</strong><br />{bookById[currentId].title}</p></div>
        <div className="legend"><span className="panel-kicker">STATUS LEGEND</span><div><span className="legend-dot current" />Current</div><div><span className="legend-dot read" />Read</div><div><span className="legend-dot next" />Recommended next</div></div>
        <div className="connection-key"><span className="panel-kicker">CONNECTION KEY</span><div className="connection-key-item"><span className="connection-key-line solid" /><span><strong>Solid arrow</strong><small>direct continuation / suggested route</small></span></div><div className="connection-key-item"><span className="connection-key-line dashed" /><span><strong>Dashed line</strong><small>parallel or optional relationship · no reading order</small></span></div><p>Only solid arrows define a direction. The arrowhead marks the destination; dashed lines show related books you may choose to explore.</p></div>
      </aside>
      <section className="map-stage">{mode === 'tactical' ? <MapCanvas selectedId={selectedId} currentId={currentId} readIds={readIds} visibleBooks={visibleBooks} routeIds={routeIds} recommendedIds={recommendedIds} onSelect={onSelect} /> : <FlowMapCanvas key={mode} mode={mode} selectedId={selectedId} currentId={currentId} readIds={readIds} visibleBooks={visibleBooks} recommendedIds={recommendedIds} onSelect={onSelect} />}<div className="map-footer"><span><span className="footer-line teal" />Suggested route</span><span><span className="footer-line" />Parallel / optional</span><span className="footer-note">{mode === 'tactical' ? 'Solid arrows mark the destination · dashed lines show related books · drag to pan · scroll to zoom' : 'Solid arrows mark the destination · dashed lines show related books · select a book to inspect'}</span></div></section>
      <aside className="inspector">
        {selected ? <BookDetail book={selected} readIds={readIds} currentId={currentId} onClose={() => onSelect(null)} onRead={onRead} onCurrent={onCurrent} /> : <RecommendationPanel recommendation={recommendations[0]} recommendations={recommendations} onSelect={onSelect} onRead={onRead} onCurrent={onCurrent} />}
        {!selected && <div className="inspector-divider"><span />YOUR ROUTE<span /></div>}
        {!selected && <div className="route-summary"><div className="route-summary-row"><span>Completed</span><strong>{readIds.size} <small>/ {books.length}</small></strong></div><div className="progress-track"><span style={{ width: `${Math.round((readIds.size / books.length) * 100)}%` }} /></div><p>{readIds.size === 0 ? 'Mark books read to make the route yours.' : 'Your path is taking shape. Keep moving through the branches.'}</p></div>}
      </aside>
      </div>
    </>
  )
}

function AtlasView({ readIds, currentId, onSelect }: { readIds: Set<string>; currentId: string; onSelect: (book: Book) => void }) {
  return <div className="content-view atlas-view"><div className="content-heading"><div><span className="panel-kicker">ARC ATLAS</span><h1>Choose a campaign, then follow its pressure lines.</h1></div><p>These are navigational groupings, not hard boundaries. The same book can belong to several stories.</p></div>{Object.entries(arcMeta).map(([id, meta]) => { const arcBooks = books.filter((book) => book.arc === id); const readCount = arcBooks.filter((book) => readIds.has(book.id)).length; return <section className="atlas-section" key={id}><div className="atlas-heading"><span className="atlas-mark" style={{ background: meta.colour }} /><div><h2>{meta.label}</h2><p>{meta.blurb}</p></div><span className="atlas-progress">{readCount}/{arcBooks.length} read</span></div><div className="atlas-books">{arcBooks.map((book) => <button className={`atlas-book ${book.id === currentId ? 'current' : ''}`} type="button" key={book.id} onClick={() => onSelect(book)}><span className="atlas-book-status">{readIds.has(book.id) ? <Check size={13} /> : book.id === currentId ? <Target size={12} /> : <span />}</span><span className="atlas-book-title">{book.title}</span><span className="atlas-book-faction">{book.faction}</span><ChevronRight size={15} /></button>)}</div></section> })}</div>
}

function LibraryView({ readIds, currentId, onSelect, onRead, onCurrent, onReset }: { readIds: Set<string>; currentId: string; onSelect: (book: Book) => void; onRead: (id: string) => void; onCurrent: (id: string) => void; onReset: () => void }) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const filtered = books.filter((book) => filter === 'all' || (filter === 'read' ? readIds.has(book.id) : !readIds.has(book.id)))
  return <div className="content-view library-view"><div className="content-heading"><div><span className="panel-kicker">PERSONAL LOG</span><h1>The books you have carried through the war.</h1></div><div className="library-actions"><button className="quiet-action" type="button" onClick={() => { const payload = JSON.stringify({ readIds: [...readIds], currentId }, null, 2); const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'heresy-pathfinder-route.json'; anchor.click(); URL.revokeObjectURL(url) }}><Download size={14} /> Export route</button><button className="quiet-action danger" type="button" onClick={onReset}><RotateCcw size={14} /> Reset</button></div></div><div className="library-overview"><div><span>BOOKS READ</span><strong>{readIds.size}</strong><small>of {books.length} in this experiment</small></div><div><span>CURRENT BOOK</span><strong>{bookById[currentId].shortTitle}</strong><small>{bookById[currentId].faction}</small></div><div><span>ROUTE STATUS</span><strong>{Math.round((readIds.size / books.length) * 100)}%</strong><small>campaign mapped</small></div></div><div className="library-toolbar"><div className="segmented"><button className={filter === 'all' ? 'active' : ''} type="button" onClick={() => setFilter('all')}>All books</button><button className={filter === 'unread' ? 'active' : ''} type="button" onClick={() => setFilter('unread')}>Unread</button><button className={filter === 'read' ? 'active' : ''} type="button" onClick={() => setFilter('read')}>Read</button></div><span>{filtered.length} records</span></div><div className="library-list">{filtered.map((book) => <div className={`library-row ${book.id === currentId ? 'current' : ''}`} key={book.id}><div className="library-status"><span className={`status-dot ${readIds.has(book.id) ? 'read' : book.id === currentId ? 'current' : ''}`} /></div><button className="library-book" type="button" onClick={() => onSelect(book)}><strong>{book.title}</strong><span>{book.faction} · {arcMeta[book.arc].label}</span></button><span className="library-kind">{book.kind}</span><button className="row-action" type="button" onClick={() => readIds.has(book.id) ? onRead(book.id) : onCurrent(book.id)}>{readIds.has(book.id) ? 'Mark unread' : book.id === currentId ? 'Current' : 'Set current'}</button></div>)}</div></div>
}

export function App() {
  const initial = useMemo(loadProgress, [])
  const [view, setView] = useState<View>('map')
  const [mapMode, setMapMode] = useState<MapMode>('reference')
  const [readIdsArray, setReadIdsArray] = useState(initial.readIds)
  const [currentId, setCurrentId] = useState(initial.currentId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [arcFilter, setArcFilter] = useState<ArcId | 'all'>('all')
  const [routeOnly, setRouteOnly] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const readIds = useMemo(() => new Set(readIdsArray), [readIdsArray])
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ readIds: readIdsArray, currentId })) }, [readIdsArray, currentId])
  useEffect(() => {
    const selected = selectedId ? bookById[selectedId] : undefined
    if (selected) {
      setAnnouncement(`${selected.title} selected. ${readIds.has(selected.id) ? 'Read.' : currentId === selected.id ? 'Current book.' : 'Unread.'}`)
      return
    }
    const next = getRecommendations(currentId, readIds)[0]?.book
    setAnnouncement(next ? `Recommended next: ${next.title}.` : 'Route complete. Choose another node to continue.')
  }, [currentId, readIdsArray, selectedId, readIds])

  const toggleRead = (id: string) => {
    setReadIdsArray((ids) => {
      if (ids.includes(id)) return ids.filter((item) => item !== id)
      setCurrentId(id)
      return [...ids, id]
    })
  }
  const setCurrent = (id: string) => { setCurrentId(id); setSelectedId(id) }
  const selectBook = (book: Book | null) => setSelectedId(book?.id || null)
  const reset = () => { setReadIdsArray([]); setCurrentId('horus-rising'); setSelectedId(null) }

  return <div className="app-shell">
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    <header className="topbar"><button className="brand-lockup" type="button" onClick={() => { setView('map'); setSelectedId(null) }}><span className="brand-mark"><Shield size={17} /></span><span><strong>PATHFINDER</strong><small>HORUS HERESY READING MAP</small></span></button><nav className="primary-nav" aria-label="Primary navigation"><button className={view === 'map' ? 'active' : ''} type="button" onClick={() => setView('map')}><Map size={15} />Campaign map</button><button className={view === 'atlas' ? 'active' : ''} type="button" onClick={() => setView('atlas')}><LibraryBig size={15} />Arc atlas</button><button className={view === 'library' ? 'active' : ''} type="button" onClick={() => setView('library')}><BookOpen size={15} />My library</button></nav><div className="topbar-status"><span className="signal-dot" />LOCAL ROUTE<span className="topbar-count">{readIds.size}/{books.length}</span></div></header>
    <main>{view === 'map' ? <><section className="map-intro"><div><span className="panel-kicker"><Compass size={13} /> FIELD GUIDE / PERSONAL ROUTE</span><h1>Find the next book<br /><em>through the war.</em></h1></div><p>The Heresy is a branching campaign, not a queue. Mark where you are, then let the map show the pressure lines around it.</p></section><MapView mode={mapMode} onModeChange={setMapMode} currentId={currentId} selectedId={selectedId} readIds={readIds} search={search} arcFilter={arcFilter} routeOnly={routeOnly} onSelect={selectBook} onSearch={setSearch} onArcFilter={setArcFilter} onRouteOnly={setRouteOnly} onRead={toggleRead} onCurrent={setCurrent} /></> : view === 'atlas' ? <AtlasView readIds={readIds} currentId={currentId} onSelect={(book) => { setView('map'); setSelectedId(book.id) }} /> : <LibraryView readIds={readIds} currentId={currentId} onSelect={(book) => { setView('map'); setSelectedId(book.id) }} onRead={toggleRead} onCurrent={setCurrent} onReset={reset} />}</main>
    <footer className="site-footer"><span>CURATED EXPERIMENT / LOCAL-FIRST PROGRESS</span><span><a href="https://www.kylebb.com/HH/HHSeriesOrder.svg" target="_blank" rel="noreferrer">Reference flowchart <ArrowUpRight size={12} /></a><a href="https://gaming.kylebb.com/hhtimeline/" target="_blank" rel="noreferrer">Arc-driven timeline <ArrowUpRight size={12} /></a></span></footer>
  </div>
}
