#!/usr/bin/env node
/**
 * Migration: Remove manually-added engagement dice/successes that are now
 * automatically provided by a character's assigned mestiere (via novizio data).
 *
 * Safe to run multiple times — only removes items that match what the mestiere provides.
 *
 * Usage: node scripts/migrate-engagement-from-mestiere.js
 */

const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.join(__dirname, '..')
const CHARACTERS_DIR = path.join(PROJECT_ROOT, 'data/characters')
const CONCEPTS_DIR = path.join(PROJECT_ROOT, 'data/concepts')

// Load all concepts indexed by id
const concepts = new Map()
fs.readdirSync(CONCEPTS_DIR)
  .filter(f => f.endsWith('.json'))
  .forEach(f => {
    const concept = JSON.parse(fs.readFileSync(path.join(CONCEPTS_DIR, f), 'utf8'))
    concepts.set(concept.id, concept)
  })

const characterFiles = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.json'))

let updatedCount = 0

for (const file of characterFiles) {
  const filePath = path.join(CHARACTERS_DIR, file)
  const character = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  if (!character.mestiereId) continue

  const mestiere = concepts.get(character.mestiereId)
  if (!mestiere?.novizio) continue

  let changed = false

  // ── Engagement Dice ──────────────────────────────────────────────────────
  // Build the list of dice the mestiere provides (in die-size order)
  const novizioEngagementDice = mestiere.novizio.engagementDice || {}
  const mestriereDiceToRemove = []
  for (const [sizeStr, count] of Object.entries(novizioEngagementDice)) {
    const size = Number(sizeStr)
    for (let i = 0; i < count; i++) {
      mestriereDiceToRemove.push(size)
    }
  }

  if (mestriereDiceToRemove.length > 0 && character.engagementDice?.length > 0) {
    const remaining = [...character.engagementDice]
    for (const mestiereDie of mestriereDiceToRemove) {
      const idx = remaining.indexOf(mestiereDie)
      if (idx !== -1) {
        remaining.splice(idx, 1)
        changed = true
      }
    }
    if (changed) {
      character.engagementDice = remaining
    }
  }

  // ── Engagement Successes ─────────────────────────────────────────────────
  const mestiereSuccessIds = new Set(mestiere.novizio.engagementSuccesses || [])
  if (mestiereSuccessIds.size > 0 && character.engagementSuccesses?.length > 0) {
    const before = character.engagementSuccesses.length
    character.engagementSuccesses = character.engagementSuccesses.filter(id => !mestiereSuccessIds.has(id))
    if (character.engagementSuccesses.length !== before) changed = true
  }

  // ── Prune stale user_added dice statuses ─────────────────────────────────
  // After removing dice from the array, any user_added_{n} keys beyond the new
  // array length are stale. The frontend prunes them on load, but cleaning up
  // here keeps the data tidy and avoids confusing diffs.
  if (changed && character.engagementDiceStatuses) {
    const validKeys = new Set(
      (character.engagementDice || []).map((_, i) => `user_added_${i}`)
    )
    const cleaned = {}
    for (const [key, val] of Object.entries(character.engagementDiceStatuses)) {
      if (!key.startsWith('user_added_') || validKeys.has(key)) {
        cleaned[key] = val
      }
    }
    character.engagementDiceStatuses = cleaned
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(character, null, 2) + '\n')
    console.log(`Updated: ${file}`)
    console.log(`  mestiere: ${mestiere.name}`)
    console.log(`  engagementDice now: ${JSON.stringify(character.engagementDice ?? [])}`)
    console.log(`  engagementSuccesses now: ${JSON.stringify(character.engagementSuccesses ?? [])}`)
    updatedCount++
  }
}

console.log(`\nMigration complete. Updated ${updatedCount} character(s).`)
