import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { App } from '../src/App.tsx'
import { bookById, books } from '../src/data.ts'
import { getEdgeRoute, NODE_WIDTH, NODE_HEIGHT } from '../src/map-layout.ts'
import { getReachableBookIds, getNextSteps } from '../src/logic.ts'
import { getConnections, reference, referenceBookByNodeId, referenceNodeByBookId, sagaBookIds, siegeBookIds, siegeBookNumbers } from '../src/reading-options.ts'
import { parseProgress, toggleFinished } from '../src/progress.ts'

const run = (name, test) => {
  test()
  console.log(`✓ ${name}`)
}

run('uses the reference book colours without inventing a legion palette', () => {
  for (const [id, fill, stroke] of [
    ['thousand-sons', '#1478A8', '#006EAF'],
    ['fulgrim', '#FF66FF', '#006EAF'],
    ['scars', '#CCCCCC', '#CC0000'],
    ['first-heretic', '#6E3600', 'none'],
    ['know-no-fear', '#6E3600', 'none'],
    ['mechanicum', '#4D4D4D', '#006EAF'],
    ['nemesis', '#FFFFFF', '#000000'],
  ]) {
    assert.equal(referenceNodeByBookId[id].fill, fill)
    assert.equal(referenceNodeByBookId[id].stroke, stroke)
  }
  assert.equal(referenceNodeByBookId['end-and-death-iii'], undefined)
})

run('pairs source colour marks with visible faction labels in the book list', () => {
  const html = renderToStaticMarkup(createElement(App))
  for (const book of books.filter((book) => referenceNodeByBookId[book.id])) {
    const row = html.match(new RegExp(`<li[^>]*data-book-id="${book.id}"[\\s\\S]*?</li>`))?.[0]
    assert.ok(row, book.title)
    assert.ok(row.includes('reference-colour-mark'), book.title)
    assert.ok(row.includes(book.faction.replaceAll('&', '&amp;')), book.title)
    assert.ok(row.includes(`fill="${referenceNodeByBookId[book.id].fill}"`), book.title)
    assert.ok(row.includes('aria-hidden="true"'), book.title)
  }
})

run('follows the source opening without adding early legion branches', () => {
  assert.deepEqual(getNextSteps('horus-rising', new Set(), 'reference').map((step) => step.book?.id), ['false-gods'])
  assert.deepEqual(getNextSteps('galaxy-in-flames', new Set(), 'reference').map((step) => step.book?.id), ['flight-eisenstein'])
})

run('removes the invented First Heretic to Know No Fear bridge', () => {
  const steps = getNextSteps('first-heretic', new Set(), 'reference')
  assert.equal(steps.some((step) => step.book?.id === 'know-no-fear'), false)
  assert.deepEqual(steps.filter((step) => step.book).map((step) => step.book.id), ['battle-for-the-abyss', 'fear-to-tread'])
  assert.equal(steps.some((step) => step.title === 'Aurelian (Book 35)' && !step.book), true)
  assert.equal(steps.every((step) => !('score' in step)), true)
})

run('retains missing short stories instead of bypassing them', () => {
  const steps = getNextSteps('scars', new Set(), 'reference')
  assert.deepEqual(steps.map((step) => step.title), ['Allegiance (Book 33)', 'Brotherhood of the Moon (Book 35)', 'Daemonology (Book 33)'])
  assert.equal(steps.every((step) => !step.book && step.sourceUrl === reference.url), true)
  assert.equal(getConnections('reference').some((edge) => edge.from === 'scars' && edge.to === 'path-of-heaven'), false)
})

run('reports unattached arrows without guessing their destination', () => {
  const steps = getNextSteps('solar-war', new Set(), 'reference')
  assert.equal(steps.length, 1)
  assert.equal(steps[0].book, undefined)
  assert.match(steps[0].explanation, /no attached destination/)
})

run('returns no arbitrary catalogue fallback outside source coverage', () => {
  assert.deepEqual(getNextSteps('end-and-death-iii', new Set(), 'reference'), [])
  assert.deepEqual(getNextSteps(null, new Set(), 'reference'), [])
  assert.equal(getNextSteps('horus-rising', new Set(books.map((book) => book.id)), 'reference').every((step) => !step.book), true)
})

run('every reference map arrow matches a direct source arrow', () => {
  for (const edge of getConnections('reference')) {
    const original = reference.connections.find((item) => item.id === edge.sourceId)
    assert.ok(original)
    assert.equal(referenceBookByNodeId[original.from].id, edge.from)
    assert.equal(referenceBookByNodeId[original.to].id, edge.to)
    assert.equal(edge.sourceUrl, reference.url)
  }
  const represented = reference.connections.filter((edge) => referenceBookByNodeId[edge.from] && referenceBookByNodeId[edge.to])
  assert.equal(getConnections('reference').length, represented.length)
})

run('preserves the publisher’s exact 12-book selection and listed order', () => {
  const expected = ['horus-rising', 'false-gods', 'galaxy-in-flames', 'flight-eisenstein', 'fulgrim', 'first-heretic', 'prospero-burns', 'know-no-fear', 'betrayer', 'praetorian-dorn', 'master-of-mankind', 'slaves-to-darkness']
  assert.deepEqual(sagaBookIds, expected)
  assert.deepEqual(getConnections('saga').map((edge) => [edge.from, edge.to]), expected.slice(0, -1).map((id, index) => [id, expected[index + 1]]))
  assert.equal(getNextSteps('fulgrim', new Set(), 'saga')[0].book.id, 'first-heretic')
})

run('Saga skips finished selection books and does not extend to the Siege', () => {
  assert.equal(getNextSteps('fulgrim', new Set(['first-heretic', 'prospero-burns']), 'saga')[0].book.id, 'know-no-fear')
  assert.deepEqual(getNextSteps('slaves-to-darkness', new Set(), 'saga'), [])
  assert.deepEqual([...getReachableBookIds('slaves-to-darkness', new Set(), 'saga')], [])
  assert.deepEqual(getNextSteps('horus-rising', new Set(sagaBookIds), 'saga'), [])
})

run('starting Saga from an outside book returns its first unfinished title', () => {
  assert.equal(getNextSteps('scars', new Set(['horus-rising', 'false-gods']), 'saga')[0].book.id, 'galaxy-in-flames')
})

run('finished books advance only through source connections', () => {
  assert.equal(getNextSteps('horus-rising', new Set(['false-gods']), 'reference')[0].book.id, 'galaxy-in-flames')
  const reachable = getReachableBookIds('horus-rising', new Set(['false-gods']), 'reference')
  assert.equal(reachable.has('false-gods'), false)
  assert.equal(reachable.has('galaxy-in-flames'), true)
})

run('follows the publisher’s numbered Siege series through all three final volumes', () => {
  const expected = ['solar-war', 'lost-and-damned', 'first-wall', 'saturnine', 'mortis', 'warhawk', 'echoes-of-eternity', 'end-and-death-i', 'end-and-death-ii', 'end-and-death-iii']
  assert.deepEqual(siegeBookIds, expected)
  assert.deepEqual(getConnections('siege').map((edge) => [edge.from, edge.to]), expected.slice(0, -1).map((id, index) => [id, expected[index + 1]]))
  assert.equal(getConnections('siege').every((edge) => edge.sourceUrl.startsWith('https://www.blacklibrary.com/')), true)
  assert.equal(siegeBookNumbers['end-and-death-ii'], '8, Part 2')
  assert.equal(getNextSteps('solar-war', new Set(['lost-and-damned']), 'siege')[0].book.id, 'first-wall')
  assert.equal(getNextSteps('end-and-death-ii', new Set(), 'siege')[0].book.id, 'end-and-death-iii')
  assert.deepEqual(getNextSteps('end-and-death-iii', new Set(), 'siege'), [])
  assert.equal(getNextSteps('slaves-to-darkness', new Set(), 'siege')[0].book.id, 'solar-war')
  assert.equal(getReachableBookIds('solar-war', new Set(['lost-and-damned']), 'siege').has('lost-and-damned'), false)
  assert.equal(siegeBookIds.includes('sons-of-selenar'), false)
  assert.equal(siegeBookIds.includes('fury-of-magnus'), false)
})

run('keeps caller progress unchanged when finding routes', () => {
  const readIds = new Set(['horus-rising'])
  for (const option of ['reference', 'saga', 'siege']) {
    getNextSteps('false-gods', readIds, option)
    getReachableBookIds('false-gods', readIds, option)
  }
  assert.deepEqual([...readIds], ['horus-rising'])
})

run('keeps source graphs valid without requiring invented links for every book', () => {
  const ids = new Set(books.map((book) => book.id))
  assert.equal(ids.size, books.length)
  for (const option of ['reference', 'saga', 'siege']) {
    const connections = getConnections(option)
    assert.equal(connections.every((edge) => ids.has(edge.from) && ids.has(edge.to)), true)
    assert.equal(new Set(connections.map((edge) => `${edge.from}:${edge.to}`)).size, connections.length)
  }
})

run('keeps campaign map book plates separate', () => {
  for (let index = 0; index < books.length; index++) {
    for (const other of books.slice(index + 1)) {
      const book = books[index]
      const overlaps = book.x < other.x + 180 && book.x + 180 > other.x && book.y < other.y + 74 && book.y + 74 > other.y
      assert.equal(overlaps, false, `${book.id} overlaps ${other.id}`)
    }
  }
})

run('offers source browsing without unsupported story arc groups', () => {
  const page = renderToStaticMarkup(createElement(App))
  assert.match(page, /Reference flowchart/)
  assert.match(page, /Black Library: Horus Heresy Saga/)
  assert.match(page, /Titles A–Z/)
  assert.match(page, /Connection map/)
  assert.match(page, /Siege of Terra continuation/)
  assert.match(page, /Explore Siege of Terra/)
  assert.doesNotMatch(page, /Legions in collision|Loyalist convergence|The Warmaster ascendant|Arc lanes|aria-label="Story arc"|>Story arcs</)
})

run('routes all source arrows outside book plates', () => {
  for (const option of ['reference', 'saga', 'siege']) {
    for (const edge of getConnections(option)) {
      const route = getEdgeRoute(bookById[edge.from], bookById[edge.to])
      for (let index = 1; index < route.length; index++) {
        const start = route[index - 1]
        const end = route[index]
        for (const book of books) {
          const left = book.x - 4
          const right = book.x + NODE_WIDTH + 4
          const top = book.y - 4
          const bottom = book.y + NODE_HEIGHT + 4
          const crosses = start.y === end.y
            ? start.y > top && start.y < bottom && Math.max(start.x, end.x) > left && Math.min(start.x, end.x) < right
            : start.x > left && start.x < right && Math.max(start.y, end.y) > top && Math.min(start.y, end.y) < bottom
          assert.equal(crosses, false, `${edge.from} → ${edge.to} crosses ${book.id}`)
        }
      }
    }
  }
})

run('loads old saved progress into the reference option without losing books', () => {
  assert.deepEqual(parseProgress({ readIds: ['horus-rising', 'legion'], currentId: 'scars' }), { readIds: ['horus-rising', 'legion'], currentId: 'scars', readingOption: 'reference' })
})

run('retains Saga selection across a save and reload', () => {
  const progress = { readIds: ['horus-rising', 'scars'], currentId: 'false-gods', readingOption: 'saga' }
  assert.deepEqual(parseProgress(JSON.parse(JSON.stringify(progress))), progress)
  assert.equal(parseProgress({ ...progress, readingOption: 'unknown' }).readingOption, 'reference')
  assert.deepEqual(parseProgress(null), { readIds: [], currentId: 'horus-rising', readingOption: 'reference' })
  assert.deepEqual(parseProgress({ readIds: ['horus-rising', 'horus-rising', 'unknown', 2] }).readIds, ['horus-rising'])
})

run('retains Siege selection and progress across a save and reload', () => {
  const progress = { readIds: ['horus-rising', 'solar-war'], currentId: 'lost-and-damned', readingOption: 'siege' }
  assert.deepEqual(parseProgress(JSON.parse(JSON.stringify(progress))), progress)
  assert.equal(toggleFinished(progress, 'saturnine').readingOption, 'siege')
  assert.equal(toggleFinished(progress, 'saturnine').currentId, 'lost-and-damned')
})

run('finishing another book preserves the current position and reading option', () => {
  const progress = { readIds: ['horus-rising'], currentId: 'false-gods', readingOption: 'saga' }
  const next = toggleFinished(progress, 'legion')
  assert.equal(next.currentId, 'false-gods')
  assert.equal(next.readingOption, 'saga')
  assert.deepEqual(next.readIds, ['horus-rising', 'legion'])
  assert.deepEqual(progress.readIds, ['horus-rising'])
  assert.deepEqual(toggleFinished(next, 'legion'), progress)
})

console.log('Source route and progress checks passed.')
