#!/usr/bin/env node
/**
 * Migration: speed current/base + PC/NPC beast-field cleanup
 *
 * 1. Converts `speed: <number>` → `speed: { current: <number>, base: <number> }`
 *    for ALL character types (playerCharacter, npc, beast, beastInstance).
 *
 * 2. Removes beast-exclusive fields from playerCharacter and npc character files:
 *    size, reach, hasDarkvision, hasBlindsight, hasTremorsense, hasTruesight,
 *    burrowSpeed, climbSpeed, flySpeed, swimSpeed, biomeTagsAugment,
 *    biomeTagsInhibit, beastTypeIds
 *
 * Run: node scripts/migrate-speed-and-beast-fields.js
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'data')

const CHARACTER_DIRS = [
  { dir: 'playerCharacters', types: ['playerCharacter'] },
  { dir: 'npcs', types: ['npc'] },
  { dir: 'beasts', types: ['beast'] },
  { dir: 'beastInstances', types: ['beastInstance'] },
]

const BEAST_EXCLUSIVE_FIELDS = [
  'size', 'reach',
  'hasDarkvision', 'hasBlindsight', 'hasTremorsense', 'hasTruesight',
  'burrowSpeed', 'climbSpeed', 'flySpeed', 'swimSpeed',
  'biomeTagsAugment', 'biomeTagsInhibit',
  'beastTypeIds',
]

let totalFiles = 0
let modifiedFiles = 0

function migrateFile(filePath, isNonBeast) {
  let raw
  try {
    raw = fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    console.error(`  ERROR reading ${filePath}: ${e.message}`)
    return
  }

  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    console.error(`  ERROR parsing ${filePath}: ${e.message}`)
    return
  }

  totalFiles++
  let changed = false

  // 1. Migrate speed
  if (typeof data.speed === 'number') {
    const speedValue = data.speed
    data.speed = { current: speedValue, base: speedValue }
    changed = true
  }

  // 2. Remove beast-exclusive fields from PC/NPC
  if (isNonBeast) {
    for (const field of BEAST_EXCLUSIVE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        delete data[field]
        changed = true
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
    modifiedFiles++
    console.log(`  Updated: ${path.basename(filePath)}`)
  }
}

for (const { dir, types } of CHARACTER_DIRS) {
  const fullDir = path.join(DATA_DIR, dir)
  const isNonBeast = types.every(t => t === 'playerCharacter' || t === 'npc')

  if (!fs.existsSync(fullDir)) {
    console.log(`Skipping missing directory: ${fullDir}`)
    continue
  }

  console.log(`\nProcessing ${dir}/...`)
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.json'))
  for (const file of files) {
    migrateFile(path.join(fullDir, file), isNonBeast)
  }
}

console.log(`\nMigration complete: ${modifiedFiles} of ${totalFiles} files updated.`)
