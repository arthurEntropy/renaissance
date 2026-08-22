import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { applyRollToCharacterStats } from '@/services/rolls/rollStatsService'
import { RollTypes } from '@/constants/rollTypes'

const ROLL_STATS_PERSIST_DELAY_MS = 250

export const useRollsStore = defineStore('rolls', () => {
  const charactersStore = useCharactersStore()

  // Normalized roll storage
  const rollsById = ref({})
  const rollIdsByCharacterId = ref({})
  const rollIdsByBatchId = ref({})
  const latestRollIdByCharacterId = ref({})
  const pendingPersistByCharacterId = ref({})
  
  let displayedRollKeys = new Set()

  // Last difficulty used in skill checks (for defaulting next roll)
  const lastDifficulty = ref(null)

  // Generate a unique roll ID
  const generateRollId = () => `roll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add or update a roll in the normalized store
  const addRoll = (rollResult, characterId, batchId = null) => {
    const rollId = generateRollId()
    
    // Normalize roll data
    const normalizedRoll = {
      id: rollId,
      ...rollResult,
      rollCharacterId: characterId,
      batchId,
      timestamp: Date.now()
    }
    
    rollsById.value[rollId] = normalizedRoll
    
    // Index by character
    if (!rollIdsByCharacterId.value[characterId]) {
      rollIdsByCharacterId.value[characterId] = []
    }
    rollIdsByCharacterId.value[characterId].push(rollId)
    latestRollIdByCharacterId.value[characterId] = rollId
    
    // Index by batch if present
    if (batchId) {
      if (!rollIdsByBatchId.value[batchId]) {
        rollIdsByBatchId.value[batchId] = []
      }
      rollIdsByBatchId.value[batchId].push(rollId)
    }
    
    return rollId
  }

  // Set the latest roll result; defaults to selectedCharacter. Deprecated: prefer setRollForCharacter with explicit ID.
  function setRoll(rollResult, characterOverride = null) {
    const targetCharacter = characterOverride || charactersStore.selectedCharacter
    if (!targetCharacter) return
    
    const characterId = targetCharacter.id
    addRoll(rollResult, characterId)
    
    // Apply stats and schedule persist
    applyRollToCharacterStats(targetCharacter, rollResult)
    
    // Clear existing timeout for this character
    if (pendingPersistByCharacterId.value[characterId]) {
      clearTimeout(pendingPersistByCharacterId.value[characterId])
    }
    
    pendingPersistByCharacterId.value[characterId] = setTimeout(async () => {
      try {
        await charactersStore.update(targetCharacter)
      } catch (error) {
        console.error('Failed to persist roll stats:', error)
      } finally {
        delete pendingPersistByCharacterId.value[characterId]
      }
    }, ROLL_STATS_PERSIST_DELAY_MS)
  }

  // Set a roll for a specific character (multi-character aware)
  function setRollForCharacter(rollResult, characterId, batchId = null) {
    // Always add to rollsById so chatlog/bubbles pick it up even for characters
    // not in the main store (e.g. NPCs only in campaignStore).
    const rollId = addRoll(rollResult, characterId, batchId)

    const character = charactersStore.getById(characterId)
    if (!character) {
      // Character not in main store – log the roll for display but skip stats tracking.
      return rollId
    }
    
    // Apply stats and schedule persist
    applyRollToCharacterStats(character, rollResult)
    
    // Clear existing timeout for this character
    if (pendingPersistByCharacterId.value[characterId]) {
      clearTimeout(pendingPersistByCharacterId.value[characterId])
    }
    
    pendingPersistByCharacterId.value[characterId] = setTimeout(async () => {
      try {
        await charactersStore.update(character)
      } catch (error) {
        console.error('Failed to persist roll stats:', error)
      } finally {
        delete pendingPersistByCharacterId.value[characterId]
      }
    }, ROLL_STATS_PERSIST_DELAY_MS)
    
    return rollId
  }

  // Get the latest roll for a specific character
  const getLatestRollForCharacter = (characterId) => {
    const rollId = latestRollIdByCharacterId.value[characterId]
    return rollId ? rollsById.value[rollId] : null
  }

  // Get all rolls for a character
  const getRollsForCharacter = (characterId) => {
    const rollIds = rollIdsByCharacterId.value[characterId] || []
    return rollIds.map(id => rollsById.value[id]).filter(Boolean)
  }

  // Get all rolls in a batch
  const getRollsForBatch = (batchId) => {
    const rollIds = rollIdsByBatchId.value[batchId] || []
    return rollIds.map(id => rollsById.value[id]).filter(Boolean)
  }

  // Compatibility computed: returns latest roll from the selected character. Deprecated: prefer getLatestRollForCharacter(characterId).
  const latestRoll = computed(() => {
    const selectedCharacterId = charactersStore.selectedCharacter?.id
    if (!selectedCharacterId) return null
    return getLatestRollForCharacter(selectedCharacterId)
  })

  // Update the last difficulty used
  function setLastDifficulty(difficulty) {
    lastDifficulty.value = difficulty
  }

  // Clear the current roll (compatibility API - clears selected character's latest)
  function clearRoll() {
    const selectedCharacterId = charactersStore.selectedCharacter?.id
    if (!selectedCharacterId) return
    
    const rollId = latestRollIdByCharacterId.value[selectedCharacterId]
    if (rollId) {
      delete latestRollIdByCharacterId.value[selectedCharacterId]
    }
  }

  // Clear all rolls for a character
  const clearRollsForCharacter = (characterId) => {
    const rollIds = rollIdsByCharacterId.value[characterId] || []
    rollIds.forEach(rollId => {
      const roll = rollsById.value[rollId]
      if (roll?.batchId) {
        const batchRolls = rollIdsByBatchId.value[roll.batchId] || []
        const batchIndex = batchRolls.indexOf(rollId)
        if (batchIndex > -1) batchRolls.splice(batchIndex, 1)
      }
      delete rollsById.value[rollId]
    })
    delete rollIdsByCharacterId.value[characterId]
    delete latestRollIdByCharacterId.value[characterId]
  }

  function hasDisplayedRollKey(rollKey) {
    if (!rollKey) return false
    return displayedRollKeys.has(rollKey)
  }

  function markRollKeyDisplayed(rollKey) {
    if (!rollKey) return
    displayedRollKeys.add(rollKey)
  }

  // Reroll the current roll (if reroll data exists)
  async function reroll() {
    const currentRoll = latestRoll.value
    if (!currentRoll || !currentRoll._rerollData) {
      console.warn('Cannot reroll - no reroll data available')
      return
    }

    // Handle different roll types
    if (currentRoll.type === 'skill_check') {
      const { skill, character, difficulty } = currentRoll._rerollData
      const module = await import('@/services/rolls/skillCheckService')
      const rollResult = module.default.makeSkillCheck(skill, character, difficulty)
      setRoll(rollResult)
    } else if (currentRoll.type === 'custom_roll') {
      const { dicePool, modifier, character } = currentRoll._rerollData
      const module = await import('@/services/rolls/customRollService')
      const rollResult = module.default.makeCustomRoll(dicePool, modifier, character)
      setRoll(rollResult)
    } else if (currentRoll.type === 'damage') {
      const { dicePool, modifier, character, rollName, baseSkillName, sourceName, modifierLabel, illFavored } = currentRoll._rerollData
      const module = await import('@/services/rolls/damageRollService')
      const rollResult = module.default.makeDamageRoll(dicePool, modifier, character, {
        rollName,
        baseSkillName,
        sourceName,
        modifierLabel,
        illFavored,
      })
      setRoll(rollResult)
    } else if (currentRoll.type === 'initiative') {
      const { character } = currentRoll._rerollData
      const module = await import('@/services/rolls/initiativeRollService')
      const rollResult = module.default.makeInitiativeRoll(character)
      setRoll(rollResult)
    } else if (currentRoll.type === 'injury') {
      const { character } = currentRoll._rerollData
      const module = await import('@/services/rolls/injuryRollService')
      const rollResult = module.default.makeInjuryRoll(character)
      setRoll(rollResult)
    } else {
      console.warn(`Reroll not supported for roll type: ${currentRoll.type}`)
    }
  }

  // Add a chat-link entry for an ability or equipment item without triggering stat changes.
  function sendChatLink(itemName, character) {
    if (!character?.id) return
    addRoll({
      type: RollTypes.CHAT_LINK,
      sourceName: itemName,
      characterName: character.name ?? 'Unknown',
      total: null,
      diceResults: [],
      timestamp: Date.now(),
    }, character.id)
  }

  return {
    // Normalized data (read-only references)
    rollsById,
    rollIdsByCharacterId,
    rollIdsByBatchId,
    latestRollIdByCharacterId,
    
    // Compatibility API (single-character, uses selected character)
    latestRoll,
    lastDifficulty,
    setRoll,
    setLastDifficulty,
    clearRoll,
    hasDisplayedRollKey,
    markRollKeyDisplayed,
    reroll,
    
    // Multi-character aware APIs (new)
    setRollForCharacter,
    getLatestRollForCharacter,
    getRollsForCharacter,
    getRollsForBatch,
    clearRollsForCharacter,
    sendChatLink,
  }
})

