import { computed } from 'vue'

export function useItemGrouping(items, shouldGroup, sourcesStore) {
  
  const hasGrouping = computed(() => {
    return !!shouldGroup.value
  })

  const groupedItems = computed(() => {
    if (!hasGrouping.value) {
      return []
    }

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

