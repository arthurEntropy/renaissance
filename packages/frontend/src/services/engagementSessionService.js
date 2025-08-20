import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class EngagementSessionService {
  constructor() {
    this.socket = null
    this.sessionId = null
    this.listeners = new Map()
  }

  connect() {
    if (this.socket) return
    
    this.socket = io(`${API_BASE_URL}/engagement`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.socket.on('connect', () => {
      this._notifyListeners('connection-status', { connected: true })
    })

    this.socket.on('disconnect', (reason) => {
      this._notifyListeners('connection-status', { connected: false, reason })
    })

    this.socket.on('error', (error) => {
      console.error('EngagementService: WebSocket error:', error)
      this._notifyListeners('error', error)
    })

    this.socket.on('session-created', ({ sessionId, session }) => {
      this.sessionId = sessionId
      this._notifyListeners('session-created', { sessionId, session })
    })

    this.socket.on('session-updated', ({ session }) => {
      if (!this.sessionId && session.id) {
        this.sessionId = session.id
      }
      this._notifyListeners('session-updated', { session })
    })

    this.socket.on('user-left', ({ session, message }) => {
      this._notifyListeners('user-left', { session, message })
    })

    this.socket.on('session-cancelled', ({ message }) => {
      this._notifyListeners('session-cancelled', { message })
      this.sessionId = null
    })

    this.socket.on('roll-results', ({ session, timestamp }) => {
      this._notifyListeners('roll-results', { session, timestamp })
    })
    
    this.socket.on('result-indicator-updated', ({ index, state }) => {
      this._notifyListeners('result-indicator-updated', { index, state })
    })

    this.socket.on('success-assignment-updated', ({ characterId, player, diceIndex, successId }) => {
      this._notifyListeners('success-assignment-updated', { characterId, player, diceIndex, successId })
    })

    this.socket.on('acceptance-state-updated', ({ characterId, accepted }) => {
      this._notifyListeners('acceptance-state-updated', { characterId, accepted })
    })

    this.socket.on('die-rerolled', ({ player, diceIndex, newValue, characterId }) => {
      this._notifyListeners('die-rerolled', { player, diceIndex, newValue, characterId })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.sessionId = null
      this.listeners.clear()
    }
  }

  autoJoinOrCreate(characterInfo, selectedDice, engagementSuccesses) {
    if (!this.socket) this.connect()
    
    this.socket.emit('auto-join-or-create', {
      characterInfo,
      selectedDice,
      engagementSuccesses
    })
  }

  cancelSession() {
    if (this.socket && this.sessionId) {
      this.socket.emit('cancel-session', { sessionId: this.sessionId })
      this.sessionId = null
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event)
      }
    }
  }

  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        callback(data)
      }
    }
  }

  getSessionId() {
    return this.sessionId
  }

  isConnected() {
    return this.socket && this.socket.connected
  }
  
  updateResultIndicator(index, state) {
    if (this.socket && this.sessionId) {
      this.socket.emit('update-result-indicator', {
        sessionId: this.sessionId,
        index,
        state
      })
    }
  }

  rerollDie(player, diceIndex, newValue, characterId) {
    if (this.socket && this.sessionId) {
      this.socket.emit('reroll-die', {
        sessionId: this.sessionId,
        player,
        diceIndex,
        newValue,
        characterId
      })
    }
  }

  updateSuccessAssignment(characterId, player, diceIndex, successId) {
    if (this.socket && this.sessionId) {
      this.socket.emit('success-assignment-updated', {
        sessionId: this.sessionId,
        characterId,
        player,
        diceIndex,
        successId
      })
    }
  }

  updateAcceptanceState(characterId, accepted) {
    if (this.socket && this.sessionId) {
      this.socket.emit('acceptance-state-updated', {
        sessionId: this.sessionId,
        characterId,
        accepted
      })
    }
  }
}

const engagementSessionService = new EngagementSessionService()

export default engagementSessionService
