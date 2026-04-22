import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import CharacterService from '@/services/entities/characterService'
import { useAuthStore } from './authStore'

export const useCharactersStore = defineStore('characters', () => {
  const base = useCrudEntityStore(CharacterService, 'characters')
  const authStore = useAuthStore()

  // Additional state for app-wide selected character feature
  const selectedCharacter = ref(null)       // drives CharacterSheet (beast or player)
  const activePlayerCharacter = ref(null)   // drives badge — non-beast only

  // Actions
  const selectCharacter = (character) => {
    selectedCharacter.value = character
    if (!character?.isBeast) {
      activePlayerCharacter.value = character
    }
  }

  const deselectCharacter = () => {
    selectedCharacter.value = null
    activePlayerCharacter.value = null
  }

  // Computed properties
  const filteredCharacters = computed(() => {
    return base.items.value.filter(character => !character.isBeast)
  })

  const filteredBeasts = computed(() => {
    return base.items.value.filter(character => character.isBeast)
  })

  // The beast currently summoned by the active player character (if any)
  const summonedBeast = computed(() => {
    const vessels = activePlayerCharacter.value?.summonerVessels
    if (!vessels?.length) return null
    const summonedVessel = vessels.find((v) => v.isSummoned && v.beastId)
    if (!summonedVessel) return null
    return filteredBeasts.value.find((b) => b.id === summonedVessel.beastId) ?? null
  })

  const hasSelectedCharacter = computed(() => {
    return selectedCharacter.value !== null
  })

  const canEditSelectedCharacter = computed(() => {
    if (!selectedCharacter.value) return false
    if (authStore.isAdmin) return true
    if (selectedCharacter.value.isBeast) return false
    if (!authStore.isAuthenticated) return false
    return selectedCharacter.value.userId === authStore.user?.uid
  })

  // Wrap update to sync selectedCharacter and activePlayerCharacter
  const update = async (entity) => {
    const tracked = [selectedCharacter, activePlayerCharacter]

    for (const r of tracked) {
      if (r.value?.id === entity?.id) r.value = entity
    }

    const updatedEntity = await base.update(entity)

    for (const r of tracked) {
      if (r.value?.id === updatedEntity?.id) r.value = updatedEntity
    }

    return updatedEntity
  }

  return {
    characters: base.items,
    selectedCharacter,
    activePlayerCharacter,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update,
    remove: base.remove,
    selectCharacter,
    deselectCharacter,
    getById: base.getById,
    filteredCharacters,
    filteredBeasts,
    summonedBeast,
    hasSelectedCharacter,
    canEditSelectedCharacter,
  }
})
