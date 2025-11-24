import axios from 'axios'
import { API_CONFIG } from '@shared/constants/apiConfig.js'

class BaseRollService {
  static latestRollResult = null

  static getLatestRollResult() {
    return this.latestRollResult
  }

  static setLatestRollResult(result) {
    this.latestRollResult = result
  }

  static async sendToDiscord(payload) {
    try {
      await axios.post(`${API_CONFIG.BASE_URL}/send-discord-message`, payload)
    } catch (error) {
      console.error('Error sending roll results to Discord:', error)
      throw new Error('Failed to send roll results. Check your connection or server.')
    }
  }
}

export default BaseRollService
