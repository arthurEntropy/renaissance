#!/usr/bin/env node
/**
 * Migration: Rename `personalityAndBackground` → `notes` on all character JSON files.
 *
 * Safe to run multiple times — skips files that already have `notes` and no `personalityAndBackground`.
 *
 * Usage: node scripts/migrate-notes-field.js
 */

const fs = require('fs')
const path = require('path')

const CHARACTERS_DIR = path.join(__dirname, '..', 'data', 'characters')

const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.json'))

let updated = 0
let skipped = 0

for (const file of files) {
  const filePath = path.join(CHARACTERS_DIR, file)
  const character = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  if (!('personalityAndBackground' in character)) {
    skipped++
    continue
  }

  character.notes = character.personalityAndBackground
  delete character.personalityAndBackground

  fs.writeFileSync(filePath, JSON.stringify(character, null, 2) + '\n')
  console.log(`Updated: ${file}`)
  updated++
}

console.log(`\nDone. Updated ${updated} file(s), skipped ${skipped} file(s).`)
