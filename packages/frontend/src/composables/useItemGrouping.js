import { computed } from 'vue'
import { getManaCostColors } from '@shared/utils/calculateManaCost'
import { ManaColor, MANA_COLOR_ORDER } from '@shared/constants/manaColors'

// Accepts groupingMode as a string ref ('source', 'mana-color', '') or a boolean ref (treated as 'source').
export function useItemGrouping(items, groupingMode, sourcesStore) {
  
  const resolvedMode = computed(() => {
    const mode = groupingMode.value
    if (typeof mode === 'boolean') return mode ? 'source' : ''
    return mode || ''
  })

  const hasGrouping = computed(() => !!resolvedMode.value)

  const groupedItems = computed(() => {
    if (!hasGrouping.value) return []
    if (resolvedMode.value === 'mana-color') return groupByManaColor(items.value)
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

// Color display order: no mana cost first, then single colors, then multicolor, then colorless last
const MANA_COLOR_GROUP_ORDER = ['none', ...MANA_COLOR_ORDER.filter(c => c !== ManaColor.COLORLESS), ManaColor.MULTICOLOR, ManaColor.COLORLESS]

const MANA_COLOR_GROUP_LABELS = {
  [ManaColor.WHITE]: 'White',
  [ManaColor.BLUE]: 'Blue',
  [ManaColor.BLACK]: 'Black',
  [ManaColor.RED]: 'Red',
  [ManaColor.GREEN]: 'Green',
  [ManaColor.COLORLESS]: 'Colorless',
  [ManaColor.MULTICOLOR]: 'Multicolor',
  none: 'No Mana Cost',
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

