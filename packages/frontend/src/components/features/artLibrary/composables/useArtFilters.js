import { ref, computed, onMounted } from 'vue'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { useSourcesStore } from '@/stores/sourcesStore'

// Special filter IDs for missing tags
export const SPECIAL_FILTERS = {
    NO_TAGS: '__no_tags__',
    NO_ANCESTRY: '__no_ancestry__',
    NO_CULTURE: '__no_culture__',
    NO_MESTIERI: '__no_mestieri__'
}

export function useArtFilters(artStore) {
    const sourcesStore = useSourcesStore()
    const gridSize = ref('large')
    const typeFilters = ref([])
    const sourceFilters = ref([])
    const sourceFilter = ref('')
    const groupBy = ref('')
    const orderBy = ref('')
    const showDuplicates = ref(false)

    // Filter persistence
    const { initialize: initializeFilterPersistence } = useFilterPersistence('art', {
        gridSize,
        typeFilters,
        sourceFilters,
        groupBy,
        orderBy,
        showDuplicates
    })

    // Initialize on mount
    onMounted(() => {
        initializeFilterPersistence()
    })

    // Helper function to check if art has any tags from a specific category
    const hasTagFromCategory = (art, category) => {
        if (!art?.tags?.sources || !Array.isArray(art.tags.sources)) return false
        return art.tags.sources.some(sourceId => {
            const sourceType = sourcesStore.getSourceType(sourceId)
            return sourceType === category
        })
    }

    const filteredArt = computed(() => {
        let filtered = artStore.art

        // Filter by types (if any selected)
        if (typeFilters.value.length > 0) {
            filtered = filtered.filter(art => art?.tags?.type && typeFilters.value.includes(art.tags.type))
        }

        // Separate special filters from regular source filters
        const regularFilters = sourceFilters.value.filter(id => !Object.values(SPECIAL_FILTERS).includes(id))
        const specialFilters = sourceFilters.value.filter(id => Object.values(SPECIAL_FILTERS).includes(id))

        // Filter by regular sources (must match ALL selected sources)
        if (regularFilters.length > 0) {
            filtered = filtered.filter(art =>
                art?.tags?.sources && regularFilters.every(sourceId => art.tags.sources.includes(sourceId))
            )
        }

        // Apply special filters
        specialFilters.forEach(specialFilter => {
            switch (specialFilter) {
                case SPECIAL_FILTERS.NO_TAGS:
                    filtered = filtered.filter(art => 
                        !art?.tags?.sources || art.tags.sources.length === 0
                    )
                    break
                case SPECIAL_FILTERS.NO_ANCESTRY:
                    filtered = filtered.filter(art => !hasTagFromCategory(art, 'ancestry'))
                    break
                case SPECIAL_FILTERS.NO_CULTURE:
                    filtered = filtered.filter(art => !hasTagFromCategory(art, 'culture'))
                    break
                case SPECIAL_FILTERS.NO_MESTIERI:
                    filtered = filtered.filter(art => !hasTagFromCategory(art, 'mestiere'))
                    break
            }
        })

        // Filter for duplicates if enabled
        if (showDuplicates.value) {
            const urlCounts = {}
            artStore.art.forEach(art => {
                if (art.url) {
                    urlCounts[art.url] = (urlCounts[art.url] || 0) + 1
                }
            })
            filtered = filtered.filter(art => art.url && urlCounts[art.url] > 1)
        }

        // Sort the filtered results (before grouping)
        if (orderBy.value) {
            filtered = sortArt(filtered, orderBy.value)
        }

        return filtered
    })

    // Grouped art data (for display when groupBy is active)
    const groupedArt = computed(() => {
        if (!groupBy.value) {
            return null // No grouping
        }

        const groups = {}
        const groupMetadata = {} // Store actual dates for sorting
        
        filteredArt.value.forEach(art => {
            let groupKey = 'Ungrouped'
            let sortValue = null
            
            switch (groupBy.value) {
                case 'type':
                    groupKey = art?.tags?.type || 'No Type'
                    // Capitalize first letter
                    groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1)
                    break
                case 'ancestry':
                    groupKey = getFirstTagOfCategory(art, 'ancestry') || 'No Ancestry'
                    break
                case 'culture':
                    groupKey = getFirstTagOfCategory(art, 'culture') || 'No Culture'
                    break
                case 'mestieri':
                    groupKey = getFirstTagOfCategory(art, 'mestiere') || 'No Mestieri'
                    break
                case 'worldElement':
                    groupKey = getFirstTagOfCategory(art, 'worldElement') || 'No World Element'
                    break
                case 'dateAddedOldToNew':
                case 'dateAddedNewToOld':
                    if (art.createdAt) {
                        const date = new Date(art.createdAt)
                        groupKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        sortValue = date.getTime()
                    } else {
                        groupKey = 'No Date'
                        sortValue = 0
                    }
                    break
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = []
                groupMetadata[groupKey] = sortValue
            }
            groups[groupKey].push(art)
        })

        // Convert to array and sort group names
        return Object.entries(groups)
            .sort(([a], [b]) => {
                // Special handling for "No X" groups - put them at the end
                const aIsNo = a.startsWith('No ')
                const bIsNo = b.startsWith('No ')
                if (aIsNo && !bIsNo) return 1
                if (!aIsNo && bIsNo) return -1
                
                // For date grouping, use actual timestamp for sorting
                if (groupBy.value === 'dateAddedOldToNew' || groupBy.value === 'dateAddedNewToOld') {
                    const aTime = groupMetadata[a] || 0
                    const bTime = groupMetadata[b] || 0
                    // Old to new: ascending (smaller timestamp first)
                    // New to old: descending (larger timestamp first)
                    return groupBy.value === 'dateAddedOldToNew' ? aTime - bTime : bTime - aTime
                }
                
                return a.localeCompare(b)
            })
            .map(([name, items]) => ({ name, items }))
    })

    // Helper function to get the first tag of a specific category from art
    const getFirstTagOfCategory = (art, category) => {
        if (!art?.tags?.sources || !Array.isArray(art.tags.sources)) return null
        for (const sourceId of art.tags.sources) {
            const sourceType = sourcesStore.getSourceType(sourceId)
            if (sourceType === category) {
                return sourcesStore.getSourceName(sourceId)
            }
        }
        return null
    }

    // Helper function to sort art
    const sortArt = (artArray, sortBy) => {
        const sorted = [...artArray]
        
        switch (sortBy) {
            case 'type':
                return sorted.sort((a, b) => {
                    const typeA = a?.tags?.type || ''
                    const typeB = b?.tags?.type || ''
                    return typeA.localeCompare(typeB)
                })
            case 'ancestry':
                return sorted.sort((a, b) => {
                    const ancestryA = getFirstTagOfCategory(a, 'ancestry') || 'zzz'
                    const ancestryB = getFirstTagOfCategory(b, 'ancestry') || 'zzz'
                    return ancestryA.localeCompare(ancestryB)
                })
            case 'culture':
                return sorted.sort((a, b) => {
                    const cultureA = getFirstTagOfCategory(a, 'culture') || 'zzz'
                    const cultureB = getFirstTagOfCategory(b, 'culture') || 'zzz'
                    return cultureA.localeCompare(cultureB)
                })
            case 'mestieri':
                return sorted.sort((a, b) => {
                    const mestieriA = getFirstTagOfCategory(a, 'mestiere') || 'zzz'
                    const mestieriB = getFirstTagOfCategory(b, 'mestiere') || 'zzz'
                    return mestieriA.localeCompare(mestieriB)
                })
            case 'worldElement':
                return sorted.sort((a, b) => {
                    const weA = getFirstTagOfCategory(a, 'worldElement') || 'zzz'
                    const weB = getFirstTagOfCategory(b, 'worldElement') || 'zzz'
                    return weA.localeCompare(weB)
                })
            case 'dateAddedOldToNew':
                return sorted.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    return dateA - dateB // Oldest first (ascending)
                })
            case 'dateAddedNewToOld':
                return sorted.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    return dateB - dateA // Newest first (descending)
                })
            default:
                return sorted
        }
    }

    const faceCount = computed(() => {
        return filteredArt.value.filter(art => art?.tags?.type === 'faces').length
    })

    const placeCount = computed(() => {
        return filteredArt.value.filter(art => art?.tags?.type === 'places').length
    })

    const mapCount = computed(() => {
        return filteredArt.value.filter(art => art?.tags?.type === 'maps').length
    })

    const toggleTypeFilter = (type) => {
        const index = typeFilters.value.indexOf(type)
        if (index > -1) {
            typeFilters.value.splice(index, 1)
        } else {
            typeFilters.value.push(type)
        }
    }

    const addSourceFilter = () => {
        if (sourceFilter.value && !sourceFilters.value.includes(sourceFilter.value)) {
            sourceFilters.value.push(sourceFilter.value)
        }
        sourceFilter.value = ''
    }

    const removeSourceFilter = (sourceId) => {
        const index = sourceFilters.value.indexOf(sourceId)
        if (index > -1) {
            sourceFilters.value.splice(index, 1)
        }
    }

    return {
        gridSize,
        typeFilters,
        sourceFilters,
        sourceFilter,
        groupBy,
        orderBy,
        showDuplicates,
        filteredArt,
        groupedArt,
        faceCount,
        placeCount,
        mapCount,
        toggleTypeFilter,
        addSourceFilter,
        removeSourceFilter,
    }
}
