import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterBeasts, groupBeastsByType } from './bestiaryFilters.js'

const beasts = [
  { id: 'a', name: 'Alpha', challenge: 4, beastTypeIds: ['one', 'two'], biomeTagsAugment: ['forest'], biomeTagsInhibit: ['cold'] },
  { id: 'b', name: 'Beta', challenge: 1, beastTypeIds: ['two'], biomeTagsAugment: ['forest'] },
  { id: 'c', name: 'Gamma', challenge: 2 },
]
const defaults = { searchQuery: '', selectedTypes: [], augmentTags: [], inhibitTags: [], orderBy: '' }

test('biome filters require matching effects, with neutral tags ignored', () => {
  assert.equal(filterBeasts(beasts, defaults).length, 3)
  assert.deepEqual(filterBeasts(beasts, { ...defaults, augmentTags: ['forest'], inhibitTags: ['cold'] }).map(b => b.id), ['a'])
  assert.deepEqual(filterBeasts(beasts, { ...defaults, inhibitTags: ['forest'] }), [])
})

test('type, search and challenge ordering combine', () => {
  const filtered = filterBeasts(beasts, { ...defaults, selectedTypes: ['two'], orderBy: 'challenge-asc' })
  assert.deepEqual(filtered.map(b => b.id), ['b', 'a'])
  assert.deepEqual(filterBeasts(beasts, { ...defaults, searchQuery: 'alpha', orderBy: 'challenge-desc' }).map(b => b.id), ['a'])
  assert.deepEqual(filterBeasts(beasts, { ...defaults, orderBy: 'challenge-desc' }).map(b => b.id), ['a', 'c', 'b'])
})

test('grouping uses unique, alphabetically named type combinations regardless of ID order', () => {
  const grouped = groupBeastsByType([
    ...beasts,
    { id: 'd', beastTypeIds: ['two', 'one', 'one'] },
    { id: 'e', beastTypeIds: ['one'] },
    { id: 'f', beastTypeIds: ['missing'] },
  ], [{ id: 'two', name: 'Humanoid' }, { id: 'one', name: 'Beast' }])
  assert.deepEqual(grouped.map(g => [g.name, g.items.map(b => b.id)]), [
    ['Beast', ['e']], ['Beast Humanoid', ['a', 'd']], ['Humanoid', ['b']],
    ['Unknown Beast Type', ['f']], ['No Beast Type', ['c']],
  ])
  assert.equal(new Set(grouped.flatMap(g => g.items.map(b => b.id))).size, 6)
  assert.equal(grouped.flatMap(g => g.items).length, 6)
})
