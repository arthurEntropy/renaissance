import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import CharacterService from '@/services/entities/characterService'
import { useAuthStore } from './authStore'
import { useCampaignStore } from './campaignStore'
import {
  isPlayerCharacter,
  isBeastTemplate,
  isBeastInstance,
} from '@/utils/characterTypeGuards'

export const useCharactersStore = defineStore('characters', () => {
  const base = useCrudEntityStore(CharacterService, 'characters')
  const authStore = useAuthStore()
  const campaignStore = useCampaignStore()

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
    const uid = authStore.user?.uid
    if (!uid) {
      // Unauthenticated visitors: show only public preview characters
      return base.items.value.filter((character) => character.isPublicPreview)
    }
    return base.items.value.filter((character) =>
      isPlayerCharacter(character) && character.ownerId === uid
    )
  })

  const filteredBeasts = computed(() => {
    return base.items.value.filter((character) => isBeastTemplate(character))
  })

  const filteredBeastInstances = computed(() => {
    return base.items.value.filter((character) => isBeastInstance(character))
  })

  // The beast currently summoned by the selected character (if any).
  // vessel.beastId may reference a beastInstance (new) or a beast template (legacy).
  const summonedBeast = computed(() => {
    const vessels = selectedCharacter.value?.summonerVessels
    if (!vessels?.length) return null
    const summonedVessel = vessels.find((v) => v.isSummoned && v.beastId)
    if (!summonedVessel) return null
    return base.getById(summonedVessel.beastId) ?? null
  })

  const hasSelectedCharacter = computed(() => {
    return selectedCharacter.value !== null
  })

  const canEditSelectedCharacter = computed(() => {
    if (!selectedCharacter.value) return false
    if (selectedCharacter.value.isPublicPreview && !authStore.isAdmin) return false
    // Beast template: only admin not currently in a campaign can edit
    if (isBeastTemplate(selectedCharacter.value)) {
      return authStore.isAdmin && !campaignStore.isInCampaign
    }
    // Beast instance: GM in the active campaign can edit, or the player who owns it
    if (isBeastInstance(selectedCharacter.value)) {
      if (authStore.isAdmin) return true
      if (campaignStore.isGMInActiveCampaign) return true
      // Familiars and summoner vessel beasts carry an ownerId set to their creator
      if (selectedCharacter.value.ownerId && selectedCharacter.value.ownerId === authStore.user?.uid) return true
      return false
    }
    // Player characters and NPCs
    if (authStore.isAdmin) return true
    if (!authStore.isAuthenticated) return false
    return selectedCharacter.value.ownerId === authStore.user?.uid
  })

  // Wrap update to persist the entity.
  // Deliberately does NOT overwrite selectedCharacter with the server response:
  // the reactive proxy already has the user's latest mutations, and replacing it
  // with the server payload would revert any changes made during the round-trip.
  const update = async (entity) => {
    const updatedEntity = await base.update(entity)
    return updatedEntity
  }

  const transferOwnership = async (characterId, newOwnerId) => {
    const updated = await CharacterService.transferOwnership(characterId, newOwnerId)
    // Remove from store since current user no longer owns it
    base.allItems.value = base.allItems.value.filter((c) => c.id !== characterId)
    if (selectedCharacter.value?.id === characterId) {
      selectedCharacter.value = null
    }
    return updated
  }

  const deleteCharacter = async (character) => {
    if (!character) return
    await base.remove(character)
    if (selectedCharacter.value?.id === character.id) {
      selectedCharacter.value = null
    }
  }

  /**
   * Update a character in the local store from a socket event, without making
   * an API call.  Used to apply character stat changes broadcast by other
   * clients (e.g. HP or defense edited via the token info area on the tabletop).
   *
   * @param {Object} character - The full updated character object received from socket
   */
  const updateFromSocket = (character) => {
    if (!character?.id) return
    const idx = base.allItems.value.findIndex((c) => c.id === character.id)
    if (idx !== -1) {
      base.allItems.value.splice(idx, 1, character)
    }
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
    transferOwnership,
    deleteCharacter,
    selectCharacter,
    deselectCharacter,
    getById: base.getById,
    filteredCharacters,
    filteredBeasts,
    filteredBeastInstances,
    summonedBeast,
    hasSelectedCharacter,
    canEditSelectedCharacter,
    updateFromSocket,
  }
})
