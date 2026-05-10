import apiClient from '@/services/api/apiClient'
import eventBus, { ROLL_EVENTS } from '@/services/events/eventBus'
import { RollTypes } from '@/constants/rollTypes'

class DiscordService {
  constructor() {
    this.enabled = true
    this.handleSkillCheck = this.sendSkillCheck.bind(this)
    this.handleCustomRoll = this.sendCustomRoll.bind(this)
    this.handleDamageRoll = this.sendDamageRoll.bind(this)
    this.handleEngagement = this.sendEngagement.bind(this)
    this.handleOpposedSkillCheck = this.sendOpposedSkillCheck.bind(this)
    this.handleInitiativeRoll = this.sendInitiativeRoll.bind(this)
    this.handleInjuryRoll = this.sendInjuryRoll.bind(this)
    this.init()
  }

  init() {
    eventBus.on(ROLL_EVENTS.SKILL_CHECK, this.handleSkillCheck)
    eventBus.on(ROLL_EVENTS.CUSTOM_ROLL, this.handleCustomRoll)
    eventBus.on(ROLL_EVENTS.DAMAGE_ROLL, this.handleDamageRoll)
    eventBus.on(ROLL_EVENTS.ENGAGEMENT, this.handleEngagement)
    eventBus.on(ROLL_EVENTS.OPPOSED_SKILL_CHECK, this.handleOpposedSkillCheck)
    eventBus.on(ROLL_EVENTS.INITIATIVE_ROLL, this.handleInitiativeRoll)
    eventBus.on(ROLL_EVENTS.INJURY_ROLL, this.handleInjuryRoll)
  }

  destroy() {
    eventBus.off(ROLL_EVENTS.SKILL_CHECK, this.handleSkillCheck)
    eventBus.off(ROLL_EVENTS.CUSTOM_ROLL, this.handleCustomRoll)
    eventBus.off(ROLL_EVENTS.DAMAGE_ROLL, this.handleDamageRoll)
    eventBus.off(ROLL_EVENTS.ENGAGEMENT, this.handleEngagement)
    eventBus.off(ROLL_EVENTS.OPPOSED_SKILL_CHECK, this.handleOpposedSkillCheck)
    eventBus.off(ROLL_EVENTS.INITIATIVE_ROLL, this.handleInitiativeRoll)
    eventBus.off(ROLL_EVENTS.INJURY_ROLL, this.handleInjuryRoll)
  }

  setEnabled(enabled) {
    this.enabled = enabled
  }

  async sendSkillCheck({ rollResult, character, integrations }) {
    if (!this.enabled) return
    if (integrations?.discord === false) return

    try {
      const payload = {
        rollResults: rollResult.diceResults,
        total: rollResult.total,
        difficulty: rollResult.difficulty,
        name: character.name || 'Unnamed Character',
        skill: rollResult.skillName,
        success: rollResult.success,
        footer: rollResult.footer || '',
        image: character.featuredArtUrls?.[0] || ''
      }

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for skill check:', error)
    }
  }

  async sendCustomRoll({ rollResult, character, integrations }) {
    if (!this.enabled) return
    if (integrations?.discord === false) return

    try {
      const rollResultsText = rollResult.diceResults
        .map(r => `${r.dieRollValue} (d${r.dieSize})`)
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
        image: character.featuredArtUrls?.[0] || ''
      }

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for custom roll:', error)
    }
  }

  async sendDamageRoll({ rollResult, character, integrations }) {
    if (!this.enabled) return
    if (integrations?.discord === false) return

    try {
      const payload = {
        type: RollTypes.DAMAGE,
        name: character.name || 'Unnamed Character',
        skill: rollResult.skillName || 'Damage Roll',
        total: rollResult.total,
        rollResults: rollResult.diceResults,
        footer: rollResult.footer || '',
        image: character.featuredArtUrls?.[0] || ''
      }

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for damage roll:', error)
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

  async sendOpposedSkillCheck({ opposedResult, integrations }) {
    if (!this.enabled) return
    if (integrations?.discord === false) return

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

  async sendInjuryRoll({ rollResult, character }) {
    if (!this.enabled) return

    try {
      const payload = {
        type: RollTypes.INJURY,
        name: character.name || 'Unnamed Character',
        skill: 'Injury',
        total: rollResult.total,
        rollResults: rollResult.diceResults,
        footer: rollResult.footer || '',
        image: character.featuredArtUrls?.[0] || ''
      }

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for injury roll:', error)
    }
  }

  async sendInitiativeRoll({ rollResult, character }) {
    if (!this.enabled) return

    try {
      const payload = {
        type: RollTypes.INITIATIVE,
        name: character.name || 'Unnamed Character',
        skill: 'Initiative',
        total: rollResult.total,
        rollResults: rollResult.diceResults,
        footer: rollResult.footer || '',
        image: character.featuredArtUrls?.[0] || ''
      }

      await apiClient.post('/send-discord-message', payload)
    } catch (error) {
      console.warn('Discord notification failed for initiative roll:', error)
    }
  }
}

const discordService = new DiscordService()

export default discordService
