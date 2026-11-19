import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { BookType } from './book-types'
import { referenceCollections, type Book } from './data'
import type { getSiegeHandoff, ReadingStep } from './logic'
import { readingStatus } from './progress'
import { readingOptions, siegeBookIds, siegeBookNumbers, siegeBookUrls } from './reading-options'

type PathChoice = { book: Book; via?: Book }

export function PathToggle({ open, target, onClick, label }: { open: boolean; target: string; onClick: () => void; label: string }) {
  return <button type="button" className="quiet-action path-toggle" aria-expanded={open} aria-controls={target} onClick={onClick}>
    {open ? 'Hide paths' : label}<ChevronDown size={15} aria-hidden="true" />
  </button>
}

export function HiddenPaths({ count, onShowAll }: { count: number; onShowAll: () => void }) {
  return <div className="hidden-stories">
    <span>{count} {count === 1 ? 'path' : 'paths'} hidden by Novels only.</span>
    <button className="text-action" type="button" onClick={onShowAll}>Show all stories <ArrowRight size={14} aria-hidden="true" /></button>
  </div>
}

export function SourcePathNotes({ steps }: { steps: ReadingStep[] }) {
  return steps.map((step) => <div className="source-paths" key={step.id}>
    <span>{step.via ? <>An arrow from <i>{step.via.title}</i> has no recorded destination.</> : 'One arrow has no recorded destination.'}</span>
    <a href={step.sourceUrl} target="_blank" rel="noreferrer">View original flowchart <ArrowUpRight size={13} aria-hidden="true" /></a>
  </div>)
}

export function PathChoices({ id, open, choices, sourceSteps, readIds, currentId, onChoose }: {
  id: string
  open: boolean
  choices: PathChoice[]
  sourceSteps: ReadingStep[]
  readIds: Set<string>
  currentId: string
  onChoose: (book: Book) => void
}) {
  if (!open) return <div id={id} hidden />
  return <div className="path-chooser" id={id}>
    {choices.length > 0 && <ul aria-label="Path choices">
      {[...choices].sort((a, b) => a.book.title.localeCompare(b.book.title)).map(({ book, via }) => {
        const status = readingStatus(book.id, readIds, currentId)
        const collection = book.collectionNumber ? referenceCollections[book.collectionNumber] : undefined
        return <li key={book.id}><button type="button" className="path-choice" onClick={() => onChoose(book)}>
          <span className="path-choice-content">
            <span className="path-choice-title">{book.title}</span>
            <span className="path-choice-detail">
              <BookType kind={book.kind} />
              {collection ? <span>{book.collectionNumber === 42 ? 'Adapted in' : 'Collected in'} <i>{collection.title}</i></span>
                : book.seriesNumber && <span>Horus Heresy book {book.seriesNumber}</span>}
              {via && <span>Via <i>{via.title}</i></span>}
            </span>
          </span>
          <span className={status === 'Finished' ? 'path-status finished' : 'path-status'}>{status}</span>
          <ArrowRight className="path-arrow" size={15} aria-hidden="true" />
        </button></li>
      })}
    </ul>}
    <SourcePathNotes steps={sourceSteps} />
  </div>
}

export function SiegeHandoff({ handoff, onContinue, sourceSteps }: {
  handoff: ReturnType<typeof getSiegeHandoff>
  onContinue: () => void
  sourceSteps: ReadingStep[]
}) {
  const { destination, complete } = handoff
  const continues = destination.id !== siegeBookIds[0]
  return <div className="siege-handoff">
    <h3 className="book-heading">{complete ? 'Numbered Siege series finished' : destination.title}</h3>
    {continues && <p>Next in Black Library’s numbered series · Book {siegeBookNumbers[destination.id]}.</p>}
    <p>Daunt’s 2019 flowchart ends at <i>The Solar War</i>, book 1 of Black Library’s numbered Siege of Terra series.</p>
    <div className="handoff-actions">
      <button type="button" className="primary-action" onClick={onContinue}>
        {continues ? 'Continue with Black Library’s Siege of Terra' : 'Open Black Library’s Siege of Terra'} <ArrowRight size={16} aria-hidden="true" />
      </button>
      <a href={complete ? readingOptions.siege.sourceUrl : siegeBookUrls[destination.id]} target="_blank" rel="noreferrer">View publisher source <ArrowUpRight size={13} aria-hidden="true" /></a>
    </div>
    <SourcePathNotes steps={sourceSteps} />
  </div>
}
