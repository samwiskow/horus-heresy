import { books, type Connection } from './data'
import reference from './sources/reference-flowchart.json'
import siege from './sources/siege-of-terra.json'

export type ReadingOption = 'reference' | 'reference-novels' | 'saga' | 'siege'

export const isReference = (option: ReadingOption) => option === 'reference' || option === 'reference-novels'

export const siegeBookIds = siege.books.map((book) => book.id)
export const siegeBookNumbers = Object.fromEntries(siege.books.map((book) => [book.id, book.number]))

export const sagaBookIds = [
  'horus-rising', 'false-gods', 'galaxy-in-flames', 'flight-eisenstein',
  'fulgrim', 'first-heretic', 'prospero-burns', 'know-no-fear', 'betrayer',
  'praetorian-dorn', 'master-of-mankind', 'slaves-to-darkness',
]

export const readingOptions = {
  reference: {
    label: 'Reference map — all stories',
    description: 'All 173 nodes in Daunt’s branching guide, version 0.9 · 2 July 2019. Includes novels, novellas, short stories, audio dramas, graphic novels, and collections. Arrows follow the reference.',
    sourceUrl: reference.url,
  },
  'reference-novels': {
    label: 'Reference map — novels only',
    description: 'Novels from the same reference. Other works are hidden, and arrows never skip them. Show all stories to reveal hidden next steps.',
    sourceUrl: reference.url,
  },
  saga: {
    label: 'Black Library: Horus Heresy Saga',
    description: 'The publisher’s 12-book selection, in its listed order. Ends at Slaves to Darkness, before the Siege of Terra. Finished books count in both reading options.',
    sourceUrl: 'https://www.warhammer-community.com/en-gb/articles/17oswfuf/world-championships-preview-experience-the-greatest-hits-of-the-horus-heresy-saga-in-a-new-curated-series/',
  },
  siege: {
    label: 'Black Library: Siege of Terra',
    description: 'The publisher’s numbered main series: books 1–8, with book 8 in three volumes. Begins at The Solar War. Supporting novellas and anthologies remain in Black Library’s series catalogue.',
    sourceUrl: siege.url,
  },
}

export function getSequenceBookIds(option: ReadingOption) {
  return option === 'siege' ? siegeBookIds : sagaBookIds
}

const titleKey = (title: string) => title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/^(the|a)\s+/, '').replace(/[^a-z0-9]/g, '')
export const referenceBookByNodeId = Object.fromEntries(reference.nodes.flatMap((node) => {
  const key = titleKey(node.title === 'Vulcan Lives' ? 'Vulkan Lives' : node.title)
  const book = books.find((book) => book.sourceId === node.id) ?? books.find((book) => !book.sourceId && titleKey(book.title) === key)
  return book ? [[node.id, book]] : []
}))
export const referenceNodeByBookId = Object.fromEntries(reference.nodes.flatMap((node) => {
  const book = referenceBookByNodeId[node.id]
  return book ? [[book.id, node]] : []
}))

const referenceCentres = reference.nodes.map((node) => ({
  id: referenceBookByNodeId[node.id].id,
  x: node.bounds[0] + node.bounds[2] / 2,
  y: node.bounds[1] + node.bounds[3] / 2,
}))
const referenceLeft = Math.min(...referenceCentres.map((point) => point.x))
const referenceTop = Math.min(...referenceCentres.map((point) => point.y))
export const referencePositions = Object.fromEntries(referenceCentres.map((point) => [point.id, {
  x: 70 + (point.x - referenceLeft) * 2.35 + (point.id === 'the-thirteenth-wolf' ? 26 : 0),
  y: 100 + (point.y - referenceTop) * 3 - (point.y === referenceTop ? 0 : 400),
}]))

const referenceConnections: Connection[] = reference.connections.flatMap((edge) => {
  const from = referenceBookByNodeId[edge.from]
  const to = referenceBookByNodeId[edge.to]
  return from && to ? [{ from: from.id, to: to.id, kind: 'reference', explanation: 'Connected by an arrow in the reference flowchart.', sourceUrl: reference.url, sourceId: edge.id }] : []
})

const sagaConnections: Connection[] = sagaBookIds.slice(0, -1).map((from, index) => ({
  from,
  to: sagaBookIds[index + 1],
  kind: 'sequence',
  explanation: 'Next in Black Library’s published Saga list.',
  sourceUrl: readingOptions.saga.sourceUrl,
  sourceId: `saga-list:${index + 1}-${index + 2}`,
}))

const siegeConnections: Connection[] = siege.books.slice(0, -1).map((from, index) => ({
  from: from.id,
  to: siege.books[index + 1].id,
  kind: 'sequence',
  explanation: 'Next in Black Library’s numbered Siege of Terra series.',
  sourceUrl: siege.books[index + 1].url,
  sourceId: `siege-book:${from.number}→${siege.books[index + 1].number}`,
}))

export function getConnections(option: ReadingOption) {
  return option === 'siege' ? siegeConnections : option === 'saga' ? sagaConnections : referenceConnections
}

export function getOptionBooks(option: ReadingOption) {
  return isReference(option)
    ? books.filter((book) => referenceNodeByBookId[book.id] && (option !== 'reference-novels' || book.kind === 'novel')).sort((a, b) => a.title.localeCompare(b.title))
    : getSequenceBookIds(option).map((id) => books.find((book) => book.id === id)!)
}

export { reference }
