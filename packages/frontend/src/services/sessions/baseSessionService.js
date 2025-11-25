import { io } from 'socket.io-client'
import AuthService from '../auth/authService'
import { SOCKET_CONFIG } from '@shared/constants/socketConfig.js'
import { SESSION_EVENTS } from '@shared/constants/sessionEvents.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class BaseSessionService {
  constructor(namespace, config = {}) {
    this.namespace = namespace
    this.socket = null
    this.sessionId = null
    this.listeners = new Map()
    this.connectionInProgress = false
    this.config = {
      reconnection: true,
      reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
      reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
      timeout: SOCKET_CONFIG.TIMEOUT,
      ...config
    }
  }

  async connect() {
    // Prevent race conditions from multiple rapid connect() calls
    if (this.socket && this.socket.connected) {
      return Promise.resolve()
    }
    
    if (this.connectionInProgress) {
      return Promise.resolve()
    }
    
    this.connectionInProgress = true
    
    try {
      // Get authentication token
      const token = await AuthService.getIdToken()
      
      if (!token) {
        throw new Error('Authentication required for multiplayer sessions')
      }

      this.socket = io(`${API_BASE_URL}/${this.namespace}`, {
        ...this.config,
        auth: {
          token: token
        }
      })

      // Set up common event handlers
      this.socket.on(SESSION_EVENTS.CONNECT, () => {
        this.connectionInProgress = false
        this._notifyListeners(SESSION_EVENTS.CONNECTION_STATUS, { connected: true })
      })

      this.socket.on(SESSION_EVENTS.DISCONNECT, (reason) => {
        this._notifyListeners(SESSION_EVENTS.CONNECTION_STATUS, { connected: false, reason })
      })

      this.socket.on(SESSION_EVENTS.CONNECT_ERROR, (error) => {
        this.connectionInProgress = false
        console.error(`${this.constructor.name}: Connection error:`, error)
      })

      this.socket.on(SESSION_EVENTS.ERROR, (error) => {
        console.error(`${this.constructor.name}: WebSocket error:`, error)
        this._notifyListeners(SESSION_EVENTS.ERROR, error)
      })

      // Common session events
      this.socket.on(SESSION_EVENTS.SESSION_CREATED, ({ sessionId, session }) => {
        this.sessionId = sessionId
        this._notifyListeners(SESSION_EVENTS.SESSION_CREATED, { sessionId, session })
      })

      this.socket.on(SESSION_EVENTS.SESSION_UPDATED, ({ session }) => {
        // Handle cases where session-created might not fire first
        // (e.g., reconnection scenarios or race conditions)
        if (!this.sessionId && session.id) {
          this.sessionId = session.id
        }
        this._notifyListeners(SESSION_EVENTS.SESSION_UPDATED, { session })
      })

      this.socket.on(SESSION_EVENTS.USER_LEFT, ({ session, message }) => {
        this._notifyListeners(SESSION_EVENTS.USER_LEFT, { session, message })
      })

      this.socket.on(SESSION_EVENTS.SESSION_CANCELLED, ({ message, characterName }) => {
        this._notifyListeners(SESSION_EVENTS.SESSION_CANCELLED, { message, characterName })
        this.sessionId = null
      })

      this.socket.on(SESSION_EVENTS.SESSION_EXPIRED, ({ message, sessionId }) => {
        this._notifyListeners(SESSION_EVENTS.SESSION_EXPIRED, { message, sessionId })
        this.sessionId = null
      })

      this.socket.on(SESSION_EVENTS.SESSION_COMPLETED, ({ session, timestamp }) => {
        this._notifyListeners(SESSION_EVENTS.SESSION_COMPLETED, { session, timestamp })
      })
      
      this.socket.on(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, ({ index, state }) => {
        this._notifyListeners(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, { index, state })
      })

      this.socket.on(SESSION_EVENTS.ACCEPTANCE_STATE_UPDATED, ({ characterId, accepted }) => {
        this._notifyListeners(SESSION_EVENTS.ACCEPTANCE_STATE_UPDATED, { characterId, accepted })
      })

      // Set up service-specific event handlers
      this._setupServiceSpecificHandlers()
      
      return Promise.resolve()
      
    } catch (error) {
      this.connectionInProgress = false
      console.error(`${this.constructor.name}: Failed to create socket connection:`, error)
      
      // Clean up partially initialized socket
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
      
      return Promise.reject(error)
    }
  }

  disconnect() {
    try {
      if (this.socket) {
        // Remove all socket event listeners to prevent memory leaks
        this.socket.removeAllListeners()
        this.socket.disconnect()
        this.socket = null
      }
      this.sessionId = null
      this.connectionInProgress = false
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
        this.socket.emit(SESSION_EVENTS.RESULT_INDICATOR_UPDATED, {
          sessionId: this.sessionId,
          index,
          state
        })
      } else {
        console.warn(`${this.constructor.name}: Cannot update result indicator - no active socket or session`)
      }
    } catch (error) {
      console.error(`${this.constructor.name}: Error updating result indicator:`, error)
      this._notifyListeners(SESSION_EVENTS.ERROR, { error: 'Failed to update result indicator' })
    }
  }

  updateAcceptanceState(characterId, accepted) {
    try {
      if (this.socket && this.sessionId) {
        this.socket.emit(SESSION_EVENTS.ACCEPTANCE_STATE_UPDATED, {
          sessionId: this.sessionId,
          characterId,
          accepted
        })
      } else {
        console.warn(`${this.constructor.name}: Cannot update acceptance state - no active socket or session`)
      }
    } catch (error) {
      console.error(`${this.constructor.name}: Error updating acceptance state:`, error)
      this._notifyListeners(SESSION_EVENTS.ERROR, { error: 'Failed to update acceptance state' })
    }
  }

  cancelSession() {
    this._safeEmit(SESSION_EVENTS.CANCEL_SESSION, {})
    this.sessionId = null
  }

  submitRollResults(rollResults, characterId) {
    this._safeEmit(SESSION_EVENTS.SUBMIT_ROLL_RESULTS, {
      rollResults,
      characterId
    })
  }

  completeSession(winner) {
    this._safeEmit(SESSION_EVENTS.COMPLETE_SESSION, {
      winner
    })
  }

  // Protected methods for subclasses to override/use
  // @protected
  _setupServiceSpecificHandlers() {
    // Override in subclasses to add service-specific socket event handlers
  }

  // @protected
  _safeEmit(event, data) {
    try {
      if (this.socket && this.sessionId) {
        this.socket.emit(event, {
          sessionId: this.sessionId,
          ...data
        })
      } else {
        console.warn(`${this.constructor.name}: Cannot emit ${event} - no active socket or session`)
        this._notifyListeners(SESSION_EVENTS.ERROR, { error: `Cannot ${event} - not connected` })
      }
    } catch (error) {
      console.error(`${this.constructor.name}: Error emitting ${event}:`, error)
      this._notifyListeners(SESSION_EVENTS.ERROR, { error: `Failed to ${event}` })
    }
  }

  // @protected
  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        callback(data)
      }
    }
  }
}

export default BaseSessionService
