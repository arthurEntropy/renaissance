const { v4: uuidv4 } = require('uuid');

// In-memory storage for active engagement sessions
const activeSessions = new Map();

// Store the socket.io namespace reference for global access
let engagementIO = null;

// Session data structure:
// {
//   id: string,
//   createdAt: Date,
//   users: [
//     { id: string, name: string, ready: boolean, dice: [], success: [] }
//   ],
//   state: 'waiting' | 'ready' | 'rolling' | 'completed'
// }

const setupSocketHandlers = (io) => {
  // Namespace for engagement rolls
  engagementIO = io.of('/engagement');
  
  // Keep track of the latest available session ID
  let availableSessionId = null;
  
  engagementIO.on('connection', (socket) => {
    
    // Auto-join or create session
    socket.on('auto-join-or-create', ({ characterInfo, selectedDice, engagementSuccesses }) => {
      // Check if there's an available session to join
      if (availableSessionId && activeSessions.has(availableSessionId)) {
        const session = activeSessions.get(availableSessionId);
        
        // Make sure the session only has one user and is in waiting state
        if (session.users.length === 1 && session.state === 'waiting') {
          // Join the existing session
          session.users.push({
            socketId: socket.id,
            characterInfo,
            selectedDice,
            engagementSuccesses,
            ready: true
          });
          
          // Update session state now that we have two users
          session.state = 'ready';
          
          // Join the socket room
          socket.join(availableSessionId);
          
          // Notify all users in the session about the update
          engagementIO.to(availableSessionId).emit('session-updated', { 
            sessionId: availableSessionId, 
            session 
          });
          
          // Save the session ID before clearing it
          const joinedSessionId = availableSessionId;
          
          // Clear the available session now that it's full
          availableSessionId = null;
          
          // Schedule the roll after a delay
          setTimeout(() => {
            // Only proceed if session still exists and both users are still connected
            const currentSession = activeSessions.get(joinedSessionId);
            if (currentSession && currentSession.users.length === 2) {
              performRoll(joinedSessionId);
            }
          }, 1500);
          return;
        }
      }
      
      // If we got here, we need to create a new session
      const sessionId = uuidv4();
      
      // Create new session object
      const newSession = {
        id: sessionId,
        createdAt: new Date(),
        users: [
          {
            socketId: socket.id,
            characterInfo,
            selectedDice,
            engagementSuccesses,
            ready: true
          }
        ],
        state: 'waiting'
      };
      
      // Store in our sessions map
      activeSessions.set(sessionId, newSession);
      
      // Set this as the available session
      availableSessionId = sessionId;
      
      // Join the socket room for this session
      socket.join(sessionId);
      
      // Send back the session ID to the client
      socket.emit('session-created', { sessionId, session: newSession });
    });
    
    // Join a specific session (kept for backward compatibility but not used in auto mode)
    socket.on('join-session', ({ sessionId, characterInfo, selectedDice, engagementSuccesses }) => {
      const session = activeSessions.get(sessionId);
      
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      // Add the new user to the session
      session.users.push({
        socketId: socket.id,
        characterInfo,
        selectedDice,
        engagementSuccesses,
        ready: true
      });
      
      // Update session state if we now have two users ready
      if (session.users.length === 2) {
        session.state = 'ready';
        
        // Schedule the roll after a delay
        setTimeout(() => {
          // Only proceed if session still exists and both users are still connected
          const currentSession = activeSessions.get(sessionId);
          if (currentSession && currentSession.users.length === 2) {
            performRoll(sessionId);
          }
        }, 1500);
      }
      
      // Join the socket room
      socket.join(sessionId);
      
      // Notify all users in the session about the update
      engagementIO.to(sessionId).emit('session-updated', { session });
    });
    
    // Handle user disconnect
    socket.on('disconnect', () => {
      // Find any sessions this user was part of
      for (const [sessionId, session] of activeSessions.entries()) {
        const userIndex = session.users.findIndex(user => user.socketId === socket.id);
        
        if (userIndex !== -1) {
          // Remove the user from the session
          session.users.splice(userIndex, 1);
          
          // If this was the available session and now it's empty, clear it
          if (sessionId === availableSessionId && session.users.length === 0) {
            availableSessionId = null;
          }
          
          // If no users left, remove the session
          if (session.users.length === 0) {
            activeSessions.delete(sessionId);
          } else {
            // Notify remaining users
            engagementIO.to(sessionId).emit('user-left', { 
              session,
              message: 'Opponent has left the engagement'
            });
          }
        }
      }
    });
    
    // Cancel a session
    socket.on('cancel-session', ({ sessionId }) => {
      if (activeSessions.has(sessionId)) {
        // Notify all users in the session
        engagementIO.to(sessionId).emit('session-cancelled', { 
          message: 'Engagement session cancelled'
        });
        
        // Remove the session
        activeSessions.delete(sessionId);
      }
    });
    
    // Handle updates to result indicators
    socket.on('update-result-indicator', ({ sessionId, index, state }) => {
      if (activeSessions.has(sessionId)) {
        // Broadcast the indicator update to all other clients in the session
        socket.to(sessionId).emit('result-indicator-updated', { index, state });
      }
    });
  });
  
  // Clean up stale sessions (runs every 5 minutes)
  setInterval(() => {
    const now = new Date();
    for (const [sessionId, session] of activeSessions.entries()) {
      // Remove sessions older than 30 minutes
      const sessionAge = now - session.createdAt;
      if (sessionAge > 30 * 60 * 1000) { // 30 minutes in milliseconds
        activeSessions.delete(sessionId);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
};

// Perform the actual dice roll for both users
function performRoll(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return;
  }
  
  // Update session state
  session.state = 'rolling';
  
  // Roll dice for both users
  session.users.forEach(user => {
    // Calculate roll results for this user
    user.rollResults = user.selectedDice.map(die => {
      // Roll a die with the specified number of sides
      return Math.floor(Math.random() * die) + 1;
    });
    
    // Calculate total
    user.rollTotal = user.rollResults.reduce((sum, value) => sum + value, 0);
  });
  
  // Determine winner (highest total wins)
  if (session.users[0].rollTotal > session.users[1].rollTotal) {
    session.winner = 0;
  } else if (session.users[1].rollTotal > session.users[0].rollTotal) {
    session.winner = 1;
  } else {
    session.winner = -1; // Tie
  }
  
  // Update session state
  session.state = 'completed';
  
  // Broadcast results to all participants using the global socket.io reference
  if (engagementIO) {
    engagementIO.to(sessionId).emit('roll-results', { 
      session,
      timestamp: new Date()
    });
  } else {
    console.error('Cannot emit results: engagementIO is not initialized');
  }
  
}

module.exports = {
  setupSocketHandlers
};
