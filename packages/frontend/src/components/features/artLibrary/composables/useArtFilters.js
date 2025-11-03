import { ref, computed, onMounted } from 'vue'
import { useFilterPersistence } from '@/composables/useFilterPersistence'

export function useArtFilters(artStore) {
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

    const filteredArt = computed(() => {
        let filtered = artStore.art

        // Filter by types (if any selected)
        if (typeFilters.value.length > 0) {
            filtered = filtered.filter(art => art?.tags?.type && typeFilters.value.includes(art.tags.type))
        }

        // Filter by sources (must match ALL selected sources)
        if (sourceFilters.value.length > 0) {
            filtered = filtered.filter(art =>
                art?.tags?.sources && sourceFilters.value.every(sourceId => art.tags.sources.includes(sourceId))
            )
        }

        return filtered
    })

    const faceCount = computed(() => {
        return artStore.art.filter(art => art?.tags?.type === 'faces').length
    })

    const placeCount = computed(() => {
        return artStore.art.filter(art => art?.tags?.type === 'places').length
    })

    const mapCount = computed(() => {
        return artStore.art.filter(art => art?.tags?.type === 'maps').length
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
