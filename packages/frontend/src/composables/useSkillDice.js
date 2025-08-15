import CharacterService from '@/services/characterService'

/**
 * Composable for managing skill dice interactions
 * Handles dice state calculations and click handlers
 */
export function useSkillDice(character, updateCallback) {
  // Determine if the rank is active (either from base ranks or positive dice mod)
  const isRankActive = (skill, diceIndex) => {
    return isCheckboxChecked(skill, diceIndex)
  }

  // Determine if this die is added by a positive dice mod
  const isDiceAdded = (skill, diceIndex) => {
    return (
      diceIndex >= skill.ranks &&
      diceIndex < skill.ranks + skill.diceMod &&
      skill.diceMod > 0
    )
  }

  // Determine if this die is subtracted by a negative dice mod
  const isDiceSubtracted = (skill, diceIndex) => {
    return (
      skill.ranks - diceIndex <= Math.abs(skill.diceMod) &&
      skill.diceMod < 0 &&
      diceIndex < skill.ranks
    )
  }

  const isCheckboxChecked = (skill, checkboxIndex) => {
    const withinRanks = checkboxIndex < skill.ranks
    const withinDiceMod =
      checkboxIndex >= skill.ranks &&
      checkboxIndex < skill.ranks + skill.diceMod &&
      skill.diceMod > 0
    return withinRanks || withinDiceMod
  }

  const getStyleClassForFavoredStatus = (skill) => {
    if (skill.isFavored && !skill.isIllFavored) return 'favored'
    if (skill.isIllFavored && !skill.isFavored) return 'ill-favored'
    return ''
  }

  const handleDiceClick = (skillName, diceIndex) => {
    // Create immutable update instead of mutating original
    const updatedCharacter = {
      ...character.value,
      skills: character.value.skills.map(skill => {
        if (skill.name === skillName) {
          const newRank = diceIndex + 1
          const updatedRanks = newRank === skill.ranks ? skill.ranks - 1 : newRank
          return { ...skill, ranks: updatedRanks }
        }
        return skill
      })
    }

    CharacterService.updateFavoredStatus(updatedCharacter)
    updateCallback(updatedCharacter)
  }

  return {
    isRankActive,
    isDiceAdded,
    isDiceSubtracted,
    getStyleClassForFavoredStatus,
    handleDiceClick
  }
}
