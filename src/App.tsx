import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, BookOpen, Check, Download, Map, Minus, Plus, RotateCcw, Search, Target, X, ArrowRight, List, Crosshair, Info, Maximize, Minimize, SlidersHorizontal } from 'lucide-react'
import { bookById, books, referenceCollections, type Book, type Connection } from './data'
import { parseProgress, readingStatus, toggleFinished, type Progress } from './progress'
import { getConnections, getOptionBooks, getSequenceBookIds, isReference, readingOptions, referenceNodeByBookId, referencePositions, siegeBookIds, siegeBookNumbers, type ReadingOption } from './reading-options'
import { BookType, bookTypes } from './book-types'
import { getReachableBookIds, getNextSteps, getSiegeHandoff } from './logic'
import { FocusDialog, isMobileLayout, restoreFocus, useMobileLayout } from './focus'
import { getDirectionalBook, isMapDirection, revealMapBook, type MapRect } from './map-keyboard'
import { centreOnBook, fitMap, mapShowsBook, stepMapZoom, type MapCamera, type MapPosition } from './map-camera'
import { edgePath, getEdgeRoute, getConnectionFocus, layoutSourceFlow, NODE_WIDTH, NODE_HEIGHT } from './map-layout'

import { HiddenPaths, PathChoices, PathToggle, SiegeHandoff, SourcePathNotes } from './reading-decisions'

type View = 'map' | 'library'
type MapMode = 'map' | 'list'
type PathSurface = 'reading' | 'map' | 'expanded'
type MapReveal = { id: string; kind: 'path' | 'map' | 'notes' }

const STORAGE_KEY = 'heresy-pathfinder-progress'
const INITIAL_FOCUS_CAMERA: MapCamera = { focus: true }

function loadProgress(): Progress {
  try {
    return parseProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'))
  } catch {
    return parseProgress(null)
  }
}

function splitTitle(title: string) {
  const lines: string[] = ['']
  for (const word of title.split(' ')) {
    const last = lines.length - 1
    if (lines[last] && `${lines[last]} ${word}`.length > 27) lines.push(word)
    else lines[last] += `${lines[last] ? ' ' : ''}${word}`
  }
  return lines.length > 3 ? [...lines.slice(0, 2), `${lines[2].slice(0, 24)}…`] : lines
}

function getFocusedBookIds(edges: Connection[], focusId: string | null) {
  const ids = new Set<string>()
  if (!focusId) return ids
  ids.add(focusId)
  edges.forEach((edge) => {
    if (edge.from === focusId) {
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

function BookNode({ book, selected, active, zoom, dimmed, readIds, currentId, recommended, selectedDescription, onFocus, onKeyDown, onSelect }: {
  book: Book
  selected: boolean
  active: boolean
  zoom: number
  dimmed: boolean
  readIds: Set<string>
  currentId: string
  recommended: boolean
  selectedDescription: string
  onFocus: () => void
  onKeyDown: (event: KeyboardEvent<SVGGElement>) => void
  onSelect: () => void
}) {
  const titleLines = splitTitle(book.shortTitle)
  const colour = referenceNodeByBookId[book.id]
  const { label: typeLabel, Icon: TypeIcon } = bookTypes[book.kind]
  const status = readIds.has(book.id) ? 'read' : currentId === book.id ? 'current' : recommended ? 'recommended' : ''
  const ringGap = 6 / zoom
  return (
    <g
      className={`map-node ${status} ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}
      transform={`translate(${book.x} ${book.y})`}
      role="button"
      tabIndex={active ? 0 : -1}
      aria-describedby={selected ? selectedDescription : undefined}
      aria-label={`${book.title}, ${typeLabel}, ${readIds.has(book.id) ? 'finished' : currentId === book.id ? 'currently reading' : 'unread'}`}
      data-book-id={book.id}
      data-book-kind={book.kind}
      onClick={(event) => {
        if (event.detail === 0) event.currentTarget.focus({ preventScroll: true })
        onSelect()
      }}
      onFocus={onFocus}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.altKey && !event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          if (!event.repeat) onSelect()
        } else onKeyDown(event)
      }}
    >
      {selected && <rect className="node-focus-ring" x="-7" y="-7" width={NODE_WIDTH + 14} height={NODE_HEIGHT + 14} rx="15" />}
      <title>{`${book.title} · ${typeLabel}`}</title>
      {book.kind === 'novel' ? <rect className="node-plate" width={NODE_WIDTH} height={NODE_HEIGHT} rx="12" /> : <><path className="node-plate" d={`M 12 0 H ${NODE_WIDTH - 20} L ${NODE_WIDTH} 20 V ${NODE_HEIGHT - 12} Q ${NODE_WIDTH} ${NODE_HEIGHT} ${NODE_WIDTH - 12} ${NODE_HEIGHT} H 12 Q 0 ${NODE_HEIGHT} 0 ${NODE_HEIGHT - 12} V 12 Q 0 0 12 0 Z`} /><path className="node-fold" d={`M ${NODE_WIDTH - 20} 0 V 20 H ${NODE_WIDTH}`} /></>}
      {colour && <rect className="reference-colour-mark" x="16" y="6" width="12" height="12" fill={colour.fill} stroke={colour.stroke} aria-hidden="true" />}
      <text className="node-faction" x={colour ? 36 : 16} y="17">{book.faction ? book.faction.toUpperCase() : book.collectionNumber ? `IN BOOK ${book.collectionNumber}` : 'HORUS HERESY'}</text>
      {titleLines.map((line, index) => <text className="node-title" key={index} x="16" y={42 + index * 18}>{line}</text>)}
      <TypeIcon className="node-type-icon" x="16" y={NODE_HEIGHT - 22} width="13" height="13" strokeWidth={1.5} aria-hidden="true" />
      <text className="node-meta" x="35" y={NODE_HEIGHT - 11}>{typeLabel}{book.seriesNumber ? ` · ${String(book.seriesNumber).padStart(2, '0')}` : ''}</text>
      <StatusMark book={book} readIds={readIds} currentId={currentId} />
      {recommended && !readIds.has(book.id) && currentId !== book.id && <circle className="recommend-dot" cx={NODE_WIDTH - 31} cy={14} r="4" />}
      <rect className="node-keyboard-ring" x={-ringGap} y={-ringGap} width={NODE_WIDTH + 2 * ringGap} height={NODE_HEIGHT + 2 * ringGap}
        rx="14" vectorEffect="non-scaling-stroke" aria-hidden="true" />
    </g>
  )
}

function mapTransform({ x, y, zoom }: MapPosition) {
  return `translate(calc(50% + ${-x * zoom}px), calc(50% + ${-y * zoom}px)) scale(${zoom})`
}

function MapCanvas({
  selectedId, currentId, readIds, visibleBooks, highlightPaths, focusConnections, referenceLayout, recommendedIds,
  active, onSelect, camera, atlasAnchor, onCameraChange, connections, routeOnly,
  reveal, onRevealHandled, expanded, announcement, onDismissNotes,
}: {
  selectedId: string | null
  currentId: string
  readIds: Set<string>
  visibleBooks: Book[]
  highlightPaths: boolean
  focusConnections: boolean
  referenceLayout: boolean
  routeOnly: boolean
  active: boolean
  recommendedIds: Set<string>
  connections: Connection[]
  camera: MapCamera
  atlasAnchor: Book | undefined
  onCameraChange: (camera: MapCamera) => void
  onSelect: (book: Book, locate: boolean) => void
  reveal: MapReveal | null
  onRevealHandled: () => void
  expanded: boolean
  announcement: string
  onDismissNotes: () => void
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const worldRef = useRef<SVGGElement>(null)
  const hintId = useId()
  const selectionId = useId()
  const [keyboardBookId, setKeyboardBookId] = useState<string>()
  const pointerBook = useRef<string | null>(null)
  const hadRouteFilter = useRef(routeOnly)
  const [size, setSize] = useState({ width: 1000, height: 600 })
  const drag = useRef<{
    pointerId: number; x: number; y: number; camera: MapCamera; start: MapPosition; position?: MapPosition
  } | null>(null)
  const { placedById, visibleConnections, paths } = useMemo(() => {
    const placedById = Object.fromEntries(visibleBooks.map((book) => [book.id, book]))
    const visibleConnections = connections.filter((edge) => placedById[edge.from] && placedById[edge.to])
    const paths = visibleConnections.map((edge) => ({
      ...edge,
      path: edgePath(getEdgeRoute(placedById[edge.from], placedById[edge.to], visibleConnections, visibleBooks, referenceLayout)),
    }))
    return { placedById, visibleConnections, paths }
  }, [visibleBooks, connections, referenceLayout])
  const selected = selectedId ? placedById[selectedId] : undefined
  const fitted = useMemo(() => fitMap(visibleBooks, size, focusConnections ? 40 : 48), [visibleBooks, size, focusConnections])
  const anchor = 'bookId' in camera
    ? (focusConnections ? placedById[camera.bookId] : atlasAnchor)
    : selected
  const view = 'zoom' in camera
    ? camera
    : ('focus' in camera && fitted.zoom === 1) || !(anchor || visibleBooks[0])
      ? fitted
      : centreOnBook(anchor ?? visibleBooks[0])
  const { zoom } = view
  const focusId = highlightPaths ? selectedId : null
  const highlightedIds = getFocusedBookIds(visibleConnections, focusId)

  const tabStop = [keyboardBookId, selectedId, currentId].find((id) => id && placedById[id]) ?? visibleBooks[0]?.id
  const card = (id: string) => svgRef.current?.querySelector<SVGGElement>('[data-book-id="' + CSS.escape(id) + '"]')

  const revealFocus = (book: Book) => {
    const svg = svgRef.current!
    let bounds = svg.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const visibleHeight = Math.min(innerHeight, bounds.bottom) - Math.max(0, bounds.top)
    if (visibleHeight < Math.min(bounds.height * 0.6, NODE_HEIGHT * zoom + 20)) {
      svg.scrollIntoView({ block: 'center', inline: 'nearest' })
      bounds = svg.getBoundingClientRect()
    }
    const toMap = (rect: MapRect) => ({
      left: rect.left - bounds.left, top: rect.top - bounds.top,
      right: rect.right - bounds.left, bottom: rect.bottom - bounds.top,
    })
    const canvas = toMap({
      left: Math.max(0, bounds.left), top: Math.max(0, bounds.top),
      right: Math.min(document.documentElement.clientWidth, bounds.right), bottom: Math.min(innerHeight, bounds.bottom),
    })
    const mapOverlays = svg.closest('.atlas-map')?.querySelectorAll('.map-hint, .map-key[open] > div')
    const overlays = [...(mapOverlays ?? []), document.querySelector('.progress-notice')]
      .filter((element) => element?.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
      .map((element) => toMap(element!.getBoundingClientRect()))
    const screenView = { zoom, pan: { x: bounds.width / 2 - view.x * zoom, y: bounds.height / 2 - view.y * zoom } }
    let next = revealMapBook(book, screenView, canvas, overlays)
    const notes = document.querySelector('aside.book-notes')
    if (notes) {
      const withNotes = revealMapBook(book, screenView, canvas, [...overlays, toMap(notes.getBoundingClientRect())])
      if (next && (!withNotes || withNotes.zoom < next.zoom)) onDismissNotes()
      else next = withNotes
    }
    if (!next || (next.zoom === zoom && next.pan.x === screenView.pan.x && next.pan.y === screenView.pan.y)) return
    onCameraChange({
      x: (bounds.width / 2 - next.pan.x) / next.zoom,
      y: (bounds.height / 2 - next.pan.y) / next.zoom,
      zoom: next.zoom,
    })
  }

  const moveFocus = (event: KeyboardEvent<SVGGElement>, book: Book) => {
    if (!isMapDirection(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    event.preventDefault()
    const next = getDirectionalBook(book, visibleBooks, event.key)
    if (next) card(next.id)?.focus({ preventScroll: true })
    else revealFocus(book)
  }


  useEffect(() => {
    const shell = shellRef.current!
    const update = () => {
      const { clientWidth: width, clientHeight: height } = shell
      if (width && height) setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height })
    }
    const observer = new ResizeObserver(update)
    observer.observe(shell)
    update()
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (!active || !('focus' in camera)) return
    const shell = shellRef.current!
    if (!shell.clientWidth || !shell.clientHeight) return
    const fit = fitMap(visibleBooks, { width: shell.clientWidth, height: shell.clientHeight }, 40)
    const book = selected ?? visibleBooks[0]
    onCameraChange(fit.zoom === 1 || !book ? fit : centreOnBook(book))
  }, [active, camera, visibleBooks, selected, onCameraChange, size])

  useEffect(() => {
    const enabledRouteFilter = routeOnly && !hadRouteFilter.current
    hadRouteFilter.current = routeOnly
    if (!enabledRouteFilter || focusConnections || mapShowsBook(visibleBooks, size, view)) return
    const fallback = selected ?? placedById[currentId] ?? visibleBooks[0]
    if (fallback) onCameraChange({ bookId: fallback.id })
  }, [routeOnly, focusConnections, visibleBooks, size, view, selected, placedById, currentId, onCameraChange])

  useLayoutEffect(() => {
    if (!active || !reveal || 'focus' in camera) return
    if (reveal.kind === 'path' || (reveal.kind === 'map' && !expanded)) {
      const target = card(reveal.id)
      if (target && document.activeElement === target && placedById[reveal.id]) revealFocus(placedById[reveal.id])
      else restoreFocus(target)
    }
    onRevealHandled()
  }, [active, reveal, camera, expanded])

  useLayoutEffect(() => {
    const target = document.activeElement
    const id = target?.getAttribute('data-book-id')
    if (active && id && svgRef.current?.contains(target) && placedById[id]) revealFocus(placedById[id])
  }, [active, size])

  const zoomBy = (direction: 1 | -1) => onCameraChange({ ...view, zoom: stepMapZoom(zoom, direction, fitted.zoom) })
  const rememberPointerBook = (target: EventTarget) => {
    pointerBook.current = (target as Element).closest('.map-node')?.getAttribute('data-book-id') ?? null
  }
  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    rememberPointerBook(event.target)
    if (event.button !== 0 || pointerBook.current || drag.current) return
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera, start: view }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const pan = drag.current
    if (!pan || pan.pointerId !== event.pointerId || pan.camera !== camera) return
    const { x, y, zoom } = pan.start
    pan.position = { x: x - (event.clientX - pan.x) / zoom, y: y - (event.clientY - pan.y) / zoom, zoom }
    // Paint drag frames without rerendering the map and list. Commit the camera when the pointer ends.
    worldRef.current!.style.transform = mapTransform(pan.position)
  }
  const stopDrag = (event: PointerEvent<SVGSVGElement>) => {
    pointerBook.current = null
    const pan = drag.current
    if (!pan || pan.pointerId !== event.pointerId) return
    drag.current = null
    if (pan.position && pan.camera === camera) onCameraChange(pan.position)
  }

  return (
    <div className="map-canvas-panel">
      <div className="map-controls" aria-label="Map controls">
        <div className="map-zoom">
          <IconButton label="Zoom out" disabled={!visibleBooks.length || zoom <= fitted.zoom} onClick={() => zoomBy(-1)}><Minus size={16} /></IconButton>
          <output className="zoom-label" aria-label="Zoom">{Math.max(1, Math.round(zoom * 100))}%</output>
          <IconButton label="Zoom in" disabled={!visibleBooks.length || zoom >= 1.5} onClick={() => zoomBy(1)}><Plus size={16} /></IconButton>
        </div>
        <button className="map-text-control map-fit" disabled={!visibleBooks.length} onClick={() => onCameraChange(fitted)}>{focusConnections ? 'Fit connections' : 'Fit all'}</button>
        <div className="map-camera-targets">
          <IconButton label="Show selected book" disabled={!selected} onClick={() => onCameraChange(centreOnBook(selected!))}><Crosshair size={15} /></IconButton>
          <IconButton label="Return to my book" disabled={!placedById[currentId]} onClick={() => onCameraChange(centreOnBook(placedById[currentId]))}><Target size={15} /></IconButton>
        </div>
        <details className="map-key" onKeyDown={(event) => {
          if (event.key !== 'Escape' || !event.currentTarget.open) return
          event.preventDefault()
          event.stopPropagation()
          event.currentTarget.open = false
          event.currentTarget.querySelector('summary')?.focus()
        }}>
          <summary aria-label="Map key"><Info size={15} /><span>Map key</span></summary>
          <div>
            <p><b>Arrow:</b> a connection from the selected source.</p>
            <div className="type-key">{Object.keys(bookTypes).map((kind) => <BookType key={kind} kind={kind as Book['kind']} />)}</div>
            <p><b>Card shape:</b> novels have rounded corners. Other works have a folded corner.</p>
            <p><b>Colour mark:</b> the book’s colour in Daunt’s reference. Colours are not unique legion or story arc labels. Books absent from the reference have no mark.</p>
            <p>All stories includes every node in the 2019 reference. Novels only hides other works; arrows never skip hidden steps.</p>
            <p>Select a book to trace its paths. Open Book notes when you want more detail. Drag the Connection map, or use Book list. The reference opening flows left to right. Focus connections shows direct incoming and outgoing links, including works hidden by filters. Highlight next paths marks outgoing arrows.</p>
          </div>
        </details>
      </div>
      <div className={`map-canvas-shell ${focusId ? 'paths-highlighted' : ''} ${zoom < 0.3 ? 'map-overview' : ''} ${focusConnections && paths.length > 8 ? 'map-dense-focus' : ''}`} ref={shellRef}>
        <svg
          className="map-canvas"
          ref={svgRef}
          role="group" aria-label="Connection map cards" aria-describedby={hintId}
          onPointerDown={handlePointerDown}
          onMouseDown={(event) => rememberPointerBook(event.target)}
          onMouseUp={() => { pointerBook.current = null }}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onLostPointerCapture={stopDrag}
        >
          <defs>
            <pattern id="map-grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="var(--map-grid)" />
            </pattern>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--map-edge)" />
            </marker>
            <marker id="arrowhead-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--accent)" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />
          <g className="map-world" ref={worldRef} style={{ transform: mapTransform(view) }}>
            {[...paths].sort((a, b) => Number(a.from === focusId) - Number(b.from === focusId)).map((edge) => {
              const active = edge.from === focusId
              const dimmed = Boolean(focusId) && !active && !focusConnections
              return <g key={`${edge.from}-${edge.to}`}><path className="map-edge-clearance" d={edge.path} /><path className={`map-edge ${active ? 'active' : ''} ${dimmed ? 'dimmed' : ''} ${edge.kind}`} d={edge.path} markerEnd={`url(#${active ? 'arrowhead-active' : 'arrowhead'})`} /></g>
            })}
            {visibleBooks.map((book) => <BookNode key={book.id} book={book} selected={selectedId === book.id} active={tabStop === book.id}
              zoom={zoom} selectedDescription={selectionId} dimmed={Boolean(focusId) && !highlightedIds.has(book.id)}
              readIds={readIds} currentId={currentId} recommended={recommendedIds.has(book.id)}
              onFocus={() => {
                setKeyboardBookId(book.id)
                if (pointerBook.current !== book.id) revealFocus(book)
              }}
              onKeyDown={(event) => moveFocus(event, book)} onSelect={() => { setKeyboardBookId(book.id); onSelect(book, zoom < 0.65) }} />)}
          </g>
        </svg>
        {visibleBooks.length > 0 && <div className="map-hint">Drag to browse</div>}
        <span className="sr-only" id={hintId}>Tab to the cards. Use arrow keys to move. Enter or Space selects.</span>
        <span className="sr-only" id={selectionId}>Selected for Book notes</span>
        <span className="sr-only" role="status">{announcement}</span>
      </div>
    </div>
  )
}

type ProgressNotice = (inDialog?: boolean) => ReactNode

type BookActions = { readingOption: ReadingOption; readIds: Set<string>; currentId: string; onRead: (id: string) => void; onCurrent: (id: string) => void }


function ReadingActions({ book, readIds, currentId, onRead, onCurrent, list = false, notes = false }: BookActions & { book: Book; list?: boolean; notes?: boolean }) {
  const status = readingStatus(book.id, readIds, currentId)
  const finishLabel = status === 'Finished' ? 'Mark unread' : 'Mark finished'
  return <div className="book-actions">
    {status === 'Unread' && <button className={list ? 'text-action' : 'primary-action'} aria-label={`Start reading ${book.title}`} onClick={() => onCurrent(book.id)}>Start reading</button>}
    {notes && status === 'Finished' && book.id !== currentId && <button className="text-action" onClick={() => onCurrent(book.id)}>Continue from here</button>}
    <button className="quiet-action" aria-label={`${finishLabel}: ${book.title}`} onClick={() => onRead(book.id)}>{finishLabel}</button>
  </div>
}

function BookNotes({ book, mobile, notice, onSelect, onClose, onSiege, ...actions }: BookActions & {
  book: Book
  mobile: boolean
  notice?: ReactNode
  onSiege?: () => void
  onSelect: (book: Book) => void
  onClose: (restore?: boolean) => void
}) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    const title = titleRef.current!
    title.closest('.book-notes')!.scrollTop = 0
    title.focus({ preventScroll: true })
  }, [book.id, mobile])
  useEffect(() => {
    if (mobile) return
    const panel = titleRef.current!.closest('.book-notes')!
    const dismissIfCovered = (target: EventTarget | null) => {
      if (!(target instanceof Element) || panel.contains(target) || target.closest('.map-node, .progress-notice')) return
      const rect = target.getBoundingClientRect()
      const notes = panel.getBoundingClientRect()
      if (rect.width && rect.right > notes.left && rect.left < notes.right) onClose(false)
    }
    const dismissOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      onClose(panel.contains(document.activeElement))
    }
    const dismissOnFocus = (event: FocusEvent) => dismissIfCovered(event.target)
    const dismissOnResize = () => {
      if (!isMobileLayout()) dismissIfCovered(document.activeElement)
    }
    document.addEventListener('focusin', dismissOnFocus)
    document.addEventListener('keydown', dismissOnEscape)
    window.addEventListener('resize', dismissOnResize)
    return () => {
      document.removeEventListener('focusin', dismissOnFocus)
      document.removeEventListener('keydown', dismissOnEscape)
      window.removeEventListener('resize', dismissOnResize)
    }
  }, [mobile, onClose])
  const connections = getConnections(actions.readingOption)
  const source = readingOptions[actions.readingOption]
  const unresolved = getNextSteps(book.id, new Set(), actions.readingOption).filter((step) => !step.book)
  const incoming = connections.filter((edge) => edge.to === book.id)
  const outgoing = connections.filter((edge) => edge.from === book.id)
  const labels = { reference: 'Reference arrow', sequence: 'Publisher’s listed order' }
  const referenceNode = referenceNodeByBookId[book.id]
  const collection = book.collectionNumber ? referenceCollections[book.collectionNumber] : undefined
  const content = <>
    <div className="notes-heading"><h2>Book notes</h2><IconButton label="Close book notes" onClick={() => onClose()}><X size={18} /></IconButton></div>
    <div className="book-reference">{(actions.readingOption === 'siege' || book.id === siegeBookIds[0]) && siegeBookNumbers[book.id] ? `Siege book ${siegeBookNumbers[book.id]}` : book.seriesNumber ? `Book ${String(book.seriesNumber).padStart(2, '0')}` : 'Supporting story'} <BookType kind={book.kind} /></div>
    <h3 ref={titleRef} tabIndex={-1} data-initial-focus>{book.title}</h3>
    {book.faction && <p className="faction-name">{book.faction}</p>}
    <p className="book-status">{actions.readIds.has(book.id) ? <Check size={15} /> : <BookOpen size={15} />}{actions.readIds.has(book.id) ? 'Finished' : book.id === actions.currentId ? 'Currently reading' : 'Unread'}</p>
    <ReadingActions book={book} notes {...actions} />
    {collection && <p className="publication-note">{book.collectionNumber === 42 ? 'Adapted in' : 'Collected in'} {collection.bookId ? <button className="text-action" onClick={() => onSelect(bookById[collection.bookId!])}>{collection.title}</button> : <a href={referenceNode.sourceLink} target="_blank" rel="noreferrer">{collection.title} <ArrowUpRight size={12} /></a>} · Book {book.collectionNumber}. Completion is tracked separately.</p>}
    {book.publication && <p className="publication-note">{book.publication}</p>}
    {book.sourceId && <p className="publication-note">Source label: {referenceNode.title}. {book.metadataSourceUrl && <a href={book.metadataSourceUrl} target="_blank" rel="noreferrer">Publication record <ArrowUpRight size={12} /></a>}</p>}
    {book.summary && <details className="story-details" key={book.id}><summary>Show story notes <span>{book.spoilerLevel} spoilers</span></summary><p>{book.summary}</p></details>}
    {incoming.length > 0 && <section className="connection-list"><h4>{!isReference(actions.readingOption) ? 'Earlier in the publisher’s order' : 'Incoming source arrows'}</h4>{incoming.map((edge) => <button key={edge.from} onClick={() => onSelect(bookById[edge.from])}><span>{bookById[edge.from].title}<small>{labels[edge.kind]}</small></span><ArrowRight size={15} /></button>)}</section>}
    {outgoing.length > 0 && <section className="connection-list"><h4>Where the story leads</h4>{outgoing.map((edge) => <button key={edge.to} onClick={() => onSelect(bookById[edge.to])}><span>{bookById[edge.to].title}<small>{labels[edge.kind]}</small></span><ArrowRight size={15} /></button>)}</section>}
    {onSiege && <button type="button" className="quiet-action" onClick={onSiege}>Open Black Library’s Siege of Terra <ArrowRight size={15} aria-hidden="true" /></button>}
    {unresolved.length > 0 && <SourcePathNotes steps={unresolved} />}
    <p className="curation-note">No story arc is assigned in this catalogue. Connections follow <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.label}</a>. Missing steps are not joined across.</p>
  </>
  return mobile
    ? <FocusDialog label="Book notes" className="book-notes" onClose={onClose}>{content}{notice}</FocusDialog>
    : <aside className="book-notes" aria-label="Book notes">{content}</aside>
}

function useBookNotes(fallback: () => HTMLElement | SVGElement | null) {
  const [notesOpen, setNotesOpen] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const openNotes = (trigger: HTMLElement) => {
    opener.current = trigger
    setNotesOpen(true)
    if (notesOpen) requestAnimationFrame(() => document.querySelector<HTMLElement>('.book-notes [data-initial-focus]')?.focus())
  }
  const closeNotes = (restore = true) => {
    setNotesOpen(false)
    if (restore) requestAnimationFrame(() => restoreFocus(opener.current, fallback()))
  }
  return { notesOpen, openNotes, closeNotes }
}

function BookList({ items, selectedId, onSelect, mobile, sequence = false, ...actions }: BookActions & {
  items: Book[]
  selectedId: string
  onSelect: (book: Book, trigger: HTMLButtonElement) => void
  mobile: boolean
  sequence?: boolean
}) {
  const statusPrefix = useId()
  const orderedIds = getSequenceBookIds(actions.readingOption)
  return <ol className="book-list">{items.map((book) => <li key={book.id} data-book-id={book.id} className={selectedId === book.id ? 'selected' : ''}>
    <span className="book-number" aria-label={sequence ? `List position ${orderedIds.indexOf(book.id) + 1}` : undefined}>{sequence ? String(orderedIds.indexOf(book.id) + 1).padStart(2, '0') : book.seriesNumber ? String(book.seriesNumber).padStart(2, '0') : '—'}</span>
    <div className="list-entry">
      <button className="list-book" aria-haspopup={mobile ? 'dialog' : undefined}
        aria-describedby={statusPrefix + book.id} onClick={(event) => onSelect(book, event.currentTarget)}><strong>{referenceNodeByBookId[book.id] && <svg className="reference-colour-mark" width="14" height="14" aria-hidden="true"><rect x="0.5" y="0.5" width="13" height="13" fill={referenceNodeByBookId[book.id].fill} stroke={referenceNodeByBookId[book.id].stroke} /></svg>}{book.title}</strong><span>{book.faction && `${book.faction} · `}<BookType kind={book.kind} />{actions.readingOption === 'siege' && siegeBookNumbers[book.id] ? ` · Siege book ${siegeBookNumbers[book.id]}` : ''}</span></button>
      <span className="list-status" id={statusPrefix + book.id}>{readingStatus(book.id, actions.readIds, actions.currentId)}{selectedId === book.id && <span className="sr-only">. Selected for Book notes.</span>}</span>
    </div>
    <ReadingActions book={book} list {...actions} />
  </li>)}</ol>
}

function mapStartBook(option: ReadingOption, selectedId: string, currentId: string) {
  const available = getOptionBooks(option)
  return available.find((book) => book.id === selectedId) ??
    available.find((book) => book.id === currentId) ??
    (isReference(option) ? bookById['horus-rising'] : available[0])
}

function Explore({ currentId, readIds, onRead, onCurrent, selectedId, onSelect, readingOption, onOption, progressNotice }: BookActions & { selectedId: string; progressNotice: ProgressNotice; onSelect: (book: Book) => void; onOption: (option: ReadingOption) => void }) {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<MapMode>('map')
  const [routeOnly, setRouteOnly] = useState(false)
  const [highlightPaths, setHighlightPaths] = useState(true)
  const [focusConnections, setFocusConnections] = useState(false)
  const [fullMobileMap, setFullMobileMap] = useState(false)
  const [atlasCamera, setAtlasCamera] = useState<MapCamera>(() => ({ bookId: selectedId }))
  const [focusView, setFocusView] = useState<{ bookId: string; camera: MapCamera } | null>(null)
  const focusCamera = focusView?.bookId === selectedId ? focusView.camera : INITIAL_FOCUS_CAMERA
  const setFocusCamera = useCallback((camera: MapCamera) => setFocusView({ bookId: selectedId, camera }), [selectedId])
  const [announcedBookId, setAnnouncedBookId] = useState<string>()
  const [chooser, setChooser] = useState<PathSurface | null>(null)
  const [mapReveal, setMapReveal] = useState<MapReveal | null>(null)
  const mobile = useMobileLayout()
  const mapSlot = useRef<HTMLDivElement>(null)
  const mapOpener = useRef<HTMLElement | null>(null)
  const clearMapFiltersRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Move the portal host between the inline map and dialog without remounting the canvas.
  const [mapHost] = useState(() => typeof document === 'undefined' ? null : document.createElement('div'))
  const activeTab = () => document.querySelector<HTMLElement>('.atlas-tabs [aria-selected="true"]')
  const mapCard = (id: string) => mapHost?.querySelector<SVGGElement>('[data-book-id="' + CSS.escape(id) + '"]')
  const { notesOpen, openNotes, closeNotes } = useBookNotes(() =>
    document.querySelector<HTMLElement>('.mobile-expanded .map-reading-notes') ?? activeTab())
  const notesModal = mobile && notesOpen
  const selectedBook = bookById[selectedId]
  const selectedStatus = readingStatus(selectedId, readIds, currentId)
  const source = readingOptions[readingOption]
  const referenceOption = isReference(readingOption)
  const siegeStartId = siegeBookIds[0]
  const currentCanHandoff = referenceOption && currentId === siegeStartId
  const selectedCanHandoff = referenceOption && selectedId === siegeStartId
  const handoff = getSiegeHandoff(currentId, readIds)
  const connections = getConnections(readingOption)
  const nextSteps = useMemo(() => getNextSteps(currentId, readIds, readingOption), [currentId, readIds, readingOption])
  const bookSteps = nextSteps.flatMap(({ book, via }) => book ? [{ book, via }] : [])
  const readingChoices = bookSteps.filter(({ book }) => readingOption !== 'reference-novels' || book.kind === 'novel')
  const hiddenReadingPaths = bookSteps.length - readingChoices.length
  const unresolvedReadingPaths = nextSteps.filter((step) => !step.book)
  const recommended = nextSteps.length === 1 && readingChoices.length === 1 ? nextSteps[0] : undefined
  const showReadingChoices = nextSteps.length > 0 && !recommended && !currentCanHandoff
  const routeIds = useMemo(() => getReachableBookIds(currentId, readIds, readingOption), [currentId, readIds, readingOption])
  const actions = { currentId, readIds, onRead, onCurrent, readingOption }
  const optionBooks = useMemo(() => getOptionBooks(readingOption), [readingOption])
  const focusCatalogue = useMemo(() => readingOption === 'reference-novels' ? getOptionBooks('reference') : optionBooks, [readingOption, optionBooks])
  const sourceBooks = useMemo(() => layoutSourceFlow(optionBooks, connections, referenceOption ? referencePositions : undefined), [optionBooks, connections, referenceOption])
  const atlasBooks = useMemo(() => routeOnly ? sourceBooks.filter((book) => book.id === currentId || routeIds.has(book.id)) : sourceBooks, [sourceBooks, routeOnly, currentId, routeIds])
  const query = search.trim().toLowerCase()
  const matches = useMemo(() => query ? atlasBooks.filter((book) => `${book.title} ${book.faction}`.toLowerCase().includes(query)) : atlasBooks, [atlasBooks, query])
  const focused = useMemo(() => {
    if (!focusConnections) return null
    const { ids, edges } = getConnectionFocus(connections, selectedId)
    return { books: layoutSourceFlow(focusCatalogue.filter((book) => ids.has(book.id)), edges), edges }
  }, [focusConnections, connections, selectedId, focusCatalogue])
  const mapBooks = focused?.books ?? atlasBooks
  const mapConnections = focused?.edges ?? connections
  const mapSelection = mapBooks.find((book) => book.id === selectedId)
  const mapIds = new Set(mapBooks.map((book) => book.id))
  const mapChoices = mapSelection ? mapConnections.filter((edge) => edge.from === selectedId && mapIds.has(edge.to)).map((edge) => ({ book: bookById[edge.to] })) : []
  const showHiddenSteps = mode === 'list' ? matches.some((book) => book.id === selectedId) : mapSelection && !focused
  const hiddenSteps = showHiddenSteps && readingOption === 'reference-novels'
    ? connections.filter((edge) => edge.from === selectedId && bookById[edge.to].kind !== 'novel') : []
  const selectedSourceSteps = mapSelection ? getNextSteps(selectedId, new Set(), readingOption).filter((step) => !step.book) : []
  const canCompareMap = highlightPaths && (mapChoices.length > 1 || (selectedSourceSteps.length > 0 && !selectedCanHandoff))
  const singleMapBook = highlightPaths && !canCompareMap && mapChoices.length === 1 ? mapChoices[0].book : undefined
  const atlasAnchor = 'bookId' in atlasCamera
    ? sourceBooks.find((book) => book.id === atlasCamera.bookId) ?? sourceBooks.find((book) => book.id === currentId) ?? atlasBooks[0]
    : undefined
  const toggleChooser = (surface: PathSurface) => setChooser((open) => open === surface ? null : surface)
  const hasMap = mapBooks.length > 0
  const mapModal = mobile && fullMobileMap && hasMap && mode === 'map'
  useLayoutEffect(() => {
    if (mapSlot.current && mapHost) mapSlot.current.append(mapHost)
  }, [mapModal, mapHost])
  useLayoutEffect(() => {
    if (!fullMobileMap || mapModal) return
    setFullMobileMap(false)
    setChooser((open) => open === 'expanded' ? null : open)
    if (!notesOpen) requestAnimationFrame(() => {
      if (hasMap) restoreFocus(mapOpener.current, mapCard(selectedId), activeTab())
      else restoreFocus(clearMapFiltersRef.current, activeTab())
    })
  }, [fullMobileMap, mapModal, hasMap])

  const openFullMobileMap = (trigger: HTMLElement) => {
    mapOpener.current = trigger
    setChooser((open) => open === 'map' ? null : open)
    setFullMobileMap(true)
  }
  const closeFullMobileMap = () => {
    setFullMobileMap(false)
    setChooser((open) => open === 'expanded' ? null : open)
    requestAnimationFrame(() => restoreFocus(mapOpener.current, mapCard(selectedId), activeTab()))
  }
  const changeMode = (next: MapMode) => {
    setMode(next)
    setFullMobileMap(false)
    setChooser((open) => open === 'reading' ? open : null)
  }
  const locateBook = (book: Book) => {
    if (focusConnections) setFocusView(null)
    else setAtlasCamera({ bookId: book.id })
  }
  const selectAtlasBook = (book: Book, locate = true) => {
    onSelect(book)
    if (focusConnections || locate) locateBook(book)
    setAnnouncedBookId(book.id)
    closeNotes(false)
    setChooser(null)
    setMapReveal(null)
  }
  const selectSearchResult = (book: Book) => {
    setSearch('')
    selectAtlasBook(book)
    setMapReveal({ id: book.id, kind: 'path' })
  }
  const selectListBook = (book: Book, trigger: HTMLButtonElement) => {
    setAnnouncedBookId(undefined)
    onSelect(book)
    locateBook(book)
    openNotes(trigger)
  }
  const revealBook = (book: Book, trigger?: HTMLElement, kind: 'notes' | 'map' = 'notes') => {
    if (readingOption === 'reference-novels' && book.kind !== 'novel') onOption('reference')
    setSearch('')
    setRouteOnly(false)
    if (optionBooks.some((item) => item.id === book.id)) locateBook(book)
    else {
      setFocusConnections(false)
      setAtlasCamera({ bookId: book.id })
    }
    setAnnouncedBookId(undefined)
    onSelect(book)
    if (mode === 'map' || kind === 'map') setMapReveal({ id: book.id, kind })
    if (trigger) openNotes(trigger)
  }
  const showOnMap = (book: Book, trigger: HTMLElement) => {
    setMode('map')
    closeNotes(false)
    revealBook(book, undefined, 'map')
    if (mobile) openFullMobileMap(trigger)
  }
  const revealListBook = (book: Book) => requestAnimationFrame(() => {
    const row = listRef.current?.querySelector('[data-book-id="' + CSS.escape(book.id) + '"]')
    restoreFocus(row?.querySelector<HTMLButtonElement>('.list-book'), activeTab())
  })
  const revealPath = (book: Book) => {
    if (mode === 'list' || !focusConnections) {
      if (!matches.some((item) => item.id === book.id)) setSearch('')
      if (!atlasBooks.some((item) => item.id === book.id)) setRouteOnly(false)
    }
    selectAtlasBook(book)
    if (mode === 'map') setMapReveal({ id: book.id, kind: 'path' })
    else revealListBook(book)
  }
  const changeReadingOption = (option: ReadingOption, book = mapStartBook(option, selectedId, currentId)) => {
    if (book.id !== selectedId) onSelect(book)
    onOption(option)
    setAtlasCamera({ bookId: book.id })
    setSearch('')
    setRouteOnly(false)
    setFullMobileMap(false)
    closeNotes(false)
    setFocusConnections(false)
    setChooser(null)
    setMapReveal(null)
    setAnnouncedBookId(undefined)
  }
  const openSiege = () => {
    changeReadingOption('siege', handoff.destination)
    setMode('list')
    revealListBook(handoff.destination)
  }
  const showAllReadingPaths = () => {
    onOption('reference')
    setChooser('reading')
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.branch-decision .path-toggle')?.focus({ preventScroll: true }))
  }
  const clearFilters = () => {
    setSearch('')
    setRouteOnly(false)
    restoreFocus(activeTab())
  }

  const pathSurface = mapModal ? 'expanded' : 'map'
  const mapPathAction = singleMapBook
    ? <button className="text-action" type="button" onClick={() => revealPath(singleMapBook)}>{singleMapBook.title} <ArrowRight size={15} aria-hidden="true" /></button>
    : canCompareMap && <PathToggle open={chooser === pathSurface} target={`${pathSurface}-path-choices`} label="Direct paths" onClick={() => toggleChooser(pathSurface)} />
  const canvas = <MapCanvas active={mode === 'map'} routeOnly={routeOnly}
    referenceLayout={referenceOption && !focused} reveal={mapReveal} onRevealHandled={() => setMapReveal(null)} expanded={mapModal}
    camera={focused ? focusCamera : atlasCamera} atlasAnchor={atlasAnchor} onCameraChange={focused ? setFocusCamera : setAtlasCamera}
    selectedId={mapSelection?.id ?? null} currentId={currentId} readIds={readIds} visibleBooks={mapBooks} highlightPaths={highlightPaths}
    focusConnections={Boolean(focused)} connections={mapConnections} recommendedIds={new Set(bookSteps.map(({ book }) => book.id))}
    announcement={announcedBookId === selectedId ? 'Selected ' + selectedBook.title + ', ' + bookTypes[selectedBook.kind].label + '.' : ''}
    onDismissNotes={() => closeNotes(false)} onSelect={selectAtlasBook}
  />
  const hiddenPathNotice = hiddenSteps.length > 0 && (selectedId !== currentId || !hiddenReadingPaths) &&
    <HiddenPaths count={hiddenSteps.length} onShowAll={() => onOption('reference')} />
  const mapSelectionStrip = <section className="map-selected" aria-label="Selected book">
    {mapSelection ? <>
      <div className="map-selected-heading">
        <div><small>Selected book</small><h2>{selectedBook.title}</h2>
          <div className="map-selected-detail"><span className={selectedStatus === 'Unread' ? undefined : 'reading-status'}>{selectedStatus}</span><BookType kind={selectedBook.kind} /></div>
        </div>
        <div className="map-selected-actions" onClickCapture={() => {
          if (chooser === 'expanded') setChooser(null)
        }}>
          <ReadingActions book={selectedBook} {...actions} />
          <button type="button" className="quiet-action map-reading-notes" aria-label={'Book notes for ' + selectedBook.title}
            aria-haspopup={mobile ? 'dialog' : undefined} onClick={(event) => openNotes(event.currentTarget)}>Book notes</button>
        </div>
      </div>
      <div className="map-related" onKeyDown={(event) => {
        if (event.key !== 'Escape' || chooser !== pathSurface) return
        event.preventDefault()
        event.stopPropagation()
        setChooser(null)
        event.currentTarget.querySelector<HTMLButtonElement>('.path-toggle')?.focus()
      }}>
        {mapPathAction}
        {selectedCanHandoff && <button className="text-action" type="button" onClick={openSiege}>
          {handoff.destination.id === siegeStartId ? 'Open Siege of Terra' : 'Continue with Siege of Terra'} <ArrowRight size={15} aria-hidden="true" />
        </button>}
        {canCompareMap && <PathChoices id={`${pathSurface}-path-choices`} open={chooser === pathSurface}
          choices={mapChoices} sourceSteps={selectedSourceSteps} readIds={readIds} currentId={currentId} onChoose={revealPath}
        />}
      </div>
      {mode === 'map' && hiddenPathNotice}
      {selectedId !== currentId && (selectedCanHandoff || !highlightPaths) && <SourcePathNotes steps={selectedSourceSteps} />}
    </> : <p>{hasMap ? 'The selected book is hidden by the current reading option or filters.' : 'No works match these filters.'}</p>}
    {!hasMap && routeOnly && <button ref={clearMapFiltersRef} className="text-action" onClick={clearFilters}>Clear onward-route filter</button>}
  </section>
  const mapContent = <>
    <div className="map-heading">
      {mapModal && <button data-initial-focus className="map-fullscreen-close quiet-action" onClick={closeFullMobileMap}><Minimize size={15} />Back to map</button>}
      <button className="text-action" aria-pressed={focusConnections} disabled={!focused && !mapSelection} onClick={() => {
        if (!focused) setFocusView(null)
        setFocusConnections(!focusConnections)
      }}>{focused ? 'Back to atlas' : 'Focus connections'}</button>
      {mapModal && <label className="route-checkbox"><input type="checkbox" checked={highlightPaths} onChange={(event) => setHighlightPaths(event.target.checked)} />Next paths</label>}
      <span className="book-count" role="status">{focused ? `${focused.edges.length} direct ${focused.edges.length === 1 ? 'link' : 'links'}` : `${mapBooks.length} ${mapBooks.length === 1 ? 'work' : 'works'}`}</span>
    </div>
    {!mobile && mapSelectionStrip}
    <div className="map-canvas-host" ref={mapSlot}>{!mapHost && canvas}</div>
    {mobile && mapSelectionStrip}
  </>
  const sourceDescription = <>
    <p>{source.description} <a href={source.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} /></a></p>
    {!referenceOption && <span className="option-progress">{getSequenceBookIds(readingOption).filter((id) => readIds.has(id)).length} / {optionBooks.length} {readingOption === 'siege' ? 'Siege volumes' : 'Saga books'} finished</span>}
  </>
  const filterControls = <>
    <label className="route-checkbox"><input type="checkbox" checked={routeOnly} onChange={(event) => setRouteOnly(event.target.checked)} />Only my onward route</label>
    {mode === 'map' && <label className="route-checkbox highlight-checkbox"><input type="checkbox" checked={highlightPaths} onChange={(event) => setHighlightPaths(event.target.checked)} />Highlight next paths</label>}
  </>
  const readingDesk = <>
    <section className="reading-desk" aria-label="Your reading route">
      <div className="current-reading"><div className="section-label"><BookOpen size={17} /><h2>{readIds.has(currentId) ? 'Last finished' : 'Reading now'}</h2></div><button className="book-heading" aria-haspopup={mobile ? 'dialog' : undefined} onClick={(event) => revealBook(bookById[currentId], event.currentTarget)}>{bookById[currentId].title}</button><p><BookType kind={bookById[currentId].kind} /></p><button className="text-action" onClick={() => onRead(currentId)}>{readIds.has(currentId) ? <RotateCcw size={15} /> : <Check size={15} />}{readIds.has(currentId) ? 'Mark unread' : 'Mark finished'}</button></div>
      <div className="next-reading">
        <div className="section-label"><ArrowRight size={17} /><h2>{referenceOption && !currentCanHandoff ? 'Next source steps' : 'Read next'}</h2></div>
        {currentCanHandoff ? <SiegeHandoff handoff={handoff} onContinue={openSiege} sourceSteps={unresolvedReadingPaths} />
          : recommended?.book ? <>
            <button className="book-heading" aria-haspopup={mobile ? 'dialog' : undefined} onClick={(event) => revealBook(recommended.book!, event.currentTarget)}>{recommended.title}</button>
            <p>{recommended.via ? <>Via <i>{recommended.via.title}</i> in Daunt’s flowchart.</> : recommended.explanation}</p>
            <div className="next-actions">
              <button className="quiet-action" onClick={() => onCurrent(recommended.book!.id)}>Start reading <ArrowRight size={16} /></button>
              <button className="text-action" aria-haspopup={mobile ? 'dialog' : undefined} onClick={(event) => showOnMap(recommended.book!, event.currentTarget)}>Show on map</button>
            </div>
          </> : showReadingChoices ? <div className="branch-decision">
            <div className="branch-summary">
              <h3 className="book-heading">
                {readingChoices.length > 0 ? `${readingChoices.length} ${readingChoices.length === 1 ? 'path' : 'paths'} in Daunt’s flowchart`
                  : hiddenReadingPaths > 0 ? 'Supporting works come next' : 'No next work is recorded'}
              </h3>
              {readingChoices.length > 0 && <PathToggle open={chooser === 'reading'} target="reading-path-choices" label="Compare paths" onClick={() => toggleChooser('reading')} />}
            </div>
            {hiddenReadingPaths > 0 && <HiddenPaths count={hiddenReadingPaths} onShowAll={showAllReadingPaths} />}
            {readingChoices.length === 0 && <SourcePathNotes steps={unresolvedReadingPaths} />}
          </div> : <>
            <h3>{readingOption === 'siege' ? 'End of the numbered Siege series.' : readingOption === 'saga' ? 'End of the Saga selection.' : 'No next step is recorded here.'}</h3>
            <p>{readingOption === 'siege' ? 'The main series ends at The End and the Death: Volume III. Earlier unfinished volumes remain in the list below; related stories are in the publisher’s catalogue.' : readingOption === 'saga' ? 'This selection stops at Slaves to Darkness. Any earlier unfinished books remain in the list below.' : 'Check the original flowchart for its full route and coverage.'}</p>
            <a className="text-action" href={source.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={14} /></a>
          </>}
      </div>
    </section>
    {showReadingChoices && readingChoices.length > 0 && <PathChoices
      id="reading-path-choices" open={chooser === 'reading'} choices={readingChoices} sourceSteps={unresolvedReadingPaths}
      readIds={readIds} currentId={currentId} onChoose={revealPath}
    />}
  </>
  const mapClass = `atlas-map${focused ? ' atlas-map-focused' : ''}`
  return <>
    <h1 className="sr-only">Explore reading options</h1>
    {!mobile && readingDesk}
    <div className="atlas-header">
    <div className="atlas-tabs" role="tablist" aria-label="Explore views">
      {([['map', 'Connection map', Map], ['list', 'Book list', List]] as const).map(([id, label, Icon]) => <button key={id} id={`view-tab-${id}`} role="tab" aria-selected={mode === id} aria-controls={`view-panel-${id}`} tabIndex={mode === id ? 0 : -1} onClick={() => changeMode(id)} onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'map' : event.key === 'End' ? 'list' : mode === 'map' ? 'list' : 'map'
        changeMode(next)
        document.getElementById(`view-tab-${next}`)?.focus()
      }}><Icon size={17} />{label}</button>)}
    </div>
      {mobile && mode === 'map' && hasMap && <button className="mobile-map-toggle text-action" aria-haspopup="dialog" onClick={(event) => openFullMobileMap(event.currentTarget)}><Maximize size={15} />Expand map</button>}
    </div>
    <section className="reading-option explore-reading-option" aria-label="Reading option">
      <label className="select-field"><span>Reading option</span><select aria-label="Reading option" value={readingOption} onChange={(event) => changeReadingOption(event.target.value as ReadingOption)}>{Object.entries(readingOptions).map(([id, option]) => <option key={id} value={id}>{option.label}</option>)}</select></label>
      {mobile ? <details className="explore-filters">
        <summary><SlidersHorizontal size={15} />Filters{routeOnly ? ' (1)' : ''}</summary>
        <div className="explore-filter-controls">{filterControls}{sourceDescription}</div>
      </details> : sourceDescription}
    </section>
    <div className="atlas-toolbar explore-toolbar">
      <div className="search-summary">
        <label className="search-field"><Search size={17} /><input ref={searchRef} aria-label="Search titles or legions" placeholder="Find a title or legion" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        {search && <IconButton label="Clear search" onClick={() => { setSearch(''); searchRef.current?.focus() }}><X size={16} /></IconButton>}
        {mode === 'list' && <span className="book-count" role="status">{matches.length} {matches.length === 1 ? 'work' : 'works'}{referenceOption ? ' · Titles A–Z' : ''}</span>}
      </div>
      {!mobile && filterControls}
    </div>
    <div className="atlas-workspace"><section className="atlas-main" aria-label="Books and connections">
      <div role="tabpanel" id="view-panel-map" aria-labelledby="view-tab-map" tabIndex={0} hidden={mode !== 'map'}>
        {query && <section className="map-search-results" aria-label="Search results">
          <p role="status">{matches.length ? `${matches.length} ${matches.length === 1 ? 'result' : 'results'}` : 'No works match this search.'}</p>
          {matches.length > 0 && <ul>{matches.map((book) => <li key={book.id}><button className="map-search-result" onClick={() => selectSearchResult(book)}><span>{book.title}</span><BookType kind={book.kind} /></button></li>)}</ul>}
        </section>}
        {mapModal ? <FocusDialog label="Connection map" className={`${mapClass} mobile-expanded`} onClose={closeFullMobileMap}>
          {mapContent}
          {!notesModal && progressNotice(true)}
        </FocusDialog> : <div className={mapClass}>{mapContent}</div>}
        {mapHost && createPortal(canvas, mapHost)}
        <div className="map-caption"><span><span className="status-sample selected" />Selected</span><span><BookOpen size={13} />Reading</span><span><Check size={13} />Finished</span></div>
      </div>
      <div role="tabpanel" id="view-panel-list" aria-labelledby="view-tab-list" tabIndex={0} hidden={mode !== 'list'}>
        {mode === 'list' && hiddenPathNotice}
        {matches.length === 0 ? <div className="empty-state"><h2>No books found</h2><p>Try another title, or clear the filters.</p><button className="quiet-action" onClick={clearFilters}>Clear filters</button></div> : <div className="list-view" ref={listRef}><BookList mobile={mobile} sequence={!referenceOption} items={matches} selectedId={selectedId} onSelect={selectListBook} {...actions} /></div>}
      </div>
    </section>{notesOpen && <BookNotes
      book={selectedBook} mobile={mobile} notice={notesModal ? progressNotice(true) : undefined} onSelect={revealBook} onClose={closeNotes}
      onSiege={selectedCanHandoff ? openSiege : undefined} {...actions}
    />}</div>
    {mobile && readingDesk}
    {!mapModal && !notesModal && progressNotice()}
  </>
}

function Collection({ selectedId, onSelect, progressNotice, ...actions }: BookActions & { selectedId: string; progressNotice: ProgressNotice; onSelect: (book: Book) => void }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const mobile = useMobileLayout()
  const searchRef = useRef<HTMLInputElement>(null)
  const { notesOpen, openNotes, closeNotes } = useBookNotes(() => searchRef.current)
  const selectAndShowNotes = (book: Book, trigger: HTMLButtonElement) => {
    onSelect(book)
    openNotes(trigger)
  }
  const items = books.filter((book) => (!query || `${book.title} ${book.faction}`.toLowerCase().includes(query.toLowerCase())) && (filter === 'all' || actions.readIds.has(book.id) === (filter === 'finished')))
  return <><div className="collection-heading"><h1>Your reading library.</h1><p>{`${actions.readIds.size} of ${books.length} works finished. Your progress stays in this browser.`}</p></div>
    <div className="atlas-toolbar"><label className="search-field"><Search size={17} /><input ref={searchRef} aria-label="Search collection" placeholder="Find a title or legion" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="select-field"><span>Status</span><select aria-label="Reading status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All works</option><option value="finished">Finished</option><option value="unread">Unread</option></select></label></div>
    <div className="atlas-workspace"><section className="collection-books">{items.length === 0 ? <div className="empty-state"><h2>No books here yet</h2><p>Change the status filter or search to see more books.</p><button className="quiet-action" onClick={() => { setQuery(''); setFilter('all') }}>Show all books</button></div> : <BookList mobile={mobile} items={items} selectedId={selectedId} onSelect={selectAndShowNotes} {...actions} />}</section>{notesOpen && <BookNotes book={bookById[selectedId]} mobile={mobile} notice={mobile ? progressNotice(true) : undefined} onSelect={onSelect} onClose={closeNotes} {...actions} />}</div>
    {(!mobile || !notesOpen) && progressNotice()}
  </>
}

export function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [view, setView] = useState<View>('map')
  const [selectedId, setSelectedId] = useState(() => mapStartBook(progress.readingOption, progress.currentId, progress.currentId).id)
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [undo, setUndo] = useState<{ progress: Progress; message: string } | null>(null)
  const progressTrigger = useRef<{ button: HTMLButtonElement; label: string; surface: Element | null; bookId?: string; keyboard: boolean } | null>(null)
  const undoButton = useRef<HTMLButtonElement>(null)
  const showProgressNotice = undo !== null && notice === undo.message
  const readIds = useMemo(() => new Set(progress.readIds), [progress.readIds])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setStorageError(false) } catch { setStorageError(true) } }, [progress])
  useEffect(() => {
    if (showProgressNotice && progressTrigger.current && (progressTrigger.current.keyboard || document.activeElement === document.body)) {
      undoButton.current?.focus({ preventScroll: true })
    }
  }, [undo, showProgressNotice])
  const changeProgress = (next: Progress, message: string) => {
    const button = document.activeElement
    progressTrigger.current = button instanceof HTMLButtonElement ? {
      button,
      label: button.getAttribute('aria-label') || button.textContent.trim(),
      surface: button.closest('.reading-desk, .map-selected-actions, #view-panel-list, .collection-books, .book-notes, .library-tools'),
      bookId: button.closest<HTMLElement>('li[data-book-id]')?.dataset.bookId,
      keyboard: button.matches(':focus-visible'),
    } : null
    setUndo({ progress, message })
    setProgress(next)
    setNotice(message)
  }
  const onRead = (id: string) => changeProgress(toggleFinished(progress, id), `${bookById[id].title} marked ${readIds.has(id) ? 'unread' : 'finished'}.`)
  const onCurrent = (id: string) => {
    changeProgress({ ...progress, currentId: id }, readIds.has(id) ? `Reading position set to ${bookById[id].title}.` : `Now reading ${bookById[id].title}.`)
    setSelectedId(id)
  }
  const restoreProgressFocus = () => {
    requestAnimationFrame(() => {
      const trigger = progressTrigger.current
      const group = trigger?.bookId ? trigger.surface?.querySelector(`[data-book-id="${trigger.bookId}"]`) : trigger?.surface
      const buttons = Array.from(group?.querySelectorAll('button') || [])
      const restored = buttons.find((button) => (button.getAttribute('aria-label') || button.textContent.trim()) === trigger?.label)
      const notesHeading = document.querySelector<HTMLElement>('dialog.book-notes:modal [data-initial-focus]')
      const mapNotes = document.querySelector<HTMLElement>('.mobile-expanded .map-reading-notes')
      const currentPage = document.querySelector<HTMLElement>('.primary-nav [aria-current="page"]')
      restoreFocus(trigger?.button, restored, ...buttons, notesHeading, mapNotes, currentPage)
    })
  }
  const undoProgress = () => {
    if (!undo) return
    setProgress({ ...undo.progress, readingOption: progress.readingOption })
    setUndo(null)
    setNotice('Last progress change undone.')
    restoreProgressFocus()
  }
  const onOption = (option: ReadingOption) => { setProgress((saved) => ({ ...saved, readingOption: option })); setNotice(`Reading option: ${readingOptions[option].label}.`) }
  const onSelect = (book: Book) => {
    setSelectedId(book.id)
    setNotice('')
  }
  const exportRoute = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'heresy-pathfinder-route.json'; anchor.click(); URL.revokeObjectURL(url); setNotice('Reading progress exported.') }
  const progressNotice: ProgressNotice = (inDialog = false) => (
    <div className={showProgressNotice ? 'progress-notice' : inDialog ? 'sr-only' : 'notice-bar'} onKeyDown={(event) => {
      if (event.key !== 'Escape' || !showProgressNotice) return
      event.preventDefault()
      event.stopPropagation()
      setNotice('')
      restoreProgressFocus()
    }}>
      <span><span role="status">{notice}</span>{!notice && !inDialog && 'Progress is saved on this device.'}</span>
      {undo && (!inDialog || showProgressNotice) && <button ref={undoButton} className="text-action" onClick={undoProgress}>Undo</button>}
    </div>
  )
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a><header className="topbar"><button className="brand-lockup" onClick={() => setView('map')} aria-label="Pathfinder home"><BookOpen size={25} strokeWidth={1.3} /><span>Pathfinder<small>A Horus Heresy reading companion</small></span></button><nav className="primary-nav" aria-label="Primary navigation">{([['map', 'Explore'], ['library', 'My library']] as const).map(([id, label]) => <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{label}</button>)}</nav><div className="header-progress"><span>{readIds.size} / {books.length} finished</span><progress aria-label="Works finished" value={readIds.size} max={books.length} /></div></header>
    <main id="main">{storageError && <div className="storage-error" role="alert">Your browser could not save progress. Keep this page open and <button onClick={exportRoute}>export your progress</button>.</div>}{view === 'map' ? <Explore progressNotice={progressNotice} readingOption={progress.readingOption} onOption={onOption} selectedId={selectedId} onSelect={onSelect} currentId={progress.currentId} readIds={readIds} onRead={onRead} onCurrent={onCurrent} /> : <Collection progressNotice={progressNotice} readingOption={progress.readingOption} selectedId={selectedId} onSelect={onSelect} currentId={progress.currentId} readIds={readIds} onRead={onRead} onCurrent={onCurrent} />}
      {view === 'library' && <div className="library-tools"><button className="quiet-action" onClick={exportRoute}><Download size={16} />Export progress</button>{confirmReset ? <div className="reset-confirm"><span>Clear all reading progress?</span><button className="quiet-action" onClick={() => { changeProgress({ ...progress, readIds: [], currentId: 'horus-rising' }, 'Progress cleared.'); setSelectedId('horus-rising'); setConfirmReset(false) }}>Clear progress</button><button className="text-action" onClick={() => setConfirmReset(false)}>Cancel</button></div> : <button className="text-action" onClick={() => setConfirmReset(true)}>Reset progress</button>}</div>}
    </main><footer className="site-footer"><span>Pathfinder <span className="footer-divider">/</span> An unofficial companion to source reading guides</span><div><a href="https://www.kylebb.com/HH/HHSeriesOrder.svg" target="_blank" rel="noreferrer">Reference flowchart <ArrowUpRight size={13} /></a><a href="https://gaming.kylebb.com/hhtimeline/" target="_blank" rel="noreferrer">Reading timeline <ArrowUpRight size={13} /></a></div></footer></div>
}
