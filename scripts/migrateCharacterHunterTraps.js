#!/usr/bin/env node
/**
 * One-time migration: add hunterTraps field to all player character and NPC JSON files.
 * Sets hunterTraps: [] for any character that doesn't already have the field.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const charactersDir = join(__dirname, '../data/playerCharacters')
const npcsDir = join(__dirname, '../data/npcs')

let migrated = 0
let alreadySet = 0
let skipped = 0

function migrateDir(dir) {
  let files
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.json'))
  } catch {
    console.log(`Directory not found, skipping: ${dir}`)
    return
  }

  for (const file of files) {
    const filePath = join(dir, file)
    try {
      const stat = statSync(filePath)
      if (!stat.isFile()) continue
      
      const character = JSON.parse(readFileSync(filePath, 'utf8'))

      if (character.characterType !== 'playerCharacter' && character.characterType !== 'npc') {
        skipped++
        continue
      }

      if ('hunterTraps' in character) {
        alreadySet++
        continue
      }

      character.hunterTraps = []
      writeFileSync(filePath, JSON.stringify(character, null, 2) + '\n', 'utf8')
      migrated++
    } catch (e) {
      console.warn(`Skipping ${file}: ${e.message}`)
      skipped++
    }
  }
}

migrateDir(charactersDir)
migrateDir(npcsDir)

console.log(`Migration complete: ${migrated} updated, ${alreadySet} already had hunterTraps, ${skipped} skipped.`)
