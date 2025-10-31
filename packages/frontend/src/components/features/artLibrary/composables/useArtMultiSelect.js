import { ref } from 'vue'

export function useArtMultiSelect() {
    const selectedItems = ref([])

    const toggleSelection = (artId) => {
        const index = selectedItems.value.indexOf(artId)
        if (index > -1) {
            selectedItems.value.splice(index, 1)
        } else {
            selectedItems.value.push(artId)
        }
    }

    const clearSelection = () => {
        selectedItems.value = []
    }

    return {
        selectedItems,
        toggleSelection,
        clearSelection,
    }
}
