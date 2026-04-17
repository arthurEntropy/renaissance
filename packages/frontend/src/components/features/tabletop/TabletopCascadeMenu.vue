<template>
    <div class="cascade-menu" @mousedown.stop @wheel.stop @mouseleave="startCloseMenu" @mouseenter="cancelCloseMenu">

        <!-- Col 0: Category -->
        <div class="cascade-col cascade-col--category">
            <div class="cascade-item-wrap" :class="{ active: pickerCategory === 'ability' }"
                @mouseenter="onHoverCategory('ability')">
                <button class="cascade-btn cascade-btn--category" tabindex="-1">
                    <span class="cascade-btn-label">Abilities</span>
                    <span class="cascade-chevron">›</span>
                </button>
            </div>
            <div class="cascade-item-wrap" :class="{ active: pickerCategory === 'equipment' }"
                @mouseenter="onHoverCategory('equipment')">
                <button class="cascade-btn cascade-btn--category" tabindex="-1">
                    <span class="cascade-btn-label">Equipment</span>
                    <span class="cascade-chevron">›</span>
                </button>
            </div>
        </div>

        <!-- Col 1: Source types (visible when a category is hovered) -->
        <div class="cascade-col" v-if="pickerCategory">
            <div class="cascade-add-all" @click="handleAddAllItems(pickerCategory, allPickerItems)">
                <span class="cascade-add-all-label">Add All</span>
                <span class="cascade-count">{{ allPickerItems.length }}</span>
            </div>
            <div class="cascade-col-divider" />
            <div class="cascade-item-wrap" v-for="st in pickerSourceTypeOptions" :key="st.id"
                :class="{ active: pickerSelectedSourceType === st.id }" @mouseenter="onHoverSourceType(st)">
                <button class="cascade-btn" tabindex="-1">
                    <span class="cascade-btn-label">{{ st.label }}</span>
                    <span class="cascade-chevron" v-if="st.id !== 'general'">›</span>
                    <span class="cascade-count">{{ st.count }}</span>
                </button>
            </div>
        </div>

        <!-- Col 2: Sources within type (not shown for 'general') -->
        <div class="cascade-col"
            v-if="pickerCategory && pickerSelectedSourceType && pickerSelectedSourceType !== 'general'">
            <div class="cascade-add-all" @click="handleAddAllItems(pickerCategory, pickerItemsForSourceType)">
                <span class="cascade-add-all-label">Add All</span>
                <span class="cascade-count">{{ pickerItemsForSourceType.length }}</span>
            </div>
            <div class="cascade-col-divider" />
            <div class="cascade-item-wrap" v-for="src in pickerCurrentSources" :key="src.id"
                :class="{ active: pickerSelectedSource?.id === src.id }" @mouseenter="onHoverSource(src)">
                <button class="cascade-btn" tabindex="-1">
                    <span class="cascade-btn-label">{{ src.name }}</span>
                    <span class="cascade-chevron">›</span>
                    <span class="cascade-count">{{ src.count }}</span>
                </button>
            </div>
        </div>

        <!-- Col 3: Items (visible when a source is selected or 'general' is active) -->
        <div class="cascade-col cascade-col--items" v-if="cascadeItemsVisible">
            <div class="cascade-add-all" @click="handleAddAllItems(pickerCategory, pickerCurrentItems)">
                <span class="cascade-add-all-label">Add All</span>
                <span class="cascade-count">{{ pickerCurrentItems.length }}</span>
            </div>
            <div class="cascade-col-divider" />
            <input v-model="pickerSearch" class="cascade-search" placeholder="Search…"
                @keydown.escape="closeCascadeImmediate" />
            <div class="cascade-items-list" v-if="pickerCurrentItems.length > 0">
                <template v-for="group in pickerCurrentItemsGrouped" :key="group.groupName ?? '__ug__'">
                    <div v-if="group.groupName" class="cascade-group-header">{{ group.groupName }}</div>
                    <div class="cascade-item-wrap cascade-item-wrap--leaf" v-for="dataItem in group.items"
                        :key="dataItem.id" @mouseenter="onHoverLeafItem(dataItem)"
                        @click="handleAddItem(pickerCategory, dataItem.id)">
                        <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
                            <span class="cascade-btn-label">{{ dataItem.name || '(unnamed)' }}</span>
                            <PlusIcon class="cascade-add" />
                        </button>
                    </div>
                </template>
            </div>
            <div class="cascade-empty" v-else>
                <span v-if="pickerSearch">No results for "{{ pickerSearch }}"</span>
                <span v-else-if="isLoading">Loading…</span>
                <span v-else>Nothing here.</span>
            </div>
        </div>

        <!-- Preview pane (shown when hovering a leaf item) -->
        <div class="cascade-preview" v-if="previewItem" title="Click to add to tabletop"
            @click="handleAddItem(previewItemType, previewItem.id)">
            <AbilityCard v-if="previewItemType === 'ability'" :ability="previewItem" :editable="false"
                :deletable="false" :collapsible="false" :collapsed="false" :show-xp-badge="true"
                :show-action-buttons="false" :show-improvements="false" :show-successes="false" />
            <EquipmentCard v-else-if="previewItemType === 'equipment'" :equipment="previewItem" :editable="false"
                :deletable="false" :duplicatable="false" :collapsible="false" :collapsed="false"
                :show-keeping-badge="false" :engagement-success-options="engagementSuccessOptions"
                :show-improvements="false" :show-successes="false" />
        </div>
    </div>
</template>

<script setup>
import { PlusIcon } from '@heroicons/vue/24/outline'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import { useCascadePicker } from '@/composables/useCascadePicker'

defineProps({
    engagementSuccessOptions: Array,
    isLoading: Boolean,
})

const emit = defineEmits(['add-item', 'add-all-items'])

const {
    pickerCategory,
    pickerSelectedSourceType,
    pickerSelectedSource,
    pickerSearch,
    previewItem,
    previewItemType,
    cascadeItemsVisible,
    allPickerItems,
    pickerSourceTypeOptions,
    pickerItemsForSourceType,
    pickerCurrentSources,
    pickerCurrentItems,
    pickerCurrentItemsGrouped,
    closeCascadeImmediate,
    startCloseMenu,
    cancelCloseMenu,
    onHoverCategory,
    onHoverSourceType,
    onHoverSource,
    onHoverLeafItem,
} = useCascadePicker()

const handleAddItem = (type, itemId) => {
    emit('add-item', type, itemId)
    closeCascadeImmediate()
}

const handleAddAllItems = (type, items) => {
    emit('add-all-items', type, items)
    closeCascadeImmediate()
}
</script>

<style scoped>
/* Cascade Menu */
.cascade-menu {
    position: fixed;
    top: calc(var(--nav-height) + 10px);
    bottom: 40px;
    left: 0;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 3px;
    z-index: var(--z-popover);
    padding: 6px;
    background: transparent;
    pointer-events: auto;
    overflow: visible;
}

.cascade-col--category {
    align-self: flex-end;
}

.cascade-col {
    position: relative;
    width: 180px;
    font-family: var(--font-family-primary);
    background: var(--color-bg-secondary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    padding: var(--space-xs) 0;
    max-height: 100%;
    overflow-y: auto;
    flex-shrink: 0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.cascade-col--items {
    width: 200px;
}

/* Add All row */
.cascade-add-all {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 6px var(--space-sm);
    cursor: pointer;
    color: var(--color-primary);
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
    transition: background var(--transition-fast);
    border-radius: var(--radius-5);
    margin: 0 4px;
}

.cascade-add-all:hover {
    background: var(--overlay-white-medium);
}

.cascade-add-all-label {
    flex: 1;
}

.cascade-col-divider {
    height: 1px;
    background: var(--overlay-white-medium);
    margin: 2px var(--space-sm) 4px;
}

.cascade-item-wrap {
    position: relative;
}

.cascade-item-wrap.active>.cascade-btn,
.cascade-item-wrap--leaf:hover>.cascade-btn {
    background: var(--overlay-white-medium);
    color: var(--color-text-primary);
}

.cascade-btn {
    display: flex;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-family: inherit;
    font-size: var(--font-size-12);
    padding: 6px var(--space-sm);
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
    gap: var(--space-xs);
}

.cascade-btn:hover {
    background: var(--overlay-white-medium);
    color: var(--color-text-primary);
}

.cascade-btn--category {
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    padding: var(--space-sm);
}

.cascade-btn--leaf {
    cursor: pointer;
}

.cascade-btn-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.cascade-chevron {
    color: var(--color-text-muted);
    font-size: var(--font-size-11);
    flex-shrink: 0;
    margin-left: auto;
}

.cascade-count {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    flex-shrink: 0;
}

.cascade-add {
    color: var(--color-primary);
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--transition-fast);
}

.cascade-item-wrap--leaf:hover .cascade-add {
    opacity: 1;
}

.cascade-search {
    display: block;
    width: calc(100% - var(--space-sm) * 2);
    margin: var(--space-xs) var(--space-sm) 0;
    padding: var(--space-xs) var(--space-sm);
    background: var(--overlay-white-subtle);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--font-size-12);
    outline: none;
    box-sizing: border-box;
}

.cascade-search:focus {
    border-color: var(--color-primary);
}

.cascade-items-list {
    overflow-y: auto;
    max-height: calc(100vh - var(--content-padding-desktop) - 110px);
    margin-top: var(--space-xs);
}

.cascade-group-header {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: var(--space-sm) var(--space-sm) 2px;
    margin-top: 4px;
    border-top: 1px solid var(--overlay-white-medium);
    pointer-events: none;
    user-select: none;
}

.cascade-group-header:first-child {
    border-top: none;
    margin-top: 0;
}

.cascade-empty {
    padding: var(--space-md) var(--space-sm);
    color: var(--color-text-muted);
    font-size: var(--font-size-12);
    text-align: center;
    font-style: italic;
    margin-top: var(--space-xs);
}

/* Preview pane */
.cascade-preview {
    width: 300px;
    flex-shrink: 0;
    cursor: pointer;
    overflow: hidden;
    /* card gets clipped at container bottom */
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.7));
}

.cascade-preview:hover {
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.9)) brightness(1.05);
}
</style>
