import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const abilitiesDir = path.join(__dirname, '../data/abilities');

// Define the field order based on the type definition
const fieldOrder = [
  // GameEntity fields
  'id',
  'isDeleted',
  'createdAt',
  'lastModified',

  // Ability-specific fields
  'name',
  'artUrl',
  'description',
  'successes',
  'improvements',
  'source',
  'school',
  'isMagical',

  // Costs
  'actionCost',
  'mpCost',
  'xpCost',
  'manaCost',

  // Biome interactions
  'biomeTagsAugment',
  'biomeTagsInhibit',
];

function normalizeAbility(ability) {
  // Rename 'type' to 'actionCost' if it exists
  if ('type' in ability && !('actionCost' in ability)) {
    ability.actionCost = ability.type;
    delete ability.type;
  }

  // Create a new object with fields in the correct order
  const normalized = {};

  for (const field of fieldOrder) {
    if (field in ability) {
      normalized[field] = ability[field];
    }
  }

  // Include any extra fields that aren't in the standard order
  for (const key in ability) {
    if (!fieldOrder.includes(key)) {
      normalized[key] = ability[key];
    }
  }

  return normalized;
}

function normalizeAbilities() {
  const files = fs.readdirSync(abilitiesDir).filter(file => file.endsWith('.json'));

  let count = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const filePath = path.join(abilitiesDir, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const ability = JSON.parse(data);

      const normalized = normalizeAbility(ability);

      fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2) + '\n');
      count++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
      errors++;
    }
  }

  console.log(`✓ Normalized ${count} ability files`);
  if (errors > 0) {
    console.log(`✗ Encountered ${errors} errors`);
  }
}

normalizeAbilities();
