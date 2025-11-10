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

    // Filter persistence
    const { initialize: initializeFilterPersistence } = useFilterPersistence('art', {
        gridSize,
        typeFilters,
        sourceFilters
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

        return filtered
    })

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
        filteredArt,
        faceCount,
        placeCount,
        mapCount,
        toggleTypeFilter,
        addSourceFilter,
        removeSourceFilter,
    }
}
