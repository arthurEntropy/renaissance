import { writeFile, mkdir, rm, readdir, cp } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import * as tar from 'tar'
import { DATA_DIR } from '../utils/fileService.js'

export const exportData = async (req, res) => {
  try {
    const date = new Date().toISOString().slice(0, 10)
    const filename = `renaissance-data-${date}.tar.gz`

    res.setHeader('Content-Type', 'application/gzip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const tarStream = tar.c({ gzip: true, cwd: DATA_DIR }, ['./'])
    tarStream.pipe(res)

    tarStream.on('error', (err) => {
      console.error('Export stream error:', err)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to export data' })
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export data' })
    }
  }
}

export const importData = async (req, res) => {
  const tempTarPath = join('/tmp', `renaissance-import-${uuidv4()}.tar.gz`)
  const tempExtractDir = join('/tmp', `renaissance-extract-${uuidv4()}`)

  try {
    // Write uploaded body (Buffer) to a temp tar file
    await writeFile(tempTarPath, req.body)

    // Extract into temp dir
    await mkdir(tempExtractDir, { recursive: true })
    await tar.x({ file: tempTarPath, cwd: tempExtractDir })

    // Verify extraction produced something
    const newEntries = await readdir(tempExtractDir)
    if (newEntries.length === 0) {
      return res.status(400).json({ error: 'Archive appears to be empty' })
    }

    // Clear existing DATA_DIR contents and replace with extracted files.
    // We never remove DATA_DIR itself (it may be the disk mount point).
    const existingEntries = await readdir(DATA_DIR)
    for (const entry of existingEntries) {
      await rm(join(DATA_DIR, entry), { recursive: true, force: true })
    }
    for (const entry of newEntries) {
      await cp(join(tempExtractDir, entry), join(DATA_DIR, entry), { recursive: true })
    }

    res.json({ message: 'Data imported successfully' })
  } catch (error) {
    console.error('Error importing data:', error)
    res.status(500).json({ error: `Failed to import data: ${error.message}` })
  } finally {
    await rm(tempTarPath, { force: true })
    await rm(tempExtractDir, { recursive: true, force: true })
  }
}
