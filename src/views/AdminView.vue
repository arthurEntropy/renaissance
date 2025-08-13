<template>
    <div class="admin-page">
        <h1>Expansions</h1>
        <div class="expansion-list">
            <div v-for="expansion in expansions" :key="expansion.id" class="expansion-item">
                <input v-model="expansion.name" @blur="saveExpansion(expansion)" class="expansion-name-input"
                    placeholder="Expansion Name" />
                <input v-model="expansion.logoUrl" @blur="saveExpansion(expansion)" class="expansion-logo-input"
                    placeholder="Logo URL" />
                <img v-if="expansion.logoUrl" :src="expansion.logoUrl" class="expansion-logo-preview" />
                <button class="delete-button" @click="deleteExpansion(expansion)">Delete</button>
            </div>
        </div>
        <button class="add-button" @click="addExpansion">Add Expansion</button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ExpansionService from '@/services/ExpansionService'

const expansions = ref([])

const fetchExpansions = async () => {
    expansions.value = await ExpansionService.getAllExpansions()
}

const addExpansion = async () => {
    // Always create with a default name so the backend can generate a file
    await ExpansionService.createExpansion({ name: 'New Expansion', logoUrl: '' })
    await fetchExpansions()
}

const saveExpansion = async (expansion) => {
    await ExpansionService.saveExpansion(expansion)
    await fetchExpansions()
}

const deleteExpansion = async (expansion) => {
    await ExpansionService.deleteExpansion(expansion)
    await fetchExpansions()
}

onMounted(fetchExpansions)
</script>

<style scoped>
.admin-page {
    max-width: 700px;
    margin: 40px auto;
    padding: 30px;
    background: var(--color-bg-secondary);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
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
    border-radius: 8px;
}

.expansion-name-input,
.expansion-logo-input {
    font-size: 1.1rem;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    width: 180px;
}

.expansion-logo-preview {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 4px;
    background: var(--color-white);
    border: 1px solid var(--color-gray-medium);
}

.delete-button {
    background: var(--color-danger-hover);
    color: var(--color-white);
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 1rem;
    margin-left: auto;
    transition: background 0.2s;
}

.delete-button:hover {
    background: var(--color-danger);
}

.add-button {
    background: var(--color-success);
    color: var(--color-white);
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background 0.2s;
}

.add-button:hover {
    background: var(--color-success-hover);
}
</style>
