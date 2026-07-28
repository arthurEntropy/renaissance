import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCharacterContextStore = defineStore('characterContext', () => {
  // Runtime-only state – populated from the active tabletop's combatGroups when
  // a tabletop is opened, and cleared when it is closed. No longer persisted to
  // localStorage (groups now live on the Tabletop document).
  const pinnedGroupIds = ref([])
  const pinnedGroupsById = ref({})

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Populate groups from a tabletop's persisted combatGroups array.
   * Replaces any previously loaded groups.
   */
  const setGroupsFromTabletop = (combatGroups) => {
    const ids = []
    const byId = {}
    for (const group of (combatGroups || [])) {
      if (!group?.id) continue
      ids.push(group.id)
      const combatants = (group.combatants || []).filter(c => c?.characterId)
      byId[group.id] = {
        id: group.id,
        name: group.name ?? '',
        memberIds: combatants.map(c => c.characterId),
        combatants,
      }
    }
    pinnedGroupIds.value = ids
    pinnedGroupsById.value = byId
  }

  const unpinGroup = (groupId) => {
    const index = pinnedGroupIds.value.indexOf(groupId)
    if (index !== -1) {
      pinnedGroupIds.value.splice(index, 1)
    }
    delete pinnedGroupsById.value[groupId]
  }

  const addPinnedGroup = (group) => {
    if (!group?.id) return
    pinnedGroupIds.value = [...pinnedGroupIds.value, group.id]
    pinnedGroupsById.value = {
      ...pinnedGroupsById.value,
      [group.id]: {
        id: group.id,
        name: group.name ?? '',
        memberIds: [],
        combatants: [],
      },
    }
  }

  const updatePinnedGroup = (groupId, groupData) => {
    if (pinnedGroupsById.value[groupId]) {
      pinnedGroupsById.value[groupId] = {
        ...pinnedGroupsById.value[groupId],
        ...groupData,
      }
    }
  }

  /**
   * Replace the full combatants array for a group, keeping memberIds in sync.
   */
  const updateGroupCombatants = (groupId, combatants) => {
    if (pinnedGroupsById.value[groupId]) {
      pinnedGroupsById.value[groupId] = {
        ...pinnedGroupsById.value[groupId],
        combatants,
        memberIds: combatants.map(c => c.characterId),
      }
    }
  }

  /**
   * Convert current in-memory groups back to the tabletop combatGroups format
   * (suitable for persisting to the REST API).
   */
  const toCombatGroupsFormat = () => {
    return pinnedGroupIds.value.map(id => {
      const group = pinnedGroupsById.value[id]
      if (!group) return null
      return {
        id: group.id,
        name: group.name,
        combatants: group.combatants || [],
      }
    }).filter(Boolean)
  }

  const isPinned = (groupId) => {
    return pinnedGroupIds.value.includes(groupId)
  }

  const clearPinnedGroups = () => {
    pinnedGroupIds.value = []
    pinnedGroupsById.value = {}
  }

  /**
   * Remove a character from every group it belongs to.
   * Groups that become empty are removed.
   */
  const removeCharacterFromPinnedGroups = (characterId) => {
    for (const groupId of [...pinnedGroupIds.value]) {
      const group = pinnedGroupsById.value[groupId]
      if (!group) continue
      const memberIds = (group.memberIds || []).filter(id => id !== characterId)
      if (memberIds.length !== (group.memberIds || []).length) {
        if (memberIds.length === 0) {
          unpinGroup(groupId)
        } else {
          updatePinnedGroup(groupId, { memberIds })
        }
      }
    }
  }

  const reorderPinnedGroups = (orderedIds) => {
    const currentSet = new Set(pinnedGroupIds.value)
    pinnedGroupIds.value = orderedIds.filter((id) => currentSet.has(id))
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const pinnedGroups = computed(() => {
    return pinnedGroupIds.value.map((id) => pinnedGroupsById.value[id]).filter(Boolean)
  })

  const pinnedGroupCount = computed(() => {
    return pinnedGroupIds.value.length
  })

  return {
    // State
    pinnedGroupIds,
    pinnedGroupsById,

    // Computed
    pinnedGroups,
    pinnedGroupCount,

    // Actions
    setGroupsFromTabletop,
    addPinnedGroup,
    unpinGroup,
    updatePinnedGroup,
    updateGroupCombatants,
    toCombatGroupsFormat,
    isPinned,
    clearPinnedGroups,
    removeCharacterFromPinnedGroups,
    reorderPinnedGroups,
  }
})
