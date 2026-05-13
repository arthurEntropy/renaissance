#!/usr/bin/env node
/**
 * One-time migration: flatten art data from { tags: { type, sources } }
 * to top-level { type, sources }, removing the 'tags' wrapper.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const artDir = join(__dirname, '../data/art')

const files = readdirSync(artDir).filter(f => f.endsWith('.json'))

let migrated = 0
let skipped = 0

for (const file of files) {
  const filePath = join(artDir, file)
  const art = JSON.parse(readFileSync(filePath, 'utf8'))

  if (!art.tags) {
    skipped++
    continue
  }

  const { tags, ...rest } = art
  const normalized = {
    ...rest,
    type: tags.type ?? rest.type,
    sources: tags.sources ?? rest.sources ?? [],
  }

  writeFileSync(filePath, JSON.stringify(normalized, null, 2) + '\n', 'utf8')
  migrated++
}

console.log(`Migration complete: ${migrated} migrated, ${skipped} already up to date.`)
