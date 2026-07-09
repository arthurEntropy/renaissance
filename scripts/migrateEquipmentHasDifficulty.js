#!/usr/bin/env node
/**
 * One-time migration: add hasDifficulty field to all equipment items.
 * Sets hasDifficulty: true for items that are Hunter's Traps (by subtype)
 * or whose description contains trigger phrases indicating they set a Difficulty.
 * All other items get hasDifficulty: false.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const equipmentDir = join(__dirname, '../data/equipment')

const HUNTER_TRAP_SUBTYPE_ID = '71c52847-7265-4c53-82c0-5b89a8f32998'
const DIFFICULTY_TRIGGER_PHRASES = ['to set the Difficulty', 'becomes the Difficulty']

const files = readdirSync(equipmentDir).filter(f => f.endsWith('.json'))

let migrated = 0
let alreadySet = 0

for (const file of files) {
  const filePath = join(equipmentDir, file)
  const item = JSON.parse(readFileSync(filePath, 'utf8'))

  const hasDifficulty =
    item.subtype === HUNTER_TRAP_SUBTYPE_ID ||
    (typeof item.description === 'string' &&
      DIFFICULTY_TRIGGER_PHRASES.some(phrase => item.description.includes(phrase)))

  if (item.hasDifficulty === hasDifficulty) {
    alreadySet++
    continue
  }

  item.hasDifficulty = hasDifficulty
  writeFileSync(filePath, JSON.stringify(item, null, 2) + '\n', 'utf8')
  migrated++
}

console.log(`Migration complete: ${migrated} updated, ${alreadySet} already correct.`)
