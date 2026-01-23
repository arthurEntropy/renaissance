<template>
    <div class="user-settings-section">
        <h3 class="section-title">Personal Settings</h3>

        <div class="setting-item">
            <label class="setting-label">
                <input type="checkbox" :checked="showArtwork" @change="toggleArtwork" class="setting-checkbox" />
                <span class="setting-text">Show artwork on ability cards</span>
            </label>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const showArtwork = computed(() => {
    return userStore.userProfile?.preferences?.showArtwork ?? true
})

const toggleArtwork = async () => {
    if (!userStore.userProfile) return

    const updatedUser = {
        ...userStore.userProfile,
        preferences: {
            ...userStore.userProfile.preferences,
            showArtwork: !showArtwork.value
        }
    }

    await userStore.update(updatedUser)
}
</script>

<style scoped>
.user-settings-section {
    background: var(--color-bg-primary);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
    margin-bottom: var(--space-xl);
}

.section-title {
    margin: 0 0 var(--space-md) 0;
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}

.setting-item {
    padding: var(--space-md) 0;
}

.setting-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: var(--space-sm);
}

.setting-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.setting-text {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
}
</style>
