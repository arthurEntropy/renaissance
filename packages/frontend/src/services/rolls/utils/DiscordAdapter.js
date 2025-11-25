import axios from 'axios'
import { API_CONFIG } from '@shared/constants/apiConfig.js'
import { RollTypes } from '@/constants/rollTypes'

class DiscordAdapter {

  static async sendSkillCheck(rollResult, character) {
    try {
      const payload = {
        rollResults: rollResult.diceResults, // Backend expects array of DiceResult objects
        total: rollResult.total,
        targetNumber: rollResult.targetNumber,
        name: character.name || 'Unnamed Character',
        skill: rollResult.skillName,
        success: rollResult.success,
        footer: rollResult.footer || '',
        image: character.artUrls?.[0] || ''
      }
      
      await this._sendToDiscord(payload)
    } catch (error) {
      console.warn('Failed to send skill check to Discord:', error.message)
      // Don't throw - Discord failures shouldn't break the game
    }
  }

  static async sendCustomRoll(rollResult, character) {
    try {
      // Format dice results for Discord display
      const rollResultsText = rollResult.diceResults
        .map(r => `${r.dieRollValue} (d${r.dieSides})`)
        .join(', ')
      
      const footer = rollResult.modifier !== 0 
        ? `Dice: ${rollResult.diceTotal}, Modifier: ${rollResult.modifier >= 0 ? '+' : ''}${rollResult.modifier}`
        : ''
      
      const payload = {
        rollResults: rollResultsText,
        total: rollResult.total,
        name: character.name || 'Unnamed Character',
        skill: 'Custom Roll',
        footer,
        image: character.artUrls?.[0] || ''
      }
      
      await this._sendToDiscord(payload)
    } catch (error) {
      console.warn('Failed to send custom roll to Discord:', error.message)
    }
  }

  static async sendEngagement(engagementResult) {
    try {
      const payload = {
        type: RollTypes.ENGAGEMENT,
        ...engagementResult
      }
      
      await this._sendToDiscord(payload)
    } catch (error) {
      console.warn('Failed to send engagement to Discord:', error.message)
    }
  }

  static async sendOpposedSkillCheck(opposedResult) {
    try {
      const payload = {
        type: RollTypes.OPPOSED_SKILL_CHECK,
        ...opposedResult
      }
      
      await this._sendToDiscord(payload)
    } catch (error) {
      console.warn('Failed to send opposed skill check to Discord:', error.message)
    }
  }

  static async _sendToDiscord(payload) {
    try {
      await axios.post(`${API_CONFIG.BASE_URL}/send-discord-message`, payload)
    } catch (error) {
      // Log the full error for debugging
      console.error('Discord webhook error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      
      // Re-throw with user-friendly message
      throw new Error('Failed to send roll results to Discord. Check your connection or server.')
    }
  }
}

export default DiscordAdapter
