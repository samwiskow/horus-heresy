import assert from 'node:assert/strict'
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

console.log('Recommendation logic smoke tests passed.')
