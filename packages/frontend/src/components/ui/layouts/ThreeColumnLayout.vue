<template>
    <div class="three-column-layout" :class="{ 'is-dragging': isDragging }">
        <div v-for="(_, colIndex) in columns" :key="colIndex" class="column">
            <draggable v-model="columns[colIndex]" :group="{ name: groupId, pull: true, put: true }" :item-key="itemKey"
                :disabled="!isDraggable" @start="onDragStart" @end="onDragEnd" @add="onDragEnd" @remove="onDragRemove"
                class="column-drop-zone" :class="{ 'drag-enabled': isDraggable }">
                <template #item="{ element }">
                    <div class="column-item">
                        <slot :item="element" />
                    </div>
                </template>
            </draggable>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { useCardPreview } from '@/composables/useCardPreview'

const props = defineProps({
    items: {
        type: Array,
        required: true
    },
    isDraggable: {
        type: Boolean,
        default: false
    },
    itemKey: {
        type: String,
        default: 'id'
    },
    groupId: {
        type: String,
        default: 'items'
    }
})

const emit = defineEmits(['reorder'])

const { setDragging } = useCardPreview()

// Three writable column arrays for vuedraggable
const columns = ref([[], [], []])

const isDragging = ref(false)

// Fully rebuild columns from items array using columnIndex (or idx % 3 fallback).
function distributeItems(items, isDraggable) {
    const cols = [[], [], []]
    items.forEach((item, idx) => {
        const colIdx = isDraggable && typeof item.columnIndex === 'number'
            ? item.columnIndex % 3
            : idx % 3
        cols[colIdx].push(item)
    })
    columns.value = cols
}

// Update item data within existing column slots without reshuffling.
// Called after a drag save is echoed back through props — item IDs and column
// positions are already correct, but data properties (e.g. collapsed) may
// have been updated by the save round-trip.
function refreshItemData(items) {
    const itemMap = new Map(items.map(i => [i[props.itemKey], i]))
    for (let c = 0; c < 3; c++) {
        columns.value[c] = columns.value[c].map(colItem => itemMap.get(colItem[props.itemKey]) ?? colItem)
    }
}

// When drag mode toggles, always redistribute from scratch.
watch(
    () => props.isDraggable,
    (val) => {
        if (!isDragging.value) {
            distributeItems(props.items, val)
        }
    }
)

// When items change:
//  - If still dragging → ignore (vuedraggable owns the state)
//  - If items were added or removed, or we are in sort mode → full redistribute
//  - Otherwise (same IDs, drag mode) → just refresh item data in place so we
//    don't reshuffle a drag result that was just saved to the parent
watch(
    () => props.items,
    (items) => {
        if (isDragging.value) return

        const currentIds = new Set(columns.value.flat().map(i => i[props.itemKey]))
        const newIds = new Set(items.map(i => i[props.itemKey]))
        const structureChanged =
            currentIds.size !== newIds.size ||
            [...newIds].some(id => !currentIds.has(id)) ||
            [...currentIds].some(id => !newIds.has(id))

        if (structureChanged || !props.isDraggable) {
            distributeItems(items, props.isDraggable)
        } else {
            refreshItemData(items)
        }
    },
    { immediate: true }
)

// Captured at drag start to detect no-op drops in onDragEnd.
let preDragSnapshot = null
// Set when an item leaves this layout (cross-group drag). In that case @add on
// the target layout handles persistence, so @end on the source should not emit.
let itemWasRemoved = false

function onDragStart() {
    isDragging.value = true
    setDragging(true)
    preDragSnapshot = columns.value.flatMap((col, c) => col.map(item => `${item[props.itemKey]}:${c}`))
}

function onDragRemove() {
    itemWasRemoved = true
}

function onDragEnd() {
    isDragging.value = false
    setDragging(false)
    if (itemWasRemoved) {
        // The receiving layout's @add already fired onDragEnd and will emit the
        // updated items — suppress the duplicate emit from the source layout.
        itemWasRemoved = false
        return
    }
    // Emit a flat array: all col-0 items first, then col-1, then col-2.
    // Within-column order is preserved exactly as vuedraggable left it.
    // columnIndex on each emitted item reflects the column it now belongs to.
    const newItems = []
    for (let c = 0; c < 3; c++) {
        for (const item of columns.value[c]) {
            newItems.push({ ...item, columnIndex: c })
        }
    }
    // Skip the emit if nothing actually moved (dropped back in the same position)
    const newSnapshot = newItems.map(i => `${i[props.itemKey]}:${i.columnIndex}`)
    if (preDragSnapshot && preDragSnapshot.join(',') === newSnapshot.join(',')) return
    emit('reorder', newItems)
}
</script>

<style scoped>
.three-column-layout {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-lg);
    align-items: start;
}

.column {
    display: flex;
    flex-direction: column;
}

.column-drop-zone {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    min-height: 48px;
}

.column-drop-zone.drag-enabled {
    border-radius: var(--radius-5);
    transition: background-color var(--transition-fast);
}

/* Empty column drop target — only visible when a drag is actively in progress */
.three-column-layout.is-dragging .column-drop-zone:empty {
    background: var(--color-bg-tertiary);
    border: 1px dashed var(--color-border-secondary);
    min-height: 60px;
}

/* Always leave a droppable zone below the last card in every column while dragging */
.three-column-layout.is-dragging .column-drop-zone {
    padding-bottom: 60px;
}

.column-item {
    position: relative;
}

:deep(.sortable-ghost) {
    opacity: 0.35;
    border-radius: var(--radius-10);
}

:deep(.sortable-chosen) {
    cursor: grabbing;
}
</style>
