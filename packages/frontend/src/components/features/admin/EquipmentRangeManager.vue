<template>
    <div class="equipment-range-manager">
        <div class="range-list">
            <div v-for="(range, index) in sortedRanges" :key="range.id" class="range-item" draggable="true"
                @dragstart="handleDragStart(index, $event)" @dragover.prevent="handleDragOver(index)"
                @drop="handleDrop(index)" @dragend="handleDragEnd" :class="{ 'dragging': draggedIndex === index }">

                <div class="drag-handle" title="Drag to reorder">☰</div>

                <input v-model="range.name" @blur="updateRange(range)" class="range-name-input"
                    placeholder="Range Name" />

                <input v-model="range.distance" @blur="updateRange(range)" class="range-distance-input"
                    placeholder="Distance" />

                <div class="index-display">{{ range.index }}</div>

                <ActionButton variant="danger" size="small" text="Delete" @click="handleDeleteRange(range)" />
            </div>
        </div>
        <ActionButton variant="success" text="Add Range" @click="handleAddRange" />
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const equipmentRangesStore = useEquipmentRangesStore()

const ranges = computed(() => equipmentRangesStore.items)

// Sort by index
const sortedRanges = computed(() => {
    return [...ranges.value].sort((a, b) => a.index - b.index)
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

    // Create a plain copy of the sorted ranges
    const items = sortedRanges.value.map(r => ({ ...r }))
    const draggedItem = { ...items[draggedIndex.value] }

    // Remove dragged item and insert at new position
    items.splice(draggedIndex.value, 1)
    items.splice(dropIndex, 0, draggedItem)

    // Update index for all items and batch the updates
    const updates = []
    for (let i = 0; i < items.length; i++) {
        const updated = { ...items[i], index: i }
        updates.push(equipmentRangesStore.update(updated))
    }

    // Wait for all updates to complete
    await Promise.all(updates)

    // Refresh the store to ensure UI is in sync
    await equipmentRangesStore.fetch()

    draggedIndex.value = null
    dragOverIndex.value = null
}

const handleDragEnd = () => {
    draggedIndex.value = null
    dragOverIndex.value = null
}

const handleAddRange = async () => {
    const maxIndex = Math.max(...ranges.value.map(r => r.index ?? 0), -1)
    await equipmentRangesStore.create({
        name: '',
        distance: '',
        index: maxIndex + 1
    })
}

const updateRange = async (range) => {
    if (range.name) {
        await equipmentRangesStore.update(range)
    }
}

const handleDeleteRange = async (range) => {
    if (confirm(`Delete equipment range "${range.name}"?`)) {
        await equipmentRangesStore.remove(range)
    }
}

onMounted(() => {
    equipmentRangesStore.fetch()
})
</script>

<style scoped>
.equipment-range-manager {}

.range-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.range-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-gray-dark);
    padding: 1rem;
    border-radius: var(--radius-10);
    cursor: move;
    transition: all 0.2s;
}

.range-item:hover {
    background: var(--color-gray-medium);
}

.range-item.dragging {
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

.range-name-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    width: 150px;
    flex-shrink: 0;
}

.range-distance-input {
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
