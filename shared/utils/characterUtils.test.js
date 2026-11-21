import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateBeastChallenge } from './characterUtils.js'

test('beast challenge includes only trained wielded equipment and ability XP divided by five', () => {
  const character = {
    body: 3, heart: 2, wits: 1,
    equipment: [
      { id: 'trained', isWielding: true, quantity: 2 },
      { id: 'untrained', isWielding: true, quantity: 1 },
      { id: 'carried', isWielding: false, quantity: 1 },
      { id: 'free', isWielding: true, quantity: 1 },
    ],
    abilities: [{ id: 'a' }, { id: 'b' }],
  }
  const equipment = [
    { id: 'trained', keeping: 'price' },
    { id: 'untrained', keeping: 'price' },
    { id: 'carried', keeping: 'price' },
    { id: 'free', keeping: null },
  ]
  const abilities = [{ id: 'a', xpCost: 6 }, { id: 'b', xpCost: 2 }]
  assert.equal(calculateBeastChallenge(character, equipment, abilities, [{ id: 'price', cost: 3 }],
    item => item.id !== 'untrained'), 13.6)
})

test('beast challenge reports missing referenced data rather than producing a partial value', () => {
  assert.throws(() => calculateBeastChallenge({ equipment: [{ id: 'missing', isWielding: true }] },
    [], [], [], () => true), /Equipment not found/)
  assert.throws(() => calculateBeastChallenge({ abilities: [{ id: 'missing' }] },
    [], [], [], () => true), /Ability not found/)
  assert.throws(() => calculateBeastChallenge({ equipment: [{ id: 'sword', isWielding: true }] },
    [{ id: 'sword', keeping: 'missing' }], [], [], () => true), /Equipment keeping not found/)
})
