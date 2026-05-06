import { randomUUID } from 'crypto'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Define action costs with their original labels and desired order
const actionCosts = [
  { name: 'Trait', order: 0 },
  { name: 'Free Action', order: 1 },
  { name: 'Half Action', order: 2 },
  { name: 'Action', order: 3 },
  { name: 'Reaction', order: 4 },
  { name: 'Ritual', order: 5 },
]

const dataDir = join(__dirname, '..', 'data', 'actionCosts')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const now = new Date().toISOString()

actionCosts.forEach((cost) => {
  const entity = {
    id: randomUUID(),
    name: cost.name,
    index: cost.order,
    isDeleted: false,
    createdAt: now,
    lastModified: now,
  }

  // Convert name to kebab-case for filename
  const filename = cost.name.toLowerCase().replace(/\s+/g, '_') + '.json'
  const filepath = join(dataDir, filename)

  writeFileSync(filepath, JSON.stringify(entity, null, 2))
  console.log(`Created ${filename} with id ${entity.id}`)
})

console.log('\nAction cost data files created successfully!')
