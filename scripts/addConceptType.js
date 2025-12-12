#!/usr/bin/env node

/**
 * Data Migration Script: Add conceptType to Concept JSON Files
 * 
 * This script adds the conceptType property to all existing concept JSON files
 * in preparation for consolidating the four concept stores into one.
 * 
 * Usage: node scripts/addConceptType.js [--dry-run]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Concept type mappings
const CONCEPT_MAPPINGS = [
  {
    folder: 'ancestries',
    conceptType: 'ANCESTRY',
    label: 'Ancestry'
  },
  {
    folder: 'cultures',
    conceptType: 'CULTURE',
    label: 'Culture'
  },
  {
    folder: 'mestieri',
    conceptType: 'MESTIERE',
    label: 'Mestiere'
  },
  {
    folder: 'worldElements',
    conceptType: 'WORLD_ELEMENT',
    label: 'World Element'
  }
]

const DATA_DIR = path.join(__dirname, '..', 'data')
const BACKUP_DIR = path.join(__dirname, '..', 'data-backup-' + Date.now())

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

// Statistics
let stats = {
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  errors: 0,
  byType: {}
}

/**
 * Create backup of data directory
 */
function createBackup() {
  console.log('\n📦 Creating backup...')
  console.log(`Backup location: ${BACKUP_DIR}`)
  
  if (isDryRun) {
    console.log('  [DRY RUN] Backup would be created')
    return
  }
  
  try {
    fs.cpSync(DATA_DIR, BACKUP_DIR, { recursive: true })
    console.log('✅ Backup created successfully\n')
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message)
    throw error
  }
}

/**
 * Process a single JSON file
 */
function processFile(filePath, conceptType, label) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)
    
    // Check if conceptType already exists
    if (data.conceptType) {
      console.log(`  ⏭️  Skipped: ${path.basename(filePath)} (already has conceptType: ${data.conceptType})`)
      stats.skippedFiles++
      return false
    }
    
    // Add conceptType property (after id, before name if possible)
    const updatedData = {
      id: data.id,
      conceptType: conceptType,
      ...Object.keys(data).reduce((acc, key) => {
        if (key !== 'id') {
          acc[key] = data[key]
        }
        return acc
      }, {})
    }
    
    if (isDryRun) {
      console.log(`  🔍 Would update: ${path.basename(filePath)} → conceptType: ${conceptType}`)
    } else {
      // Write back to file with pretty formatting
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2) + '\n', 'utf8')
      console.log(`  ✅ Updated: ${path.basename(filePath)} → conceptType: ${conceptType}`)
    }
    
    stats.processedFiles++
    return true
  } catch (error) {
    console.error(`  ❌ Error processing ${path.basename(filePath)}:`, error.message)
    stats.errors++
    return false
  }
}

/**
 * Process all files in a concept folder
 */
function processConceptFolder(mapping) {
  const folderPath = path.join(DATA_DIR, mapping.folder)
  
  console.log(`\n📁 Processing ${mapping.label} (${mapping.folder})`)
  console.log(`   Path: ${folderPath}`)
  
  if (!fs.existsSync(folderPath)) {
    console.log(`   ⚠️  Folder not found, skipping...`)
    return
  }
  
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'))
  console.log(`   Found ${files.length} JSON files\n`)
  
  stats.byType[mapping.conceptType] = {
    folder: mapping.folder,
    total: files.length,
    processed: 0,
    skipped: 0,
    errors: 0
  }
  
  files.forEach(file => {
    const filePath = path.join(folderPath, file)
    stats.totalFiles++
    
    const processed = processFile(filePath, mapping.conceptType, mapping.label)
    
    if (processed) {
      stats.byType[mapping.conceptType].processed++
    } else {
      stats.byType[mapping.conceptType].skipped++
    }
  })
}

/**
 * Print final statistics
 */
function printStats() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))
  
  if (isDryRun) {
    console.log('\n⚠️  DRY RUN MODE - No files were modified\n')
  }
  
  console.log('\nOverall Statistics:')
  console.log(`  Total files found:    ${stats.totalFiles}`)
  console.log(`  Files processed:      ${stats.processedFiles}`)
  console.log(`  Files skipped:        ${stats.skippedFiles}`)
  console.log(`  Errors:               ${stats.errors}`)
  
  console.log('\nBy Concept Type:')
  Object.entries(stats.byType).forEach(([type, data]) => {
    console.log(`\n  ${type} (${data.folder}):`)
    console.log(`    Total:      ${data.total}`)
    console.log(`    Processed:  ${data.processed}`)
    console.log(`    Skipped:    ${data.skipped}`)
    if (data.errors > 0) {
      console.log(`    Errors:     ${data.errors}`)
    }
  })
  
  console.log('\n' + '='.repeat(60))
  
  if (stats.errors > 0) {
    console.log('\n⚠️  Migration completed with errors. Please review the output above.')
  } else if (stats.processedFiles === 0 && stats.skippedFiles > 0) {
    console.log('\n✅ All files already have conceptType property.')
  } else if (!isDryRun) {
    console.log('\n✅ Migration completed successfully!')
    console.log(`\nBackup location: ${BACKUP_DIR}`)
    console.log('If anything went wrong, you can restore from this backup.')
  } else {
    console.log('\n✅ Dry run completed. Run without --dry-run to apply changes.')
  }
  
  console.log('\n')
}

/**
 * Main execution
 */
function main() {
  console.log('╔' + '═'.repeat(58) + '╗')
  console.log('║' + ' '.repeat(58) + '║')
  console.log('║' + '  Concept Type Migration Script'.padEnd(58) + '║')
  console.log('║' + ' '.repeat(58) + '║')
  console.log('╚' + '═'.repeat(58) + '╝')
  
  if (isDryRun) {
    console.log('\n🔍 Running in DRY RUN mode - no files will be modified\n')
  }
  
  try {
    // Create backup
    if (!isDryRun) {
      createBackup()
    }
    
    // Process each concept folder
    CONCEPT_MAPPINGS.forEach(mapping => {
      processConceptFolder(mapping)
    })
    
    // Print final statistics
    printStats()
    
    // Exit with appropriate code
    process.exit(stats.errors > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the script
main()
