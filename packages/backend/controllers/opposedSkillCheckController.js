import { v4 as uuidv4 } from 'uuid'
import { SESSION_STATUS } from '../../../shared/constants/sessionStatus.js'

const activeSessions = new Map()
let opposedSkillCheckIO = null

const SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
const SESSION_MAX_AGE = 30 * 60 * 1000 // 30 minutes
const ROLL_DELAY = 1500 // 1.5 seconds

const setupSocketHandlers = (io) => {
  opposedSkillCheckIO = io.of('/opposed-skill-check')
  let availableSessionId = null
  
  opposedSkillCheckIO.on('connection', (socket) => {
    socket.on('auto-join-or-create', ({ characterInfo, skillCheckConfig }) => {
      if (availableSessionId && activeSessions.has(availableSessionId)) {
        const session = activeSessions.get(availableSessionId)
        
        if (session.users.length === 1 && session.status === SESSION_STATUS.WAITING) {
          session.users.push({
            socketId: socket.id,
            characterInfo,
            skillCheckConfig,
            ready: true
          })
          
          session.status = SESSION_STATUS.ACTIVE
          socket.join(availableSessionId)
          
          opposedSkillCheckIO.to(availableSessionId).emit('session-updated', { 
            sessionId: availableSessionId, 
            session 
          })
          
          const joinedSessionId = availableSessionId
          availableSessionId = null
          
          setTimeout(() => {
            const currentSession = activeSessions.get(joinedSessionId)
            if (currentSession && currentSession.users.length === 2) {
              performRoll(joinedSessionId)
            }
          }, ROLL_DELAY)
          return
        }
      }
      
      const sessionId = uuidv4()
      
      const newSession = {
        id: sessionId,
        createdAt: new Date(),
        users: [
          {
            socketId: socket.id,
            characterInfo,
            skillCheckConfig,
            ready: true
          }
        ],
        status: SESSION_STATUS.WAITING
      }
      
      activeSessions.set(sessionId, newSession)
      availableSessionId = sessionId
      socket.join(sessionId)
      socket.emit('session-created', { sessionId, session: newSession })
    })
    
    socket.on('disconnect', () => {
      for (const [sessionId, session] of activeSessions.entries()) {
        const userIndex = session.users.findIndex(user => user.socketId === socket.id)
        
        if (userIndex !== -1) {
          const bothUsersAccepted = session.users.length === 2 && 
                                   session.users.every(user => user.accepted === true)
          
          const leavingUser = session.users[userIndex]
          const characterName = leavingUser.characterInfo?.name
          
          session.users.splice(userIndex, 1)
          
          if (sessionId === availableSessionId && session.users.length === 0) {
            availableSessionId = null
          }
          
          if (session.users.length === 0) {
            activeSessions.delete(sessionId)
          } else if (!bothUsersAccepted) {
            opposedSkillCheckIO.to(sessionId).emit('session-cancelled', { 
              message: 'Opponent has left the opposed skill check',
              characterName: characterName
            })
          }
          break
        }
      }
    })
    
    socket.on('cancel-session', ({ sessionId }) => {
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId)
        
        const bothUsersAccepted = session.users.length === 2 && 
                                 session.users.every(user => user.accepted === true)
        
        const cancellingUser = session.users.find(user => user.socketId === socket.id)
        const characterName = cancellingUser?.characterInfo?.name
        
        if (!bothUsersAccepted) {
          opposedSkillCheckIO.to(sessionId).emit('session-cancelled', { 
            message: 'Opponent has left the opposed skill check.',
            characterName: characterName
          })
        }
        
        activeSessions.delete(sessionId)
      }
    })
    
    socket.on('update-result-indicator', ({ sessionId, index, state }) => {
      if (activeSessions.has(sessionId)) {
        socket.to(sessionId).emit('result-indicator-updated', { index, state })
      }
    })

    socket.on('reroll-die', ({ sessionId, player, diceIndex, newValue, characterId }) => {
      if (activeSessions.has(sessionId)) {
        socket.to(sessionId).emit('die-rerolled', { player, diceIndex, newValue, characterId })
      }
    })

    socket.on('acceptance-state-updated', ({ sessionId, characterId, accepted }) => {
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId)
        
        const user = session.users.find(u => u.characterInfo.id === characterId)
        if (user) {
          user.accepted = accepted
        }
        
        socket.to(sessionId).emit('acceptance-state-updated', { characterId, accepted })
      }
    })
  })
  
  setInterval(() => {
    const now = new Date()
    for (const [sessionId, session] of activeSessions.entries()) {
      const sessionAge = now - session.createdAt
      if (sessionAge > SESSION_MAX_AGE) {
        activeSessions.delete(sessionId)
      }
    }
  }, SESSION_CLEANUP_INTERVAL)
}

function performRoll(sessionId) {
  const session = activeSessions.get(sessionId)
  if (!session) {
    return
  }
  
  session.status = SESSION_STATUS.ROLLING
  
  session.users.forEach(user => {
    const skillConfig = user.skillCheckConfig
    
    // Create dice pool based on skill configuration
    const dicePool = createDicePool(skillConfig)
    
    // Roll the dice
    user.rollResults = rollDicePool(dicePool)
    
    // Apply favored/ill-favored logic
    applyFavoredLogic(user.rollResults, skillConfig.isFavored, skillConfig.isIllFavored)
    
    // Calculate total
    user.rollTotal = user.rollResults
      .filter(result => result.roll > 0) // Exclude dropped dice
      .reduce((sum, result) => sum + result.roll, 0)
  })
  
  // Determine winner
  if (session.users[0].rollTotal > session.users[1].rollTotal) {
    session.winner = 0
  } else if (session.users[1].rollTotal > session.users[0].rollTotal) {
    session.winner = 1
  } else {
    session.winner = -1 // tie
  }
  
  session.status = SESSION_STATUS.COMPLETED
  
  if (opposedSkillCheckIO) {
    opposedSkillCheckIO.to(sessionId).emit('roll-results', { 
      session,
      timestamp: new Date()
    })
  } else {
    console.error('Cannot emit results: opposedSkillCheckIO is not initialized')
  }
}

function createDicePool(skillConfig) {
  const dicePool = []
  
  // Add d12 dice (always 1 for skill checks, but 2 for favored/ill-favored)
  const d12Count = skillConfig.isFavored || skillConfig.isIllFavored ? 2 : 1
  for (let i = 0; i < d12Count; i++) {
    dicePool.push({ sides: 12, type: 'd12' })
  }
  
  // Add d6 dice based on ranks and dice mod
  const effectiveRanks = Math.max(0, skillConfig.ranks + skillConfig.diceMod)
  const maxD6 = 5 // Maximum of 5 d6 dice
  const d6Count = Math.min(effectiveRanks, maxD6)
  
  for (let i = 0; i < d6Count; i++) {
    dicePool.push({ sides: 6, type: 'd6' })
  }
  
  return dicePool
}

function rollDicePool(dicePool) {
  return dicePool.map((die, index) => {
    const roll = Math.floor(Math.random() * die.sides) + 1
    let symbol
    
    if (die.sides === 12) {
      if (roll === 12) {
        symbol = '⭓12🌞'
      } else if (roll === 11) {
        symbol = '⭓11💀'
      } else {
        symbol = `⭓${roll}`
      }
    } else if (die.sides === 6 && roll === 6) {
      symbol = `◽️6✨`
    } else {
      symbol = `◽️${roll}`
    }

    return { 
      die: die.sides, 
      roll: roll, 
      symbol: symbol,
      originalRoll: roll,
      index: index
    }
  })
}

function applyFavoredLogic(diceResults, isFavored, isIllFavored) {
  if (!isFavored && !isIllFavored) return
  
  const d12Results = diceResults.filter(result => result.die === 12)
  if (d12Results.length < 2) return
  
  const d12Rolls = d12Results.map(result => result.roll)
  
  if (isFavored) {
    // Keep the highest roll, but treat 11 as lowest
    const highestRoll = d12Rolls.reduce((max, roll) => {
      if (roll === 11) return max
      return max === 11 || roll > max ? roll : max
    }, 11)
    
    let keptOne = false
    d12Results.forEach(result => {
      if (result.roll === highestRoll && !keptOne) {
        keptOne = true
      } else {
        result.roll = 0 // Mark as dropped
      }
    })
  } else if (isIllFavored) {
    // Keep the lowest roll, with 11 being treated as lowest
    const lowestRoll = d12Rolls.includes(11) ? 11 : Math.min(...d12Rolls)
    
    let keptOne = false
    d12Results.forEach(result => {
      if (result.roll === lowestRoll && !keptOne) {
        keptOne = true
      } else {
        result.roll = 0 // Mark as dropped
      }
    })
  }
}

export {
  setupSocketHandlers
}
