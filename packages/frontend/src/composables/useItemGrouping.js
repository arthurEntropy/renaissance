import { computed } from 'vue'
import { getManaCostColors } from '@shared/utils/calculateManaCost'
import {
  ManaColor,
  MANA_COLOR_GROUP_ORDER,
  MANA_COLOR_GROUP_LABELS,
} from '@shared/constants/manaColors'

// Accepts groupingMode as a string ref ('source', 'mana-color', 'custom', '') or a boolean ref (treated as 'source').
// When mode is 'custom', customGroups must be a ref to an array of { id, name } objects and
// items must carry a customGroupId property to assign them to a group.
export function useItemGrouping(items, groupingMode, sourcesStore, customGroups) {
  
  const resolvedMode = computed(() => {
    const mode = groupingMode.value
    if (typeof mode === 'boolean') return mode ? 'source' : ''
    return mode || ''
  })

  const hasGrouping = computed(() => !!resolvedMode.value)

  const groupedItems = computed(() => {
    if (!hasGrouping.value) return []
    if (resolvedMode.value === 'mana-color') return groupByManaColor(items.value)
    if (resolvedMode.value === 'custom') return groupByCustom(items.value, customGroups?.value ?? [])
    return groupBySource(items.value, sourcesStore)
  })

  return {
    groupedItems,
    hasGrouping
  }
}

function groupBySource(items, sourcesStore) {
  const groups = {}
  
  items.forEach(item => {
    const sourceId = item.source
    let groupName = 'No Source'
    
    if (sourceId && sourcesStore) {
      const sourceName = sourcesStore.getSourceName(sourceId)
      if (sourceName) {
        groupName = sourceName
      }
    }
    
    if (!groups[groupName]) {
      groups[groupName] = {
        id: sourceId || 'no-source',
        name: groupName,
        collapsed: false,
        items: []
      }
    }
    
    groups[groupName].items.push(item)
  })
  
  return Object.values(groups).sort((a, b) => {
    if (a.name === 'No Source') return 1
    if (b.name === 'No Source') return -1
    const nameA = (a.name || '').replace(/^The /i, '').toLowerCase()
    const nameB = (b.name || '').replace(/^The /i, '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
}

function getManaColorGroupKey(ability) {
  if (!ability.manaCost) return 'none'
  const colors = getManaCostColors(ability.manaCost)
  if (colors.size === 0) return ManaColor.COLORLESS
  if (colors.size === 1) return [...colors][0]
  return ManaColor.MULTICOLOR
}

function groupByManaColor(items) {
  const groups = {}

  items.forEach(item => {
    const key = getManaColorGroupKey(item)
    if (!groups[key]) {
      groups[key] = {
        id: key,
        name: MANA_COLOR_GROUP_LABELS[key] || key,
        collapsed: false,
        items: []
      }
    }
    groups[key].items.push(item)
  })

  return Object.values(groups).sort((a, b) => {
    const ai = MANA_COLOR_GROUP_ORDER.indexOf(a.id)
    const bi = MANA_COLOR_GROUP_ORDER.indexOf(b.id)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

// Groups items by their customGroupId, respecting the user-defined group order.
// Items with no customGroupId (or an unrecognised one) fall into an "Ungrouped" section at the end.
function groupByCustom(items, customGroups) {
  const groupMap = new Map()

  // Seed map with defined groups in their defined order (preserving empty groups)
  customGroups.forEach(g => {
    groupMap.set(g.id, {
      id: g.id,
      name: g.name,
      collapsed: false,
      items: [],
      isCustom: true
    })
  })

  const ungrouped = {
    id: '__ungrouped__',
    name: 'Ungrouped',
    collapsed: false,
    items: [],
    isUngrouped: true
  }

  items.forEach(item => {
    const gid = item.customGroupId
    if (gid && groupMap.has(gid)) {
      groupMap.get(gid).items.push(item)
    } else {
      ungrouped.items.push(item)
    }
  })

  const result = [...groupMap.values()]
  // Always append the Ungrouped section (even if empty, so it acts as a drop target)
  result.push(ungrouped)
  return result
}

