import { google } from 'googleapis'
import { access } from 'fs/promises'
import { constants as fsConstants } from 'fs'
import * as tar from 'tar'
import { getDirectory } from './fileService.js'

let driveClient = null

function initializeDriveClient() {
  if (driveClient) {
    return driveClient
  }

  try {
    const serviceAccountKeyJson = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON
    if (!serviceAccountKeyJson) {
      console.warn('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON not configured; backups to Google Drive will not work')
      return null
    }

    let serviceAccount
    try {
      // Assume the env var is base64-encoded JSON
      const decoded = Buffer.from(serviceAccountKeyJson, 'base64').toString('utf8')
      serviceAccount = JSON.parse(decoded)
    } catch {
      // Fallback: try to parse as raw JSON
      serviceAccount = JSON.parse(serviceAccountKeyJson)
    }

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    driveClient = google.drive({ version: 'v3', auth })
    console.log('Google Drive client initialized successfully')
    return driveClient
  } catch (error) {
    console.error('Failed to initialize Google Drive client:', error.message)
    return null
  }
}

export async function backupDataToDrive() {
  const drive = initializeDriveClient()
  if (!drive) {
    throw new Error('Google Drive not configured')
  }

  const folderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_BACKUP_FOLDER_ID not configured')
  }

  // Check if data directory exists
  const dataDir = getDirectory('.')
  try {
    await access(dataDir, fsConstants.R_OK)
  } catch {
    throw new Error(`Data directory not accessible: ${dataDir}`)
  }

  // Create a tar.gz stream and upload
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `renaissance-backup-${timestamp}.tar.gz`

  return new Promise((resolve, reject) => {
    const tarStream = tar.c(
      {
        gzip: true,
        cwd: dataDir,
      },
      ['./']
    )

    drive.files.create(
      {
        requestBody: {
          name: filename,
          mimeType: 'application/gzip',
          parents: [folderId],
        },
        media: {
          mimeType: 'application/gzip',
          body: tarStream,
        },
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading backup to Google Drive:', error.message)
          reject(new Error(`Failed to upload backup: ${error.message}`))
        } else {
          console.log(`Backup uploaded successfully: ${filename} (ID: ${result.data.id})`)
          resolve({
            filename,
            fileId: result.data.id,
            timestamp: new Date().toISOString(),
          })
        }
      }
    )
  })
}

export default {
  backupDataToDrive,
}
