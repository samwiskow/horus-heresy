import { bookById, books, connections, type Book } from './data'

export type Recommendation = {
  book: Book
  explanation: string
  score: number
}

export function getReachableBookIds(currentId: string | null, readIds: Set<string>) {
  if (!currentId) return new Set<string>()
  const reachable = new Set<string>()
  const queue = [currentId]
  while (queue.length) {
    const id = queue.shift()!
    connections.filter((edge) => edge.from === id).forEach((edge) => {
      if (!readIds.has(edge.to) && !reachable.has(edge.to)) {
        reachable.add(edge.to)
        if (edge.kind === 'recommended' || edge.kind === 'sequel') queue.push(edge.to)
      }
    })
  }
  return reachable
}

export function getRecommendations(currentId: string | null, readIds: Set<string>): Recommendation[] {
  const candidates = connections
    .filter((edge) => edge.from === currentId && !readIds.has(edge.to))
    .map((edge) => {
      const book = bookById[edge.to]
      const score = edge.kind === 'sequel' ? 100 : edge.kind === 'recommended' ? 85 : edge.kind === 'parallel' ? 62 : edge.kind === 'prerequisite' ? 52 : 32
      return {
        book,
        score,
        explanation: edge.explanation,
      }
    })
    .sort((a, b) => b.score - a.score)

  if (candidates.length) return candidates.slice(0, 3)

  const fallback = books
    .filter((book) => !readIds.has(book.id) && book.id !== currentId)
    .map((book) => ({
      book,
      score: 10,
      explanation: 'A nearby branch remains available while you choose your next route.',
    }))
  return fallback.slice(0, 3)
}
