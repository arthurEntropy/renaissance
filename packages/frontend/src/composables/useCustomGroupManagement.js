import { v4 as uuidv4 } from 'uuid'

// Shared reorder / create / rename / delete logic for custom-grouped item tables (abilities, equipment).
export function useCustomGroupManagement(character, itemsKey, customGroupsKey, groupingOption) {
  // Persist a drag-reordered flat array back to the character.
  // newItems have updated columnIndex values set by ThreeColumnLayout.
  function handleFlatReorder(newItems) {
    if (!character.value?.[itemsKey]) return
    const current = character.value[itemsKey]
    character.value[itemsKey] = newItems
      .map(item => {
        const original = current.find(a => a.id === item.id)
        return original ? { ...original, columnIndex: item.columnIndex } : null
      })
      .filter(Boolean)
  }

  // Persist a within-group drag reorder back to the character.
  // Reordered items are placed at the same flat-array slots their group previously occupied.
  function handleGroupReorder(_groupId, reorderedGroupItems) {
    if (!character.value?.[itemsKey]) return
    const reorderedIds = reorderedGroupItems.map(item => item.id)
    const groupIdSet = new Set(reorderedIds)
    const current = character.value[itemsKey]
    const groupFlatIndices = current
      .map((a, i) => (groupIdSet.has(a.id) ? i : -1))
      .filter(i => i !== -1)
    if (groupFlatIndices.length === 0) return
    const newItems = [...current]
    groupFlatIndices.forEach((flatIdx, orderIdx) => {
      const entry = current.find(a => a.id === reorderedIds[orderIdx])
      if (entry) newItems[flatIdx] = entry
    })
    character.value[itemsKey] = newItems
  }

  // Custom grouping: cross-group reorder. A card was dropped into a different group,
  // so update its customGroupId and re-merge all group arrays back into the flat list.
  function handleCustomGroupReorder(groupId, reorderedGroupItems) {
    if (!character.value?.[itemsKey]) return
    const updatedIds = new Set(reorderedGroupItems.map(i => i.id))
    const current = [...character.value[itemsKey]]
    const remaining = current.filter(a => !updatedIds.has(a.id))
    const reinserted = reorderedGroupItems
      .map(item => {
        const original = current.find(a => a.id === item.id)
        return original ? { ...original, customGroupId: groupId === '__ungrouped__' ? null : groupId } : null
      })
      .filter(Boolean)
    character.value[itemsKey] = [...remaining, ...reinserted]
  }

  // Named dispatcher so Vue passes all event args correctly.
  function onGroupReorder(groupId, items) {
    if (groupingOption.value === 'custom') {
      handleCustomGroupReorder(groupId, items)
    } else {
      handleGroupReorder(groupId, items)
    }
  }

  function createGroup() {
    if (!character.value) return
    const newGroup = { id: uuidv4(), name: 'New Group' }
    character.value[customGroupsKey] = [
      ...(character.value[customGroupsKey] ?? []),
      newGroup
    ]
  }

  function renameGroup(groupId, newName) {
    if (!character.value?.[customGroupsKey]) return
    const idx = character.value[customGroupsKey].findIndex(g => g.id === groupId)
    if (idx !== -1) {
      character.value[customGroupsKey][idx] = {
        ...character.value[customGroupsKey][idx],
        name: newName
      }
    }
  }

  function deleteGroup(groupId) {
    if (!character.value) return
    // Un-assign items from the deleted group before removing the group definition
    character.value[itemsKey] = (character.value[itemsKey] ?? []).map(a =>
      a.customGroupId === groupId ? { ...a, customGroupId: null } : a
    )
    character.value[customGroupsKey] = (character.value[customGroupsKey] ?? []).filter(
      g => g.id !== groupId
    )
  }

  return { handleFlatReorder, onGroupReorder, createGroup, renameGroup, deleteGroup }
}
