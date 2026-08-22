<template>
    <CollapsibleAdminSection :title="title">
        <!-- Grouped layout -->
        <template v-if="groupByStore">
            <div v-for="group in groups" :key="group.id" class="group-section">
                <h3 class="group-title">{{ group.name }}</h3>

                <draggable :list="getItemsByGroup(group.id)" item-key="id" handle=".drag-handle"
                    ghost-class="ghost-item" class="item-list" @end="() => handleDragEnd(group.id)">
                    <template #item="{ element: item }">
                        <div class="list-item">
                            <!-- Drag handle -->
                            <div class="drag-handle" title="Drag to reorder">☰</div>

                            <!-- Custom fields slot -->
                            <slot name="fields" :item="item" :update="() => updateItem(item)">
                                <!-- Default: single text input -->
                                <input v-model="item.name" @blur="updateItem(item)" class="default-input"
                                    placeholder="Name" />
                            </slot>

                            <!-- Delete button -->
                            <ActionButton variant="danger" size="small" text="Delete" @click="handleDelete(item)" />
                        </div>
                    </template>
                </draggable>

                <!-- Add button for this group -->
                <ActionButton variant="success" size="small" :text="`Add ${itemName}`" @click="handleAdd(group.id)" />
            </div>
        </template>

        <!-- Non-grouped layout -->
        <template v-else>
            <draggable :list="sortedItems" item-key="id" handle=".drag-handle" ghost-class="ghost-item"
                class="item-list" @end="() => handleDragEnd(null)">
                <template #item="{ element: item }">
                    <div class="list-item">
                        <!-- Drag handle -->
                        <div class="drag-handle" title="Drag to reorder">☰</div>

                        <!-- Custom fields slot -->
                        <slot name="fields" :item="item" :update="() => updateItem(item)">
                            <!-- Default: single text input -->
                            <input v-model="item.name" @blur="updateItem(item)" class="default-input"
                                placeholder="Name" />
                        </slot>

                        <!-- Delete button -->
                        <ActionButton variant="danger" size="small" text="Delete" @click="handleDelete(item)" />
                    </div>
                </template>
            </draggable>

            <!-- Add button -->
            <ActionButton variant="success" :text="`Add ${itemName}`" @click="handleAdd()" />
        </template>
    </CollapsibleAdminSection>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import CollapsibleAdminSection from './CollapsibleAdminSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import draggable from 'vuedraggable'

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

const items = computed(() => props.store.items || [])

const groups = computed(() => {
    if (!props.groupByStore) return []
    return props.groupByStore.items || []
})

const getItemsByGroup = (groupId) => {
    return items.value.filter(item => item[props.groupByKey] === groupId).sort((a, b) => {
        const aVal = a.index ?? 999
        const bVal = b.index ?? 999
        return aVal - bVal
    })
}

const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => {
        const aVal = a.index ?? 999
        const bVal = b.index ?? 999
        return aVal - bVal
    })
})

const handleDragEnd = async (groupId) => {
    // Get the current list (either grouped or all items)
    const currentList = groupId !== null ? getItemsByGroup(groupId) : sortedItems.value

    // Update index for all items in the list
    const updates = []
    for (let i = 0; i < currentList.length; i++) {
        const item = currentList[i]
        if (item.index !== i) {
            // Find the actual item in the store and update it
            const storeItem = items.value.find(it => it.id === item.id)
            if (storeItem) {
                updates.push(props.store.update({ ...storeItem, index: i }))
            }
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates)
        await props.store.fetch()
    }
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
    const { confirm } = useConfirm()
    if (await confirm(props.deleteConfirmMessage(item))) {
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
    transition: all var(--duration-fast);
    cursor: move;
}

.list-item:hover {
    background: var(--color-gray-medium);
}

.ghost-item {
    opacity: 0.4;
    background: var(--color-primary);
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
