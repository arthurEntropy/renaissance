<template>
    <div class="tabletop-root" @wheel.prevent="handleWheel" @contextmenu.prevent>

        <!-- Canvas Container -->
        <div class="canvas-container" :class="{ 'is-panning': isPanning }" :style="canvasCursorStyle"
            ref="canvasContainerRef" @mousedown="handleCanvasContainerMousedown" @dragover="handleDragOver"
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
                    @mousedown="(e) => { dismissBubble(item.id); handleTokenMousedown(item, e) }">
                    <TabletopToken :name="item.name" :portrait-url="item.portraitUrl" :is-beast="item.isBeast"
                        :is-npc="item.isNpc" :size="item.size" :grid-size="gridSize" :is-selected="isSelected(item.id)"
                        :in-engagement="isCharacterInEngagement(item)" />
                    <TabletopTokenInfoArea
                        v-if="singleSelectedToken?.id === item.id && canViewTokenInfo && !activeBubbles[item.id]"
                        :character="singleSelectedCharacter" :can-edit="canEditTokenInfo"
                        :is-in-engagement="canSpectateSelectedToken" @expand="openCharacterSheetPopup"
                        @spectate="openSpectatePopup" @character-saved="onCharacterSaved" />
                </div>

                <!-- Roll speech bubbles (one per canvas item that has an active roll) -->
                <TabletopRollBubble v-for="(bubble, itemId) in activeBubbles" :key="itemId" :entry="bubble.entry"
                    :expanded="bubble.expanded" :canvas-item-x="canvasItemById(itemId)?.x ?? 0"
                    :canvas-item-y="canvasItemById(itemId)?.y ?? 0"
                    :token-px="(canvasItemById(itemId)?.size ?? 1) * gridSize"
                    :is-beast="canvasItemById(itemId)?.isBeast ?? false"
                    :is-npc="canvasItemById(itemId)?.isNpc ?? false" @toggle-expand="toggleBubbleExpanded(itemId)"
                    @dismiss="dismissBubble(itemId)" />

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

            <!-- Roll chatlog (bottom-right corner, above toolbar) -->
            <TabletopChatlog :roll-log="rollLog" :is-expanded="rollLogExpanded"
                @update:is-expanded="setRollLogExpanded" />
        </div>

        <!-- Bottom Toolbar – teleported to body so it stacks above PinnedTokensContainer (z-badge) -->
        <Teleport to="body">
            <div class="tabletop-toolbar-portal">
                <TabletopToolbar :scale="transform.scale" :grid-size="gridSize" :item-count="canvasItems.length"
                    :can-undo="canUndo" :can-redo="canRedo" :has-background="!!backgroundImage" :grid-color="gridColor"
                    :grid-opacity="gridOpacity" :show-paths="showPaths" :is-g-m="campaignStore.isGMInActiveCampaign"
                    :tabletops="campaignStore.tabletops" :current-tabletop-id="tabletopId"
                    :active-tabletop-id="campaignStore.activeCampaign?.activeTabletopId ?? null"
                    :current-tabletop-name="currentTabletopName" @zoom-in="adjustZoom(1.2)"
                    @zoom-out="adjustZoom(1 / 1.2)" @increase-grid="increaseGridSize" @decrease-grid="decreaseGridSize"
                    @clear-all="clearAll" @undo="undo" @redo="redo" @set-background="setBackgroundImage"
                    @clear-background="clearBackgroundImage" @update-grid-color="setGridColor"
                    @update-grid-opacity="setGridOpacity" @update-show-paths="setShowPaths"
                    @toggle-active-tabletop="handleToggleActiveTabletop" @switch-tabletop="handleSwitchTabletop" />
            </div>
        </Teleport>

        <!-- Character sheet popup (opened from token info area expand button) -->
        <!-- Teleport to body so this component never creates a second root node (fragment),
             which would trigger Vue's "runtime directive on non-element root" warning. -->
        <Teleport to="body">
            <CharacterSheetPopup v-if="charSheetPopupOpen && charSheetPopupCharacter"
                :character="charSheetPopupCharacter" @close="charSheetPopupOpen = false" />
        </Teleport>

        <!-- Engagement spectate popup (read-only view of another character's engagement) -->
        <Teleport to="body">
            <EngagementRollModal v-if="spectatePopupOpen && spectateCharacter && spectateSessionId"
                :spectator-character="spectateCharacter" :spectator-session-id="spectateSessionId"
                @close="closeSpectatePopup" />
        </Teleport>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAuthStore } from '@/stores/authStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useTabletopCanvas } from '@/composables/useTabletopCanvas'
import TabletopToken from '@/components/features/tabletop/TabletopToken.vue'
import TabletopToolbar from '@/components/features/tabletop/TabletopToolbar.vue'
import TabletopMeasurementOverlay from '@/components/features/tabletop/TabletopMeasurementOverlay.vue'
import TabletopRadiusMeasurementOverlay from '@/components/features/tabletop/TabletopRadiusMeasurementOverlay.vue'
import TabletopRadiusAreaOverlay from '@/components/features/tabletop/TabletopRadiusAreaOverlay.vue'
import TabletopTokenInfoArea from '@/components/features/tabletop/TabletopTokenInfoArea.vue'
import CharacterSheetPopup from '@/components/features/tabletop/CharacterSheetPopup.vue'
import TabletopChatlog from '@/components/features/tabletop/TabletopChatlog.vue'
import TabletopRollBubble from '@/components/features/tabletop/TabletopRollBubble.vue'
import EngagementRollModal from '@/components/features/characterSheet/rollModal/EngagementRollModal.vue'
import { useTabletopRollLog } from '@/composables/useTabletopRollLog'
import { useTabletopSync } from '@/composables/useTabletopSync'
import { useEngagementSession, engagedCharacterIds } from '@/composables/useEngagementSession'
import radiusCursorUrl from '@/assets/icons/cursor/radius.png'
import rulerCursorUrl from '@/assets/icons/cursor/ruler.png'

const route = useRoute()
const router = useRouter()
const campaignStore = useCampaignStore()
const authStore = useAuthStore()
const charactersStore = useCharactersStore()

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
    selectedIds,
    isSelected,
    isDragging,
    isDragActive,
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
    saveState,
    rollLog,
    rollLogExpanded,
    setRollLogExpanded,
    applyExternalState,
} = useTabletopCanvas(campaignId, tabletopId, {
    onStateSaved: (snapshot) => broadcastStateUpdate(snapshot),
})

// ─── Real-time sync ──────────────────────────────────────────────────────────
// broadcastStateUpdate is called by useTabletopCanvas after each successful save.
// It must be defined before the canvas composable call above; here we provide a
// stable reference via a forwarding wrapper so the closure is valid at call time.
// (useTabletopSync sets up the socket join and returns the actual broadcast fn.)
let _broadcastStateUpdateRef = null
function broadcastStateUpdate(snapshot) {
    _broadcastStateUpdateRef?.(snapshot)
}

// When the GM changes the active tabletop, redirect all viewers to that tabletop.
function handleActiveTabletopChanged({ activeTabletopId }) {
    if (!activeTabletopId || !campaignSlug.value) return
    // Don't redirect if we're already on the active tabletop
    if (tabletopId.value === activeTabletopId) return
    // Update local campaign store so the active badge reflects the change
    const campaign = campaignStore.getBySlug(campaignSlug.value)
    if (campaign) {
        campaignStore.upsertCampaign({ ...campaign, activeTabletopId })
    }
    router.push(`/campaigns/${campaignSlug.value}/tabletop/${activeTabletopId}`)
}

const { broadcastStateUpdate: _syncBroadcast, broadcastCharacterUpdate, announceActiveTabletopChanged } = useTabletopSync({
    tabletopId,
    campaignId,
    applyExternalState,
    onActiveTabletopChanged: handleActiveTabletopChanged,
})
_broadcastStateUpdateRef = _syncBroadcast

// ─── Roll log + speech bubbles ───────────────────────────────────────────────
const {
    activeBubbles,
    clearBubbles,
    toggleBubbleExpanded,
    dismissBubble,
} = useTabletopRollLog({
    canvasItems,
    rollLog,
    saveStateFn: saveState,
    tabletopId,
    campaignId,
})

// Look up a canvas item by its canvas-item id (for bubble positioning)
const canvasItemById = (id) => canvasItems.value.find((i) => i.id === id) ?? null

// Wrap the canvas container mousedown to also clear bubbles on plain canvas clicks.
// Speech bubble components call @mousedown.stop, so clicks on bubbles won't reach here.
function handleCanvasContainerMousedown(e) {
    handleContainerMousedown(e)
    // Plain left-click on empty canvas (no modifier keys) → clear all speech bubbles
    if (e.button === 0 && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        clearBubbles()
    }
}

// Newer areas are later in the array = rendered on top (DOM order stacking)
const radiusAreasWithZIndex = computed(() => radiusAreas.value)

// Custom cursor: grabbing while dragging; ruler/radius when shift modifiers held
const canvasCursorStyle = computed(() => {
    if (isDragActive.value) return { cursor: 'grabbing' }
    if (isShiftHeld.value && isCmdHeld.value) return { cursor: `url('${radiusCursorUrl}') 8 8, crosshair` }
    if (isShiftHeld.value) return { cursor: `url('${rulerCursorUrl}') 8 8, crosshair` }
    return {}
})

const onRadiusAreaSelect = (id) => {
    selectedRadiusAreaId.value = id
    bringRadiusAreaToFront(id)
}

// ─── Token info area ────────────────────────────────────────────────────────

// The single selected canvas token (only when exactly one is selected)
const singleSelectedToken = computed(() => {
    if (selectedIds.value.size !== 1) return null
    const [id] = selectedIds.value
    return canvasItems.value.find(item => item.id === id) ?? null
})

// The character object backing the single selected token
const singleSelectedCharacter = computed(() => {
    const token = singleSelectedToken.value
    if (!token?.characterId) return null
    return charactersStore.getById(token.characterId) ?? null
})

// Whether the current user may see the info area for the single selected token.
// GMs see all tokens; other users see only their own character, their familiar,
// and their summoned creature.
const canViewTokenInfo = computed(() => {
    if (!singleSelectedToken.value || !singleSelectedCharacter.value) return false
    if (campaignStore.isGMInActiveCampaign || authStore.isAdmin) return true

    const userId = authStore.user?.uid
    if (!userId) return false

    const charId = singleSelectedCharacter.value.id
    for (const myChar of charactersStore.filteredCharacters) {
        if (myChar.id === charId) return true
        if (myChar.witchFamiliar?.characterId === charId) return true
        if (myChar.summonerVessels?.some(v => v.isSummoned && v.beastId === charId)) return true
    }
    return false
})

// Whether the current user may edit stats in the info area
const canEditTokenInfo = computed(() => {
    const char = singleSelectedCharacter.value
    if (!char) return false
    if (campaignStore.isGMInActiveCampaign || authStore.isAdmin) return true
    const userId = authStore.user?.uid
    return !!userId && char.ownerId === userId
})

// ─── CharacterSheetPopup ────────────────────────────────────────────────────
const charSheetPopupOpen = ref(false)
const charSheetPopupCharacter = ref(null)

function openCharacterSheetPopup() {
    const char = singleSelectedCharacter.value
    if (!char) return
    charSheetPopupCharacter.value = char
    charSheetPopupOpen.value = true
}

// Close the popup automatically when a roll bubble appears for the character it shows.
// This covers all roll types (skill checks, damage, etc.) triggered from within the popup.
watch(activeBubbles, (bubbles) => {
    if (!charSheetPopupOpen.value || !charSheetPopupCharacter.value) return
    const charId = charSheetPopupCharacter.value.id
    const matchingItem = canvasItems.value.find(i => i.characterId === charId)
    if (matchingItem && bubbles[matchingItem.id]) {
        charSheetPopupOpen.value = false
    }
}, { deep: true })

// ─── Engagement spectate ────────────────────────────────────────────────────
const engagementSessionManager = useEngagementSession()
const spectatePopupOpen = ref(false)
const spectateCharacter = ref(null)
const spectateSessionId = ref(null)

/**
 * Whether a given canvas item's character is in an active engagement session.
 * Checks both the module-level in-memory set (for the current client) and the
 * character's persisted `engagementSessionId` field (for other clients).
 */
function isCharacterInEngagement(canvasItem) {
    if (!canvasItem?.characterId) return false
    if (engagedCharacterIds.value.has(canvasItem.characterId)) return true
    const char = charactersStore.getById(canvasItem.characterId)
    return !!char?.engagementSessionId
}

/**
 * The single selected character is in engagement and the current user is not
 * already an active participant (only then do we show the spectate button).
 */
const canSpectateSelectedToken = computed(() => {
    if (!singleSelectedToken.value) return false
    if (!isCharacterInEngagement(singleSelectedToken.value)) return false
    // Don't offer spectate if the user is already an active participant
    const sid = engagementSessionManager.sessionId?.value
    const spectating = engagementSessionManager.isSpectating?.value
    return !sid || spectating
})

function openSpectatePopup() {
    const char = singleSelectedCharacter.value
    if (!char?.engagementSessionId) return
    spectateCharacter.value = char
    spectateSessionId.value = char.engagementSessionId
    spectatePopupOpen.value = true
}

function closeSpectatePopup() {
    spectatePopupOpen.value = false
    spectateCharacter.value = null
    spectateSessionId.value = null
}

function onCharacterSaved(character) {
    broadcastCharacterUpdate(character)
}

async function handleToggleActiveTabletop() {
    if (!campaignId.value || !tabletopId.value) return
    const currentActiveId = campaignStore.activeCampaign?.activeTabletopId ?? null
    const newActiveId = tabletopId.value === currentActiveId ? null : tabletopId.value
    try {
        await campaignStore.setActiveTabletop(campaignId.value, newActiveId)
        // Broadcast the change to all connected campaign members so they redirect
        if (newActiveId) {
            announceActiveTabletopChanged(campaignId.value, newActiveId)
        }
    } catch (err) {
        console.error('Failed to toggle active tabletop:', err)
    }
}

function handleSwitchTabletop(targetTabletopId) {
    if (!campaignSlug.value || !targetTabletopId) return
    router.push(`/campaigns/${campaignSlug.value}/tabletop/${targetTabletopId}`)
}

// Load state when campaign data becomes available.
// A watch (rather than onMounted) is required because child onMounted hooks run
// before the parent App.vue onMounted, which is where auth + campaigns are fetched.
// On a hard page refresh campaignId may therefore be null when the component first
// mounts; the watch fires again once it becomes non-null.
watch(campaignId, async (id) => {
    if (!id) return

    const fetches = []

    // Fetch tabletops for this campaign if the current tabletop is not yet in the store.
    const tid = tabletopId.value
    if (tid && !campaignStore.tabletops.some((t) => t.id === tid)) {
        fetches.push(campaignStore.fetchTabletops(id))
    }

    // Ensure campaign characters (NPCs & beast instances) are loaded so that
    // PinnedTokensContainer can resolve group members on a hard page refresh.
    if (!campaignStore.campaignCharacters.length) {
        fetches.push(campaignStore.fetchCampaignCharacters(id))
    }

    // Ensure player characters are loaded for the same reason.
    if (!charactersStore.characters.length) {
        fetches.push(charactersStore.fetch())
    }

    await Promise.all(fetches)
    loadState()
}, { immediate: true })
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
    /* Expose the toolbar height so the chatlog can position itself above the toolbar */
    --vtt-toolbar-height: 38px;
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
    z-index: 3;
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
    cursor: pointer;
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

/* Teleported toolbar portal – sits above PinnedTokensContainer (z-badge = 1200) */
.tabletop-toolbar-portal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: calc(var(--z-badge) + 1);
}
</style>
