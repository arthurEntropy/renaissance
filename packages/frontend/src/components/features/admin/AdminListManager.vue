<template>
    <CollapsibleAdminSection :title="title">
        <!-- Grouped layout -->
        <template v-if="groupByStore">
            <div v-for="group in groups" :key="group.id" class="group-section">
                <h3 class="group-title">{{ group.name }}</h3>

                <div class="item-list">
                    <div v-for="(item, index) in getItemsByGroup(group.id)" :key="item.id" class="list-item"
                        draggable="true" @dragstart="handleDragStart(group.id, index, $event)"
                        @dragover.prevent="handleDragOver(group.id, index)" @drop="handleDrop(group.id, index)"
                        @dragend="handleDragEnd" :class="{ 'dragging': isDragging(group.id, index), 'sortable': true }">

                        <!-- Drag handle -->
                        <div class="drag-handle" title="Drag to reorder">☰</div>

                        <!-- Custom fields slot -->
                        <slot name="fields" :item="item" :update="() => updateItem(item)">
                            <!-- Default: single text input -->
                            <input v-model="item.name" @blur="updateItem(item)" class="default-input"
                                placeholder="Name" />
                        </slot>

                        <!-- Index display -->
                        <div class="index-display">{{ item.index }}</div>

                        <!-- Delete button -->
                        <ActionButton variant="danger" size="small" text="Delete" @click="handleDelete(item)" />
                    </div>
                </div>

                <!-- Add button for this group -->
                <ActionButton variant="success" size="small" :text="`Add ${itemName}`" @click="handleAdd(group.id)" />
            </div>
        </template>

        <!-- Non-grouped layout -->
        <template v-else>
            <div class="item-list">
                <div v-for="(item, index) in sortedItems" :key="item.id" class="list-item" draggable="true"
                    @dragstart="handleDragStart(null, index, $event)" @dragover.prevent="handleDragOver(null, index)"
                    @drop="handleDrop(null, index)" @dragend="handleDragEnd"
                    :class="{ 'dragging': isDragging(null, index), 'sortable': true }">

                    <!-- Drag handle -->
                    <div class="drag-handle" title="Drag to reorder">☰</div>

                    <!-- Custom fields slot -->
                    <slot name="fields" :item="item" :update="() => updateItem(item)">
                        <!-- Default: single text input -->
                        <input v-model="item.name" @blur="updateItem(item)" class="default-input" placeholder="Name" />
                    </slot>

                    <!-- Index display -->
                    <div class="index-display">{{ item.index }}</div>

                    <!-- Delete button -->
                    <ActionButton variant="danger" size="small" text="Delete" @click="handleDelete(item)" />
                </div>
            </div>

            <!-- Add button -->
            <ActionButton variant="success" :text="`Add ${itemName}`" @click="handleAdd()" />
        </template>
    </CollapsibleAdminSection>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import CollapsibleAdminSection from './CollapsibleAdminSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    store: {
        type: Object,
        required: true
    },
    defaultItem: {
        type: Object,
        default: () => ({ name: '' })
    },
    // Grouping props
    groupByStore: {
        type: Object,
        default: null
    },
    groupByKey: {
        type: String,
        default: null
    },
    deleteConfirmMessage: {
        type: Function,
        default: (item) => `Delete "${item.name}"?`
    }
})

// Get items from store
const items = computed(() => props.store.items || [])

// Get groups if grouping is enabled
const groups = computed(() => {
    if (!props.groupByStore) return []
    return props.groupByStore.items || []
})

// Get items by group (for grouped layout)
const getItemsByGroup = (groupId) => {
    const groupItems = items.value.filter(item => item[props.groupByKey] === groupId)
    return groupItems.sort((a, b) => {
        const aVal = a.index ?? 999
        const bVal = b.index ?? 999
        return aVal - bVal
    })
}

// Sort items (for non-grouped layout)
const sortedItems = computed(() => {
    const itemsCopy = [...items.value]
    return itemsCopy.sort((a, b) => {
        const aVal = a.index ?? 999
        const bVal = b.index ?? 999
        return aVal - bVal
    })
})

// Drag and drop state
const draggedGroupId = ref(null)
const draggedIndex = ref(null)

const handleDragStart = (groupId, index, event) => {
    draggedGroupId.value = groupId
    draggedIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
}

const handleDragOver = (groupId, _index) => {
    // Only allow drop within same group (if grouped)
    if (props.groupByStore && draggedGroupId.value !== groupId) {
        return
    }
}

const handleDrop = async (groupId, dropIndex) => {
    if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
        draggedGroupId.value = null
        draggedIndex.value = null
        return
    }

    // Check group restriction for grouped layouts
    if (props.groupByStore && draggedGroupId.value !== groupId) {
        draggedGroupId.value = null
        draggedIndex.value = null
        return
    }

    // Get the appropriate item list
    const itemsList = props.groupByStore ? getItemsByGroup(groupId) : sortedItems.value
    const itemsCopy = itemsList.map(item => ({ ...item }))
    const draggedItem = { ...itemsCopy[draggedIndex.value] }

    // Remove and reinsert
    itemsCopy.splice(draggedIndex.value, 1)
    itemsCopy.splice(dropIndex, 0, draggedItem)

    // Update index for all items
    const updates = []
    for (let i = 0; i < itemsCopy.length; i++) {
        const updated = { ...itemsCopy[i], index: i }
        updates.push(props.store.update(updated))
    }

    await Promise.all(updates)
    await props.store.fetch()

    draggedGroupId.value = null
    draggedIndex.value = null
}

const handleDragEnd = () => {
    draggedGroupId.value = null
    draggedIndex.value = null
}

const isDragging = (groupId, index) => {
    return draggedGroupId.value === groupId && draggedIndex.value === index
}

// CRUD operations
const handleAdd = async (groupId = null) => {
    const newItem = { ...props.defaultItem }

    // If grouped, add the group key
    if (props.groupByStore && groupId !== null) {
        newItem[props.groupByKey] = groupId

        // Calculate max index within this group
        const groupItems = getItemsByGroup(groupId)
        const maxIndex = Math.max(...groupItems.map(item => item.index ?? 0), -1)
        newItem.index = maxIndex + 1
    } else {
        // Calculate max index across all items
        const maxIndex = Math.max(...items.value.map(item => item.index ?? 0), -1)
        newItem.index = maxIndex + 1
    }

    await props.store.create(newItem)
}

const updateItem = async (item) => {
    if (item.name || !props.defaultItem.name) { // Allow update if no name validation needed
        await props.store.update(item)
    }
}

const handleDelete = async (item) => {
    if (confirm(props.deleteConfirmMessage(item))) {
        await props.store.remove(item)
    }
}

// Lifecycle
onMounted(async () => {
    if (props.groupByStore) {
        await props.groupByStore.fetch()
    }
    await props.store.fetch()
})
</script>

<style scoped>
.item-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.list-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-gray-dark);
    padding: 1rem;
    border-radius: var(--radius-10);
    transition: all 0.2s;
}

.list-item.sortable {
    cursor: move;
}

.list-item:hover {
    background: var(--color-gray-medium);
}

.list-item.dragging {
    opacity: 0.5;
}

.drag-handle {
    color: var(--color-gray-light);
    font-size: var(--font-size-20);
    cursor: grab;
    padding: 0 0.5rem;
    user-select: none;
    flex-shrink: 0;
}

.drag-handle:active {
    cursor: grabbing;
}

.index-display {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    min-width: 30px;
    text-align: center;
    flex-shrink: 0;
}

.default-input {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
    flex: 1;
    min-width: 0;
}

.default-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.group-section {
    margin-bottom: 2.5rem;
}

.group-title {
    font-size: var(--font-size-24);
    margin-bottom: 1rem;
    color: var(--color-primary);
}

/* Common field input styles for slotted content */
:deep(.field-input),
:deep(.url-input),
:deep(.name-input),
:deep(.logo-input) {
    font-size: var(--font-size-14);
    padding: 6px 10px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-secondary);
    color: var(--color-white);
}

:deep(.field-input) {
    width: 150px;
    flex-shrink: 0;
}

:deep(.field-input.flex-1),
:deep(.url-input),
:deep(.name-input),
:deep(.logo-input) {
    flex: 1;
    width: auto;
    min-width: 0;
}

:deep(.preview) {
    width: 120px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
}

:deep(.logo-preview) {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: var(--radius-5);
    background: var(--color-white);
    border: 1px solid var(--color-gray-medium);
}
</style>
