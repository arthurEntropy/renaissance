import { computed } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'

export function useSummonedBeast(characterId = null) {
  const charactersStore = useCharactersStore()

  const getSummonedBeastForCharacterId = (id) => {
    if (!id) return null

    const character = charactersStore.getById(id)
    if (!character?.summonerVessels?.length) return null

    const summonedVessel = character.summonerVessels.find(
      (v) => v.isSummoned && v.beastId
    )
    if (!summonedVessel) return null

    return charactersStore.filteredBeasts.find(
      (b) => b.id === summonedVessel.beastId
    ) ?? null
  }

  const summonedBeast = computed(() => {
    const id = typeof characterId === 'object' && characterId !== null && 'value' in characterId
      ? characterId.value
      : characterId
    return getSummonedBeastForCharacterId(id)
  })

  return {
    summonedBeast,
    getSummonedBeastForCharacterId,
  }
}
