<template>
    <div class="modal-overlay preferences-modal-overlay" @click.self="closeModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Preferences</h2>
                <button class="close-button" @click="closeModal" aria-label="Close">
                    <XMarkIcon class="close-icon" />
                </button>
            </div>

            <div class="preferences-section">
                <h3>Background Image</h3>
                <div class="background-options">
                    <!-- Show all backgrounds in order, first one is default -->
                    <div v-for="(background, index) in sortedBackgrounds" :key="background.id" class="background-option"
                        :class="{ selected: isSelected(background.id, index) }"
                        @click="selectBackground(background.id)">
                        <img :src="background.imageUrl" :alt="`Background`" class="background-thumbnail" />
                        <div v-if="index === 0" class="default-badge">Default</div>
                        <div v-if="isSelected(background.id, index)" class="selected-indicator">✓</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBackgroundImagesStore } from '@/stores/backgroundImagesStore'
import { useUserStore } from '@/stores/userStore'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits(['close'])

const backgroundImagesStore = useBackgroundImagesStore()
const userStore = useUserStore()

const selectedBackgroundId = ref(null)

// Sort backgrounds by index (items without index go to end, then sort by id)
const sortedBackgrounds = computed(() => {
    return [...backgroundImagesStore.items].sort((a, b) => {
        // Items with index come before items without index
        const aHasIndex = a.index != null
        const bHasIndex = b.index != null

        if (aHasIndex && !bHasIndex) return -1
        if (!aHasIndex && bHasIndex) return 1

        // Both have index: sort by index value
        if (aHasIndex && bHasIndex) {
            if (a.index !== b.index) return a.index - b.index
        }

        // Same index or both lack index: sort by id
        return (a.id || '').localeCompare(b.id || '')
    })
})

const isSelected = (backgroundId, index) => {
    return selectedBackgroundId.value === backgroundId ||
        (selectedBackgroundId.value === null && index === 0)
}

const selectBackground = async (backgroundId) => {
    selectedBackgroundId.value = backgroundId
    await userStore.update({
        preferences: {
            ...(userStore.userProfile?.preferences || {}),
            backgroundImageId: backgroundId
        }
    })
}

const closeModal = () => {
    emit('close')
}

onMounted(async () => {
    await backgroundImagesStore.fetch()
    selectedBackgroundId.value = userStore.userProfile?.preferences?.backgroundImageId || null
})
</script>

<style scoped>
.modal-content {
    max-width: 800px;
}

.modal-header {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 100%;
}

.modal-header h2 {
    flex: 1;
    text-align: center;
    color: var(--color-primary);
    font-size: var(--font-size-32);
    margin: 0;
}

.close-button {
    position: absolute;
    right: 0;
    background: none;
    border: none;
    color: var(--color-gray-light);
    cursor: pointer;
    padding: var(--space-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-5);
    transition: color var(--duration-fast);
}

.close-button:hover {
    color: var(--color-white);
}

.close-icon {
    width: 24px;
    height: 24px;
}

.preferences-section {
    margin-bottom: var(--space-xl);
}

.preferences-section h3 {
    color: var(--color-white);
    font-size: var(--font-size-24);
    margin-bottom: var(--space-lg);
}

.background-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--space-lg);
}

.background-option {
    position: relative;
    cursor: pointer;
    border: 2px solid var(--color-gray-medium);
    border-radius: var(--radius-10);
    overflow: hidden;
    transition: all var(--duration-fast);
    background: var(--color-bg-primary);
    aspect-ratio: 16 / 9;
}

.background-option:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow-sm);
}

.background-option.selected {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-glow-gold-md);
}

.background-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.selected-indicator {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    background: var(--color-primary);
    color: var(--color-bg-primary);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: var(--font-size-14);
}

.default-badge {
    position: absolute;
    top: var(--space-sm);
    left: var(--space-sm);
    background: var(--color-gray-dark);
    color: var(--color-white);
    padding: 2px 8px;
    border-radius: var(--radius-3);
    font-size: var(--font-size-12);
    font-weight: bold;
}
</style>
