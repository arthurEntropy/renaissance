import apiClient from '@/services/api/apiClient'
import eventBus, { ROLL_EVENTS } from '@/services/events/eventBus'
import { RollTypes } from '@/constants/rollTypes'

class DiscordService {
  constructor() {
    this.enabled = true
    this.init()
  }

  init() {
    eventBus.on(ROLL_EVENTS.SKILL_CHECK, this.sendSkillCheck.bind(this))
    eventBus.on(ROLL_EVENTS.CUSTOM_ROLL, this.sendCustomRoll.bind(this))
    eventBus.on(ROLL_EVENTS.ENGAGEMENT, this.sendEngagement.bind(this))
    eventBus.on(ROLL_EVENTS.OPPOSED_SKILL_CHECK, this.sendOpposedSkillCheck.bind(this))
  }

  destroy() {
    eventBus.off(ROLL_EVENTS.SKILL_CHECK, this.sendSkillCheck)
    eventBus.off(ROLL_EVENTS.CUSTOM_ROLL, this.sendCustomRoll)
    eventBus.off(ROLL_EVENTS.ENGAGEMENT, this.sendEngagement)
    eventBus.off(ROLL_EVENTS.OPPOSED_SKILL_CHECK, this.sendOpposedSkillCheck)
  }

  setEnabled(enabled) {
    this.enabled = enabled
  }

  async sendSkillCheck({ rollResult, character }) {
    if (!this.enabled) return

    try {
      const payload = {
        rollResults: rollResult.diceResults,
        total: rollResult.total,
        targetNumber: rollResult.targetNumber,
        name: character.name || 'Unnamed Character',
        skill: rollResult.skillName,
        success: rollResult.success,
        footer: rollResult.footer || '',
        image: character.artUrls?.[0] || ''
      }

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for skill check:', error)
    }
  }

  async sendCustomRoll({ rollResult, character }) {
    if (!this.enabled) return

    try {
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

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for custom roll:', error)
    }
  }

  async sendEngagement({ engagementResult }) {
    if (!this.enabled) return

    try {
      const payload = {
        type: RollTypes.ENGAGEMENT,
        ...engagementResult
      }

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for engagement:', error)
    }
  }

  async sendOpposedSkillCheck({ opposedResult }) {
    if (!this.enabled) return

    try {
      const payload = {
        type: RollTypes.OPPOSED_SKILL_CHECK,
        ...opposedResult
      }

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for opposed skill check:', error)
    }
  }
}

const discordService = new DiscordService()

export default discordService
