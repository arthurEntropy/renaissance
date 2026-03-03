import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBiomeStore = defineStore('biome', () => {
  const activeTags = ref(new Set())

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
  }

  function clearAll() {
    activeTags.value = new Set()
  }

  return { activeTags, isTagActive, toggleTag, clearAll }
})
