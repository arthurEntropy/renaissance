<template>
    <div class="modal-overlay preferences-modal-overlay" @click.self="closeModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Preferences</h2>
                <button class="close-button" @click="closeModal">×</button>
            </div>

            <div class="preferences-section">
                <h3>Background Image</h3>
                <div class="background-options">
                    <!-- Show all backgrounds in order, first one is default -->
                    <div v-for="(background, index) in sortedBackgrounds" :key="background.id" class="background-option"
                        :class="{ selected: selectedBackgroundId === background.id || (selectedBackgroundId === null && index === 0) }"
                        @click="selectBackground(background.id)">
                        <img :src="background.imageUrl" :alt="`Background`" class="background-thumbnail" />
                        <div v-if="index === 0" class="default-badge">Default</div>
                        <div v-if="selectedBackgroundId === background.id || (selectedBackgroundId === null && index === 0)"
                            class="selected-indicator">✓</div>
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

const emit = defineEmits(['close'])

const backgroundImagesStore = useBackgroundImagesStore()
const userStore = useUserStore()

const selectedBackgroundId = ref(null)

// Sort backgrounds by index
const sortedBackgrounds = computed(() => {
    return [...backgroundImagesStore.items].sort((a, b) => {
        const orderA = a.index ?? 999
        const orderB = b.index ?? 999
        if (orderA !== orderB) return orderA - orderB
        return (a.id || '').localeCompare(b.id || '')
    })
})

const selectBackground = async (backgroundId) => {
    selectedBackgroundId.value = backgroundId
    try {
        await userStore.update({
            preferences: {
                ...(userStore.userProfile?.preferences || {}),
                backgroundImageId: backgroundId
            }
        })
    } catch (error) {
        console.error('Error updating background preference:', error)
        alert('Failed to update background preference. Please try again.')
    }
}

const closeModal = () => {
    emit('close')
}

onMounted(async () => {
    await backgroundImagesStore.fetch()
    selectedBackgroundId.value = userStore.userProfile?.preferences?.backgroundImageId || null
})
</script>

<style>
/* Override modal-content max-width for preferences modal only */
.preferences-modal-overlay .modal-content {
    max-width: 800px;
}

/* Modal header customization for preferences */
.preferences-modal-overlay .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preferences-modal-overlay .modal-header h2 {
    color: var(--color-primary);
    font-size: var(--font-size-32);
    margin: 0;
}
</style>

<style scoped>
.close-button {
    background: none;
    border: none;
    color: var(--color-white);
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-5);
    transition: background-color var(--duration-fast);
}

.close-button:hover {
    background-color: var(--overlay-black-medium);
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
