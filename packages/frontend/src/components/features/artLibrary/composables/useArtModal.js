import { ref } from 'vue'
import { ART_TYPES } from '@shared/constants/artConstants'

export function useArtModal() {
    const showEditModal = ref(false)
    const selectedArt = ref(null)
    const isMultiEdit = ref(false)

    const openAddModal = (initialTags = {}) => {
        selectedArt.value = initialTags.type || initialTags.sources ? {
            type: initialTags.type || ART_TYPES.DEFAULT,
            sources: initialTags.sources || []
        } : null
        isMultiEdit.value = false
        showEditModal.value = true
    }

    const openEditModal = (artItem) => {
        selectedArt.value = artItem
        isMultiEdit.value = false
        showEditModal.value = true
    }

    const openMultiEditModal = () => {
        selectedArt.value = null
        isMultiEdit.value = true
        showEditModal.value = true
    }

    const closeEditModal = () => {
        showEditModal.value = false
        selectedArt.value = null
        isMultiEdit.value = false
    }

    return {
        showEditModal,
        selectedArt,
        isMultiEdit,
        openAddModal,
        openEditModal,
        openMultiEditModal,
        closeEditModal,
    }
}
