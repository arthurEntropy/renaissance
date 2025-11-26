<template>
    <div class="equipment-subtype-manager">

        <div v-for="type in types" :key="type.id" class="type-section">
            <h3>{{ type.name }}</h3>

            <div class="subtype-list">
                <div v-for="(subtype, index) in getSubtypesByType(type.id)" :key="subtype.id" class="subtype-item"
                    draggable="true" @dragstart="handleDragStart(type.id, index, $event)"
                    @dragover.prevent="handleDragOver(type.id, index)" @drop="handleDrop(type.id, index)"
                    @dragend="handleDragEnd" :class="{ 'dragging': isDragging(type.id, index) }">

                    <div class="drag-handle" title="Drag to reorder">☰</div>

                    <input v-model="subtype.name" @blur="updateSubtype(subtype)" class="subtype-name-input"
                        placeholder="Subtype Name" />

                    <input v-model="subtype.description" @blur="updateSubtype(subtype)"
                        class="subtype-description-input" placeholder="Description" />

                    <div class="index-display">{{ subtype.index }}</div>

                    <ActionButton variant="danger" size="small" text="Delete" @click="handleDeleteSubtype(subtype)" />
                </div>
            </div>

            <ActionButton variant="success" size="small" text="Add Subtype" @click="handleAddSubtype(type.id)" />
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()

const types = computed(() => equipmentTypesStore.items)

// Get subtypes for a specific type, sorted by index
const getSubtypesByType = (typeId) => {
    return equipmentSubtypesStore.getSubtypesByType(typeId)
}

// Drag and drop state
const draggedTypeId = ref(null)
const draggedIndex = ref(null)

const handleDragStart = (typeId, index, event) => {
    draggedTypeId.value = typeId
    draggedIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
}

const handleDragOver = (typeId) => {
    // Only allow drop within same type
    if (draggedTypeId.value !== typeId) {
        return
    }
}

const handleDrop = async (typeId, dropIndex) => {
    if (draggedTypeId.value !== typeId || draggedIndex.value === null || draggedIndex.value === dropIndex) {
        draggedTypeId.value = null
        draggedIndex.value = null
        return
    }

    // Create a plain copy of the subtypes for this type
    const items = getSubtypesByType(typeId).map(s => ({ ...s }))
    const draggedItem = { ...items[draggedIndex.value] }

    // Remove dragged item and insert at new position
    items.splice(draggedIndex.value, 1)
    items.splice(dropIndex, 0, draggedItem)

    // Update index for all items and batch the updates
    const updates = []
    for (let i = 0; i < items.length; i++) {
        const updated = { ...items[i], index: i }
        updates.push(equipmentSubtypesStore.update(updated))
    }

    // Wait for all updates to complete
    await Promise.all(updates)

    // Refresh the store to ensure UI is in sync
    await equipmentSubtypesStore.fetch()

    draggedTypeId.value = null
    draggedIndex.value = null
}

const handleDragEnd = () => {
    draggedTypeId.value = null
    draggedIndex.value = null
}

const isDragging = (typeId, index) => {
    return draggedTypeId.value === typeId && draggedIndex.value === index
}

const handleAddSubtype = async (typeId) => {
    const subtypes = getSubtypesByType(typeId)
    const maxIndex = Math.max(...subtypes.map(s => s.index ?? 0), -1)
    await equipmentSubtypesStore.create({
        name: '',
        description: '',
        typeId: typeId,
        index: maxIndex + 1
    })
}

const updateSubtype = async (subtype) => {
    if (subtype.name) {
        await equipmentSubtypesStore.update(subtype)
    }
}

const handleDeleteSubtype = async (subtype) => {
    if (confirm(`Delete equipment subtype "${subtype.name}"?`)) {
        await equipmentSubtypesStore.remove(subtype)
    }
}

onMounted(async () => {
    await equipmentTypesStore.fetch()
    await equipmentSubtypesStore.fetch()
})
</script>

<style scoped>
.equipment-subtype-manager {}

.type-section {
    margin-bottom: 2.5rem;
}

h3 {
    font-size: var(--font-size-24);
    margin-bottom: 1rem;
    color: var(--color-primary);
}

.subtype-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.subtype-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-gray-dark);
    padding: 0.75rem;
    border-radius: var(--radius-5);
    cursor: move;
    transition: all 0.2s;
}

.subtype-item:hover {
    background: var(--color-gray-medium);
}

.subtype-item.dragging {
    opacity: 0.5;
}

.drag-handle {
    color: var(--color-gray-light);
    font-size: var(--font-size-18);
    cursor: grab;
    padding: 0 0.5rem;
    user-select: none;
}

.drag-handle:active {
    cursor: grabbing;
}

.subtype-name-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    width: 120px;
    flex-shrink: 0;
}

.subtype-description-input {
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
