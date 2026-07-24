import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const PINNED_GROUPS_KEY = 'characterContext:pinnedGroups'

function loadPersistedGroups() {
  try {
    const raw = localStorage.getItem(PINNED_GROUPS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.ids) && parsed.byId && typeof parsed.byId === 'object') {
      return parsed
    }
  } catch {
    // ignore parse errors
  }
  return null
}

export const useCharacterContextStore = defineStore('characterContext', () => {
  const persisted = loadPersistedGroups()

  // State
  const pinnedGroupIds = ref(persisted?.ids ?? [])
  const pinnedGroupsById = ref(persisted?.byId ?? {})
  // Persist pinned groups to localStorage on change
  watch(
    [pinnedGroupIds, pinnedGroupsById],
    () => {
      try {
        localStorage.setItem(PINNED_GROUPS_KEY, JSON.stringify({
          ids: pinnedGroupIds.value,
          byId: pinnedGroupsById.value,
        }))
      } catch {
        // ignore storage errors
      }
    },
    { deep: true }
  )

  // Actions
  const pinGroup = (groupId, groupData) => {
    if (!pinnedGroupIds.value.includes(groupId)) {
      pinnedGroupIds.value.push(groupId)
    }
    pinnedGroupsById.value[groupId] = groupData
  }

  const unpinGroup = (groupId) => {
    const index = pinnedGroupIds.value.indexOf(groupId)
    if (index !== -1) {
      pinnedGroupIds.value.splice(index, 1)
    }
    delete pinnedGroupsById.value[groupId]
  }

  const updatePinnedGroup = (groupId, groupData) => {
    if (pinnedGroupsById.value[groupId]) {
      pinnedGroupsById.value[groupId] = {
        ...pinnedGroupsById.value[groupId],
        ...groupData
      }
    }
  }

  const isPinned = (groupId) => {
    return pinnedGroupIds.value.includes(groupId)
  }

  const clearPinnedGroups = () => {
    pinnedGroupIds.value = []
    pinnedGroupsById.value = {}
  }

  const reorderPinnedGroups = (orderedIds) => {
    const currentSet = new Set(pinnedGroupIds.value)
    pinnedGroupIds.value = orderedIds.filter((id) => currentSet.has(id))
  }

  // Computed properties
  const pinnedGroups = computed(() => {
    return pinnedGroupIds.value.map((id) => pinnedGroupsById.value[id]).filter(Boolean)
  })

  const pinnedGroupCount = computed(() => {
    return pinnedGroupIds.value.length
  })

  return {
    // State (read-only references)
    pinnedGroupIds,
    pinnedGroupsById,

    // Computed
    pinnedGroups,
    pinnedGroupCount,

    // Actions
    pinGroup,
    unpinGroup,
    updatePinnedGroup,
    isPinned,
    clearPinnedGroups,
    reorderPinnedGroups,
  }
})
