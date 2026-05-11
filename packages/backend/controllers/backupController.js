import { backupDataToDrive } from '../utils/backupService.js'

export const backupToDrive = async (req, res) => {
  try {
    const result = await backupDataToDrive()
    return res.status(200).json({
      success: true,
      message: 'Backup to Google Drive completed successfully',
      backup: result,
    })
  } catch (error) {
    console.error('Error in backup endpoint:', error.message)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to backup data to Google Drive',
    })
  }
}

export default {
  backupToDrive,
}
