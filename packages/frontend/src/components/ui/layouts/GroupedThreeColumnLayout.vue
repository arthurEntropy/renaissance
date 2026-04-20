<template>
    <div class="grouped-three-column-layout">
        <div v-for="group in groupedItems" :key="group.id ?? group.name" class="group-section">
            <h3 class="group-header" @click="toggleGroup(group.id ?? group.name)">
                <ChevronRightIcon v-if="isGroupCollapsed(group)" class="chevron-icon" />
                <ChevronDownIcon v-else class="chevron-icon" />

                <!-- Inline rename for custom groups -->
                <input v-if="customGroupMode && editingGroupId === (group.id ?? group.name) && !group.isUngrouped"
                    v-model="editingGroupName" class="group-name-input" @blur="commitRename(group)"
                    @keydown.enter="commitRename(group)" @keydown.escape="cancelRename" @click.stop
                    :ref="el => { if (el) renameInput = el }" />

                <span v-else class="group-name"
                    @dblclick.stop="customGroupMode && !group.isUngrouped ? startRename(group) : null">
                    {{ group.name }}
                    <span class="group-count">({{ group.items.length }})</span>
                </span>

                <!-- Custom-group controls (rename / delete) -->
                <template v-if="customGroupMode && !group.isUngrouped && editingGroupId !== (group.id ?? group.name)">
                    <button class="group-action-btn" title="Rename group" aria-label="Rename group"
                        @click.stop="startRename(group)">
                        <PencilIcon class="group-action-icon" />
                    </button>
                    <button class="group-action-btn group-action-btn--danger" title="Delete group"
                        aria-label="Delete group" @click.stop="emit('delete-group', group.id)">
                        <XMarkIcon class="group-action-icon" />
                    </button>
                </template>
            </h3>

            <div v-if="!isGroupCollapsed(group)" class="group-content">
                <!-- In custom mode all groups share a single SortableJS group so cards can cross boundaries -->
                <ThreeColumnLayout :items="strippedGroupItems.get(group.id ?? group.name)" :is-draggable="draggable"
                    :group-id="customGroupMode ? customGroupId : String(group.id ?? group.name)"
                    @reorder="(newItems) => emit('reorder-group', group.id, newItems)">
                    <template #default="slotProps">
                        <slot v-bind="slotProps" />
                    </template>
                </ThreeColumnLayout>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import ThreeColumnLayout from './ThreeColumnLayout.vue'

const props = defineProps({
    groupedItems: {
        type: Array,
        required: true
    },
    draggable: {
        type: Boolean,
        default: false
    },
    // When true, renders rename/delete controls and enables cross-group drag
    customGroupMode: {
        type: Boolean,
        default: false
    },
    // Scopes cross-group drag to this table only; must be unique per table
    customGroupId: {
        type: String,
        default: 'custom-group'
    }
})

const emit = defineEmits(['reorder-group', 'rename-group', 'delete-group'])

const collapsedGroupKeys = ref(new Set())
const editingGroupId = ref(null)
const editingGroupName = ref('')
const renameInput = ref(null)

function isGroupCollapsed(group) {
    return collapsedGroupKeys.value.has(group.id ?? group.name)
}

function toggleGroup(key) {
    const next = new Set(collapsedGroupKeys.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    collapsedGroupKeys.value = next
}

function startRename(group) {
    editingGroupId.value = group.id ?? group.name
    editingGroupName.value = group.name
    nextTick(() => renameInput.value?.focus())
}

function commitRename(group) {
    const trimmed = editingGroupName.value.trim()
    if (trimmed && trimmed !== group.name) {
        emit('rename-group', group.id, trimmed)
    }
    cancelRename()
}

function cancelRename() {
    editingGroupId.value = null
    editingGroupName.value = ''
}

// Precompute stripped items per group to avoid creating new arrays on every render.
// ThreeColumnLayout distributes items by position (round-robin) within each group
// rather than using the global column assignment from the parent.
const strippedGroupItems = computed(() =>
    new Map(
        props.groupedItems.map(group => [
            group.id ?? group.name,
            group.items.map(({ columnIndex: _ignored, ...rest }) => rest)
        ])
    )
)
</script>

<style scoped>
.grouped-three-column-layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xl);
}

.group-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding-bottom: var(--space-lg);
}

.group-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    margin: 0;
    padding-bottom: var(--space-sm);
    border-bottom: 2px solid var(--color-border-secondary);
    user-select: none;
    cursor: pointer;
    text-align: left;
    transition: var(--transition-color);
}

.group-header:hover {
    color: var(--color-primary-hover);
}

.chevron-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.group-name {
    flex: 1;
}

.group-count {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
}

.group-name-input {
    flex: 1;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    padding: 0 var(--space-xs);
    outline: none;
}

.group-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: var(--space-xs);
    border-radius: var(--radius-5);
    color: var(--color-text-secondary);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--transition-fast), color var(--transition-fast);
}

.group-header:hover .group-action-btn {
    opacity: 1;
}

.group-action-btn:hover {
    color: var(--color-text-primary);
}

.group-action-btn--danger:hover {
    color: var(--color-danger);
}

.group-action-icon {
    width: 16px;
    height: 16px;
}

.group-content {
    width: 100%;
}
</style>
