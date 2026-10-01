import { bookById, type Book } from './data'
import { readingOptions, reference, referenceBookByNodeId, referenceNodeByBookId, sagaBookIds, type ReadingOption } from './reading-options'

export type ReadingStep = {
  id: string
  title: string
  book?: Book
  explanation: string
  sourceUrl: string
}

export function getNextSteps(currentId: string | null, readIds: Set<string>, option: ReadingOption): ReadingStep[] {
  if (option === 'saga') {
    const index = currentId ? sagaBookIds.indexOf(currentId) : -1
    const nextId = sagaBookIds.slice(index + 1).find((id) => !readIds.has(id))
    return nextId ? [{ id: nextId, title: bookById[nextId].title, book: bookById[nextId], explanation: index < 0 ? 'First unfinished book in Black Library’s published Saga list.' : 'Next unfinished book in Black Library’s published Saga list.', sourceUrl: readingOptions.saga.sourceUrl }] : []
  }
  const node = currentId ? referenceNodeByBookId[currentId] : undefined
  if (!node) return []
  const queue = [node.id]
  const visited = new Set<string>()
  const steps = new Map<string, ReadingStep>()
  while (queue.length) {
    const from = queue.shift()!
    if (visited.has(from)) continue
    visited.add(from)
    for (const edge of reference.connections.filter((edge) => edge.from === from)) {
      const target = reference.nodes.find((node) => node.id === edge.to)!
      const book = referenceBookByNodeId[target.id]
      if (book && readIds.has(book.id)) queue.push(target.id)
      else if (book?.id !== currentId) steps.set(target.id, { id: target.id, title: book?.title ?? target.title, book, explanation: book ? 'Connected in the reference flowchart; choices have no app ranking.' : 'Outside this catalogue. Follow this step in the original flowchart.', sourceUrl: reference.url })
    }
    for (const edge of reference.unresolved.filter((edge) => edge.from === from)) {
      steps.set(edge.id, { id: edge.id, title: 'Continue in the original flowchart', explanation: 'This arrow has no attached destination in the source data. Check the original drawing.', sourceUrl: reference.url })
    }
  }
  return [...steps.values()]
}

export function getReachableBookIds(currentId: string | null, readIds: Set<string>, option: ReadingOption) {
  if (option === 'saga') return new Set(sagaBookIds.slice(currentId ? sagaBookIds.indexOf(currentId) + 1 : 0).filter((id) => !readIds.has(id)))
  const node = currentId ? referenceNodeByBookId[currentId] : undefined
  if (!node) return new Set<string>()
  const reachable = new Set<string>()
  const queue = [node.id]
  const visited = new Set<string>()
  while (queue.length) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    reference.connections.filter((edge) => edge.from === id).forEach((edge) => {
      const book = referenceBookByNodeId[edge.to]
      if (book && book.id !== currentId && !readIds.has(book.id)) reachable.add(book.id)
      queue.push(edge.to)
    })
  }
  return reachable
}
