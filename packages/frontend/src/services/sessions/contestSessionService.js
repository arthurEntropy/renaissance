import BaseSessionService from './baseSessionService.js'
import { SESSION_EVENTS } from '@shared/constants/sessionEvents.js'

class ContestSessionService extends BaseSessionService {
  constructor() {
    super('contest')
  }

  _setupServiceSpecificHandlers() {
    this.socket.on(SESSION_EVENTS.START_REROLL, ({ sessionId, rerollingCharacterId, timestamp }) => {
      this._notifyListeners(SESSION_EVENTS.START_REROLL, { sessionId, rerollingCharacterId, timestamp })
    })
  }

  async autoJoinOrCreate(characterInfo, skillCheckConfig) {
    try {
      if (!this.socket) await this.connect()
      
      if (!this.socket || !this.socket.connected) {
        console.error(`${this.constructor.name}: Cannot auto-join, not connected to server`)
        return
      }

      this.socket.emit(SESSION_EVENTS.AUTO_JOIN_OR_CREATE, {
        characterInfo,
        skillCheckConfig
      })
    } catch (error) {
      console.error(`${this.constructor.name}: Error in auto-join-or-create:`, error)
      this._notifyListeners(SESSION_EVENTS.ERROR, { error: 'Failed to join or create session' })
    }
  }

  rerollSkillCheck(sessionId, rerollingCharacterId) {
    try {
      if (!this.socket || !this.socket.connected) {
        console.error(`${this.constructor.name}: Socket not connected for reroll skill check`)
        return
      }

      this.socket.emit(SESSION_EVENTS.REROLL_SKILL_CHECK, { 
        sessionId, 
        rerollingCharacterId 
      })
    } catch (error) {
      console.error(`${this.constructor.name}: Error rerolling skill check:`, error)
      this._notifyListeners(SESSION_EVENTS.ERROR, { error: 'Failed to reroll skill check' })
    }
  }
}

const contestSessionService = new ContestSessionService()

export default contestSessionService
