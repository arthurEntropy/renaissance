<template>
    <div class="engagement-success-manager">
        <div class="success-list">
            <div v-for="success in sortedSuccesses" :key="success.id" class="success-item">
                <div class="success-header">
                    <input v-model="success.name" @blur="updateSuccess(success)" class="success-name-input"
                        placeholder="Success Name" />
                    <ActionButton variant="danger" size="small" text="Delete" @click="handleDeleteSuccess(success)" />
                </div>

                <textarea v-model="success.description" @blur="updateSuccess(success)" class="success-description-input"
                    placeholder="Description" rows="3" />
            </div>
        </div>
        <ActionButton variant="success" text="Add Success" @click="handleAddSuccess" />
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useEngagementSuccessesStore } from '@/stores/engagementSuccessesStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const engagementSuccessesStore = useEngagementSuccessesStore()

const successes = computed(() => engagementSuccessesStore.items)

// Sort alphabetically by name
const sortedSuccesses = computed(() => {
    return [...successes.value].sort((a, b) => a.name.localeCompare(b.name))
})

const handleAddSuccess = async () => {
    await engagementSuccessesStore.create({
        name: '',
        description: ''
    })
}

const updateSuccess = async (success) => {
    if (success.name) {
        await engagementSuccessesStore.update(success)
    }
}

const handleDeleteSuccess = async (success) => {
    if (confirm(`Delete engagement success "${success.name}"?`)) {
        await engagementSuccessesStore.remove(success)
    }
}

onMounted(() => {
    engagementSuccessesStore.fetch()
})
</script>

<style scoped>
.success-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.success-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: var(--color-gray-dark);
    padding: 1rem;
    border-radius: var(--radius-10);
    transition: all 0.2s;
}

.success-item:hover {
    background: var(--color-gray-medium);
}

.success-header {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.success-name-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    flex: 1;
    min-width: 0;
}

.success-description-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    width: 100%;
    resize: vertical;
    font-family: var(--font-family-primary);
    line-height: 1.5;
}
</style>
