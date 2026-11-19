import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, BookOpen, Check, Download, Map, Minus, Plus, RotateCcw, Search, Target, X, ArrowRight, List } from 'lucide-react'
import { bookById, books, referenceCollections, type Book, type Connection } from './data'
import { parseProgress, toggleFinished, type Progress } from './progress'
import { getConnections, getOptionBooks, getSequenceBookIds, isReference, readingOptions, referenceNodeByBookId, referencePositions, siegeBookNumbers, type ReadingOption } from './reading-options'
import { BookType, bookTypes } from './book-types'
import { getReachableBookIds, getNextSteps } from './logic'
import { FocusDialog, isMobileLayout, restoreFocus, useMobileLayout } from './focus'
import { getDirectionalBook, isMapDirection, revealMapBook, type MapView } from './map-keyboard'
import { edgePath, getEdgeRoute, getConnectionFocus, layoutSourceFlow, NODE_WIDTH, NODE_HEIGHT } from './map-layout'

type View = 'map' | 'library'
type MapMode = 'map' | 'list'

const STORAGE_KEY = 'heresy-pathfinder-progress'
const MAP_WIDTH = 2400
const MAP_HEIGHT = 1300

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

function fitCampaign(visibleBooks: Book[], size: { width: number; height: number }, padding = 80) {
  const left = Math.min(...visibleBooks.map((book) => book.x))
  const top = Math.min(...visibleBooks.map((book) => book.y))
  const right = Math.max(...visibleBooks.map((book) => book.x + NODE_WIDTH))
  const bottom = Math.max(...visibleBooks.map((book) => book.y + NODE_HEIGHT))
  const zoom = Math.min(1, (size.width - padding) / (right - left), (size.height - padding) / (bottom - top))
  return { zoom, pan: { x: size.width / 2 - (left + right) * zoom / 2, y: size.height / 2 - (top + bottom) * zoom / 2 } }
}

function MapCanvas({
  selectedId, currentId, readIds, visibleBooks, highlightPaths, focusConnections, referenceLayout, recommendedIds, onSelect, focusRevision, connections, announcement, onDismissNotes,
}: {
  selectedId: string | null
  currentId: string
  readIds: Set<string>
  visibleBooks: Book[]
  highlightPaths: boolean
  focusConnections: boolean
  referenceLayout: boolean
  focusRevision: number
  recommendedIds: Set<string>
  connections: Connection[]
  onSelect: (book: Book) => void
  announcement: string
  onDismissNotes: () => void
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const hintId = useId()
  const selectionId = useId()
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<MapView>({ zoom: 1, pan: { x: 0, y: 0 } })
  const [keyboardBookId, setKeyboardBookId] = useState<string>()
  const savedView = useRef(view)
  const previousLayout = useRef<{ size: typeof size; visibleKey: string; focusConnections: boolean } | null>(null)
  const lastFocusRevision = useRef(0)
  const { zoom, pan } = view
  const pointerBook = useRef<string | null>(null)
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const visibleKey = visibleBooks.map((book) => [book.id, book.x, book.y].join(':')).join('|')
  const visibleIds = new Set(visibleBooks.map((book) => book.id))
  const visibleConnections = connections.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
  const placedById = Object.fromEntries(visibleBooks.map((book) => [book.id, book]))
  const tabStop = [keyboardBookId, selectedId, currentId].find((id) => id && visibleIds.has(id)) ?? visibleBooks[0]?.id
  const paths = useMemo(() => Object.fromEntries(visibleConnections.map((edge) => [`${edge.from}:${edge.to}`, edgePath(getEdgeRoute(placedById[edge.from], placedById[edge.to], visibleConnections, visibleBooks, referenceLayout))])), [visibleKey, connections, referenceLayout])
  const focusId = highlightPaths ? selectedId : null
  const focusedBookIds = getFocusedBookIds(visibleConnections, focusId)
  const focusPan = (book: Book, scale: number) => ({
    x: size.width / 2 - (book.x + NODE_WIDTH / 2) * scale,
    y: size.height / 2 - (book.y + NODE_HEIGHT / 2) * scale,
  })

  const revealFocus = (book: Book) => {
    const svg = svgRef.current!
    let bounds = svg.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const visibleHeight = () => Math.min(innerHeight, bounds.bottom) - Math.max(0, bounds.top)
    if (visibleHeight() < Math.min(bounds.height * 0.6, NODE_HEIGHT * zoom + 20)) {
      svg.scrollIntoView({ block: 'center', inline: 'nearest' })
      bounds = svg.getBoundingClientRect()
    }
    const toMap = (rect: DOMRect | { left: number; top: number; right: number; bottom: number }) => ({
      left: rect.left - bounds.left, top: rect.top - bounds.top, right: rect.right - bounds.left, bottom: rect.bottom - bounds.top,
    })
    const canvas = toMap({
      left: Math.max(0, bounds.left), top: Math.max(0, bounds.top),
      right: Math.min(document.documentElement.clientWidth, bounds.right), bottom: Math.min(innerHeight, bounds.bottom),
    })
    const mapOverlays = svg.closest('.atlas-map')?.querySelectorAll([
      '.map-controls', '.map-hint', '.map-key[open] > div', '.map-fullscreen-close', '.map-highlight-mobile',
      '.map-selected-mobile', '.mobile-next-books', '.mobile-next-books[open] > div',
    ].join(','))
    const overlays = [...(mapOverlays ?? []), document.querySelector('.progress-notice')]
      .filter((element) => element?.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
      .map((element) => toMap(element!.getBoundingClientRect()))
    const notes = document.querySelector('aside.book-notes')
    if (notes) {
      const notesRect = toMap(notes.getBoundingClientRect())
      const withoutNotes = revealMapBook(book, view, canvas, overlays)
      const withNotes = revealMapBook(book, view, canvas, [...overlays, notesRect])
      if (withoutNotes && (!withNotes || withNotes.zoom < withoutNotes.zoom)) onDismissNotes()
      else overlays.push(notesRect)
    }
    setView((current) => revealMapBook(book, current, canvas, overlays) ?? current)
  }

  useLayoutEffect(() => {
    const shell = shellRef.current!
    const update = () => {
      const { clientWidth: width, clientHeight: height } = shell
      if (width && height) setSize((previous) => width === previous.width && height === previous.height ? previous : { width, height })
    }
    const observer = new ResizeObserver(update)
    observer.observe(shell)
    update()
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    if (!size.width || !visibleBooks.length) return
    const previous = previousLayout.current
    previousLayout.current = { size, visibleKey, focusConnections }
    const resizeView = (current: MapView) => previous ? { ...current, pan: {
      x: current.pan.x + (size.width - previous.size.width) / 2,
      y: current.pan.y + (size.height - previous.size.height) / 2,
    } } : current
    if (previous?.focusConnections) savedView.current = resizeView(savedView.current)
    if (previous?.visibleKey === visibleKey && previous.focusConnections === focusConnections) {
      setView(resizeView)
    } else if (focusConnections) {
      if (!previous?.focusConnections) savedView.current = resizeView(view)
      setView(fitCampaign(visibleBooks, size, 40))
    } else if (previous?.focusConnections) {
      setView(savedView.current)
    } else {
      const fitted = fitCampaign(visibleBooks, size)
      const book = placedById[selectedId || currentId] || visibleBooks[0]
      setView(fitted.zoom < 0.6 ? { zoom: 0.9, pan: focusPan(book, 0.9) } : fitted)
    }
    const focused = document.activeElement?.getAttribute('data-book-id')
    if (focused && svgRef.current?.contains(document.activeElement) && placedById[focused]) revealFocus(placedById[focused])
  }, [visibleKey, focusConnections, size])
  useLayoutEffect(() => {
    if (!size.width || lastFocusRevision.current === focusRevision) return
    lastFocusRevision.current = focusRevision
    const book = placedById[selectedId || currentId]
    if (book) setView({ zoom: 0.9, pan: focusPan(book, 0.9) })
  }, [focusRevision, size])

  const moveFocus = (event: KeyboardEvent<SVGGElement>, book: Book) => {
    if (!isMapDirection(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    event.preventDefault()
    const next = getDirectionalBook(book, visibleBooks, event.key)
    if (next) svgRef.current?.querySelector<SVGGElement>('[data-book-id="' + CSS.escape(next.id) + '"]')?.focus({ preventScroll: true })
    else revealFocus(book)
  }

  const zoomBy = (step: number) => {
    setView(({ zoom, pan }) => {
      const nextZoom = Math.max(0.18, Math.min(1.5, zoom + step))
      const ratio = nextZoom / zoom
      return { zoom: nextZoom, pan: { x: size.width / 2 - (size.width / 2 - pan.x) * ratio, y: size.height / 2 - (size.height / 2 - pan.y) * ratio } }
    })
  }

  const rememberPointerBook = (target: EventTarget) => {
    pointerBook.current = (target as Element).closest('.map-node')?.getAttribute('data-book-id') ?? null
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    rememberPointerBook(event.target)
    if (pointerBook.current) return
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const start = drag.current
    if (!start) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const scale = Math.max(size.width / bounds.width, size.height / bounds.height)
    setView((current) => ({ ...current, pan: { x: start.panX + (event.clientX - start.x) * scale, y: start.panY + (event.clientY - start.y) * scale } }))
  }
  const stopDrag = () => {
    drag.current = null
    pointerBook.current = null
  }

  return (
    <div className={`map-canvas-shell ${highlightPaths ? 'paths-highlighted' : ''} ${zoom < 0.3 ? 'map-overview' : ''}`} ref={shellRef}>
      <svg
        className="map-canvas"
        ref={svgRef}
        viewBox={`0 0 ${size.width || 1000} ${size.height || 600}`}
        role="group" aria-label="Connection map cards" aria-describedby={hintId}
        onPointerDown={handlePointerDown}
        onMouseDown={(event) => rememberPointerBook(event.target)}
        onMouseUp={() => { pointerBook.current = null }}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
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
          <text className="map-axis-label" x="70" y="45">{focusConnections ? 'INCOMING AND OUTGOING CONNECTIONS' : 'FOLLOW THE ARROWS'}</text>
          <line className="map-axis" x1="70" y1="62" x2="1170" y2="62" />
          {[...visibleConnections].sort((a, b) => Number(a.from === focusId) - Number(b.from === focusId)).map((edge) => {
            const active = edge.from === focusId
            const dimmed = Boolean(focusId) && !active && !focusConnections
            return <g key={`${edge.from}-${edge.to}`}><path className="map-edge-clearance" d={paths[`${edge.from}:${edge.to}`]} /><path className={`map-edge ${active ? 'active' : ''} ${dimmed ? 'dimmed' : ''} ${edge.kind}`} d={paths[`${edge.from}:${edge.to}`]} markerEnd={`url(#${active ? 'arrowhead-active' : 'arrowhead'})`} /></g>
          })}
          {visibleBooks.map((book) => <BookNode key={book.id} book={book} selected={selectedId === book.id} active={tabStop === book.id}
            zoom={zoom} selectedDescription={selectionId} dimmed={Boolean(focusId) && !focusedBookIds.has(book.id)}
            readIds={readIds} currentId={currentId} recommended={recommendedIds.has(book.id)}
            onFocus={() => {
              setKeyboardBookId(book.id)
              if (pointerBook.current !== book.id) revealFocus(book)
            }}
            onKeyDown={(event) => moveFocus(event, book)} onSelect={() => { setKeyboardBookId(book.id); onSelect(book) }} />)}
        </g>
      </svg>
      <div className="map-controls" aria-label="Map controls">
        <IconButton label="Zoom out" onClick={() => zoomBy(-0.1)}><Minus size={16} /></IconButton>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <IconButton label="Zoom in" onClick={() => zoomBy(0.1)}><Plus size={16} /></IconButton>
        <span className="control-rule" />
        <button className="map-text-control" onClick={() => setView(fitCampaign(visibleBooks, size, focusConnections ? 40 : 80))}>Fit all</button>
        <IconButton label="Return to my book" disabled={!placedById[currentId]} onClick={() => setView({ zoom: 0.9, pan: focusPan(placedById[currentId], 0.9) })}><Target size={15} /></IconButton>
        <details className="map-key" onKeyDown={(event) => { if (event.key === 'Escape' && event.currentTarget.open) { event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}><summary>Map key</summary><div><p><b>Arrow:</b> a connection from the selected source.</p><div className="type-key">{Object.keys(bookTypes).map((kind) => <BookType key={kind} kind={kind as Book['kind']} />)}</div><p><b>Card shape:</b> novels have rounded corners. Other works have a folded corner.</p><p><b>Colour mark:</b> the book’s colour in Daunt’s reference. Colours are not unique legion or story arc labels. Books absent from the reference have no mark.</p><p>All stories includes every node in the 2019 reference. Novels only hides other works; arrows never skip hidden steps.</p><p>Select a book to trace its paths. Open Book notes when you want more detail. Drag the Connection map, or use Book list. The reference opening flows left to right; the full reference keeps the original branch arrangement with more vertical space. Positions do not define story arcs or an additional reading order. Focus connections shows only direct incoming and outgoing links; Highlight next paths still marks outgoing arrows.</p></div></details>
      </div>
      <div className="map-hint" id={hintId}>Tab to the cards. Use arrow keys to move. Enter or Space selects.</div>
      <span className="sr-only" id={selectionId}>Selected for Book notes</span>
      <span className="sr-only" role="status">{announcement}</span>
    </div>
  )
}

type ProgressNotice = (inDialog?: boolean) => ReactNode

type BookActions = { readingOption: ReadingOption; readIds: Set<string>; currentId: string; onRead: (id: string) => void; onCurrent: (id: string) => void }

function readingStatus(id: string, readIds: Set<string>, currentId: string) {
  return readIds.has(id) ? 'Finished' : id === currentId ? 'Reading' : 'Unread'
}

function ReadingActions({ book, readIds, currentId, onRead, onCurrent, list = false, notes = false }: BookActions & { book: Book; list?: boolean; notes?: boolean }) {
  const status = readingStatus(book.id, readIds, currentId)
  const finishLabel = status === 'Finished' ? 'Mark unread' : 'Mark finished'
  return <div className="book-actions">
    {status === 'Unread' && <button className={list ? 'text-action' : 'primary-action'} aria-label={`Start reading ${book.title}`} onClick={() => onCurrent(book.id)}>Start reading</button>}
    {notes && status === 'Finished' && book.id !== currentId && <button className="text-action" onClick={() => onCurrent(book.id)}>Continue from here</button>}
    <button className="quiet-action" aria-label={`${finishLabel}: ${book.title}`} onClick={() => onRead(book.id)}>{finishLabel}</button>
  </div>
}

function BookNotes({ book, mobile, notice, onSelect, onClose, ...actions }: BookActions & {
  book: Book
  mobile: boolean
  notice?: ReactNode
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
  const sourceSteps = getNextSteps(book.id, new Set(), actions.readingOption)
  const incoming = connections.filter((edge) => edge.to === book.id)
  const outgoing = connections.filter((edge) => edge.from === book.id)
  const labels = { reference: 'Reference arrow', sequence: 'Publisher’s listed order' }
  const referenceNode = referenceNodeByBookId[book.id]
  const collection = book.collectionNumber ? referenceCollections[book.collectionNumber] : undefined
  const content = <>
    <div className="notes-heading"><h2>Book notes</h2><IconButton label="Close book notes" onClick={() => onClose()}><X size={18} /></IconButton></div>
    <div className="book-reference">{actions.readingOption === 'siege' && siegeBookNumbers[book.id] ? `Siege book ${siegeBookNumbers[book.id]}` : book.seriesNumber ? `Book ${String(book.seriesNumber).padStart(2, '0')}` : 'Supporting story'} <BookType kind={book.kind} /></div>
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
    {sourceSteps.some((step) => !step.book) && <section className="connection-list"><h4>Steps in the original flowchart</h4>{sourceSteps.filter((step) => !step.book).map((step) => <a key={step.id} href={step.sourceUrl} target="_blank" rel="noreferrer">{step.title} <ArrowUpRight size={13} /></a>)}</section>}
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

function Explore({ currentId, readIds, onRead, onCurrent, selectedId, onSelect, readingOption, onOption, progressNotice }: BookActions & { selectedId: string; progressNotice: ProgressNotice; onSelect: (book: Book) => void; onOption: (option: ReadingOption) => void }) {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<MapMode>('map')
  const [routeOnly, setRouteOnly] = useState(false)
  const [highlightPaths, setHighlightPaths] = useState(true)
  const [focusConnections, setFocusConnections] = useState(false)
  const [fullMobileMap, setFullMobileMap] = useState(false)
  const [announcedBookId, setAnnouncedBookId] = useState<string>()
  const [focusRevision, setFocusRevision] = useState(0)
  const mobile = useMobileLayout()
  const mapExpanded = mobile && fullMobileMap
  const mapSlot = useRef<HTMLDivElement>(null)
  const mapOpener = useRef<HTMLElement | null>(null)
  const mobileNextRef = useRef<HTMLDetailsElement>(null)
  const clearMapFiltersRef = useRef<HTMLButtonElement>(null)
  // Move the portal host between the inline map and dialog without remounting the canvas.
  const [mapHost] = useState(() => typeof document === 'undefined' ? null : document.createElement('div'))
  const activeTab = () => document.querySelector<HTMLElement>('.atlas-tabs [aria-selected="true"]')
  const mapCard = (id: string) => mapHost?.querySelector<SVGGElement>('[data-book-id="' + CSS.escape(id) + '"]')
  const { notesOpen, openNotes, closeNotes } = useBookNotes(() =>
    document.querySelector<HTMLElement>('.mobile-expanded .map-reading-notes') ?? activeTab())
  const selectedBook = bookById[selectedId]
  const selectedStatus = readingStatus(selectedId, readIds, currentId)
  const notesModal = mobile && notesOpen
  const source = readingOptions[readingOption]
  const connections = getConnections(readingOption)
  const nextSteps = getNextSteps(currentId, readIds, readingOption)
  const recommended = nextSteps.length === 1 && nextSteps[0].book ? nextSteps[0] : undefined
  const recommendations = nextSteps.filter((step) => step.book)
  const routeIds = getReachableBookIds(currentId, readIds, readingOption)
  const actions = { currentId, readIds, onRead, onCurrent, readingOption }
  const optionBooks = getOptionBooks(readingOption)
  const referenceBooks = getOptionBooks('reference')
  const hiddenSteps = readingOption === 'reference-novels' ? connections.filter((edge) => edge.from === selectedId && bookById[edge.to].kind !== 'novel') : []
  const selectedSourceSteps = getNextSteps(selectedId, new Set(), readingOption).filter((step) => !step.book)
  const visibleBooks = optionBooks.filter((book) => (!search || `${book.title} ${book.faction}`.toLowerCase().includes(search.toLowerCase())) && (!routeOnly || routeIds.has(book.id) || book.id === currentId))
  const optionKey = optionBooks.map((book) => book.id).join('|')
  const sourceBooks = useMemo(() => layoutSourceFlow(optionBooks, connections, isReference(readingOption) ? referencePositions : undefined), [optionKey, readingOption, referencePositions])
  const focused = getConnectionFocus(connections, selectedId)
  const mapBooks = focusConnections
    ? layoutSourceFlow((isReference(readingOption) ? referenceBooks : optionBooks).filter((book) => focused.ids.has(book.id)), focused.edges)
    : sourceBooks.filter((book) => visibleBooks.some((visible) => visible.id === book.id))
  const mapConnections = focusConnections ? focused.edges : connections
  const visibleIds = new Set((focusConnections && mode === 'map' ? mapBooks : visibleBooks).map((book) => book.id))
  const nextPaths = connections.filter((edge) => edge.from === selectedId && visibleIds.has(edge.to))
  const hasMap = mapBooks.length > 0
  const mapModal = mapExpanded && hasMap && mode === 'map'
  useLayoutEffect(() => {
    if (mapSlot.current && mapHost) mapSlot.current.append(mapHost)
  }, [mapExpanded, hasMap, mapHost])
  useLayoutEffect(() => {
    if (!fullMobileMap || mapModal) return
    setFullMobileMap(false)
    if (!notesOpen) requestAnimationFrame(() => {
      if (hasMap) restoreFocus(mapOpener.current, mapCard(selectedId), activeTab())
      else restoreFocus(clearMapFiltersRef.current, activeTab())
    })
  }, [fullMobileMap, mapModal, hasMap])

  const openFullMobileMap = (trigger: HTMLElement) => {
    mapOpener.current = trigger
    setFullMobileMap(true)
  }
  const closeFullMobileMap = () => {
    setFullMobileMap(false)
    requestAnimationFrame(() => restoreFocus(mapOpener.current, mapCard(selectedId), activeTab()))
  }
  const selectMapBook = (book: Book, focusCard = false) => {
    onSelect(book)
    setAnnouncedBookId(book.id)
    closeNotes(false)
    if (mobileNextRef.current) mobileNextRef.current.open = false
    if (focusCard) requestAnimationFrame(() => restoreFocus(mapCard(book.id), activeTab()))
  }
  const selectListBook = (book: Book, trigger: HTMLButtonElement) => {
    setAnnouncedBookId(undefined)
    onSelect(book)
    openNotes(trigger)
  }
  const revealBook = (book: Book, trigger?: HTMLElement) => {
    if (readingOption === 'reference-novels' && book.kind !== 'novel') onOption('reference')
    setSearch('')
    setRouteOnly(false)
    if (!optionBooks.some((item) => item.id === book.id)) setFocusConnections(false)
    setAnnouncedBookId(undefined)
    onSelect(book)
    setFocusRevision((value) => value + 1)
    if (trigger) openNotes(trigger)
  }
  const showOnMap = (book: Book, trigger: HTMLElement) => {
    setMode('map')
    closeNotes(false)
    revealBook(book)
    if (mobile) openFullMobileMap(trigger)
    else requestAnimationFrame(() => restoreFocus(mapCard(book.id), activeTab()))
  }

  const canvas = <MapCanvas referenceLayout={isReference(readingOption) && !focusConnections} focusRevision={focusRevision}
    selectedId={selectedId} currentId={currentId} readIds={readIds} visibleBooks={mapBooks} highlightPaths={highlightPaths}
    focusConnections={focusConnections} connections={mapConnections} recommendedIds={new Set(recommendations.map((item) => item.book!.id))}
    announcement={announcedBookId === selectedId ? 'Selected ' + selectedBook.title + ', ' + bookTypes[selectedBook.kind].label + '.' : ''} onDismissNotes={() => closeNotes(false)} onSelect={selectMapBook} />
  const mapSlotContent = <div className="map-canvas-host" ref={mapSlot}>{!mapHost && canvas}</div>
  const notesButtonLabel = 'Book notes for ' + selectedBook.title
  const phoneReadingBar = <div className="map-selected-mobile" role="group" aria-label="Selected book" onClickCapture={() => {
    if (mobileNextRef.current) mobileNextRef.current.open = false
  }}>
    <button type="button" className="map-reading-notes" aria-label={notesButtonLabel + ', ' + selectedStatus.toLowerCase()}
      aria-haspopup="dialog" onClick={(event) => openNotes(event.currentTarget)}>
      <strong>{selectedBook.title}</strong>
      <small><span>{selectedStatus} · </span>Notes <ArrowUpRight size={11} aria-hidden="true" /></small>
    </button>
    <ReadingActions book={selectedBook} {...actions} />
  </div>
  const clearFilters = () => {
    setSearch('')
    setRouteOnly(false)
    restoreFocus(activeTab())
  }
  return <>
    <section className="reading-desk" aria-label="Your reading route">
      <div className="current-reading"><div className="section-label"><BookOpen size={17} /><h2>{readIds.has(currentId) ? 'Last finished' : 'Reading now'}</h2></div><button className="book-heading" aria-haspopup={mobile ? 'dialog' : undefined} onClick={(event) => revealBook(bookById[currentId], event.currentTarget)}>{bookById[currentId].title}</button><p><BookType kind={bookById[currentId].kind} /></p><button className="text-action" onClick={() => onRead(currentId)}>{readIds.has(currentId) ? <RotateCcw size={15} /> : <Check size={15} />}{readIds.has(currentId) ? 'Mark unread' : 'Mark finished'}</button></div>
      <div className="next-reading"><div className="section-label"><ArrowRight size={17} /><h2>{isReference(readingOption) ? 'Next source steps' : 'Read next'}</h2></div>{recommended?.book ? <><button className="book-heading" aria-haspopup={mobile ? 'dialog' : undefined} onClick={(event) => revealBook(recommended.book!, event.currentTarget)}>{recommended.title}</button><p>{recommended.explanation}</p><div className="next-actions"><button className="quiet-action" onClick={() => onCurrent(recommended.book!.id)}>Start reading <ArrowRight size={16} /></button><button className="text-action" aria-haspopup={mobile ? 'dialog' : undefined} onClick={(event) => showOnMap(recommended.book!, event.currentTarget)}>Show on map</button></div></> : nextSteps.length ? <><p>Choose a source path. These choices have no app ranking.</p><ul className="source-steps">{nextSteps.map((step) => <li key={step.id}>{step.book ? <button className="text-action" aria-haspopup={mobile ? 'dialog' : undefined} onClick={(event) => revealBook(step.book!, event.currentTarget)}>{step.title}<ArrowRight size={14} /></button> : <a href={step.sourceUrl} target="_blank" rel="noreferrer">{step.title}<ArrowUpRight size={14} /><small>{step.explanation}</small></a>}</li>)}</ul></> : <><h3>{readingOption === 'siege' ? 'End of the numbered Siege series.' : readingOption === 'saga' ? 'End of the Saga selection.' : 'No next step is recorded here.'}</h3><p>{readingOption === 'siege' ? 'The main series ends at The End and the Death: Volume III. Earlier unfinished volumes remain in the list below; related stories are in the publisher’s catalogue.' : readingOption === 'saga' ? 'This selection stops at Slaves to Darkness. Any earlier unfinished books remain in the list below.' : 'Check the original flowchart for its full route and coverage.'}</p><a className="text-action" href={source.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={14} /></a></>}</div>
    </section>
    <h1 className="sr-only">Explore reading options</h1>
    <div className="atlas-tabs" role="tablist" aria-label="Explore views">
      {([['map', 'Connection map', Map], ['list', 'Book list', List]] as const).map(([id, label, Icon]) => <button key={id} id={`view-tab-${id}`} role="tab" aria-selected={mode === id} aria-controls={`view-panel-${id}`} tabIndex={mode === id ? 0 : -1} onClick={() => { setMode(id); setFullMobileMap(false) }} onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'map' : event.key === 'End' ? 'list' : mode === 'map' ? 'list' : 'map'
        setMode(next)
        setFullMobileMap(false)
        document.getElementById(`view-tab-${next}`)?.focus()
      }}><Icon size={17} />{label}</button>)}
    </div>
    <section className="reading-option explore-reading-option" aria-label="Reading option">
      <label className="select-field"><span>Reading option</span><select aria-label="Reading option" value={readingOption} onChange={(event) => { onOption(event.target.value as ReadingOption); setSearch(''); setRouteOnly(false); setFullMobileMap(false); closeNotes(false); setFocusConnections(false) }}>{Object.entries(readingOptions).map(([id, option]) => <option key={id} value={id}>{option.label}</option>)}</select></label>
      <p>{source.description} <a href={source.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} /></a></p>
      {!isReference(readingOption) && <span className="option-progress">{getSequenceBookIds(readingOption).filter((id) => readIds.has(id)).length} / {optionBooks.length} {readingOption === 'siege' ? 'Siege volumes' : 'Saga books'} finished</span>}
    </section>
    <div className="atlas-toolbar explore-toolbar">
      <div className="search-summary">
        <label className="search-field"><Search size={17} /><input aria-label="Search titles or legions" placeholder="Find a title or legion" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button className="icon-button" aria-label="Clear search" onClick={() => setSearch('')}><X size={16} /></button>}</label>
        <span className="book-count" role="status">{mode === 'map' ? mapBooks.length : visibleBooks.length} {(mode === 'map' ? mapBooks.length : visibleBooks.length) === 1 ? 'work' : 'works'}{mode === 'map' && focusConnections ? ' · Direct connections' : mode === 'list' && isReference(readingOption) ? ' · Titles A–Z' : ''}</span>
      </div>
      <label className="route-checkbox"><input type="checkbox" checked={routeOnly} onChange={(event) => setRouteOnly(event.target.checked)} />Only my onward route</label>
      {mode === 'map' && <label className="route-checkbox highlight-checkbox"><input type="checkbox" checked={highlightPaths} onChange={(event) => setHighlightPaths(event.target.checked)} />Highlight next paths</label>}
      {mode === 'map' && <label className="route-checkbox focus-checkbox"><input type="checkbox" checked={focusConnections} disabled={!(isReference(readingOption) ? referenceBooks : optionBooks).some((book) => book.id === selectedId)} onChange={(event) => setFocusConnections(event.target.checked)} />Focus connections</label>}

    </div>
    <div className="atlas-workspace"><section className="atlas-main" aria-label="Books and connections">
      {hiddenSteps.length > 0 && !focusConnections && <div className="hidden-stories"><span>{hiddenSteps.length} next {hiddenSteps.length === 1 ? 'step is' : 'steps are'} hidden by Novels only.</span><button className="text-action" onClick={() => onOption('reference')}>Show all stories <ArrowRight size={14} /></button></div>}
      {selectedSourceSteps.length > 0 && <div className="source-paths"><span>Selected work: unresolved source steps</span>{selectedSourceSteps.map((step) => <a key={step.id} href={step.sourceUrl} target="_blank" rel="noreferrer">{step.title} <ArrowUpRight size={13} /></a>)}</div>}
      <div role="tabpanel" id="view-panel-map" aria-labelledby="view-tab-map" tabIndex={0} hidden={mode !== 'map'}>
        <div className="next-paths">
          <strong>Selected: {selectedBook.title}</strong>
          {highlightPaths && (nextPaths.length ? <div className="path-links">{nextPaths.map((edge) => <button key={edge.to} onClick={() => selectMapBook(bookById[edge.to], true)}><ArrowRight size={14} /><span>{bookById[edge.to].title}<small>{edge.kind === 'sequence' ? 'Publisher’s listed order' : 'Reference arrow'}</small></span></button>)}</div> : <span>No catalogue paths are visible. Check source steps and filters.</span>)}
          <div className="map-reading-actions">
            <ReadingActions book={selectedBook} {...actions} />
            <button className="text-action path-notes-action" aria-label={notesButtonLabel} onClick={(event) => openNotes(event.currentTarget)}>Book notes <ArrowRight size={15} /></button>
          </div>
        </div>
        {focusConnections && <p className="focus-description">Direct links to and from the selected book. Filters apply to the full map. Turn off Focus connections to return to your map position.</p>}
        {!hasMap ? <div className="empty-state"><h2>No books found</h2><p>Try another title, or clear the filters.</p><button ref={clearMapFiltersRef} className="quiet-action" onClick={clearFilters}>Clear filters</button></div> : <>
          <button className="mobile-map-toggle text-action" aria-haspopup="dialog" onClick={(event) => openFullMobileMap(event.currentTarget)}><Map size={17} />Expand map</button>
          {mapModal ? <FocusDialog label="Connection map" className="atlas-map mobile-expanded" onClose={closeFullMobileMap}>
            <button data-initial-focus className="map-fullscreen-close quiet-action" onClick={closeFullMobileMap}><Map size={17} />Back to map</button>
            <label className="map-highlight-mobile"><input type="checkbox" checked={highlightPaths} onChange={(event) => setHighlightPaths(event.target.checked)} />Next paths</label>
            <label className="map-highlight-mobile map-focus-mobile"><input type="checkbox" checked={focusConnections} disabled={!(isReference(readingOption) ? referenceBooks : optionBooks).some((book) => book.id === selectedId)} onChange={(event) => setFocusConnections(event.target.checked)} />Focus connections</label>
            {mapSlotContent}
            {highlightPaths && nextPaths.length > 0 && <details ref={mobileNextRef} className="mobile-next-books" onKeyDown={(event) => {
              if (event.key !== 'Escape' || !event.currentTarget.open) return
              event.preventDefault()
              event.stopPropagation()
              event.currentTarget.open = false
              event.currentTarget.querySelector('summary')?.focus()
            }}>
              <summary>Next books</summary>
              <div>{nextPaths.map((edge) => <button type="button" className="text-action" key={edge.to} onClick={() => selectMapBook(bookById[edge.to], true)}>{bookById[edge.to].title}</button>)}</div>
            </details>}
            {phoneReadingBar}
            {!notesModal && progressNotice(true)}
          </FocusDialog> : <div className="atlas-map">{mapSlotContent}{mobile && phoneReadingBar}</div>}
          {mapHost && createPortal(canvas, mapHost)}
        </>}
        <div className="map-caption"><span><span className="status-sample selected" />Selected</span><span><BookOpen size={13} />Reading</span><span><Check size={13} />Finished</span><span className="caption-note">Select a book to trace its paths.</span></div>
      </div>
      <div role="tabpanel" id="view-panel-list" aria-labelledby="view-tab-list" tabIndex={0} hidden={mode !== 'list'}>
        {visibleBooks.length === 0 ? <div className="empty-state"><h2>No books found</h2><p>Try another title, or clear the filters.</p><button className="quiet-action" onClick={clearFilters}>Clear filters</button></div> : <div className="list-view"><BookList mobile={mobile} sequence={!isReference(readingOption)} items={visibleBooks} selectedId={selectedId} onSelect={selectListBook} {...actions} /></div>}
      </div>
    </section>{notesOpen && <BookNotes book={selectedBook} mobile={mobile} notice={notesModal ? progressNotice(true) : undefined} onSelect={revealBook} onClose={closeNotes} {...actions} />}</div>
    {readingOption !== 'siege' && <section className="reading-option siege-continuation" aria-label="Siege of Terra continuation"><h2>Siege of Terra</h2><p>The reference reaches The Solar War. Continue through Black Library’s numbered main series, including all three final volumes. <a href={readingOptions.siege.sourceUrl} target="_blank" rel="noreferrer">View publisher source <ArrowUpRight size={13} /></a></p><button className="quiet-action" onClick={() => { onOption('siege'); setSearch(''); setRouteOnly(false); setMode('list'); setFullMobileMap(false); closeNotes(false); requestAnimationFrame(() => document.getElementById('main')?.scrollIntoView({ block: 'start' })) }}>Explore Siege of Terra <ArrowRight size={16} /></button></section>}
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
  const [selectedId, setSelectedId] = useState(progress.currentId)
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
      surface: button.closest('.reading-desk, .map-reading-actions, .map-selected-mobile, #view-panel-list, .collection-books, .book-notes, .library-tools'),
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
