import { computed } from 'vue'

export function useArtMultiEdit(artStore, selectedItems, isMultiEdit) {
    const multiEditData = computed(() => {
        if (!isMultiEdit.value || selectedItems.value.length === 0) {
            return null
        }

        const selectedArts = selectedItems.value.map(id => artStore.getById(id)).filter(Boolean)

        if (selectedArts.length === 0) {
            return null
        }

        // Aggregate all unique sources from selected items
        const allSources = new Set()
        const sourceItemCounts = {} // Track how many items have each source

        selectedArts.forEach(art => {
            art.tags.sources.forEach(sourceId => {
                allSources.add(sourceId)
                sourceItemCounts[sourceId] = (sourceItemCounts[sourceId] || 0) + 1
            })
        })

        // Determine which sources are on all items vs some items
        const universalSources = [] // On all items
        const partialSources = [] // On some but not all items

        allSources.forEach(sourceId => {
            if (sourceItemCounts[sourceId] === selectedArts.length) {
                universalSources.push(sourceId)
            } else {
                partialSources.push(sourceId)
            }
        })

        // For type, use the most common type, or 'faces' as default
        const typeCounts = {}
        selectedArts.forEach(art => {
            typeCounts[art.tags.type] = (typeCounts[art.tags.type] || 0) + 1
        })
        const mostCommonType = Object.keys(typeCounts).reduce((a, b) =>
            typeCounts[a] > typeCounts[b] ? a : b, 'faces'
        )

        return {
            type: mostCommonType,
            universalSources, // Sources that ALL items have
            partialSources,   // Sources that SOME items have
            itemCount: selectedArts.length
        }
    })

    return {
        multiEditData,
    }
}
