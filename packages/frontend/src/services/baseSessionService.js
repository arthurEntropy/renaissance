import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Base class for session services that provides common socket management,
 * event handling, and session lifecycle functionality.
 */
class BaseSessionService {
  constructor(namespace, config = {}) {
    this.namespace = namespace
    this.socket = null
    this.sessionId = null
    this.listeners = new Map()
    this.config = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      ...config
    }
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return
    }
    
    try {
      this.socket = io(`${API_BASE_URL}/${this.namespace}`, this.config)

      // Set up common event handlers
      this.socket.on('connect', () => {
        this._notifyListeners('connection-status', { connected: true })
      })

      this.socket.on('disconnect', (reason) => {
        this._notifyListeners('connection-status', { connected: false, reason })
      })

      this.socket.on('connect_error', (error) => {
        console.error(`${this.constructor.name}: Connection error:`, error)
        this._notifyListeners('connection-error', { error: error.message || 'Connection failed' })
      })

      this.socket.on('error', (error) => {
        console.error(`${this.constructor.name}: WebSocket error:`, error)
        this._notifyListeners('error', error)
      })

      // Common session events
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

      this.socket.on('session-cancelled', ({ message, characterName }) => {
        this._notifyListeners('session-cancelled', { message, characterName })
        this.sessionId = null
      })

      this.socket.on('roll-results', ({ session, timestamp }) => {
        this._notifyListeners('roll-results', { session, timestamp })
      })
      
      this.socket.on('result-indicator-updated', ({ index, state }) => {
        this._notifyListeners('result-indicator-updated', { index, state })
      })

      this.socket.on('acceptance-state-updated', ({ characterId, accepted }) => {
        this._notifyListeners('acceptance-state-updated', { characterId, accepted })
      })

      this.socket.on('rerolled', ({ player, diceIndex, newValue, characterId }) => {
        this._notifyListeners('rerolled', { player, diceIndex, newValue, characterId })
      })

      // Set up service-specific event handlers
      this._setupServiceSpecificHandlers()
      
    } catch (error) {
      console.error(`${this.constructor.name}: Failed to create socket connection:`, error)
      this._notifyListeners('connection-error', { error: 'Failed to initialize connection' })
    }
  }

  disconnect() {
    try {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
      this.sessionId = null
      this.listeners.clear()
    } catch (error) {
      console.error(`${this.constructor.name}: Error during disconnect:`, error)
    }
  }

  // Event listener management
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

  // Common utility methods
  getSessionId() {
    return this.sessionId
  }

  isConnected() {
    return this.socket && this.socket.connected
  }

  // Common session actions
  updateResultIndicator(index, state) {
    try {
      if (this.socket && this.sessionId) {
        this.socket.emit('update-result-indicator', {
          sessionId: this.sessionId,
          index,
          state
        })
      } else {
        console.warn(`${this.constructor.name}: Cannot update result indicator - no active socket or session`)
      }
    } catch (error) {
      console.error(`${this.constructor.name}: Error updating result indicator:`, error)
      this._notifyListeners('error', { error: 'Failed to update result indicator' })
    }
  }

  rerollDie(player, diceIndex, newValue, characterId) {
    try {
      if (this.socket && this.sessionId) {
        this.socket.emit('reroll', {
          sessionId: this.sessionId,
          player,
          diceIndex,
          newValue,
          characterId
        })
      } else {
        console.warn(`${this.constructor.name}: Cannot reroll die - no active socket or session`)
        this._notifyListeners('error', { error: 'Cannot reroll - not connected' })
      }
    } catch (error) {
      console.error(`${this.constructor.name}: Error rerolling die:`, error)
      this._notifyListeners('error', { error: 'Failed to reroll die' })
    }
  }

  updateAcceptanceState(characterId, accepted) {
    try {
      if (this.socket && this.sessionId) {
        this.socket.emit('acceptance-state-updated', {
          sessionId: this.sessionId,
          characterId,
          accepted
        })
      } else {
        console.warn(`${this.constructor.name}: Cannot update acceptance state - no active socket or session`)
      }
    } catch (error) {
      console.error(`${this.constructor.name}: Error updating acceptance state:`, error)
      this._notifyListeners('error', { error: 'Failed to update acceptance state' })
    }
  }

  // Protected methods for subclasses to override
  _setupServiceSpecificHandlers() {
    // Override in subclasses to add service-specific socket event handlers
  }

  // Protected helper for safe socket emission
  _safeEmit(event, data) {
    try {
      if (this.socket && this.sessionId) {
        this.socket.emit(event, {
          sessionId: this.sessionId,
          ...data
        })
      } else {
        console.warn(`${this.constructor.name}: Cannot emit ${event} - no active socket or session`)
        this._notifyListeners('error', { error: `Cannot ${event} - not connected` })
      }
    } catch (error) {
      console.error(`${this.constructor.name}: Error emitting ${event}:`, error)
      this._notifyListeners('error', { error: `Failed to ${event}` })
    }
  }
}

export default BaseSessionService
