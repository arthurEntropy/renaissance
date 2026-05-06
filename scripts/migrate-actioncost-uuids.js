import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const abilitiesDir = path.join(__dirname, '../data/abilities');

// Map old ActionType constant UUIDs to new actionCost data IDs
const actionCostMapping = {
  'a1b2c3d4-e5f6-4a1b-9c8d-7e6f5a4b3c2d': 'f83f4bdb-440b-4d95-a01f-bd322b7f8be1', // TRAIT
  'b2c3d4e5-f6a1-4b2c-ad9e-8f7a6b5c4d3e': '662f778f-5995-4f20-bc8c-a0f078a2125c', // ACTION
  'c3d4e5f6-a1b2-4c3d-be0f-9a8b7c6d5e4f': '40656418-af01-43ae-8a60-a1bd0124efb4', // HALF_ACTION
  'd4e5f6a1-b2c3-4d4e-cf1a-0b9c8d7e6f5a': '022e5465-d7b9-460f-82cb-0816f86228b3', // FREE_ACTION
  'e5f6a1b2-c3d4-4e5f-da2b-1c0d9e8f7a6b': 'c4df395c-8284-4c4f-bf01-e293ed51c58c', // REACTION
  'f6a1b2c3-d4e5-4f6a-eb3c-2d1e0f9a8b7c': 'c7ea4889-0dc9-40cb-a437-70329cac43ab', // RITUAL
};

function migrateActionCosts(ability) {
  if (ability.actionCost && actionCostMapping[ability.actionCost]) {
    ability.actionCost = actionCostMapping[ability.actionCost];
    return true;
  }
  return false;
}

function migrateAbilities() {
  const files = fs.readdirSync(abilitiesDir).filter(file => file.endsWith('.json'));

  let count = 0;
  let migrated = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const filePath = path.join(abilitiesDir, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const ability = JSON.parse(data);

      if (migrateActionCosts(ability)) {
        fs.writeFileSync(filePath, JSON.stringify(ability, null, 2) + '\n');
        migrated++;
      }
      count++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
      errors++;
    }
  }

  console.log(`✓ Processed ${count} ability files`);
  console.log(`✓ Migrated ${migrated} actionCost references`);
  if (errors > 0) {
    console.log(`✗ Encountered ${errors} errors`);
  }
}

migrateAbilities();
