import { books } from './data'
import { type ReadingOption } from './reading-options'

export type Progress = { readIds: string[]; currentId: string; readingOption: ReadingOption }

export function parseProgress(value: unknown): Progress {
  const saved = value && typeof value === 'object' ? value as Partial<Progress> : {}
  const knownIds = new Set(books.map((book) => book.id))
  return {
    readIds: Array.isArray(saved.readIds) ? [...new Set(saved.readIds.filter((id) => typeof id === 'string' && knownIds.has(id)))] : [],
    currentId: typeof saved.currentId === 'string' && knownIds.has(saved.currentId) ? saved.currentId : 'horus-rising',
    readingOption: saved.readingOption === 'saga' ? 'saga' : 'reference',
  }
}

export function toggleFinished<T extends { readIds: string[]; currentId: string }>(progress: T, id: string) {
  return {
    ...progress,
    readIds: progress.readIds.includes(id)
      ? progress.readIds.filter((readId) => readId !== id)
      : [...progress.readIds, id],
  }
}
