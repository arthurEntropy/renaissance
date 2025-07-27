import { io } from 'socket.io-client';

class EngagementService {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.listeners = new Map();
  }

  // Initialize the socket connection
  connect() {
    if (this.socket) return; // Already connected
    
    // Connect to the engagement namespace
    this.socket = io(`${process.env.VUE_APP_API_URL || 'http://localhost:3000'}/engagement`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Set up default event handlers
    this.socket.on('connect', () => {
      this._notifyListeners('connection-status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      this._notifyListeners('connection-status', { connected: false, reason });
    });

    this.socket.on('error', (error) => {
      console.error('EngagementService: WebSocket error:', error);
      this._notifyListeners('error', error);
    });

    // Session events
    this.socket.on('session-created', ({ sessionId, session }) => {
      this.sessionId = sessionId;
      this._notifyListeners('session-created', { sessionId, session });
    });

    this.socket.on('session-updated', ({ session }) => {
      // Update the sessionId if we don't have one yet
      if (!this.sessionId && session.id) {
        this.sessionId = session.id;
      }
      this._notifyListeners('session-updated', { session });
    });

    this.socket.on('user-left', ({ session, message }) => {
      this._notifyListeners('user-left', { session, message });
    });

    this.socket.on('session-cancelled', ({ message }) => {
      this._notifyListeners('session-cancelled', { message });
      this.sessionId = null;
    });

    this.socket.on('roll-results', ({ session, timestamp }) => {
      this._notifyListeners('roll-results', { session, timestamp });
    });
    
    // Result indicator updates from other users
    this.socket.on('result-indicator-updated', ({ index, state }) => {
      this._notifyListeners('result-indicator-updated', { index, state });
    });

    // Success assignment updates from other users
    this.socket.on('success-assignment-updated', ({ characterId, player, diceIndex, successId }) => {
      console.log('Service received success assignment update:', { characterId, player, diceIndex, successId });
      this._notifyListeners('success-assignment-updated', { characterId, player, diceIndex, successId });
    });

    this.socket.on('die-rerolled', ({ player, diceIndex, newValue, characterId }) => {
      this._notifyListeners('die-rerolled', { player, diceIndex, newValue, characterId });
    });
  }

  // Disconnect from the socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
      this.listeners.clear();
    }
  }

  // Auto-join an existing session or create a new one if none available
  autoJoinOrCreate(characterInfo, selectedDice, engagementSuccesses) {
    if (!this.socket) this.connect();
    
    this.socket.emit('auto-join-or-create', {
      characterInfo,
      selectedDice,
      engagementSuccesses
    });
  }
  
  // Create a new engagement session (legacy method, kept for backwards compatibility)
  createSession(characterInfo, selectedDice, engagementSuccesses) {
    this.autoJoinOrCreate(characterInfo, selectedDice, engagementSuccesses);
  }

  // Join an existing engagement session (legacy method, kept for backwards compatibility)
  joinSession(sessionId, characterInfo, selectedDice, engagementSuccesses) {
    if (!this.socket) this.connect();
    
    this.sessionId = sessionId;
    this.socket.emit('join-session', {
      sessionId,
      characterInfo,
      selectedDice,
      engagementSuccesses
    });
  }

  // Cancel the current session
  cancelSession() {
    if (this.socket && this.sessionId) {
      this.socket.emit('cancel-session', { sessionId: this.sessionId });
      this.sessionId = null;
    }
  }

  // Register event listeners
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listeners
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Notify all listeners for a specific event
  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        callback(data);
      }
    }
  }

  // Get the current session ID
  getSessionId() {
    return this.sessionId;
  }

  // Check if connected to socket server
  isConnected() {
    return this.socket && this.socket.connected;
  }
  
  // Update result indicator and broadcast to other users
  updateResultIndicator(index, state) {
    if (this.socket && this.sessionId) {
      this.socket.emit('update-result-indicator', {
        sessionId: this.sessionId,
        index,
        state
      });
    }
  }

  // Broadcast die reroll to other users
  rerollDie(player, diceIndex, newValue, characterId) {
    if (this.socket && this.sessionId) {
      this.socket.emit('reroll-die', {
        sessionId: this.sessionId,
        player,
        diceIndex,
        newValue,
        characterId
      });
    }
  }

  // Broadcast success assignment to other users
  updateSuccessAssignment(characterId, player, diceIndex, successId) {
    console.log('Service sending success assignment:', { characterId, player, diceIndex, successId, sessionId: this.sessionId });
    if (this.socket && this.sessionId) {
      this.socket.emit('success-assignment-updated', {
        sessionId: this.sessionId,
        characterId,
        player,
        diceIndex,
        successId
      });
    } else {
      console.log('Cannot send success assignment - no socket or session:', { socket: !!this.socket, sessionId: this.sessionId });
    }
  }
}

// Create a singleton instance
const engagementService = new EngagementService();

export default engagementService;
