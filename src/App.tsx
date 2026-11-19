import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowUpRight, BookOpen, Check, Download, Map, Minus, Plus, RotateCcw, Search, Target, X, ArrowRight, List, Crosshair, Info, Maximize, Minimize, SlidersHorizontal } from 'lucide-react'
import { bookById, books, referenceCollections, type Book, type Connection } from './data'
import { parseProgress, toggleFinished, type Progress } from './progress'
import { getConnections, getOptionBooks, getSequenceBookIds, isReference, readingOptions, referenceNodeByBookId, referencePositions, siegeBookNumbers, type ReadingOption } from './reading-options'
import { BookType, bookTypes } from './book-types'
import { getReachableBookIds, getNextSteps } from './logic'
import { edgePath, getEdgeRoute, getConnectionFocus, layoutSourceFlow, NODE_WIDTH, NODE_HEIGHT } from './map-layout'
import { centreOnBook, fitMap, mapShowsBook, stepMapZoom, type MapCamera } from './map-camera'

type View = 'map' | 'library'
type MapMode = 'map' | 'list'

const STORAGE_KEY = 'heresy-pathfinder-progress'
const MOBILE_VIEW = '(max-width: 760px)'

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

const BookNode = memo(function BookNode({ book, selected, dimmed, readIds, currentId, recommended, onSelect }: { book: Book; selected: boolean; dimmed: boolean; readIds: Set<string>; currentId: string; recommended: boolean; onSelect: (book: Book) => void }) {
  const titleLines = splitTitle(book.shortTitle)
  const colour = referenceNodeByBookId[book.id]
  const { label: typeLabel, Icon: TypeIcon } = bookTypes[book.kind]
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
      aria-label={`${book.title}, ${typeLabel}, ${readIds.has(book.id) ? 'read' : currentId === book.id ? 'current book' : 'unread'}`}
      data-book-id={book.id}
      data-book-kind={book.kind}
      onClick={() => onSelect(book)}
      onKeyDown={onKeyDown}
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
    </g>
  )
})

function MapCanvas({
  selectedId, currentId, readIds, visibleBooks, highlightPaths, focusConnections, referenceLayout, recommendedIds,
  active, onSelect, camera, atlasAnchor, onCameraChange, connections, routeOnly,
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
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  const hadRouteFilter = useRef(routeOnly)
  const [size, setSize] = useState({ width: 1000, height: 600 })
  const drag = useRef<{ x: number; y: number; mapX: number; mapY: number } | null>(null)
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
  const locateOnSelect = zoom < 0.65
  const selectNode = useCallback((book: Book) => onSelect(book, locateOnSelect), [onSelect, locateOnSelect])

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
    const fit = fitMap(visibleBooks, { width: shell.clientWidth, height: shell.clientHeight }, 40)
    const book = selected ?? visibleBooks[0]
    onCameraChange(fit.zoom === 1 || !book ? fit : centreOnBook(book))
  }, [active, camera, visibleBooks, selected, onCameraChange])

  useEffect(() => {
    const enabledRouteFilter = routeOnly && !hadRouteFilter.current
    hadRouteFilter.current = routeOnly
    if (!enabledRouteFilter || focusConnections || mapShowsBook(visibleBooks, size, view)) return
    const fallback = selected ?? placedById[currentId] ?? visibleBooks[0]
    if (fallback) onCameraChange({ bookId: fallback.id })
  }, [routeOnly, focusConnections, visibleBooks, size, view, selected, placedById, currentId, onCameraChange])

  const zoomBy = (direction: 1 | -1) => onCameraChange({ ...view, zoom: stepMapZoom(zoom, direction, fitted.zoom) })
  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || (event.target as Element).closest('[role=button]')) return
    drag.current = { x: event.clientX, y: event.clientY, mapX: view.x, mapY: view.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const start = drag.current
    if (!start) return
    onCameraChange({ x: start.mapX - (event.clientX - start.x) / zoom, y: start.mapY - (event.clientY - start.y) / zoom, zoom })
  }
  const stopDrag = () => { drag.current = null }

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
          role="group" aria-label="Source connections"
          onPointerDown={handlePointerDown}
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
          <g className="map-world" style={{ transform: `translate(calc(50% + ${-view.x * zoom}px), calc(50% + ${-view.y * zoom}px)) scale(${zoom})` }}>
            {[...paths].sort((a, b) => Number(a.from === focusId) - Number(b.from === focusId)).map((edge) => {
              const active = edge.from === focusId
              const dimmed = Boolean(focusId) && !active && !focusConnections
              return <g key={`${edge.from}-${edge.to}`}><path className="map-edge-clearance" d={edge.path} /><path className={`map-edge ${active ? 'active' : ''} ${dimmed ? 'dimmed' : ''} ${edge.kind}`} d={edge.path} markerEnd={`url(#${active ? 'arrowhead-active' : 'arrowhead'})`} /></g>
            })}
            {visibleBooks.map((book) => <BookNode key={book.id} book={book} selected={selectedId === book.id} dimmed={Boolean(focusId) && !highlightedIds.has(book.id)} readIds={readIds} currentId={currentId} recommended={recommendedIds.has(book.id)} onSelect={selectNode} />)}
          </g>
        </svg>
        {visibleBooks.length > 0 && <div className="map-hint"><span className="drag-dot" /> Drag to browse</div>}
      </div>
    </div>
  )
}

type BookActions = { readingOption: ReadingOption; readIds: Set<string>; currentId: string; onRead: (id: string) => void; onCurrent: (id: string) => void }

function ReadingActions({ book, readIds, currentId, onRead, onCurrent }: BookActions & { book: Book }) {
  return <div className="book-actions">
    <button className="primary-action" onClick={() => onCurrent(book.id)} disabled={currentId === book.id}><BookOpen size={16} />{currentId === book.id ? 'Currently reading' : 'Read this next'}</button>
    <button className="quiet-action" aria-pressed={readIds.has(book.id)} onClick={() => onRead(book.id)}>{readIds.has(book.id) ? <RotateCcw size={16} /> : <Check size={16} />}{readIds.has(book.id) ? 'Mark unread' : 'Mark finished'}</button>
  </div>
}

function BookNotes({ book, onSelect, onClose, ...actions }: BookActions & { book: Book; onSelect: (book: Book) => void; onClose: () => void }) {
  const connections = getConnections(actions.readingOption)
  const source = readingOptions[actions.readingOption]
  const sourceSteps = getNextSteps(book.id, new Set(), actions.readingOption)
  const incoming = connections.filter((edge) => edge.to === book.id)
  const outgoing = connections.filter((edge) => edge.from === book.id)
  const labels = { reference: 'Reference arrow', sequence: 'Publisher’s listed order' }
  const referenceNode = referenceNodeByBookId[book.id]
  const collection = book.collectionNumber ? referenceCollections[book.collectionNumber] : undefined
  return <aside id="book-notes" className="book-notes" tabIndex={-1} aria-label="Book notes">
    <div className="notes-heading"><h2>Book notes</h2><IconButton label="Close book notes" onClick={onClose}><X size={18} /></IconButton></div>
    <div className="book-reference">{actions.readingOption === 'siege' && siegeBookNumbers[book.id] ? `Siege book ${siegeBookNumbers[book.id]}` : book.seriesNumber ? `Book ${String(book.seriesNumber).padStart(2, '0')}` : 'Supporting story'} <BookType kind={book.kind} /></div>
    <h3>{book.title}</h3>
    {book.faction && <p className="faction-name">{book.faction}</p>}
    <p className="book-status">{actions.readIds.has(book.id) ? <Check size={15} /> : <BookOpen size={15} />}{actions.readIds.has(book.id) ? 'Finished' : book.id === actions.currentId ? 'Currently reading' : 'Unread'}</p>
    <ReadingActions book={book} {...actions} />
    {collection && <p className="publication-note">{book.collectionNumber === 42 ? 'Adapted in' : 'Collected in'} {collection.bookId ? <button className="text-action" onClick={() => onSelect(bookById[collection.bookId!])}>{collection.title}</button> : <a href={referenceNode.sourceLink} target="_blank" rel="noreferrer">{collection.title} <ArrowUpRight size={12} /></a>} · Book {book.collectionNumber}. Completion is tracked separately.</p>}
    {book.publication && <p className="publication-note">{book.publication}</p>}
    {book.sourceId && <p className="publication-note">Source label: {referenceNode.title}. {book.metadataSourceUrl && <a href={book.metadataSourceUrl} target="_blank" rel="noreferrer">Publication record <ArrowUpRight size={12} /></a>}</p>}
    {book.summary && <details className="story-details" key={book.id}><summary>Show story notes <span>{book.spoilerLevel} spoilers</span></summary><p>{book.summary}</p></details>}
    {incoming.length > 0 && <section className="connection-list"><h4>{!isReference(actions.readingOption) ? 'Earlier in the publisher’s order' : 'Incoming source arrows'}</h4>{incoming.map((edge) => <button key={edge.from} onClick={() => onSelect(bookById[edge.from])}><span>{bookById[edge.from].title}<small>{labels[edge.kind]}</small></span><ArrowRight size={15} /></button>)}</section>}
    {outgoing.length > 0 && <section className="connection-list"><h4>Where the story leads</h4>{outgoing.map((edge) => <button key={edge.to} onClick={() => onSelect(bookById[edge.to])}><span>{bookById[edge.to].title}{' '}<small>{labels[edge.kind]}</small></span><ArrowRight size={15} /></button>)}</section>}
    {sourceSteps.some((step) => !step.book) && <section className="connection-list"><h4>Steps in the original flowchart</h4>{sourceSteps.filter((step) => !step.book).map((step) => <a key={step.id} href={step.sourceUrl} target="_blank" rel="noreferrer">{step.title} <ArrowUpRight size={13} /></a>)}</section>}
    <p className="curation-note">No story arc is assigned in this catalogue. Connections follow <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.label}</a>. Missing steps are not joined across.</p>
  </aside>
}

const BookList = memo(function BookList({ items, selectedId, onSelect, sequence = false, ...actions }: BookActions & { items: Book[]; selectedId: string; onSelect: (book: Book) => void; sequence?: boolean }) {
  const orderedIds = getSequenceBookIds(actions.readingOption)
  return <ol className="book-list">{items.map((book) => <li key={book.id} data-book-id={book.id} className={selectedId === book.id ? 'selected' : ''}>
    <span className="book-number" aria-label={sequence ? `List position ${orderedIds.indexOf(book.id) + 1}` : undefined}>{sequence ? String(orderedIds.indexOf(book.id) + 1).padStart(2, '0') : book.seriesNumber ? String(book.seriesNumber).padStart(2, '0') : '—'}</span>
    <button className="list-book" aria-pressed={selectedId === book.id} onClick={() => onSelect(book)}><strong>{referenceNodeByBookId[book.id] && <svg className="reference-colour-mark" width="14" height="14" aria-hidden="true"><rect x="0.5" y="0.5" width="13" height="13" fill={referenceNodeByBookId[book.id].fill} stroke={referenceNodeByBookId[book.id].stroke} /></svg>}{book.title}</strong><span>{book.faction && `${book.faction} · `}<BookType kind={book.kind} />{actions.readingOption === 'siege' && siegeBookNumbers[book.id] ? ` · Siege book ${siegeBookNumbers[book.id]}` : ''}</span></button>
    <span className="list-status">{actions.readIds.has(book.id) ? <><Check size={15} />Finished</> : book.id === actions.currentId ? <><BookOpen size={15} />Reading</> : 'Unread'}</span>
    <button className="icon-button" aria-label={`${actions.readIds.has(book.id) ? 'Mark unread' : 'Mark finished'}: ${book.title}`} aria-pressed={actions.readIds.has(book.id)} onClick={() => actions.onRead(book.id)}>{actions.readIds.has(book.id) ? <RotateCcw size={17} /> : <Check size={17} />}</button>
  </li>)}</ol>
})

function mapStartBook(option: ReadingOption, selectedId: string, currentId: string) {
  const available = getOptionBooks(option)
  return available.find((book) => book.id === selectedId) ??
    available.find((book) => book.id === currentId) ??
    (isReference(option) ? bookById['horus-rising'] : available[0])
}

function Explore({ currentId, readIds, onRead, onCurrent, selectedId, onSelect, readingOption, onOption }: BookActions & { selectedId: string; onSelect: (book: Book) => void; onOption: (option: ReadingOption) => void }) {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<MapMode>('map')
  const [routeOnly, setRouteOnly] = useState(false)
  const [highlightPaths, setHighlightPaths] = useState(true)
  const [focusConnections, setFocusConnections] = useState(false)
  const [fullMobileMap, setFullMobileMap] = useState(false)
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(MOBILE_VIEW).matches)
  const [notesOpen, setNotesOpen] = useState(false)
  const [atlasCamera, setAtlasCamera] = useState<MapCamera>(() => ({ bookId: selectedId }))
  const [focusCamera, setFocusCamera] = useState<MapCamera>({ focus: true })
  const mapRef = useRef<HTMLDivElement>(null)
  const mobileMapToggleRef = useRef<HTMLButtonElement>(null)
  const mapCloseRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const notesTrigger = useRef<HTMLElement | null>(null)
  const source = readingOptions[readingOption]
  const connections = getConnections(readingOption)
  const nextSteps = useMemo(() => getNextSteps(currentId, readIds, readingOption), [currentId, readIds, readingOption])
  const recommended = nextSteps.length === 1 && nextSteps[0].book ? nextSteps[0] : undefined
  const recommendedIds = new Set(nextSteps.flatMap((step) => step.book ? [step.book.id] : []))
  const routeIds = useMemo(() => getReachableBookIds(currentId, readIds, readingOption), [currentId, readIds, readingOption])
  const actions = { currentId, readIds, onRead, onCurrent, readingOption }
  const optionBooks = useMemo(() => getOptionBooks(readingOption), [readingOption])
  const focusCatalogue = useMemo(() => readingOption === 'reference-novels' ? getOptionBooks('reference') : optionBooks, [readingOption, optionBooks])
  const sourceBooks = useMemo(() => layoutSourceFlow(optionBooks, connections, isReference(readingOption) ? referencePositions : undefined), [optionBooks, connections, readingOption])
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
  const nextPaths = mapSelection ? mapConnections.filter((edge) => edge.from === selectedId && mapIds.has(edge.to)) : []
  const hiddenSteps = mapSelection && readingOption === 'reference-novels' && !focused
    ? connections.filter((edge) => edge.from === selectedId && bookById[edge.to].kind !== 'novel') : []
  const selectedSourceSteps = mapSelection ? getNextSteps(selectedId, new Set(), readingOption).filter((step) => !step.book) : []
  const atlasAnchor = 'bookId' in atlasCamera
    ? sourceBooks.find((book) => book.id === atlasCamera.bookId) ?? sourceBooks.find((book) => book.id === currentId) ?? atlasBooks[0]
    : undefined

  const openNotes = useCallback(() => {
    if (!(document.activeElement as HTMLElement)?.closest('#book-notes')) notesTrigger.current = document.activeElement as HTMLElement
    setNotesOpen(true)
    requestAnimationFrame(() => document.getElementById('book-notes')?.focus())
  }, [])
  const closeNotes = () => { setNotesOpen(false); requestAnimationFrame(() => notesTrigger.current?.focus()) }
  const closeFullMobileMap = () => { setFullMobileMap(false); requestAnimationFrame(() => mobileMapToggleRef.current?.focus()) }

  const selectBook = useCallback((book: Book, locate = true) => {
    onSelect(book)
    if (focusConnections) setFocusCamera({ focus: true })
    else if (locate) setAtlasCamera({ bookId: book.id })
  }, [onSelect, focusConnections])
  const selectMapBook = useCallback((book: Book, locate = true) => {
    selectBook(book, locate)
    setNotesOpen(false)
  }, [selectBook])
  const selectSearchResult = (book: Book) => {
    setSearch('')
    selectMapBook(book)
    requestAnimationFrame(() => mapRef.current?.querySelector<SVGElement>('.map-node.selected')?.focus())
  }
  const selectListBook = useCallback((book: Book) => { selectBook(book); openNotes() }, [selectBook, openNotes])
  const revealBook = (book: Book, showNotes = true) => {
    if (readingOption === 'reference-novels' && book.kind !== 'novel') onOption('reference')
    setSearch('')
    setRouteOnly(false)
    if (optionBooks.some((item) => item.id === book.id)) selectBook(book)
    else {
      setFocusConnections(false)
      setAtlasCamera({ bookId: book.id })
      onSelect(book)
    }
    if (showNotes) openNotes()
  }
  const changeReadingOption = (option: ReadingOption) => {
    const anchor = mapStartBook(option, selectedId, currentId)
    if (anchor.id !== selectedId) onSelect(anchor)
    onOption(option)
    setSearch('')
    setRouteOnly(false)
    setFullMobileMap(false)
    setNotesOpen(false)
    setFocusConnections(false)
    setAtlasCamera({ bookId: anchor.id })
  }

  useEffect(() => {
    const media = window.matchMedia(MOBILE_VIEW)
    const update = () => {
      setNarrow(media.matches)
      if (!media.matches) setFullMobileMap(false)
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
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
    if (!fullMobileMap || !narrow) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    mapCloseRef.current?.focus()
    return () => { document.body.style.overflow = previousOverflow }
  }, [fullMobileMap, narrow])

  const sourceDescription = <>
    <p>{source.description} <a href={source.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} /></a></p>
    {!isReference(readingOption) && <span className="option-progress">{getSequenceBookIds(readingOption).filter((id) => readIds.has(id)).length} / {optionBooks.length} {readingOption === 'siege' ? 'Siege volumes' : 'Saga books'} finished</span>}
  </>
  const filterControls = <>
    <label className="route-checkbox"><input type="checkbox" checked={routeOnly} onChange={(event) => setRouteOnly(event.target.checked)} />Only my onward route</label>
    {mode === 'map' && <label className="route-checkbox highlight-checkbox"><input type="checkbox" checked={highlightPaths} onChange={(event) => setHighlightPaths(event.target.checked)} />Highlight next paths</label>}
  </>
  const mapNotesAction = <button className="quiet-action" onClick={openNotes}>Book notes</button>
  const nextPathLinks = nextPaths.map((edge) => <button key={edge.to} className="text-action" onClick={() => selectMapBook(bookById[edge.to])}><ArrowRight size={14} /><span>{bookById[edge.to].title}{' '}<small>{edge.kind === 'sequence' ? 'Publisher’s listed order' : 'Reference arrow'}</small></span></button>)
  const readingDesk = (
    <section className="reading-desk" aria-label="Your reading route">
      <div className="current-reading"><div className="section-label"><BookOpen size={17} /><h2>{readIds.has(currentId) ? 'Last finished' : 'Reading now'}</h2></div><button className="book-heading" onClick={() => revealBook(bookById[currentId])}>{bookById[currentId].title}</button><p><BookType kind={bookById[currentId].kind} /></p><button className="text-action" onClick={() => onRead(currentId)}>{readIds.has(currentId) ? <RotateCcw size={15} /> : <Check size={15} />}{readIds.has(currentId) ? 'Mark unread' : 'Mark finished'}</button></div>
      <div className="next-reading"><div className="section-label"><ArrowRight size={17} /><h2>{isReference(readingOption) ? 'Next source steps' : 'Read next'}</h2></div>{recommended?.book ? <><button className="book-heading" onClick={() => revealBook(recommended.book!)}>{recommended.title}</button><p>{recommended.explanation}</p><div className="next-actions"><button className="quiet-action" onClick={() => { onCurrent(recommended.book!.id); revealBook(recommended.book!) }}>Start reading <ArrowRight size={16} /></button><button className="text-action" onClick={() => { if (mode === 'list') setMode('map'); setFullMobileMap(narrow); revealBook(recommended.book!, false); if (!narrow) requestAnimationFrame(() => mapRef.current?.scrollIntoView({ block: 'start' })) }}>Show on map</button></div></> : nextSteps.length ? <><p>Choose a source path. These choices have no app ranking.</p><ul className="source-steps">{nextSteps.map((step) => <li key={step.id}>{step.book ? <button className="text-action" onClick={() => revealBook(step.book!)}>{step.title}<ArrowRight size={14} /></button> : <a href={step.sourceUrl} target="_blank" rel="noreferrer">{step.title}<ArrowUpRight size={14} /><small>{step.explanation}</small></a>}</li>)}</ul></> : <><h3>{readingOption === 'siege' ? 'End of the numbered Siege series.' : readingOption === 'saga' ? 'End of the Saga selection.' : 'No next step is recorded here.'}</h3><p>{readingOption === 'siege' ? 'The main series ends at The End and the Death: Volume III. Earlier unfinished volumes remain in the list below; related stories are in the publisher’s catalogue.' : readingOption === 'saga' ? 'This selection stops at Slaves to Darkness. Any earlier unfinished books remain in the list below.' : 'Check the original flowchart for its full route and coverage.'}</p><a className="text-action" href={source.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={14} /></a></>}</div>
    </section>
  )
  return <>
    <h1 className="sr-only">Explore reading options</h1>
    {!narrow && readingDesk}
    <div className="atlas-header">
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
      {narrow && mode === 'map' && <button ref={mobileMapToggleRef} className="mobile-map-toggle text-action" aria-expanded={fullMobileMap} aria-controls="atlas-map" onClick={() => setFullMobileMap(true)}><Maximize size={15} />Expand map</button>}
    </div>
    <section className="reading-option explore-reading-option" aria-label="Reading option">
      <label className="select-field"><span>Reading option</span><select aria-label="Reading option" value={readingOption} onChange={(event) => changeReadingOption(event.target.value as ReadingOption)}>{Object.entries(readingOptions).map(([id, option]) => <option key={id} value={id}>{option.label}</option>)}</select></label>
      {narrow ? <details className="explore-filters">
        <summary><SlidersHorizontal size={15} />Filters{routeOnly ? ' (1)' : ''}</summary>
        <div className="explore-filter-controls">{filterControls}{sourceDescription}</div>
      </details> : sourceDescription}
    </section>
    <div className="atlas-toolbar explore-toolbar">
      <div className="search-summary">
        <label className="search-field"><Search size={17} /><input ref={searchRef} aria-label="Search titles or legions" placeholder="Find a title or legion" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        {search && <IconButton label="Clear search" onClick={() => { setSearch(''); searchRef.current?.focus() }}><X size={16} /></IconButton>}
        {mode === 'list' && <span className="book-count" role="status">{matches.length} {matches.length === 1 ? 'work' : 'works'}{isReference(readingOption) ? ' · Titles A–Z' : ''}</span>}
      </div>
      {!narrow && filterControls}
    </div>
    <div className="atlas-workspace"><section className="atlas-main" aria-label="Books and connections">
      <div role="tabpanel" id="view-panel-map" aria-labelledby="view-tab-map" tabIndex={0} hidden={mode !== 'map'}>
        {query && <section className="map-search-results" aria-label="Search results">
          <p role="status">{matches.length ? `${matches.length} ${matches.length === 1 ? 'result' : 'results'}` : 'No works match this search.'}</p>
          {matches.length > 0 && <ul>{matches.map((book) => <li key={book.id}><button className="map-search-result" onClick={() => selectSearchResult(book)}><span>{book.title}</span><BookType kind={book.kind} /></button></li>)}</ul>}
        </section>}
        <div id="atlas-map" ref={mapRef} className={`atlas-map${fullMobileMap ? ' mobile-expanded' : ''}${focused ? ' atlas-map-focused' : ''}`}>
          <div className="map-heading">
            {fullMobileMap && <button ref={mapCloseRef} className="map-fullscreen-close quiet-action" onClick={closeFullMobileMap}><Minimize size={15} />Back to map</button>}
            <button className="text-action" aria-pressed={focusConnections} disabled={!focused && !mapSelection} onClick={() => {
              if (!focused) setFocusCamera({ focus: true })
              setFocusConnections(!focusConnections)
            }}>{focused ? 'Back to atlas' : 'Focus connections'}</button>
            {fullMobileMap && <label className="route-checkbox"><input type="checkbox" checked={highlightPaths} onChange={(event) => setHighlightPaths(event.target.checked)} />Next paths</label>}
            <span className="book-count" role="status">{focused ? `${focused.edges.length} direct ${focused.edges.length === 1 ? 'link' : 'links'}` : `${mapBooks.length} ${mapBooks.length === 1 ? 'work' : 'works'}`}</span>
            {!narrow && mapSelection && mapNotesAction}
          </div>
          <MapCanvas active={mode === 'map'} referenceLayout={isReference(readingOption) && !focused} routeOnly={routeOnly} camera={focused ? focusCamera : atlasCamera} atlasAnchor={atlasAnchor} onCameraChange={focused ? setFocusCamera : setAtlasCamera} selectedId={mapSelection?.id ?? null} currentId={currentId} readIds={readIds} visibleBooks={mapBooks} highlightPaths={highlightPaths} focusConnections={Boolean(focused)} connections={mapConnections} recommendedIds={recommendedIds} onSelect={selectMapBook} />
          <section className="map-selected" aria-label="Selected book">
            {mapSelection ? <>
              <div className="map-selected-heading">
                <div><small>Selected book</small><h2>{mapSelection.title}</h2></div>
                {narrow && <div className="map-selected-actions">{mapNotesAction}</div>}
              </div>
              <div className="map-selected-detail"><span className={`selection-status${readIds.has(selectedId) || selectedId === currentId ? ' reading-status' : ''}`}>{readIds.has(selectedId) ? 'Finished' : currentId === selectedId ? 'Reading now' : 'Unread'}</span><BookType kind={mapSelection.kind} /></div>
              {highlightPaths && nextPaths.length === 1 && <div className="next-paths">{nextPathLinks}</div>}
              {highlightPaths && nextPaths.length > 1 && <details className="next-paths"><summary>Next paths ({nextPaths.length})</summary><div>{nextPathLinks}</div></details>}
              {hiddenSteps.length > 0 && <div className="hidden-stories"><span>{hiddenSteps.length} next {hiddenSteps.length === 1 ? 'step is' : 'steps are'} hidden by Novels only.</span><button className="text-action" onClick={() => onOption('reference')}>Show all stories <ArrowRight size={14} /></button></div>}
              {selectedSourceSteps.length > 0 && <div className="source-paths"><span>Unresolved source steps</span>{selectedSourceSteps.map((step) => <a key={step.id} href={step.sourceUrl} target="_blank" rel="noreferrer">{step.title} <ArrowUpRight size={13} /></a>)}</div>}
            </> : <p>{mapBooks.length ? 'The selected book is hidden by the current reading option or filters.' : 'No works match these filters.'}</p>}
            {!mapBooks.length && routeOnly && <button className="text-action" onClick={() => setRouteOnly(false)}>Clear onward-route filter</button>}
          </section>
        </div>
        <div className="map-caption"><span><span className="status-sample selected" />Selected</span><span><BookOpen size={13} />Reading</span><span><Check size={13} />Finished</span></div>
      </div>
      <div role="tabpanel" id="view-panel-list" aria-labelledby="view-tab-list" tabIndex={0} hidden={mode !== 'list'}>
        {matches.length === 0 ? <div className="empty-state"><h2>No books found</h2><p>Try another title, or clear the filters.</p><button className="quiet-action" onClick={() => { setSearch(''); setRouteOnly(false) }}>Clear filters</button></div> : <div className="list-view"><BookList sequence={!isReference(readingOption)} items={matches} selectedId={selectedId} onSelect={selectListBook} {...actions} /></div>}
      </div>
    </section>{notesOpen && <BookNotes book={bookById[selectedId]} onSelect={revealBook} onClose={closeNotes} {...actions} />}</div>
    {narrow && readingDesk}
    {readingOption !== 'siege' && <section className="reading-option siege-continuation" aria-label="Siege of Terra continuation"><h2>Siege of Terra</h2><p>The reference reaches The Solar War. Continue through Black Library’s numbered main series, including all three final volumes. <a href={readingOptions.siege.sourceUrl} target="_blank" rel="noreferrer">View publisher source <ArrowUpRight size={13} /></a></p><button className="quiet-action" onClick={() => { changeReadingOption('siege'); setMode('list'); requestAnimationFrame(() => document.getElementById('main')?.scrollIntoView({ block: 'start' })) }}>Explore Siege of Terra <ArrowRight size={16} /></button></section>}
  </>
}

function Collection({ selectedId, onSelect, ...actions }: BookActions & { selectedId: string; onSelect: (book: Book) => void }) {
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
  return <><div className="collection-heading"><h1>Your reading library.</h1><p>{`${actions.readIds.size} of ${books.length} works finished. Your progress stays in this browser.`}</p></div>
    <div className="atlas-toolbar"><label className="search-field"><Search size={17} /><input aria-label="Search collection" placeholder="Find a title or legion" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="select-field"><span>Status</span><select aria-label="Reading status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All works</option><option value="finished">Finished</option><option value="unread">Unread</option></select></label></div>
    <div className="atlas-workspace"><section className="collection-books">{items.length === 0 ? <div className="empty-state"><h2>No books here yet</h2><p>Change the status filter or search to see more books.</p><button className="quiet-action" onClick={() => { setQuery(''); setFilter('all') }}>Show all books</button></div> : <BookList items={items} selectedId={selectedId} onSelect={selectAndShowNotes} {...actions} />}</section>{notesOpen && <BookNotes book={bookById[selectedId]} onSelect={selectAndShowNotes} onClose={closeNotes} {...actions} />}</div>
  </>
}

export function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [view, setView] = useState<View>('map')
  const [selectedId, setSelectedId] = useState(() => mapStartBook(progress.readingOption, progress.currentId, progress.currentId).id)
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [undo, setUndo] = useState<Progress | null>(null)
  const readIds = useMemo(() => new Set(progress.readIds), [progress.readIds])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setStorageError(false) } catch { setStorageError(true) } }, [progress])
  const onRead = (id: string) => { setUndo(progress); setProgress(toggleFinished(progress, id)); setNotice(`${bookById[id].title} marked ${readIds.has(id) ? 'unread' : 'finished'}.`) }
  const onCurrent = (id: string) => { setUndo(progress); setProgress({ ...progress, currentId: id }); setSelectedId(id); setNotice(`Now reading ${bookById[id].title}.`) }
  const onOption = (option: ReadingOption) => { setProgress((saved) => ({ ...saved, readingOption: option })); setNotice(`Reading option: ${readingOptions[option].label}.`) }
  const onSelect = (book: Book) => { setSelectedId(book.id); setNotice(`Selected: ${book.title}.`) }
  const exportRoute = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'heresy-pathfinder-route.json'; anchor.click(); URL.revokeObjectURL(url); setNotice('Reading progress exported.') }
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a><header className="topbar"><button className="brand-lockup" onClick={() => setView('map')} aria-label="Pathfinder home"><BookOpen size={25} strokeWidth={1.3} /><span>Pathfinder<small>A Horus Heresy reading companion</small></span></button><nav className="primary-nav" aria-label="Primary navigation">{([['map', 'Explore'], ['library', 'My library']] as const).map(([id, label]) => <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{label}</button>)}</nav><div className="header-progress"><span>{readIds.size} / {books.length} finished</span><progress aria-label="Works finished" value={readIds.size} max={books.length} /></div></header>
    <main id="main">{storageError && <div className="storage-error" role="alert">Your browser could not save progress. Keep this page open and <button onClick={exportRoute}>export your progress</button>.</div>}{view === 'map' ? <Explore readingOption={progress.readingOption} onOption={onOption} selectedId={selectedId} onSelect={onSelect} currentId={progress.currentId} readIds={readIds} onRead={onRead} onCurrent={onCurrent} /> : <Collection readingOption={progress.readingOption} selectedId={selectedId} onSelect={onSelect} currentId={progress.currentId} readIds={readIds} onRead={onRead} onCurrent={onCurrent} />}
      <div className="notice-bar"><span role="status" aria-live="polite">{notice || 'Progress is saved on this device.'}</span>{undo && <button className="text-action" onClick={() => { setProgress({ ...undo, readingOption: progress.readingOption }); setUndo(null); setNotice('Last progress change undone.') }}>Undo</button>}</div>
      {view === 'library' && <div className="library-tools"><button className="quiet-action" onClick={exportRoute}><Download size={16} />Export progress</button>{confirmReset ? <div className="reset-confirm"><span>Clear all reading progress?</span><button className="quiet-action" onClick={() => { setUndo(progress); setProgress({ ...progress, readIds: [], currentId: 'horus-rising' }); setSelectedId('horus-rising'); setConfirmReset(false); setNotice('Progress cleared. You can undo this change.') }}>Clear progress</button><button className="text-action" onClick={() => setConfirmReset(false)}>Cancel</button></div> : <button className="text-action" onClick={() => setConfirmReset(true)}>Reset progress</button>}</div>}
    </main><footer className="site-footer"><span>Pathfinder <span className="footer-divider">/</span> An unofficial companion to source reading guides</span><div><a href="https://www.kylebb.com/HH/HHSeriesOrder.svg" target="_blank" rel="noreferrer">Reference flowchart <ArrowUpRight size={13} /></a><a href="https://gaming.kylebb.com/hhtimeline/" target="_blank" rel="noreferrer">Reading timeline <ArrowUpRight size={13} /></a></div></footer></div>
}
