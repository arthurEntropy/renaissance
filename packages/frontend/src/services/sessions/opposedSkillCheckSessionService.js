import BaseSessionService from './baseSessionService.js'

class OpposedSkillCheckSessionService extends BaseSessionService {
  constructor() {
    super('opposed-skill-check')
  }

  // Service-specific socket event handlers
  _setupServiceSpecificHandlers() {
    this.socket.on('start-reroll', ({ sessionId, rerollingCharacterId, timestamp }) => {
      this._notifyListeners('start-reroll', { sessionId, rerollingCharacterId, timestamp })
    })
  }

  // Service-specific methods
  async autoJoinOrCreate(characterInfo, skillCheckConfig) {
    try {
      if (!this.socket) await this.connect()
      
      if (!this.socket || !this.socket.connected) {
        console.error('OpposedSkillCheckService: Cannot auto-join, not connected to server')
        this._notifyListeners('connection-error', { error: 'Not connected to server' })
        return
      }

      this.socket.emit('auto-join-or-create', {
        characterInfo,
        skillCheckConfig
      })
    } catch (error) {
      console.error('OpposedSkillCheckService: Error in auto-join-or-create:', error)
      this._notifyListeners('error', { error: 'Failed to join or create session' })
    }
  }

  async rerollSkillCheck(sessionId, rerollingCharacterId) {
    try {
      if (!this.socket || !this.socket.connected) {
        console.error('OpposedSkillCheckService: Socket not connected for reroll skill check')
        this._notifyListeners('connection-error', { error: 'Not connected to server' })
        return
      }

      this.socket.emit('reroll-skill-check', { 
        sessionId, 
        rerollingCharacterId 
      })
    } catch (error) {
      console.error('OpposedSkillCheckService: Error rerolling skill check:', error)
      this._notifyListeners('error', { error: 'Failed to reroll skill check' })
    }
  }
}

const opposedSkillCheckSessionService = new OpposedSkillCheckSessionService()

export default opposedSkillCheckSessionService
