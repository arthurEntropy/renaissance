<template>
    <div class="equipment-type-manager">
        <div class="type-list">
            <div v-for="(type, index) in sortedTypes" :key="type.id" class="type-item" draggable="true"
                @dragstart="handleDragStart(index, $event)" @dragover.prevent="handleDragOver(index)"
                @drop="handleDrop(index)" @dragend="handleDragEnd" :class="{ 'dragging': draggedIndex === index }">

                <div class="drag-handle" title="Drag to reorder">☰</div>

                <input v-model="type.name" @blur="updateType(type)" class="type-name-input" placeholder="Type Name" />

                <input v-model="type.description" @blur="updateType(type)" class="type-description-input"
                    placeholder="Description" />

                <div class="index-display">{{ type.index }}</div>

                <ActionButton variant="danger" size="small" text="Delete" @click="handleDeleteType(type)" />
            </div>
        </div>
        <ActionButton variant="success" text="Add Type" @click="handleAddType" />
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const equipmentTypesStore = useEquipmentTypesStore()

const types = computed(() => equipmentTypesStore.items)

// Sort by index
const sortedTypes = computed(() => {
    return [...types.value].sort((a, b) => a.index - b.index)
})

// Drag and drop state
const draggedIndex = ref(null)
const dragOverIndex = ref(null)

const handleDragStart = (index, event) => {
    draggedIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
}

const handleDragOver = (index) => {
    dragOverIndex.value = index
}

const handleDrop = async (dropIndex) => {
    if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
        draggedIndex.value = null
        dragOverIndex.value = null
        return
    }

    // Create a plain copy of the sorted types
    const items = sortedTypes.value.map(t => ({ ...t }))
    const draggedItem = { ...items[draggedIndex.value] }

    // Remove dragged item and insert at new position
    items.splice(draggedIndex.value, 1)
    items.splice(dropIndex, 0, draggedItem)

    // Update index for all items and batch the updates
    const updates = []
    for (let i = 0; i < items.length; i++) {
        const updated = { ...items[i], index: i }
        updates.push(equipmentTypesStore.update(updated))
    }

    // Wait for all updates to complete
    await Promise.all(updates)

    // Refresh the store to ensure UI is in sync
    await equipmentTypesStore.fetch()

    draggedIndex.value = null
    dragOverIndex.value = null
}

const handleDragEnd = () => {
    draggedIndex.value = null
    dragOverIndex.value = null
}

const handleAddType = async () => {
    const maxIndex = Math.max(...types.value.map(t => t.index ?? 0), -1)
    await equipmentTypesStore.create({
        name: '',
        description: '',
        index: maxIndex + 1
    })
}

const updateType = async (type) => {
    if (type.name) {
        await equipmentTypesStore.update(type)
    }
}

const handleDeleteType = async (type) => {
    if (confirm(`Delete equipment type "${type.name}"?`)) {
        await equipmentTypesStore.remove(type)
    }
}

onMounted(() => {
    equipmentTypesStore.fetch()
})
</script>

<style scoped>
.equipment-type-manager {}

.type-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.type-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-gray-dark);
    padding: 1rem;
    border-radius: var(--radius-10);
    cursor: move;
    transition: all 0.2s;
}

.type-item:hover {
    background: var(--color-gray-medium);
}

.type-item.dragging {
    opacity: 0.5;
}

.drag-handle {
    color: var(--color-gray-light);
    font-size: var(--font-size-20);
    cursor: grab;
    padding: 0 0.5rem;
    user-select: none;
}

.drag-handle:active {
    cursor: grabbing;
}

.type-name-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    width: 150px;
    flex-shrink: 0;
}

.type-description-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    flex: 1;
    min-width: 0;
}

.index-display {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    min-width: 30px;
    text-align: center;
}
</style>
