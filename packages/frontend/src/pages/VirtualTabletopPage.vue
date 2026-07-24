<template>
    <div class="tabletop-root" @wheel.prevent="handleWheel" @contextmenu.prevent>

        <!-- Canvas Container -->
        <div class="canvas-container" :class="{ 'is-panning': isPanning }" :style="canvasCursorStyle"
            ref="canvasContainerRef" @mousedown="handleContainerMousedown" @dragover="handleDragOver"
            @dragleave="handleDragLeave" @drop="handleDrop">

            <!-- Grid overlay (always visible, tracks canvas transform) -->
            <div class="canvas-grid" :style="canvasGridStyle" />

            <!-- The transform plane -->
            <div class="canvas" :style="[canvasTransformStyle, canvasSizeStyle]">

                <!-- Background map image -->
                <img v-if="backgroundImage" :src="backgroundImage.url" class="canvas-bg-image" draggable="false" />

                <!-- Persistent radius areas: inside .canvas so they sit above the map
                     but below tokens (canvas-items each have z-index ≥ 1). -->
                <TabletopRadiusAreaOverlay :areas="radiusAreasWithZIndex" :transform="transform" :grid-size="gridSize"
                    :selected-area-id="selectedRadiusAreaId" :editing-area-id="editingRadiusAreaId"
                    :hovered-area-id="hoveringRadiusAreaId" :hovered-canvas-pos="hoveredCanvasPos"
                    @select="onRadiusAreaSelect($event)" @deselect="selectedRadiusAreaId = null"
                    @resize-start="beginRadiusResize($event)" @move-start="beginAreaMove"
                    @set-color="(id, color) => setRadiusAreaColor(id, color)"
                    @set-label="(id, label) => setRadiusAreaLabel(id, label)"
                    @remove-area="_removeRadiusArea($event)" />

                <!-- Canvas tokens -->
                <div v-for="item in canvasItems" :key="item.id" class="canvas-item edit-hover-area"
                    :ref="(el) => registerTokenRef(item.id, el)" :class="{ 'is-dragging': isDragging(item.id) }"
                    :style="{ transform: `translate(${item.x}px, ${item.y}px)`, zIndex: item.zIndex }"
                    @mousedown="handleTokenMousedown(item, $event)">
                    <TabletopToken :name="item.name" :portrait-url="item.portraitUrl" :is-beast="item.isBeast"
                        :is-npc="item.isNpc" :size="item.size" :grid-size="gridSize"
                        :is-selected="isSelected(item.id)" />
                </div>

                <!-- Rubber-band selection rect -->
                <div v-if="isSelecting && selectionRectCanvas" class="selection-rect" :style="{
                    left: `${Math.min(selectionRectCanvas.x1, selectionRectCanvas.x2)}px`,
                    top: `${Math.min(selectionRectCanvas.y1, selectionRectCanvas.y2)}px`,
                    width: `${Math.abs(selectionRectCanvas.x2 - selectionRectCanvas.x1)}px`,
                    height: `${Math.abs(selectionRectCanvas.y2 - selectionRectCanvas.y1)}px`,
                }" />

                <!-- Ghost tokens (drag preview – snapped to grid) -->
                <div v-for="ghost in activeGhosts" :key="`${ghost.x}-${ghost.y}-${ghost.name}`"
                    class="canvas-item canvas-item--ghost"
                    :style="{ transform: `translate(${ghost.x}px, ${ghost.y}px)`, zIndex: 9999 }">
                    <TabletopToken :name="ghost.name" :portrait-url="ghost.portraitUrl" :is-beast="ghost.isBeast"
                        :is-npc="ghost.isNpc" :size="ghost.size" :grid-size="gridSize" :is-ghost="true" />
                </div>
            </div>

            <!-- Measurement overlays: one per dragged token, or the single canvas-mode overlay -->
            <template v-if="isMeasuring && measureTracks.length > 0">
                <TabletopMeasurementOverlay v-for="(track, i) in measureTracks" :key="`track-${i}`"
                    :waypoints="track.waypoints" :current-point="track.currentPoint" :transform="transform"
                    :grid-size="gridSize" :exact-mode="isCmdHeld" :token-size="track.size" :show-paths="showPaths" />
            </template>
            <TabletopMeasurementOverlay v-else-if="isMeasuring" :waypoints="measureWaypoints"
                :current-point="measureCurrent" :transform="transform" :grid-size="gridSize" :exact-mode="isCmdHeld"
                :token-size="1" :show-paths="showPaths" />

            <!-- Radius measurement overlay -->
            <TabletopRadiusMeasurementOverlay v-if="isRadiusMeasuring && radiusOrigin && radiusCurrent"
                :origin="radiusOrigin" :current-point="radiusCurrent" :transform="transform" :grid-size="gridSize"
                :snap-enabled="isShiftHeld" />
        </div>

        <!-- Bottom Toolbar -->
        <TabletopToolbar :scale="transform.scale" :grid-size="gridSize" :item-count="canvasItems.length"
            :can-undo="canUndo" :can-redo="canRedo" :has-background="!!backgroundImage" :grid-color="gridColor"
            :grid-opacity="gridOpacity" :show-paths="showPaths" :is-g-m="campaignStore.isGMInActiveCampaign"
            :tabletops="campaignStore.tabletops" :current-tabletop-id="tabletopId"
            :active-tabletop-id="campaignStore.activeCampaign?.activeTabletopId ?? null"
            :current-tabletop-name="currentTabletopName" @zoom-in="adjustZoom(1.2)" @zoom-out="adjustZoom(1 / 1.2)"
            @increase-grid="increaseGridSize" @decrease-grid="decreaseGridSize" @clear-all="clearAll" @undo="undo"
            @redo="redo" @set-background="setBackgroundImage" @clear-background="clearBackgroundImage"
            @update-grid-color="setGridColor" @update-grid-opacity="setGridOpacity" @update-show-paths="setShowPaths"
            @toggle-active-tabletop="handleToggleActiveTabletop" @switch-tabletop="handleSwitchTabletop" />
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaignStore'
import { useTabletopCanvas } from '@/composables/useTabletopCanvas'
import TabletopToken from '@/components/features/tabletop/TabletopToken.vue'
import TabletopToolbar from '@/components/features/tabletop/TabletopToolbar.vue'
import TabletopMeasurementOverlay from '@/components/features/tabletop/TabletopMeasurementOverlay.vue'
import TabletopRadiusMeasurementOverlay from '@/components/features/tabletop/TabletopRadiusMeasurementOverlay.vue'
import TabletopRadiusAreaOverlay from '@/components/features/tabletop/TabletopRadiusAreaOverlay.vue'
import radiusCursorUrl from '@/assets/icons/cursor/radius.png'
import rulerCursorUrl from '@/assets/icons/cursor/ruler.png'

const route = useRoute()
const router = useRouter()
const campaignStore = useCampaignStore()

const campaignSlug = computed(() => route.params.slug)
const tabletopId = computed(() => route.params.tabletopId)
const campaign = computed(() => campaignStore.getBySlug(campaignSlug.value))
const campaignId = computed(() => campaign.value?.id)

const currentTabletopName = computed(() => {
    const id = tabletopId.value
    if (!id) return ''
    return campaignStore.tabletops.find((t) => t.id === id)?.name ?? ''
})

const {
    canvasContainerRef,
    canvasItems,
    transform,
    backgroundImage,
    gridSize,
    gridColor,
    gridOpacity,
    canvasTransformStyle,
    canvasGridStyle,
    canvasSizeStyle,
    activeGhosts,
    canUndo,
    canRedo,
    undo,
    redo,
    isSelected,
    isDragging,
    isPanning,
    isSelecting,
    selectionRectCanvas,
    isMeasuring,
    measureTracks,
    measureWaypoints,
    measureCurrent,
    isCmdHeld,
    isShiftHeld,
    isRadiusMeasuring,
    radiusOrigin,
    radiusCurrent,
    registerTokenRef,
    handleWheel,
    handleContainerMousedown,
    handleTokenMousedown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    adjustZoom,
    increaseGridSize,
    decreaseGridSize,
    setBackgroundImage,
    clearBackgroundImage,
    setGridColor,
    setGridOpacity,
    showPaths,
    setShowPaths,
    radiusAreas,
    selectedRadiusAreaId,
    editingRadiusAreaId,
    hoveringRadiusAreaId,
    hoveredCanvasPos,
    removeRadiusArea: _removeRadiusArea,
    setRadiusAreaColor,
    setRadiusAreaLabel,
    beginRadiusResize,
    beginAreaMove,
    bringRadiusAreaToFront,
    clearAll,
    loadState,
} = useTabletopCanvas(campaignId, tabletopId)

// Newer areas are later in the array = rendered on top (DOM order stacking)
const radiusAreasWithZIndex = computed(() => radiusAreas.value)

// Custom cursor: show ruler when shift held, radius when shift+cmd/ctrl held
const canvasCursorStyle = computed(() => {
    if (isShiftHeld.value && isCmdHeld.value) return { cursor: `url('${radiusCursorUrl}') 8 8, crosshair` }
    if (isShiftHeld.value) return { cursor: `url('${rulerCursorUrl}') 8 8, crosshair` }
    return {}
})

const onRadiusAreaSelect = (id) => {
    selectedRadiusAreaId.value = id
    bringRadiusAreaToFront(id)
}

async function handleToggleActiveTabletop() {
    if (!campaignId.value || !tabletopId.value) return
    const currentActiveId = campaignStore.activeCampaign?.activeTabletopId ?? null
    const newActiveId = tabletopId.value === currentActiveId ? null : tabletopId.value
    try {
        await campaignStore.setActiveTabletop(campaignId.value, newActiveId)
    } catch (err) {
        console.error('Failed to toggle active tabletop:', err)
    }
}

function handleSwitchTabletop(targetTabletopId) {
    if (!campaignSlug.value || !targetTabletopId) return
    router.push(`/campaigns/${campaignSlug.value}/tabletop/${targetTabletopId}`)
}

onMounted(async () => {
    // Ensure campaign and tabletop data are in the store before loading canvas state
    if (campaignId.value && campaignStore.tabletops.length === 0) {
        await campaignStore.fetchTabletops(campaignId.value)
    }
    loadState()
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

/* Canvas container */
.canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.canvas-container.is-panning,
.canvas-container.is-panning * {
    cursor: grabbing !important;
}

/* Grid overlay (outside the canvas div – tracks transform via backgroundPosition) */
.canvas-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: var(--z-floating);
}

/* The infinite/bounded transform plane */
.canvas {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    will-change: transform;
    z-index: 2;
}

/* Background map image – fills the bounded canvas */
.canvas-bg-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    display: block;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
}

/* Canvas tokens */
.canvas-item {
    position: absolute;
    left: 0;
    top: 0;
    cursor: grab;
    /* overflow: visible so the name label can spill below the token square */
    overflow: visible;
}

.canvas-item.is-dragging {
    cursor: grabbing;
    opacity: 0.6;
}

.canvas-item--ghost {
    pointer-events: none;
}

/* Rubber-band selection rectangle (canvas-space coords, inside .canvas div) */
.selection-rect {
    position: absolute;
    border: 1px solid var(--color-text-primary);
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
    z-index: 9998;
}
</style>
