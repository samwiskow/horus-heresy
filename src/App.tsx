import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowUpRight, BookOpen, Check, Download, Map, Minus, Plus, RotateCcw, Search, Target, X, ArrowRight, List } from 'lucide-react'
import { bookById, books, referenceCollections, type Book, type Connection } from './data'
import { parseProgress, toggleFinished, type Progress } from './progress'
import { getConnections, getOptionBooks, getSequenceBookIds, isReference, readingOptions, referenceNodeByBookId, referencePositions, siegeBookNumbers, type ReadingOption } from './reading-options'
import { BookType, bookTypes } from './book-types'
import { getReachableBookIds, getNextSteps } from './logic'
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

function BookNode({ book, selected, dimmed, readIds, currentId, recommended, onSelect }: { book: Book; selected: boolean; dimmed: boolean; readIds: Set<string>; currentId: string; recommended: boolean; onSelect: (book: Book) => void }) {
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
  selectedId, currentId, readIds, visibleBooks, highlightPaths, focusConnections, referenceLayout, recommendedIds, onSelect, focusRevision, connections,
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
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 1000, height: 600 })
  const [view, setView] = useState(() => fitCampaign(visibleBooks, size))
  const savedView = useRef(view)
  const wasFocused = useRef(false)
  const previousSize = useRef(size)
  const { zoom, pan } = view
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const visibleKey = visibleBooks.map((book) => book.id).join('|')
  const visibleIds = new Set(visibleBooks.map((book) => book.id))
  const visibleConnections = connections.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
  const placedById = Object.fromEntries(visibleBooks.map((book) => [book.id, book]))
  const paths = useMemo(() => Object.fromEntries(visibleConnections.map((edge) => [`${edge.from}:${edge.to}`, edgePath(getEdgeRoute(placedById[edge.from], placedById[edge.to], visibleConnections, visibleBooks, referenceLayout))])), [visibleKey, connections, referenceLayout])
  const focusId = highlightPaths ? selectedId : null
  const focusedBookIds = getFocusedBookIds(visibleConnections, focusId)
  const focusPan = (book: Book, scale: number) => ({
    x: size.width / 2 - (book.x + NODE_WIDTH / 2) * scale,
    y: size.height / 2 - (book.y + NODE_HEIGHT / 2) * scale,
  })

  useEffect(() => {
    const shell = shellRef.current!
    const update = () => { if (shell.clientWidth && shell.clientHeight) setSize({ width: shell.clientWidth, height: shell.clientHeight }) }
    const observer = new ResizeObserver(update)
    observer.observe(shell)
    update()
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (wasFocused.current) {
      savedView.current = { ...savedView.current, pan: {
        x: savedView.current.pan.x + (size.width - previousSize.current.width) / 2,
        y: savedView.current.pan.y + (size.height - previousSize.current.height) / 2,
      } }
    }
    previousSize.current = size
    if (focusConnections) {
      if (!wasFocused.current) savedView.current = view
      setView(fitCampaign(visibleBooks, size, 40))
    } else if (wasFocused.current) {
      setView(savedView.current)
    } else {
      const fitted = fitCampaign(visibleBooks, size)
      const book = placedById[selectedId || currentId] || visibleBooks[0]
      setView(fitted.zoom < 0.6 ? { zoom: 0.9, pan: focusPan(book, 0.9) } : fitted)
    }
    wasFocused.current = focusConnections
  }, [visibleKey, focusConnections, size.width, size.height])
  useEffect(() => {
    if (focusRevision === 0) return
    const book = placedById[selectedId || currentId]
    if (!book) return
    setView({ zoom: 0.9, pan: focusPan(book, 0.9) })
  }, [focusRevision, size.width, size.height])

  const zoomBy = (step: number) => {
    setView(({ zoom, pan }) => {
      const nextZoom = Math.max(0.18, Math.min(1.5, zoom + step))
      const ratio = nextZoom / zoom
      return { zoom: nextZoom, pan: { x: size.width / 2 - (size.width / 2 - pan.x) * ratio, y: size.height / 2 - (size.height / 2 - pan.y) * ratio } }
    })
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest('[role=button]')) return
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
  const stopDrag = () => { drag.current = null }

  return (
    <div className={`map-canvas-shell ${highlightPaths ? 'paths-highlighted' : ''} ${zoom < 0.3 ? 'map-overview' : ''}`} ref={shellRef}>
      <svg
        className="map-canvas"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="group" aria-label="Source connections"
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
          <text className="map-axis-label" x="70" y="45">{focusConnections ? 'INCOMING AND OUTGOING CONNECTIONS' : 'FOLLOW THE ARROWS'}</text>
          <line className="map-axis" x1="70" y1="62" x2="1170" y2="62" />
          {[...visibleConnections].sort((a, b) => Number(a.from === focusId) - Number(b.from === focusId)).map((edge) => {
            const active = edge.from === focusId
            const dimmed = Boolean(focusId) && !active && !focusConnections
            return <g key={`${edge.from}-${edge.to}`}><path className="map-edge-clearance" d={paths[`${edge.from}:${edge.to}`]} /><path className={`map-edge ${active ? 'active' : ''} ${dimmed ? 'dimmed' : ''} ${edge.kind}`} d={paths[`${edge.from}:${edge.to}`]} markerEnd={`url(#${active ? 'arrowhead-active' : 'arrowhead'})`} /></g>
          })}
          {visibleBooks.map((book) => <BookNode key={book.id} book={book} selected={selectedId === book.id} dimmed={Boolean(focusId) && !focusedBookIds.has(book.id)} readIds={readIds} currentId={currentId} recommended={recommendedIds.has(book.id)} onSelect={onSelect} />)}
        </g>
      </svg>
      <div className="map-controls" aria-label="Map controls">
        <IconButton label="Zoom out" onClick={() => zoomBy(-0.1)}><Minus size={16} /></IconButton>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <IconButton label="Zoom in" onClick={() => zoomBy(0.1)}><Plus size={16} /></IconButton>
        <span className="control-rule" />
        <button className="map-text-control" onClick={() => setView(fitCampaign(visibleBooks, size, focusConnections ? 40 : 80))}>Fit all</button>
        <IconButton label="Return to my book" disabled={!placedById[currentId]} onClick={() => setView({ zoom: 0.9, pan: focusPan(placedById[currentId], 0.9) })}><Target size={15} /></IconButton>
        <details className="map-key" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}><summary>Map key</summary><div><p><b>Arrow:</b> a connection from the selected source.</p><div className="type-key">{Object.keys(bookTypes).map((kind) => <BookType key={kind} kind={kind as Book['kind']} />)}</div><p><b>Card shape:</b> novels have rounded corners. Other works have a folded corner.</p><p><b>Colour mark:</b> the book’s colour in Daunt’s reference. Colours are not unique legion or story arc labels. Books absent from the reference have no mark.</p><p>All stories includes every node in the 2019 reference. Novels only hides other works; arrows never skip hidden steps.</p><p>Select a book to trace its paths. Open Book notes when you want more detail. Drag the Connection map, or use Book list. The reference opening flows left to right; the full reference keeps the original branch arrangement with more vertical space. Positions do not define story arcs or an additional reading order. Focus connections shows only direct incoming and outgoing links; Highlight next paths still marks outgoing arrows.</p></div></details>
      </div>
      <div className="map-hint"><span className="drag-dot" /> Drag the map to scan the route</div>
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
    {outgoing.length > 0 && <section className="connection-list"><h4>Where the story leads</h4>{outgoing.map((edge) => <button key={edge.to} onClick={() => onSelect(bookById[edge.to])}><span>{bookById[edge.to].title}<small>{labels[edge.kind]}</small></span><ArrowRight size={15} /></button>)}</section>}
    {sourceSteps.some((step) => !step.book) && <section className="connection-list"><h4>Steps in the original flowchart</h4>{sourceSteps.filter((step) => !step.book).map((step) => <a key={step.id} href={step.sourceUrl} target="_blank" rel="noreferrer">{step.title} <ArrowUpRight size={13} /></a>)}</section>}
    <p className="curation-note">No story arc is assigned in this catalogue. Connections follow <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.label}</a>. Missing steps are not joined across.</p>
  </aside>
}

function BookList({ items, selectedId, onSelect, sequence = false, ...actions }: BookActions & { items: Book[]; selectedId: string; onSelect: (book: Book) => void; sequence?: boolean }) {
  const orderedIds = getSequenceBookIds(actions.readingOption)
  return <ol className="book-list">{items.map((book) => <li key={book.id} data-book-id={book.id} className={selectedId === book.id ? 'selected' : ''}>
    <span className="book-number" aria-label={sequence ? `List position ${orderedIds.indexOf(book.id) + 1}` : undefined}>{sequence ? String(orderedIds.indexOf(book.id) + 1).padStart(2, '0') : book.seriesNumber ? String(book.seriesNumber).padStart(2, '0') : '—'}</span>
    <button className="list-book" aria-pressed={selectedId === book.id} onClick={() => onSelect(book)}><strong>{referenceNodeByBookId[book.id] && <svg className="reference-colour-mark" width="14" height="14" aria-hidden="true"><rect x="0.5" y="0.5" width="13" height="13" fill={referenceNodeByBookId[book.id].fill} stroke={referenceNodeByBookId[book.id].stroke} /></svg>}{book.title}</strong><span>{book.faction && `${book.faction} · `}<BookType kind={book.kind} />{actions.readingOption === 'siege' && siegeBookNumbers[book.id] ? ` · Siege book ${siegeBookNumbers[book.id]}` : ''}</span></button>
    <span className="list-status">{actions.readIds.has(book.id) ? <><Check size={15} />Finished</> : book.id === actions.currentId ? <><BookOpen size={15} />Reading</> : 'Unread'}</span>
    <button className="icon-button" aria-label={`${actions.readIds.has(book.id) ? 'Mark unread' : 'Mark finished'}: ${book.title}`} aria-pressed={actions.readIds.has(book.id)} onClick={() => actions.onRead(book.id)}>{actions.readIds.has(book.id) ? <RotateCcw size={17} /> : <Check size={17} />}</button>
  </li>)}</ol>
}

function Explore({ currentId, readIds, onRead, onCurrent, selectedId, onSelect, readingOption, onOption }: BookActions & { selectedId: string; onSelect: (book: Book) => void; onOption: (option: ReadingOption) => void }) {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<MapMode>('map')
  const [routeOnly, setRouteOnly] = useState(false)
  const [highlightPaths, setHighlightPaths] = useState(true)
  const [focusConnections, setFocusConnections] = useState(false)
  const [fullMobileMap, setFullMobileMap] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [focusRevision, setFocusRevision] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  const mobileMapToggleRef = useRef<HTMLButtonElement>(null)
  const mapCloseRef = useRef<HTMLButtonElement>(null)
  const notesTrigger = useRef<HTMLElement | null>(null)
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
  const openNotes = () => {
    if (!(document.activeElement as HTMLElement)?.closest('#book-notes')) notesTrigger.current = document.activeElement as HTMLElement
    setNotesOpen(true)
    requestAnimationFrame(() => document.getElementById('book-notes')?.focus())
  }
  const closeNotes = () => { setNotesOpen(false); requestAnimationFrame(() => notesTrigger.current?.focus()) }
  const closeFullMobileMap = () => { setFullMobileMap(false); requestAnimationFrame(() => mobileMapToggleRef.current?.focus()) }
  const selectMapBook = (book: Book) => {
    onSelect(book)
    setNotesOpen(false)
  }
  const selectListBook = (book: Book) => { onSelect(book); openNotes() }
  const revealBook = (book: Book, showNotes = true) => { if (readingOption === 'reference-novels' && book.kind !== 'novel') onOption('reference'); setSearch(''); setRouteOnly(false); if (!optionBooks.some((item) => item.id === book.id)) setFocusConnections(false); onSelect(book); setFocusRevision((value) => value + 1); if (showNotes) openNotes(); else requestAnimationFrame(() => document.querySelector('.list-view [data-book-id="' + book.id + '"]')?.scrollIntoView({ block: 'center' })) }
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
  return <>
    <section className="reading-desk" aria-label="Your reading route">
      <div className="current-reading"><div className="section-label"><BookOpen size={17} /><h2>{readIds.has(currentId) ? 'Last finished' : 'Reading now'}</h2></div><button className="book-heading" onClick={() => revealBook(bookById[currentId])}>{bookById[currentId].title}</button><p><BookType kind={bookById[currentId].kind} /></p><button className="text-action" onClick={() => onRead(currentId)}>{readIds.has(currentId) ? <RotateCcw size={15} /> : <Check size={15} />}{readIds.has(currentId) ? 'Mark unread' : 'Mark finished'}</button></div>
      <div className="next-reading"><div className="section-label"><ArrowRight size={17} /><h2>{isReference(readingOption) ? 'Next source steps' : 'Read next'}</h2></div>{recommended?.book ? <><button className="book-heading" onClick={() => revealBook(recommended.book!)}>{recommended.title}</button><p>{recommended.explanation}</p><div className="next-actions"><button className="quiet-action" onClick={() => { onCurrent(recommended.book!.id); revealBook(recommended.book!) }}>Start reading <ArrowRight size={16} /></button><button className="text-action" onClick={() => { if (mode === 'list') setMode('map'); setFullMobileMap(true); revealBook(recommended.book!, false); requestAnimationFrame(() => mapRef.current?.scrollIntoView({ block: 'center' })) }}>Show on map</button></div></> : nextSteps.length ? <><p>Choose a source path. These choices have no app ranking.</p><ul className="source-steps">{nextSteps.map((step) => <li key={step.id}>{step.book ? <button className="text-action" onClick={() => revealBook(step.book!)}>{step.title}<ArrowRight size={14} /></button> : <a href={step.sourceUrl} target="_blank" rel="noreferrer">{step.title}<ArrowUpRight size={14} /><small>{step.explanation}</small></a>}</li>)}</ul></> : <><h3>{readingOption === 'siege' ? 'End of the numbered Siege series.' : readingOption === 'saga' ? 'End of the Saga selection.' : 'No next step is recorded here.'}</h3><p>{readingOption === 'siege' ? 'The main series ends at The End and the Death: Volume III. Earlier unfinished volumes remain in the list below; related stories are in the publisher’s catalogue.' : readingOption === 'saga' ? 'This selection stops at Slaves to Darkness. Any earlier unfinished books remain in the list below.' : 'Check the original flowchart for its full route and coverage.'}</p><a className="text-action" href={source.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={14} /></a></>}</div>
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
      <label className="select-field"><span>Reading option</span><select aria-label="Reading option" value={readingOption} onChange={(event) => { onOption(event.target.value as ReadingOption); setSearch(''); setRouteOnly(false); setFullMobileMap(false); setNotesOpen(false); setFocusConnections(false) }}>{Object.entries(readingOptions).map(([id, option]) => <option key={id} value={id}>{option.label}</option>)}</select></label>
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
        <div className="next-paths" aria-live="polite"><strong>Selected: {bookById[selectedId].title}</strong>{highlightPaths && (nextPaths.length ? <div>{nextPaths.map((edge) => <button key={edge.to} onClick={() => selectMapBook(bookById[edge.to])}><ArrowRight size={14} /><span>{bookById[edge.to].title}<small>{edge.kind === 'sequence' ? 'Publisher’s listed order' : 'Reference arrow'}</small></span></button>)}</div> : <span>No catalogue paths are visible. Check source steps and filters.</span>)}<button className="text-action path-notes-action" onClick={openNotes}>Book notes <ArrowRight size={15} /></button></div>
        {focusConnections && <p className="focus-description">Direct links to and from the selected book. Filters apply to the full map. Turn off Focus connections to return to your map position.</p>}
        {mapBooks.length === 0 ? <div className="empty-state"><h2>No books found</h2><p>Try another title, or clear the filters.</p><button className="quiet-action" onClick={() => { setSearch(''); setRouteOnly(false) }}>Clear filters</button></div> : <>
          <button ref={mobileMapToggleRef} className="mobile-map-toggle text-action" aria-expanded={fullMobileMap} onClick={() => setFullMobileMap(!fullMobileMap)}><Map size={17} />{fullMobileMap ? 'Back to map' : 'Expand map'}</button>
          <div ref={mapRef} className={`atlas-map ${fullMobileMap ? 'mobile-expanded' : ''}`}><button ref={mapCloseRef} className="map-fullscreen-close quiet-action" onClick={closeFullMobileMap}><Map size={17} />Back to map</button><label className="map-highlight-mobile"><input type="checkbox" checked={highlightPaths} onChange={(event) => setHighlightPaths(event.target.checked)} />Next paths</label><label className="map-highlight-mobile map-focus-mobile"><input type="checkbox" checked={focusConnections} disabled={!(isReference(readingOption) ? referenceBooks : optionBooks).some((book) => book.id === selectedId)} onChange={(event) => setFocusConnections(event.target.checked)} />Focus connections</label><MapCanvas referenceLayout={isReference(readingOption) && !focusConnections} focusRevision={focusRevision} selectedId={selectedId} currentId={currentId} readIds={readIds} visibleBooks={mapBooks} highlightPaths={highlightPaths} focusConnections={focusConnections} connections={mapConnections} recommendedIds={new Set(recommendations.map((item) => item.book!.id))} onSelect={selectMapBook} /><div className="map-selected-mobile"><div className="map-selected-heading"><span><small>Selected book</small><strong>{bookById[selectedId].title}</strong></span><button className="quiet-action" onClick={openNotes}>Book notes</button></div><div className="map-selected-branches">{highlightPaths ? <><small>Next</small>{nextPaths.length ? nextPaths.map((edge) => <button key={edge.to} onClick={() => selectMapBook(bookById[edge.to])}><ArrowRight size={13} />{bookById[edge.to].title}</button>) : <span>No visible next path</span>}</> : <span>Next paths hidden</span>}</div></div></div>
        </>}
        <div className="map-caption"><span><span className="status-sample selected" />Selected</span><span><BookOpen size={13} />Reading</span><span><Check size={13} />Finished</span><span className="caption-note">Select a book to trace its paths.</span></div>
      </div>
      <div role="tabpanel" id="view-panel-list" aria-labelledby="view-tab-list" tabIndex={0} hidden={mode !== 'list'}>
        {visibleBooks.length === 0 ? <div className="empty-state"><h2>No books found</h2><p>Try another title, or clear the filters.</p><button className="quiet-action" onClick={() => { setSearch(''); setRouteOnly(false) }}>Clear filters</button></div> : <div className="list-view"><BookList sequence={!isReference(readingOption)} items={visibleBooks} selectedId={selectedId} onSelect={selectListBook} {...actions} /></div>}
      </div>
    </section>{notesOpen && <BookNotes book={bookById[selectedId]} onSelect={revealBook} onClose={closeNotes} {...actions} />}</div>
    {readingOption !== 'siege' && <section className="reading-option siege-continuation" aria-label="Siege of Terra continuation"><h2>Siege of Terra</h2><p>The reference reaches The Solar War. Continue through Black Library’s numbered main series, including all three final volumes. <a href={readingOptions.siege.sourceUrl} target="_blank" rel="noreferrer">View publisher source <ArrowUpRight size={13} /></a></p><button className="quiet-action" onClick={() => { onOption('siege'); setSearch(''); setRouteOnly(false); setMode('list'); setFullMobileMap(false); setNotesOpen(false); requestAnimationFrame(() => document.getElementById('main')?.scrollIntoView({ block: 'start' })) }}>Explore Siege of Terra <ArrowRight size={16} /></button></section>}
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
  const [selectedId, setSelectedId] = useState(progress.currentId)
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
