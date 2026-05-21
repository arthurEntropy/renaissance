import { computed } from 'vue'
import { getManaCostColors } from '@/utils/calculateManaCost'
import {
  ManaColor,
  MANA_COLOR_GROUP_ORDER,
  MANA_COLOR_GROUP_LABELS,
} from '@/constants/manaColors'

// Accepts groupingMode as a string ref ('source', 'mana-color', 'custom', 'type', 'subtype', 'grade', '') or a boolean ref (treated as 'source').
// When mode is 'custom', customGroups must be a ref to an array of { id, name } objects and
// items must carry a customGroupId property to assign them to a group.
// equipmentStores is an optional object with { typesStore, subtypesStore, gradesStore } for equipment grouping modes.
export function useItemGrouping(items, groupingMode, sourcesStore, customGroups, equipmentStores = {}) {
  
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
    if (resolvedMode.value === 'type') return groupByType(items.value, equipmentStores.typesStore)
    if (resolvedMode.value === 'subtype') return groupBySubtype(items.value, equipmentStores.subtypesStore)
    if (resolvedMode.value === 'grade') return groupByGrade(items.value, equipmentStores.gradesStore)
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

function groupByType(items, typesStore) {
  const groups = {}
  items.forEach(item => {
    const typeId = item.type ?? null
    const typeName = typesStore?.getById(typeId)?.name || 'Unknown Type'
    const key = typeId || '__unknown-type__'
    if (!groups[key]) {
      groups[key] = { id: key, name: typeName, collapsed: false, items: [] }
    }
    groups[key].items.push(item)
  })
  return Object.values(groups).sort((a, b) => {
    if (a.id === '__unknown-type__') return 1
    if (b.id === '__unknown-type__') return -1
    return a.name.localeCompare(b.name)
  })
}

function groupBySubtype(items, subtypesStore) {
  const groups = {}
  items.forEach(item => {
    const subtypeId = item.subtype ?? null
    const subtypeName = subtypesStore?.getById(subtypeId)?.name || 'Unknown Subtype'
    const key = subtypeId || '__unknown-subtype__'
    if (!groups[key]) {
      groups[key] = { id: key, name: subtypeName, collapsed: false, items: [] }
    }
    groups[key].items.push(item)
  })
  return Object.values(groups).sort((a, b) => {
    if (a.id === '__unknown-subtype__') return 1
    if (b.id === '__unknown-subtype__') return -1
    return a.name.localeCompare(b.name)
  })
}

function groupByGrade(items, gradesStore) {
  const groups = {}
  items.forEach(item => {
    const gradeId = item.grade ?? null
    const grade = gradesStore?.getById(gradeId)
    const gradeName = grade?.name || 'Unknown Grade'
    const gradeIndex = grade?.index ?? 999
    const key = gradeId || '__unknown-grade__'
    if (!groups[key]) {
      groups[key] = { id: key, name: gradeName, index: gradeIndex, collapsed: false, items: [] }
    }
    groups[key].items.push(item)
  })
  return Object.values(groups).sort((a, b) => {
    if (a.id === '__unknown-grade__') return 1
    if (b.id === '__unknown-grade__') return -1
    return a.index - b.index
  })
}

