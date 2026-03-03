import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'

export const useBiomeStore = defineStore('biome', () => {
  const activeTags = ref(new Set())

  const charactersStore = useCharactersStore()
  const character = computed(() => charactersStore.selectedCharacter)

  const loadBiomeTagsFromCharacter = () => {
    const stored = character.value?.biomeTags
    activeTags.value = Array.isArray(stored) ? new Set(stored) : new Set()
  }

  const persistBiomeTagsToCharacter = () => {
    if (!character.value) return
    character.value.biomeTags = [...activeTags.value]
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
    persistBiomeTagsToCharacter()
  }

  return { activeTags, isTagActive, toggleTag, clearAll }
})
