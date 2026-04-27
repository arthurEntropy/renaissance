<template>
    <div class="tabletop-root" @wheel.prevent="handleWheel">
        <CardCascadePicker v-if="showPicker" :picker="cascadePicker"
            :engagement-success-options="engagementSuccessOptions" :anchor-position="tabletopPickerAnchor"
            :bottom-boundary="tabletopPickerBottomBoundary" :is-loading="isLoading" :show-add-all-at-every-level="true"
            @add-item="addItem" @add-all-items="addAllItems" />

        <!-- Canvas Container -->
        <div class="canvas-container" ref="canvasContainerRef" @mousedown="handleContainerMousedown">
            <div v-if="snapToGrid" class="canvas-grid" :style="canvasGridStyle" />
            <div v-if="selectionRectangle" class="selection-rectangle" :style="selectionRectangleStyle" />
            <div class="canvas" :style="canvasTransformStyle">
                <div v-for="item in canvasItems" :key="item.id" class="canvas-item"
                    :ref="(el) => registerCardRef(item.id, el)"
                    :class="{ 'is-dragging': isDragging(item.id), 'is-selected': isSelected(item.id) || isPendingSelection(item.id) }"
                    :style="{ transform: `translate(${item.x}px, ${item.y}px)`, zIndex: item.zIndex }"
                    @mousedown="handleCardMousedown(item, $event)">

                    <!-- Ability card -->
                    <AbilityCard v-if="item.type === 'ability' && resolvedItemMap.get(item.id)"
                        :ability="resolvedItemMap.get(item.id)" :editable="authStore.isAdmin" :deletable="true"
                        :collapsible="false" :collapsed="false" :show-xp-badge="true" :show-action-buttons="false"
                        :show-improvements="getImprovementsVisible(item.id)"
                        :show-successes="getSuccessesVisible(item.id)"
                        @update:showImprovements="setImprovementsVisible(item.id, $event)"
                        @update:showSuccesses="setSuccessesVisible(item.id, $event)" @edit="openAbilityEdit"
                        @update="abilitiesStore.update" @delete="removeItem(item.id)" />

                    <!-- Stale ability placeholder -->
                    <div v-else-if="item.type === 'ability'" class="stale-card">
                        <span>Ability not found</span>
                        <button @click.stop="removeItem(item.id)">Remove</button>
                    </div>

                    <!-- Equipment card -->
                    <EquipmentCard v-if="item.type === 'equipment' && resolvedItemMap.get(item.id)"
                        :equipment="resolvedItemMap.get(item.id)" :editable="authStore.isAdmin" :deletable="true"
                        :duplicatable="false" :collapsible="false" :collapsed="false" :show-keeping-badge="true"
                        :engagement-success-options="engagementSuccessOptions"
                        :show-improvements="getImprovementsVisible(item.id)"
                        :show-successes="getSuccessesVisible(item.id)"
                        @update:showImprovements="setImprovementsVisible(item.id, $event)"
                        @update:showSuccesses="setSuccessesVisible(item.id, $event)" @edit="openEquipmentEdit"
                        @update="equipmentStore.update" @delete="removeItem(item.id)" />

                    <!-- Stale equipment placeholder -->
                    <div v-else-if="item.type === 'equipment'" class="stale-card">
                        <span>Equipment not found</span>
                        <button @click.stop="removeItem(item.id)">Remove</button>
                    </div>
                </div>
            </div>

            <!-- Empty state hint when canvas is empty -->
            <div v-if="canvasItems.length === 0" class="canvas-empty-hint">
                <p>Click <strong>+ Add Card</strong> below to add abilities or equipment to the tabletop.</p>
                <p class="hint-sub">Scroll to zoom · Drag empty space to pan · Drag a card to move it · Hold shift for
                    multi-select</p>
            </div>
        </div>

        <!-- Edit Modals -->
        <EditAbilityModal v-if="showEditAbilityModal" :ability="abilityToEdit" @update="handleAbilityModalUpdate"
            @delete="handleAbilityModalDelete" @close="closeEditAbilityModal" />

        <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit"
            @update="handleEquipmentModalUpdate" @delete="handleEquipmentModalDelete"
            @close="closeEditEquipmentModal" />

        <!-- Bottom Toolbar -->
        <TabletopToolbar :show-picker="showPicker" :scale="transform.scale" :snap-to-grid="snapToGrid"
            :grid-size="gridSize" :item-count="canvasItems.length" :can-undo="canUndo" :can-redo="canRedo"
            @toggle-picker="handleTogglePicker" @zoom-in="adjustZoom(1.2)" @zoom-out="adjustZoom(1 / 1.2)"
            @reset-view="resetView" @toggle-snap="toggleSnap" @increase-grid="increaseGridSize"
            @decrease-grid="decreaseGridSize" @clear-all="clearAll" @undo="undo" @redo="redo" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import EditAbilityModal from '@/components/editModals/EditAbilityModal.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import CardCascadePicker from '@/components/ui/pickers/CardCascadePicker.vue'
import TabletopToolbar from '@/components/features/tabletop/TabletopToolbar.vue'
import { useTabletopCanvas } from '@/composables/useTabletopCanvas'
import { useCardCascadePicker } from '@/composables/useCardCascadePicker'

// Stores
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useEngagementSuccessesStore } from '@/stores/engagementSuccessesStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useAuthStore } from '@/stores/authStore'

// Stores
const abilitiesStore = useAbilitiesStore()
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const equipmentRangesStore = useEquipmentRangesStore()
const keepingStore = useKeepingStore()
const engagementSuccessesStore = useEngagementSuccessesStore()
const sourcesStore = useSourcesStore()
const abilitySchoolsStore = useAbilitySchoolsStore()
const authStore = useAuthStore()

// Composables
const {
    canvasContainerRef,
    canvasItems,
    resolvedItemMap,
    transform,
    snapToGrid,
    gridSize,
    canvasTransformStyle,
    canvasGridStyle,
    canUndo,
    canRedo,
    undo,
    redo,
    selectionRectangle,
    isSelected,
    isPendingSelection,
    isDragging,
    registerCardRef,
    getImprovementsVisible,
    setImprovementsVisible,
    getSuccessesVisible,
    setSuccessesVisible,
    handleWheel,
    handleContainerMousedown,
    handleCardMousedown,
    adjustZoom,
    resetView,
    toggleSnap,
    increaseGridSize,
    decreaseGridSize,
    addItem,
    addAllItems,
    removeItem,
    removeItemsBySource,
    clearAll,
} = useTabletopCanvas()

const cascadePicker = useCardCascadePicker()
const { showPicker, togglePicker } = cascadePicker
const tabletopPickerAnchor = ref({ x: 0, y: 0 })
const tabletopPickerBottomBoundary = ref(null)

const handleTogglePicker = (event) => {
    const triggerEl = event?.currentTarget || event?.target?.closest('button')
    if (triggerEl) {
        const rect = triggerEl.getBoundingClientRect()
        tabletopPickerAnchor.value = {
            x: Math.round(rect.left + 16),
            y: Math.round(rect.top - 12),
        }
        tabletopPickerBottomBoundary.value = Math.round(rect.top - 8)
    }

    togglePicker()
}

// Selection rectangle visual style
const selectionRectangleStyle = computed(() => {
    if (!selectionRectangle.value) return {}
    const { x1, y1, x2, y2 } = selectionRectangle.value
    return {
        left: Math.min(x1, x2) + 'px',
        top: Math.min(y1, y2) + 'px',
        width: Math.abs(x2 - x1) + 'px',
        height: Math.abs(y2 - y1) + 'px',
    }
})

// Loading
const isLoading = ref(true)

// Store-derived data shared with canvas components
const engagementSuccessOptions = computed(() => engagementSuccessesStore.items)

// Edit modals – Abilities
const showEditAbilityModal = ref(false)
const abilityToEdit = ref(null)

const openAbilityEdit = (ability) => {
    abilityToEdit.value = ability
    showEditAbilityModal.value = true
}

const closeEditAbilityModal = () => {
    showEditAbilityModal.value = false
    abilityToEdit.value = null
}

const handleAbilityModalUpdate = async (edited) => {
    await abilitiesStore.update(edited)
    closeEditAbilityModal()
}

const handleAbilityModalDelete = async (ability) => {
    if (!ability) return
    await abilitiesStore.update({ ...ability, isDeleted: true })
    closeEditAbilityModal()
    removeItemsBySource('ability', ability.id)
}

// Edit modals – Equipment
const showEditEquipmentModal = ref(false)
const equipmentToEdit = ref(null)

const openEquipmentEdit = (equipment) => {
    equipmentToEdit.value = equipment
    showEditEquipmentModal.value = true
}

const closeEditEquipmentModal = () => {
    showEditEquipmentModal.value = false
    equipmentToEdit.value = null
}

const handleEquipmentModalUpdate = async (edited) => {
    await equipmentStore.update(edited)
    closeEditEquipmentModal()
}

const handleEquipmentModalDelete = async (equipment) => {
    if (!equipment) return
    await equipmentStore.update({ ...equipment, isDeleted: true })
    closeEditEquipmentModal()
    removeItemsBySource('equipment', equipment.id)
}

// Data loading
onMounted(async () => {
    const fetchTasks = [
        abilitiesStore.fetch(),
        equipmentStore.fetch(),
        sourcesStore.fetchSources(),
        equipmentTypesStore.fetch(),
        equipmentSubtypesStore.fetch(),
        equipmentGradesStore.fetch(),
        equipmentRangesStore.fetch(),
        keepingStore.fetch(),
        abilitySchoolsStore.fetch(),
        engagementSuccessesStore.fetch(),
    ]

    try {
        await Promise.all(fetchTasks)
    } finally {
        isLoading.value = false
    }
})
</script>

<style scoped>
/* Root layout */
.tabletop-root {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    user-select: none;
    background: var(--overlay-black-medium);
    z-index: var(--z-overlay);
}

.canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    cursor: grab;
}

/* Grid overlay */
.canvas-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
    z-index: var(--z-base);
}

.canvas-container:active {
    cursor: grabbing;
}

/* Canvas (the infinite transform plane) */
.canvas {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    /* Promote to GPU layer so pan/zoom never repaints card content */
    will-change: transform;
}

/* Canvas Items */
.canvas-item {
    position: absolute;
    /* Static origin — position is driven entirely by transform: translate(x, y) */
    left: 0;
    top: 0;
    width: 300px;
    cursor: grab;
    /* box-shadow is GPU-accelerated; filter: drop-shadow was CPU-bound and very expensive at scale */
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.65);
    transition: box-shadow var(--transition-fast);
    /* Tell the browser changes to one card don't affect siblings' layout or paint */
    contain: layout style;
}

.canvas-item.is-dragging {
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.9);
    cursor: grabbing;
}

.canvas-item.is-selected {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
    border-radius: var(--radius-5);
}

/* Rubber-band selection rectangle */
.selection-rectangle {
    position: absolute;
    border: 1.5px dashed var(--color-primary);
    background: rgba(255, 255, 255, 0.04);
    pointer-events: none;
    z-index: var(--z-dropdown);
}

/* Stale card placeholder */
.stale-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-lg);
    background: var(--color-bg-secondary);
    border: 1px dashed var(--color-gray-medium);
    border-radius: var(--radius-10);
    color: var(--color-text-muted);
    font-size: var(--font-size-12);
    font-style: italic;
}

.stale-card button {
    background: var(--color-danger);
    color: var(--color-danger-text);
    border: none;
    border-radius: var(--radius-5);
    padding: 2px var(--space-sm);
    font-size: var(--font-size-12);
    cursor: pointer;
}

/* Empty canvas hint */
.canvas-empty-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--color-text-muted);
    pointer-events: none;
    font-size: var(--font-size-14);
    line-height: 1.8;
}

.hint-sub {
    font-size: var(--font-size-12);
    color: var(--color-gray-medium);
}
</style>
