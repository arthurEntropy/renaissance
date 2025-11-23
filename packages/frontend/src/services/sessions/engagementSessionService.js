import BaseSessionService from './baseSessionService.js'

class EngagementSessionService extends BaseSessionService {
  constructor() {
    super('engagement')
  }

  // Service-specific socket event handlers
  _setupServiceSpecificHandlers() {
    this.socket.on('success-assignment-updated', ({ characterId, player, diceIndex, successId }) => {
      this._notifyListeners('success-assignment-updated', { characterId, player, diceIndex, successId })
    })
  }

  // Service-specific methods
  async autoJoinOrCreate(characterInfo, selectedDice, engagementSuccesses) {
    try {
      if (!this.socket) await this.connect()
      
      if (!this.socket || !this.socket.connected) {
        console.error('EngagementSessionService: Cannot auto-join, not connected to server')
        this._notifyListeners('connection-error', { error: 'Not connected to server' })
        return
      }

      this.socket.emit('auto-join-or-create', {
        characterInfo,
        selectedDice,
        engagementSuccesses
      })
    } catch (error) {
      console.error('EngagementSessionService: Error in auto-join-or-create:', error)
      this._notifyListeners('error', { error: 'Failed to join or create session' })
    }
  }

  updateSuccessAssignment(characterId, player, diceIndex, successId) {
    this._safeEmit('success-assignment-updated', {
      characterId,
      player,
      diceIndex,
      successId
    })
  }
}

const engagementSessionService = new EngagementSessionService()

export default engagementSessionService
