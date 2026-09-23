import assert from 'node:assert/strict'
import { books, connections } from '../src/data.ts'
import { getReachableBookIds, getRecommendations } from '../src/logic.ts'

const run = (name, test) => {
  test()
  console.log(`✓ ${name}`)
}

run('starts with the direct opening recommendation', () => {
  const recommendations = getRecommendations('horus-rising', new Set())

  assert.equal(recommendations[0].book.id, 'false-gods')
  assert.equal(recommendations[0].score, 100)
  assert.equal(recommendations.length, 1)
})

run('advances after the current book is marked read', () => {
  const recommendations = getRecommendations('false-gods', new Set(['horus-rising']))

  assert.equal(recommendations[0].book.id, 'galaxy-in-flames')
  assert.match(recommendations[0].explanation, /opening trilogy/i)
})

run('keeps alternate routes reachable without bypassing a read branch', () => {
  const reachable = getReachableBookIds('galaxy-in-flames', new Set())

  assert.equal(reachable.has('first-heretic'), true)
  assert.equal(reachable.has('thousand-sons'), true)

  const afterFirstHeretic = getReachableBookIds('galaxy-in-flames', new Set(['first-heretic']))
  assert.equal(afterFirstHeretic.has('know-no-fear'), false)
})

run('does not recommend a book already in the read set', () => {
  const readIds = new Set(['flight-eisenstein'])
  const recommendations = getRecommendations('galaxy-in-flames', readIds)

  assert.equal(recommendations.some(({ book }) => book.id === 'flight-eisenstein'), false)
})

run('treats progress input as caller-owned state', () => {
  const readIds = new Set(['horus-rising'])
  getRecommendations('false-gods', readIds)
  getReachableBookIds('false-gods', readIds)

  assert.deepEqual([...readIds], ['horus-rising'])
})

run('keeps the current book graph structurally valid', () => {
  const ids = new Set(books.map((book) => book.id))
  const pairs = new Set(connections.map((edge) => `${edge.from}:${edge.to}`))

  assert.equal(ids.size, books.length)
  assert.equal(connections.every((edge) => ids.has(edge.from) && ids.has(edge.to)), true)
  assert.equal(pairs.size, connections.length)
  assert.equal(books.every((book) => connections.some((edge) => edge.from === book.id || edge.to === book.id)), true)
})

run('keeps campaign map book plates separate', () => {
  for (let index = 0; index < books.length; index++) {
    for (const other of books.slice(index + 1)) {
      const book = books[index]
      const overlaps = book.x < other.x + 180 && book.x + 180 > other.x
        && book.y < other.y + 74 && book.y + 74 > other.y
      assert.equal(overlaps, false, `${book.id} overlaps ${other.id}`)
    }
  }
})

run('keeps direct continuations distinct from suggested bridges', () => {
  const edgeKind = (from, to) => connections.find((edge) => edge.from === from && edge.to === to)?.kind

  assert.equal(edgeKind('galaxy-in-flames', 'flight-eisenstein'), 'sequel')
  assert.equal(edgeKind('thousand-sons', 'prospero-burns'), 'parallel')
  assert.equal(edgeKind('thousand-sons', 'crimson-king'), 'sequel')

  const siegeSpine = ['solar-war', 'lost-and-damned', 'first-wall', 'saturnine', 'mortis', 'warhawk', 'echoes-of-eternity', 'end-and-death-i', 'end-and-death-ii', 'end-and-death-iii']
  siegeSpine.slice(0, -1).forEach((from, index) => {
    assert.equal(edgeKind(from, siegeSpine[index + 1]), 'sequel')
  })

  assert.equal(edgeKind('saturnine', 'sons-of-selenar'), 'optional')
  assert.equal(edgeKind('sons-of-selenar', 'fury-of-magnus'), undefined)
  assert.equal(edgeKind('fury-of-magnus', 'mortis'), undefined)
})

console.log('Recommendation logic smoke tests passed.')

const { toggleFinished } = await import('../src/progress.ts')
run('finishing another book preserves the current reading position', () => {
  const progress = { readIds: ['horus-rising'], currentId: 'false-gods' }
  const next = toggleFinished(progress, 'legion')
  assert.equal(next.currentId, 'false-gods')
  assert.deepEqual(next.readIds, ['horus-rising', 'legion'])
  assert.deepEqual(progress.readIds, ['horus-rising'])
})
run('marking a book unread keeps other progress and the reading position', () => {
  const next = toggleFinished({ readIds: ['horus-rising', 'legion'], currentId: 'false-gods' }, 'legion')
  assert.deepEqual(next, { readIds: ['horus-rising'], currentId: 'false-gods' })
})
