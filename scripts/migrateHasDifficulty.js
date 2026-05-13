#!/usr/bin/env node
/**
 * One-time migration: add hasDifficulty field to all abilities.
 * Sets hasDifficulty: true for abilities whose description contains one of the
 * trigger phrases that indicate they set a Difficulty to be tracked per-character.
 * All other abilities get hasDifficulty: false.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const abilitiesDir = join(__dirname, '../data/abilities')

const DIFFICULTY_TRIGGER_PHRASES = ['to set the Difficulty', 'becomes the Difficulty']

const files = readdirSync(abilitiesDir).filter(f => f.endsWith('.json'))

let migrated = 0
let alreadySet = 0

for (const file of files) {
  const filePath = join(abilitiesDir, file)
  const ability = JSON.parse(readFileSync(filePath, 'utf8'))

  const hasDifficulty =
    typeof ability.description === 'string' &&
    DIFFICULTY_TRIGGER_PHRASES.some(phrase => ability.description.includes(phrase))

  if (ability.hasDifficulty === hasDifficulty) {
    alreadySet++
    continue
  }

  ability.hasDifficulty = hasDifficulty
  writeFileSync(filePath, JSON.stringify(ability, null, 2) + '\n', 'utf8')
  migrated++
}

console.log(`Migration complete: ${migrated} updated, ${alreadySet} already correct.`)
