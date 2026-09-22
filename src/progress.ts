export function toggleFinished(progress: { readIds: string[]; currentId: string }, id: string) {
  return {
    ...progress,
    readIds: progress.readIds.includes(id)
      ? progress.readIds.filter((readId) => readId !== id)
      : [...progress.readIds, id],
  }
}
