import { computed } from 'vue'

export function useArtNavigation(selectedArt, filteredArt) {
    const hasPreviousArt = computed(() => {
        if (!selectedArt.value) return false
        const currentIndex = filteredArt.value.findIndex(art => art.id === selectedArt.value.id)
        return currentIndex > 0
    })

    const hasNextArt = computed(() => {
        if (!selectedArt.value) return false
        const currentIndex = filteredArt.value.findIndex(art => art.id === selectedArt.value.id)
        return currentIndex < filteredArt.value.length - 1
    })

    const navigateArt = (direction) => {
        if (!selectedArt.value) return
        const currentIndex = filteredArt.value.findIndex(art => art.id === selectedArt.value.id)
        const newIndex = currentIndex + direction
        if (newIndex >= 0 && newIndex < filteredArt.value.length) {
            selectedArt.value = filteredArt.value[newIndex]
        }
    }

    return {
        hasPreviousArt,
        hasNextArt,
        navigateArt,
    }
}
