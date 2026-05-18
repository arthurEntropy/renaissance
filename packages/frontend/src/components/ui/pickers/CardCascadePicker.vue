<template>
    <CascadeMenuFrame :overlay="overlay" :anchor-position="anchorPosition" :close-on-outside-click="closeOnOutsideClick"
        @close="closeCascadeImmediate" @mouseleave="handleMouseLeave" @mouseenter="handleMouseEnter">

        <!-- Col 0: Category -->
        <div ref="categoryColRef" class="cascade-col cascade-col--category" :style="getColumnStyle('category')"
            v-if="showCategoryColumn && !fixedCategory">
            <div class="cascade-item-wrap" :class="{ active: pickerCategory === 'ability' }"
                @mouseenter="handleHoverCategory('ability', $event)">
                <button class="cascade-btn cascade-btn--category" tabindex="-1">
                    <span class="cascade-btn-label">Abilities</span>
                    <span class="cascade-chevron">›</span>
                </button>
            </div>
            <div class="cascade-item-wrap" :class="{ active: pickerCategory === 'equipment' }"
                @mouseenter="handleHoverCategory('equipment', $event)">
                <button class="cascade-btn cascade-btn--category" tabindex="-1">
                    <span class="cascade-btn-label">Equipment</span>
                    <span class="cascade-chevron">›</span>
                </button>
            </div>
        </div>

        <!-- Col 1: Source types (visible when a category is hovered) -->
        <div ref="sourceTypeColRef" class="cascade-col" :style="getColumnStyle('sourceType')" v-if="pickerCategory">
            <div v-if="topLevelActionLabel" class="cascade-item-wrap cascade-item-wrap--action"
                @click="handleTopLevelAction">
                <button class="cascade-btn cascade-btn--action" tabindex="-1">
                    <span class="cascade-btn-label">{{ topLevelActionLabel }}</span>
                </button>
            </div>
            <div v-if="showAddAllAtEveryLevel" class="cascade-add-all"
                @click="handleAddAllItems(pickerCategory, allPickerItems)">
                <span class="cascade-add-all-label">Add All</span>
                <span class="cascade-count">{{ allPickerItems.length }}</span>
            </div>
            <div v-if="topLevelActionLabel || showAddAllAtEveryLevel" class="cascade-col-divider" />
            <div class="cascade-item-wrap" v-for="st in pickerSourceTypeOptions" :key="st.id"
                :class="{ active: pickerSelectedSourceType === st.id }" @mouseenter="handleHoverSourceType(st, $event)">
                <button class="cascade-btn" tabindex="-1">
                    <span class="cascade-btn-label">{{ st.label }}</span>
                    <span class="cascade-chevron" v-if="st.id !== 'general'">›</span>
                    <span class="cascade-count">{{ st.count }}</span>
                </button>
            </div>
        </div>

        <!-- Col 2: Sources within type (not shown for 'general') -->
        <div ref="sourceColRef" class="cascade-col" :style="getColumnStyle('source')"
            v-if="pickerCategory && pickerSelectedSourceType && pickerSelectedSourceType !== 'general'">
            <div v-if="showAddAllAtEveryLevel" class="cascade-add-all"
                @click="handleAddAllItems(pickerCategory, pickerItemsForSourceType)">
                <span class="cascade-add-all-label">Add All</span>
                <span class="cascade-count">{{ pickerItemsForSourceType.length }}</span>
            </div>
            <div v-if="showAddAllAtEveryLevel" class="cascade-col-divider" />
            <div class="cascade-item-wrap" v-for="src in pickerCurrentSources" :key="src.id"
                :class="{ active: pickerSelectedSource?.id === src.id }" @mouseenter="handleHoverSource(src, $event)">
                <button class="cascade-btn" tabindex="-1">
                    <span class="cascade-btn-label">{{ src.name }}</span>
                    <span class="cascade-chevron">›</span>
                    <span class="cascade-count">{{ src.count }}</span>
                </button>
            </div>
        </div>

        <!-- Col 3: Items (visible when a source is selected or 'general' is active) -->
        <div ref="itemsColRef" class="cascade-col cascade-col--items" :style="getColumnStyle('items')"
            v-if="cascadeItemsVisible">
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
                        :key="dataItem.id" @mouseenter="handleHoverLeafItem(dataItem, $event)"
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
        <div ref="previewColRef" class="cascade-preview" :style="getColumnStyle('preview')" v-if="previewItem"
            title="Click to add" @click="handleAddItem(previewItemType || pickerCategory, previewItem.id)">
            <AbilityCard v-if="(previewItemType || pickerCategory) === 'ability'" :ability="previewItem"
                :editable="false" :deletable="false" :collapsible="false" :collapsed="false" :show-xp-badge="true"
                :show-action-buttons="false" :show-improvements="false" :show-successes="false" />
            <EquipmentCard v-else-if="(previewItemType || pickerCategory) === 'equipment'" :equipment="previewItem"
                :editable="false" :deletable="false" :duplicatable="false" :collapsible="false" :collapsed="false"
                :show-keeping-badge="false" :engagement-success-options="engagementSuccessOptions"
                :show-improvements="false" :show-successes="false" />
        </div>
    </CascadeMenuFrame>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import CascadeMenuFrame from '@/components/ui/pickers/CascadeMenuFrame.vue'
import { useCascadeColumnPositioning } from '@/composables/useCascadeColumnPositioning'
import { useCardCascadePicker } from '@/composables/useCardCascadePicker'

const props = defineProps({
    picker: {
        type: Object,
        default: null,
    },
    engagementSuccessOptions: {
        type: Array,
        default: () => [],
    },
    isLoading: {
        type: Boolean,
        default: false,
    },
    fixedCategory: {
        type: String,
        default: '',
    },
    showCategoryColumn: {
        type: Boolean,
        default: true,
    },
    closeOnMouseLeave: {
        type: Boolean,
        default: true,
    },
    overlay: {
        type: Boolean,
        default: false,
    },
    anchorPosition: {
        type: Object,
        default: null,
    },
    bottomBoundary: {
        type: Number,
        default: null,
    },
    topLevelActionLabel: {
        type: String,
        default: '',
    },
    showAddAllAtEveryLevel: {
        type: Boolean,
        default: true,
    },
    closeOnOutsideClick: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['add-item', 'add-all-items', 'top-level-action'])

const cascadePicker = props.picker ?? useCardCascadePicker({ fixedCategory: props.fixedCategory || null })

const categoryColRef = ref(null)
const sourceTypeColRef = ref(null)
const sourceColRef = ref(null)
const itemsColRef = ref(null)
const previewColRef = ref(null)

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
} = cascadePicker

const handleMouseLeave = () => {
    if (props.closeOnMouseLeave) {
        startCloseMenu()
    }
}

const handleMouseEnter = () => {
    if (props.closeOnMouseLeave) {
        cancelCloseMenu()
    }
}

const getViewportBounds = () => {
    if (typeof window === 'undefined') {
        return { top: 0, bottom: 0 }
    }

    const navHeightValue = getComputedStyle(document.documentElement).getPropertyValue('--nav-height')
    const navHeight = Number.parseFloat(navHeightValue)
    const top = (Number.isFinite(navHeight) ? navHeight : 0) + 10

    return {
        top,
        bottom: props.bottomBoundary ?? window.innerHeight,
    }
}

const {
    columnAnchors,
    getColumnStyle,
    positionColumnByCenter,
} = useCascadeColumnPositioning({
    columnKeys: ['category', 'sourceType', 'source', 'items', 'preview'],
    getViewportBounds,
    getBaselineTop: () => getViewportBounds().top,
})

const baseAnchorY = computed(() => props.anchorPosition?.y ?? getViewportBounds().top)

const getTriggerCenterY = (event, fallbackY = baseAnchorY.value) => {
    const target = event?.currentTarget
    if (!target?.getBoundingClientRect) return fallbackY
    const rect = target.getBoundingClientRect()
    return rect.top + rect.height / 2
}

const handleHoverCategory = (category, event) => {
    const centerY = getTriggerCenterY(event)
    onHoverCategory(category)
    void positionColumnByCenter('sourceType', sourceTypeColRef, centerY)
}

const handleHoverSourceType = (sourceType, event) => {
    const centerY = getTriggerCenterY(event, columnAnchors.value.sourceType ?? baseAnchorY.value)
    onHoverSourceType(sourceType)

    if (sourceType.id === 'general') {
        void positionColumnByCenter('items', itemsColRef, centerY)
        return
    }

    void positionColumnByCenter('source', sourceColRef, centerY)
}

const handleHoverSource = (source, event) => {
    const centerY = getTriggerCenterY(event, columnAnchors.value.source ?? baseAnchorY.value)
    onHoverSource(source)
    void positionColumnByCenter('items', itemsColRef, centerY)
}

const handleHoverLeafItem = (item, event) => {
    const centerY = getTriggerCenterY(event, columnAnchors.value.items ?? baseAnchorY.value)
    onHoverLeafItem(item)
    void positionColumnByCenter('preview', previewColRef, centerY)
}

watch(
    () => [props.anchorPosition?.x, props.anchorPosition?.y, pickerCategory.value],
    ([, anchorY]) => {
        const centerY = anchorY ?? baseAnchorY.value
        if (props.fixedCategory || !props.showCategoryColumn) {
            void positionColumnByCenter('sourceType', sourceTypeColRef, centerY)
            return
        }

        void positionColumnByCenter('category', categoryColRef, centerY)
    },
    { immediate: true }
)

watch(
    () => pickerSelectedSourceType.value,
    (sourceType) => {
        if (!sourceType) return
        if (sourceType === 'general') {
            void positionColumnByCenter('items', itemsColRef, columnAnchors.value.items ?? columnAnchors.value.sourceType ?? baseAnchorY.value)
            return
        }

        void positionColumnByCenter('source', sourceColRef, columnAnchors.value.source ?? columnAnchors.value.sourceType ?? baseAnchorY.value)
    }
)

watch(
    () => pickerSelectedSource.value?.id,
    (sourceId) => {
        if (!sourceId) return
        void positionColumnByCenter('items', itemsColRef, columnAnchors.value.items ?? columnAnchors.value.source ?? baseAnchorY.value)
    }
)

watch(
    () => previewItem.value?.id,
    (previewId) => {
        if (!previewId) return
        void positionColumnByCenter('preview', previewColRef, columnAnchors.value.preview ?? columnAnchors.value.items ?? baseAnchorY.value)
    }
)

const handleAddItem = (type, itemId) => {
    emit('add-item', type, itemId)
    closeCascadeImmediate()
}

const handleAddAllItems = (type, items) => {
    emit('add-all-items', type, items)
    closeCascadeImmediate()
}

const handleTopLevelAction = () => {
    emit('top-level-action')
    closeCascadeImmediate()
}
</script>

<style scoped>
@import '@/styles/cascade-picker.css';

.cascade-col--category {
    align-self: flex-start;
}

.cascade-col {
    width: 180px;
}

.cascade-col--items {
    width: 200px;
}

.cascade-item-wrap--action {
    margin: 0 4px;
}

.cascade-btn--category {
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    padding: var(--space-sm);
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

/* Preview pane */
.cascade-preview {
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
