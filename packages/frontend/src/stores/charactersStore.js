import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import CharacterService from '@/services/entities/characterService'
import { useAuthStore } from './authStore'

export const useCharactersStore = defineStore('characters', () => {
  const base = useCrudEntityStore(CharacterService, 'characters')
  const authStore = useAuthStore()

  // The last-viewed character (player, NPC, or beast). Drives the badge rail and CharacterSheet.
  const selectedCharacter = ref(null)

  const SELECTED_CHAR_KEY = 'characters:selectedId'

  // Persist selected character ID on change
  watch(() => selectedCharacter.value?.id, (id) => {
    try {
      if (id) localStorage.setItem(SELECTED_CHAR_KEY, id)
      else localStorage.removeItem(SELECTED_CHAR_KEY)
    } catch {
      // ignore storage errors
    }
  })

  // Rehydrate selected character once after initial characters load
  let rehydrated = false
  watch(base.items, (characters) => {
    if (rehydrated || selectedCharacter.value || !characters.length) return
    rehydrated = true
    const storedId = localStorage.getItem(SELECTED_CHAR_KEY)
    if (storedId) {
      const char = characters.find((c) => c.id === storedId)
      if (char) selectedCharacter.value = char
    }
  })

  // Actions
  const selectCharacter = (character) => {
    selectedCharacter.value = character
  }

  const deselectCharacter = () => {
    selectedCharacter.value = null
  }

  // Computed properties
  const filteredCharacters = computed(() => {
    return base.items.value.filter(character => !character.isBeast)
  })

  const filteredBeasts = computed(() => {
    return base.items.value.filter((character) => character.isBeast && character.beastType !== 'instance')
  })

  // The beast currently summoned by the selected character (if any)
  const summonedBeast = computed(() => {
    const vessels = selectedCharacter.value?.summonerVessels
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

  // Wrap update to keep selectedCharacter in sync
  const update = async (entity) => {
    if (selectedCharacter.value?.id === entity?.id) selectedCharacter.value = entity

    const updatedEntity = await base.update(entity)

    if (selectedCharacter.value?.id === updatedEntity?.id) selectedCharacter.value = updatedEntity

    return updatedEntity
  }

  return {
    characters: base.items,
    selectedCharacter,
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
