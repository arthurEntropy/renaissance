<template>
    <div class="background-manager">
        <h2>Background Images</h2>
        <div class="background-list">
            <div v-for="(background, index) in sortedBackgrounds" :key="background.id" class="background-item"
                draggable="true" @dragstart="handleDragStart(index, $event)" @dragover.prevent="handleDragOver(index)"
                @drop="handleDrop(index)" @dragend="handleDragEnd" :class="{ 'dragging': draggedIndex === index }">

                <div class="drag-handle" title="Drag to reorder">☰</div>

                <input v-model="background.imageUrl" @blur="updateBackground(background)" class="background-url-input"
                    placeholder="Image URL" />

                <img v-if="background.imageUrl" :src="background.imageUrl" class="background-preview" />

                <label class="default-checkbox">
                    <input type="checkbox" :checked="background.isDefault" @change="handleSetDefault(background)" />
                    <span>Default</span>
                </label>

                <ActionButton variant="danger" size="small" text="Delete" @click="handleDeleteBackground(background)" />
            </div>
        </div>
        <ActionButton variant="success" text="Add Background" @click="handleAddBackground" />
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useBackgroundImagesStore } from '@/stores/backgroundImagesStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const backgroundImagesStore = useBackgroundImagesStore()

const backgroundImages = computed(() => backgroundImagesStore.backgroundImages)

// Sort by displayOrder, then by ID
const sortedBackgrounds = computed(() => {
    return [...backgroundImages.value].sort((a, b) => {
        const orderA = a.displayOrder ?? 999
        const orderB = b.displayOrder ?? 999
        if (orderA !== orderB) return orderA - orderB
        return (a.id || '').localeCompare(b.id || '')
    })
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

    // Create a plain copy of the sorted backgrounds
    const items = sortedBackgrounds.value.map(bg => ({ ...bg }))
    const draggedItem = { ...items[draggedIndex.value] }

    // Remove dragged item and insert at new position
    items.splice(draggedIndex.value, 1)
    items.splice(dropIndex, 0, draggedItem)

    // Update displayOrder for all items and batch the updates
    const updates = []
    for (let i = 0; i < items.length; i++) {
        const updated = { ...items[i], displayOrder: i }
        updates.push(backgroundImagesStore.update(updated))
    }

    // Wait for all updates to complete
    await Promise.all(updates)

    draggedIndex.value = null
    dragOverIndex.value = null
}

const handleDragEnd = () => {
    draggedIndex.value = null
    dragOverIndex.value = null
}

const handleAddBackground = async () => {
    const maxOrder = Math.max(...backgroundImages.value.map(b => b.displayOrder ?? 0), -1)
    await backgroundImagesStore.create({
        imageUrl: '',
        displayOrder: maxOrder + 1,
        isDefault: false
    })
}

const updateBackground = async (background) => {
    if (background.imageUrl) {
        await backgroundImagesStore.update(background)
    }
}

const handleSetDefault = async (background) => {
    // Unset default on all others
    for (const bg of backgroundImages.value) {
        if (bg.id !== background.id && bg.isDefault) {
            bg.isDefault = false
            await backgroundImagesStore.update(bg)
        }
    }

    // Set default on this one
    background.isDefault = true
    await backgroundImagesStore.update(background)
}

const handleDeleteBackground = async (background) => {
    if (confirm('Delete this background image?')) {
        await backgroundImagesStore.remove(background)
    }
}

onMounted(() => {
    backgroundImagesStore.fetch()
})
</script>

<style scoped>
.background-manager {
    margin-bottom: 3rem;
}

h2 {
    font-size: var(--font-size-32);
    margin-bottom: 1.5rem;
    color: var(--color-white);
}

.background-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.background-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-gray-dark);
    padding: 1rem;
    border-radius: var(--radius-10);
    cursor: move;
    transition: all 0.2s;
}

.background-item:hover {
    background: var(--color-gray-medium);
}

.background-item.dragging {
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

.background-url-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    flex: 1;
    min-width: 300px;
}

.background-preview {
    width: 120px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
}

.default-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-white);
    font-size: var(--font-size-14);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}

.default-checkbox input[type="checkbox"] {
    cursor: pointer;
}
</style>
