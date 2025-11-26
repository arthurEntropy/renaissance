<template>
    <div class="equipment-grade-manager">
        <div class="grade-list">
            <div v-for="(grade, index) in sortedGrades" :key="grade.id" class="grade-item" draggable="true"
                @dragstart="handleDragStart(index, $event)" @dragover.prevent="handleDragOver(index)"
                @drop="handleDrop(index)" @dragend="handleDragEnd" :class="{ 'dragging': draggedIndex === index }">

                <div class="drag-handle" title="Drag to reorder">☰</div>

                <input v-model="grade.name" @blur="updateGrade(grade)" class="grade-name-input"
                    placeholder="Grade Name" />

                <input v-model="grade.description" @blur="updateGrade(grade)" class="grade-description-input"
                    placeholder="Description" />

                <div class="index-display">{{ grade.index }}</div>

                <ActionButton variant="danger" size="small" text="Delete" @click="handleDeleteGrade(grade)" />
            </div>
        </div>
        <ActionButton variant="success" text="Add Grade" @click="handleAddGrade" />
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const equipmentGradesStore = useEquipmentGradesStore()

const grades = computed(() => equipmentGradesStore.items)

// Sort by index
const sortedGrades = computed(() => {
    return [...grades.value].sort((a, b) => a.index - b.index)
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

    // Create a plain copy of the sorted grades
    const items = sortedGrades.value.map(g => ({ ...g }))
    const draggedItem = { ...items[draggedIndex.value] }

    // Remove dragged item and insert at new position
    items.splice(draggedIndex.value, 1)
    items.splice(dropIndex, 0, draggedItem)

    // Update index for all items and batch the updates
    const updates = []
    for (let i = 0; i < items.length; i++) {
        const updated = { ...items[i], index: i }
        updates.push(equipmentGradesStore.update(updated))
    }

    // Wait for all updates to complete
    await Promise.all(updates)

    // Refresh the store to ensure UI is in sync
    await equipmentGradesStore.fetch()

    draggedIndex.value = null
    dragOverIndex.value = null
}

const handleDragEnd = () => {
    draggedIndex.value = null
    dragOverIndex.value = null
}

const handleAddGrade = async () => {
    const maxIndex = Math.max(...grades.value.map(g => g.index ?? 0), -1)
    await equipmentGradesStore.create({
        name: '',
        description: '',
        index: maxIndex + 1
    })
}

const updateGrade = async (grade) => {
    if (grade.name) {
        await equipmentGradesStore.update(grade)
    }
}

const handleDeleteGrade = async (grade) => {
    if (confirm(`Delete equipment grade "${grade.name}"?`)) {
        await equipmentGradesStore.remove(grade)
    }
}

onMounted(() => {
    equipmentGradesStore.fetch()
})
</script>

<style scoped>
.equipment-grade-manager {}

.grade-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.grade-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-gray-dark);
    padding: 1rem;
    border-radius: var(--radius-10);
    cursor: move;
    transition: all 0.2s;
}

.grade-item:hover {
    background: var(--color-gray-medium);
}

.grade-item.dragging {
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

.grade-name-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    width: 150px;
    flex-shrink: 0;
}

.grade-description-input {
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
