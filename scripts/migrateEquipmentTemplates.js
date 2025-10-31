#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const EQUIPMENT_DIR = path.join(__dirname, '../data/equipment');

async function migrateEquipmentTemplates() {
  console.log('Starting equipment template migration...\n');
  
  let migratedCount = 0;
  let errorCount = 0;

  try {
    // Read all files in the equipment directory
    const files = await fs.readdir(EQUIPMENT_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} equipment files\n`);

    for (const file of jsonFiles) {
      const filePath = path.join(EQUIPMENT_DIR, file);
      
      try {
        // Read the file
        const content = await fs.readFile(filePath, 'utf8');
        const equipment = JSON.parse(content);

        // Check if the name starts with ª
        if (equipment.name && equipment.name.startsWith('ª')) {
          console.log(`Migrating: ${equipment.name}`);
          
          // Remove the ª character from the name
          equipment.name = equipment.name.substring(1);
          
          // Set isTemplate to true
          equipment.isTemplate = true;
          
          // Write the updated equipment back to the file
          await fs.writeFile(
            filePath,
            JSON.stringify(equipment, null, 2) + '\n',
            'utf8'
          );
          
          console.log(`  ✓ Migrated to: ${equipment.name} (isTemplate: true)\n`);
          migratedCount++;
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration complete!');
    console.log(`Successfully migrated: ${migratedCount} items`);
    if (errorCount > 0) {
      console.log(`Errors encountered: ${errorCount} items`);
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateEquipmentTemplates();
