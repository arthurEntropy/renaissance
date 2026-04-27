import { computed, ref } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'
import { SOURCE_COLLECTION_TYPES } from '@/constants/sourceTypes'

export function useSourceCascadePicker() {
    const sourcesStore = useSourcesStore()

    const showPicker = ref(false)
    const pickerSearch = ref('')
    const pickerSelectedSourceType = ref(null)

    let closeMenuTimer = null

    const sourceTypeOptions = computed(() => SOURCE_COLLECTION_TYPES
        .map((opt) => ({
            ...opt,
            count: (sourcesStore.sources[opt.listKey] || []).length,
        }))
        .filter((opt) => opt.count > 0)
    )

    const pickerCurrentSources = computed(() => {
        const selectedType = pickerSelectedSourceType.value
        const typeOption = SOURCE_COLLECTION_TYPES.find((option) => option.id === selectedType)
        if (!typeOption) return []

        const query = pickerSearch.value.toLowerCase().trim()
        const items = [...(sourcesStore.sources[typeOption.listKey] || [])]
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

        if (!query) return items
        return items.filter((item) => (item.name || '').toLowerCase().includes(query))
    })

    const openPicker = () => {
        showPicker.value = true
    }

    const closeCascadeImmediate = () => {
        showPicker.value = false
        pickerSelectedSourceType.value = null
        pickerSearch.value = ''
    }

    const togglePicker = () => {
        if (showPicker.value) {
            closeCascadeImmediate()
        } else {
            openPicker()
        }
    }

    const onHoverSourceType = (sourceType) => {
        pickerSelectedSourceType.value = sourceType.id
        pickerSearch.value = ''
        cancelCloseMenu()
    }

    const startCloseMenu = () => {
        closeMenuTimer = setTimeout(closeCascadeImmediate, 180)
    }

    const cancelCloseMenu = () => {
        if (closeMenuTimer) {
            clearTimeout(closeMenuTimer)
            closeMenuTimer = null
        }
    }

    return {
        showPicker,
        pickerSearch,
        pickerSelectedSourceType,
        sourceTypeOptions,
        pickerCurrentSources,
        openPicker,
        closeCascadeImmediate,
        togglePicker,
        onHoverSourceType,
        startCloseMenu,
        cancelCloseMenu,
    }
}
