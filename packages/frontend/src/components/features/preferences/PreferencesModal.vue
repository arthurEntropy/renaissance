<template>
    <BaseModal title="Preferences" width="min(800px, 90vw)" @close="closeModal">
        <div class="preferences-section">
            <h3>BACKGROUND IMAGE</h3>
            <div class="background-options">
                <div v-for="(background, index) in sortedBackgrounds" :key="background.id" class="background-option"
                    :class="{ selected: isSelected(background.id, index) }" @click="selectBackground(background.id)">
                    <img :src="background.imageUrl" :alt="`Background`" class="background-thumbnail" />
                    <div v-if="index === 0" class="default-badge">Default</div>
                    <div v-if="isSelected(background.id, index)" class="selected-indicator">✓</div>
                </div>
            </div>
        </div>
    </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { BACKGROUND_IMAGES } from '@/constants/backgroundImages'
import BaseModal from '@/components/ui/modals/BaseModal.vue'

const emit = defineEmits(['close'])

const userStore = useUserStore()

const selectedBackgroundId = ref(null)

const sortedBackgrounds = computed(() => BACKGROUND_IMAGES)

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
    selectedBackgroundId.value = userStore.userProfile?.preferences?.backgroundImageId || null
})
</script>

<style scoped>
.preferences-section {
    margin-bottom: var(--space-xl);
}

.preferences-section h3 {
    color: var(--color-text-secondary);
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-semibold);
    margin: var(--space-lg) 0 var(--space-lg) 0;
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
    box-shadow: var(--glow-sm);
}

.background-option.selected {
    border-color: var(--color-primary);
    box-shadow: var(--glow-gold-lg);
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
    border-radius: var(--radius-5);
    font-size: var(--font-size-12);
    font-weight: bold;
}
</style>
