import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'

export const useBiomeStore = defineStore('biome', () => {
  const activeTags = ref(new Set())
  const selectedBiomeId = ref(null)

  const charactersStore = useCharactersStore()
  const character = computed(() => charactersStore.selectedCharacter)

  const loadBiomeTagsFromCharacter = () => {
    const stored = character.value?.biomeTags
    activeTags.value = Array.isArray(stored) ? new Set(stored) : new Set()
    selectedBiomeId.value = character.value?.biomeId ?? null
  }

  const persistBiomeTagsToCharacter = () => {
    if (!character.value) return
    character.value.biomeTags = [...activeTags.value]
    character.value.biomeId = selectedBiomeId.value
  }

  watch(
    () => character.value?.id,
    () => {
      loadBiomeTagsFromCharacter()
    },
    { immediate: true }
  )

  function isTagActive(tag) {
    return activeTags.value.has(tag)
  }

  function toggleTag(tag) {
    const next = new Set(activeTags.value)
    if (next.has(tag)) {
      next.delete(tag)
    } else {
      next.add(tag)
    }
    activeTags.value = next
    persistBiomeTagsToCharacter()
  }

  function clearAll() {
    activeTags.value = new Set()
    selectedBiomeId.value = null
    persistBiomeTagsToCharacter()
  }

  function selectBiome(biome) {
    activeTags.value = new Set(biome.tags)
    selectedBiomeId.value = biome.id
    persistBiomeTagsToCharacter()
  }

  // Clears the selected preset ID without touching active tags (custom mode)
  function deselectBiome() {
    selectedBiomeId.value = null
    persistBiomeTagsToCharacter()
  }

  return { activeTags, selectedBiomeId, isTagActive, toggleTag, clearAll, selectBiome, deselectBiome }
})
