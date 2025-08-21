<template>
    <div class="expansion-manager">
        <h2>Expansions</h2>
        <div class="expansion-list">
            <div v-for="expansion in expansions" :key="expansion.id" class="expansion-item">
                <input v-model="expansion.name" @blur="updateExpansion(expansion.name, expansion)"
                    class="expansion-name-input" placeholder="Expansion Name" />
                <input v-model="expansion.logoUrl" @blur="updateExpansion(expansion.name, expansion)"
                    class="expansion-logo-input" placeholder="Logo URL" />
                <img v-if="expansion.logoUrl" :src="expansion.logoUrl" class="expansion-logo-preview" />
                <ActionButton variant="danger" size="small" text="Delete" @click="handleDeleteExpansion(expansion)" />
            </div>
        </div>
        <ActionButton variant="success" text="Add Expansion" @click="handleAddExpansion" />
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useExpansionsStore } from '@/stores/expansionsStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const expansionsStore = useExpansionsStore()

const expansions = computed(() => expansionsStore.expansions)

const handleAddExpansion = async () => {
    await expansionsStore.addExpansion({ name: '', logoUrl: '' })
}

const updateExpansion = async (name, expansion) => {
    await expansionsStore.updateExpansion(name, expansion)
}

const handleDeleteExpansion = async (expansion) => {
    await expansionsStore.deleteExpansion(expansion.name)
}

onMounted(() => {
    expansionsStore.fetch()
})
</script>

<style scoped>
.expansion-manager {
    margin-bottom: 3rem;
}

h2 {
    font-size: var(--font-size-32);
    margin-bottom: 1.5rem;
    color: var(--color-white);
}

.expansion-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.expansion-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-gray-dark);
    padding: 1rem;
    border-radius: var(--radius-10);
}

.expansion-name-input,
.expansion-logo-input {
    font-size: var(--font-size-18);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    width: 180px;
}

.expansion-logo-preview {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: var(--radius-5);
    background: var(--color-white);
    border: 1px solid var(--color-gray-medium);
}
</style>
