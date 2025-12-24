import BaseSessionService from './baseSessionService.js'
import { SESSION_EVENTS } from '@shared/constants/sessionEvents.js'

class EngagementSessionService extends BaseSessionService {
  constructor() {
    super('engagement')
  }

  _setupServiceSpecificHandlers() {
    this.socket.on(SESSION_EVENTS.SUCCESS_ASSIGNMENT_UPDATED, ({ characterId, player, diceIndex, successId }) => {
      this._notifyListeners(SESSION_EVENTS.SUCCESS_ASSIGNMENT_UPDATED, { characterId, player, diceIndex, successId })
    })

    this.socket.on(SESSION_EVENTS.DIE_REROLLED, ({ player, diceIndex, newValue, characterId }) => {
      this._notifyListeners(SESSION_EVENTS.DIE_REROLLED, { player, diceIndex, newValue, characterId })
    })

    this.socket.on(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, ({ index, state }) => {
      this._notifyListeners(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, { index, state })
    })
  }

  async autoJoinOrCreate(characterInfo, selectedDice, engagementSuccesses) {
    try {
      if (!this.socket) await this.connect()
      
      if (!this.socket || !this.socket.connected) {
        console.error(`${this.constructor.name}: Cannot auto-join, not connected to server`)
        return
      }

      this.socket.emit(SESSION_EVENTS.AUTO_JOIN_OR_CREATE, {
        characterInfo,
        selectedDice,
        engagementSuccesses
      })
    } catch (error) {
      console.error(`${this.constructor.name}: Error in auto-join-or-create:`, error)
      this._notifyListeners(SESSION_EVENTS.ERROR, { error: 'Failed to join or create session' })
    }
  }

  updateSuccessAssignment(characterId, player, diceIndex, successId) {
    this._safeEmit(SESSION_EVENTS.SUCCESS_ASSIGNMENT_UPDATED, {
      characterId,
      player,
      diceIndex,
      successId
    })
  }

  rerollDie(player, diceIndex, newValue, characterId) {
    try {
      if (this.socket && this.sessionId) {
        this.socket.emit(SESSION_EVENTS.REROLL_DIE, {
          sessionId: this.sessionId,
          player,
          diceIndex,
          newValue,
          characterId
        })
      } else {
        console.warn(`${this.constructor.name}: Cannot reroll die - no active socket or session`)
        this._notifyListeners(SESSION_EVENTS.ERROR, { error: 'Cannot reroll - not connected' })
      }
    } catch (error) {
      console.error(`${this.constructor.name}: Error rerolling die:`, error)
      this._notifyListeners(SESSION_EVENTS.ERROR, { error: 'Failed to reroll die' })
    }
  }

  updateResultIndicator(index, state) {
    this._safeEmit(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, {
      index,
      state
    })
  }
}

const engagementSessionService = new EngagementSessionService()

export default engagementSessionService
