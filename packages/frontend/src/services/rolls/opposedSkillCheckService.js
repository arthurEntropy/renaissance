import { RollTypes } from '@/constants/rollTypes'
import { WINNER } from '@shared/constants/winner.js'
import eventBus, { ROLL_EVENTS } from '../events/eventBus'
import BaseRollService from './baseRollService.js'

class OpposedSkillCheckService extends BaseRollService {

  // Initial roll is an isolated step, since opponent's results are not yet known
  static makeOpposedSkillCheck(skill, character) {
    const { diceResults, total, isAutoFail } = this.performSkillCheckRoll(skill, character)
    
    // Format dice for display (adds CSS classes, emojis, and sorts them)
    const formattedDiceResults = this.formatDiceForDisplay(diceResults, RollTypes.OPPOSED_SKILL_CHECK)
    
    return {
      diceResults: formattedDiceResults,
      totalSum: total,
      isAutoFail: isAutoFail,
      skillConfig: skill,
      characterInfo: character
    }
  }

  // Result object is created as a separate step, since we need both users' results.
  // It's also independent from sending to Discord because users need to review and accept the result first.
  static createOpposedSkillCheckResult(session, userCharacterId, opponentCharacterId) {
    const userSession = session.users.find(u => u.characterInfo.id === userCharacterId)
    const opponentSession = session.users.find(u => u.characterInfo.id === opponentCharacterId)
    
    if (!userSession || !opponentSession) {
      return null
    }

    const winner = this._determineWinner(session, userCharacterId)
    
    const result = this.createRollResult(RollTypes.OPPOSED_SKILL_CHECK, {
      characterName: userSession.characterInfo.name,
      opponentName: opponentSession.characterInfo.name,
      skillName: userSession.skillCheckConfig.name,
      opponentSkillName: opponentSession.skillCheckConfig.name,
      userTotal: userSession.rollTotal,
      opponentTotal: opponentSession.rollTotal,
      winner: winner,
      userDiceResults: userSession.rollResults,
      opponentDiceResults: opponentSession.rollResults,
      userFavoredStatus: this.getFavoredStatus(userSession.skillCheckConfig),
      opponentFavoredStatus: this.getFavoredStatus(opponentSession.skillCheckConfig),
      session: session
    })

    return result
  }

  // Separate method to emit event when result is accepted by both users
  static emitOpposedSkillCheckResult(session, userCharacterId, opponentCharacterId) {
    const result = this.createOpposedSkillCheckResult(session, userCharacterId, opponentCharacterId)
    if (result) {
      eventBus.emit(ROLL_EVENTS.OPPOSED_SKILL_CHECK, { opposedResult: result })
    }
    return result
  }

  static _determineWinner(session, userCharacterId) {
    if (session.winner !== null && session.winner !== undefined) {
      // Server winner is 0-indexed: 0 = first user, 1 = second user
      const winnerUser = session.users[session.winner]
      
      if (winnerUser) {
        return winnerUser.characterInfo.id === userCharacterId ? WINNER.USER : WINNER.OPPONENT
      }
    }
    
    // Fallback to client-side calculation if server doesn't provide winner
    const userSession = session.users.find(u => u.characterInfo.id === userCharacterId)
    const opponentSession = session.users.find(u => u.characterInfo.id !== userCharacterId)
    
    if (userSession && opponentSession) {
      return this._determineOpposedWinner(userSession.rollTotal, opponentSession.rollTotal)
    }
    
    return WINNER.TIE
  }

  static _determineOpposedWinner(userTotal, opponentTotal) {
    if (userTotal > opponentTotal) return WINNER.USER
    if (opponentTotal > userTotal) return WINNER.OPPONENT
    return WINNER.TIE
  }
}

export default OpposedSkillCheckService
