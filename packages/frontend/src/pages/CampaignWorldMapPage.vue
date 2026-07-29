<template>
    <div class="tabletop-root" @wheel.prevent="handleWheel" @contextmenu.prevent>

        <!-- Canvas Container -->
        <div class="canvas-container" :class="{ 'is-panning': isPanning }" :style="canvasCursorStyle"
            ref="canvasContainerRef" @mousedown="handleCanvasContainerMousedown" @dragover="handleDragOver"
            @dragleave="handleDragLeave" @drop="handleDrop">

            <!-- No grid overlay for world maps -->

            <!-- The transform plane -->
            <div class="canvas" :style="[canvasTransformStyle, canvasSizeStyle]">

                <!-- Background map image -->
                <img v-if="backgroundImage" :src="backgroundImage.url" class="canvas-bg-image" draggable="false" />

                <!-- Canvas tokens (character + culture) -->
                <div v-for="item in displayCanvasItems" :key="item.id" class="canvas-item edit-hover-area"
                    :ref="(el) => registerTokenRef(item.id, el)"
                    :class="{ 'is-dragging': isDragging(item.id), 'is-hidden-token': item.isHidden, 'is-locked-culture': item.tokenType === 'culture' && cultureTokensLocked }"
                    :style="{ transform: `translate(${item.x}px, ${item.y}px)`, zIndex: item.zIndex }"
                    @mousedown="(e) => handleTokenMousedown(item, e)" @click="(e) => handleCanvasItemClick(item, e)">
                    <!-- Culture token -->
                    <CultureToken v-if="item.tokenType === 'culture'" :culture="resolveCultureById(item.cultureId)"
                        :is-placed="true" :show-permanent-name="true" :size="item.size"
                        :show-remove-fab="isGM && !cultureTokensLocked"
                        @remove="removeCultureTokenFromCanvas(item.cultureId)" />
                    <!-- Character token: use live portrait/name from the store to avoid stale snapshots -->
                    <TabletopToken v-else :name="resolveCurrentName(item)"
                        :portrait-url="resolveCurrentPortraitUrl(item)" :is-beast="item.isBeast" :is-npc="item.isNpc"
                        :size="item.size" :grid-size="1" :is-selected="isSelected(item.id)" :in-engagement="false" />
                    <TabletopTokenInfoArea
                        v-if="item.tokenType !== 'culture' && singleSelectedToken?.id === item.id && canViewTokenInfo"
                        :character="singleSelectedCharacter" :can-edit="canEditTokenInfo" :is-in-engagement="false"
                        :can-toggle-visibility="isGM" :cmd-held="isCmdHeld" :is-hidden="item.isHidden ?? false"
                        @expand="openCharacterSheetPopup" @character-saved="onCharacterSaved"
                        @toggle-visibility="toggleTokenVisibility" />
                </div>

                <!-- Ghost tokens (drag preview) -->
                <div v-for="ghost in activeGhosts" :key="`${ghost.x}-${ghost.y}-${ghost.name}`"
                    class="canvas-item canvas-item--ghost"
                    :style="{ transform: `translate(${ghost.x}px, ${ghost.y}px)`, zIndex: 9999 }">
                    <CultureToken v-if="ghost.tokenType === 'culture'"
                        :culture="{ name: ghost.name, featuredArtUrls: [ghost.portraitUrl] }" :is-placed="true"
                        :size="ghost.size" />
                    <TabletopToken v-else :name="ghost.name" :portrait-url="ghost.portraitUrl" :is-beast="ghost.isBeast"
                        :is-npc="ghost.isNpc" :size="ghost.size" :grid-size="1" :is-ghost="true" />
                </div>

                <!-- Rubber-band selection rect -->
                <div v-if="isSelecting && selectionRectCanvas" class="selection-rect" :style="{
                    left: `${Math.min(selectionRectCanvas.x1, selectionRectCanvas.x2)}px`,
                    top: `${Math.min(selectionRectCanvas.y1, selectionRectCanvas.y2)}px`,
                    width: `${Math.abs(selectionRectCanvas.x2 - selectionRectCanvas.x1)}px`,
                    height: `${Math.abs(selectionRectCanvas.y2 - selectionRectCanvas.y1)}px`,
                }" />
            </div>

            <!-- Measurement overlays (linear only; no radius) -->
            <template v-if="isMeasuring && measureTracks.length > 0">
                <TabletopMeasurementOverlay v-for="(track, i) in measureTracks" :key="`track-${i}`"
                    :waypoints="track.waypoints" :current-point="track.currentPoint" :transform="transform"
                    :grid-size="1" :exact-mode="true" :token-size="1" :show-paths="false"
                    :pixels-per-mile="pixelsPerMile" />
            </template>
            <TabletopMeasurementOverlay v-else-if="isMeasuring" :waypoints="measureWaypoints"
                :current-point="measureCurrent" :transform="transform" :grid-size="1" :exact-mode="true" :token-size="1"
                :show-paths="false" :pixels-per-mile="pixelsPerMile" />

            <!-- Linear scale bar -->
            <WorldMapLinearScale :transform="transform" :pixels-per-mile="pixelsPerMile" />

            <!-- Roll chatlog -->
            <TabletopChatlog :roll-log="rollLog" :is-expanded="rollLogExpanded"
                @update:is-expanded="setRollLogExpanded" />
        </div>

        <!-- Toolbar -->
        <Teleport to="body">
            <div class="tabletop-toolbar-portal">
                <TabletopToolbar :scale="transform.scale" :grid-size="1" :grid-color="'#ffffff'" :grid-opacity="0"
                    :item-count="canvasItems.length" :can-undo="canUndo" :can-redo="canRedo"
                    :has-background="!!backgroundImage" :map-scale="mapScale" :show-paths="false"
                    :is-g-m="campaignStore.isGMInActiveCampaign" :is-world-map="true" :pixels-per-mile="pixelsPerMile"
                    :character-token-size="characterTokenSize" :culture-token-size="cultureTokenSize"
                    @zoom-in="adjustZoom(1.2)" @zoom-out="adjustZoom(1 / 1.2)" @increase-map-scale="increaseMapScale"
                    @decrease-map-scale="decreaseMapScale" @clear-all="clearAll" @undo="undo" @redo="redo"
                    @set-background="setBackgroundImage" @clear-background="clearBackgroundImage"
                    @clear-log="clearRollLog" @increase-pixels-per-mile="increasePixelsPerMile"
                    @decrease-pixels-per-mile="decreasePixelsPerMile"
                    @update-character-token-size="setAndResizeCharacterTokens"
                    @update-culture-token-size="setAndResizeCultureTokens" />
            </div>
        </Teleport>

        <!-- Character sheet popup -->
        <Teleport to="body">
            <CharacterSheetPopup v-if="charSheetPopupOpen && charSheetPopupCharacter"
                :character="charSheetPopupCharacter" @close="charSheetPopupOpen = false" />
        </Teleport>

        <!-- Campaign questions button (top-right, shifts left with chatlog) -->
        <Teleport to="body">
            <CampaignQuestionsButton />
        </Teleport>
    </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAuthStore } from '@/stores/authStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useTabletopCanvas } from '@/composables/useTabletopCanvas'
import { useTabletopSync } from '@/composables/useTabletopSync'
import { useTabletopSharedCanvas } from '@/composables/useTabletopSharedCanvas'
import { useTabletopRollLog } from '@/composables/useTabletopRollLog'
import TabletopToken from '@/components/features/tabletop/TabletopToken.vue'
import TabletopToolbar from '@/components/features/tabletop/TabletopToolbar.vue'
import TabletopMeasurementOverlay from '@/components/features/tabletop/TabletopMeasurementOverlay.vue'
import TabletopTokenInfoArea from '@/components/features/tabletop/TabletopTokenInfoArea.vue'
import TabletopChatlog from '@/components/features/tabletop/TabletopChatlog.vue'
import CharacterSheetPopup from '@/components/features/tabletop/CharacterSheetPopup.vue'
import CultureToken from '@/components/features/worldMap/CultureToken.vue'
import WorldMapLinearScale from '@/components/features/worldMap/WorldMapLinearScale.vue'
import CampaignQuestionsButton from '@/components/features/worldMap/CampaignQuestionsButton.vue'
import { createDefaultWorldMap } from '@shared/types/tabletop.js'
import { createSlug } from '@/utils/urlHelpers'
import rulerCursorUrl from '@/assets/icons/cursor/ruler.png'

const route = useRoute()
const _router = useRouter()
const campaignStore = useCampaignStore()
const authStore = useAuthStore()
const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()

const campaignSlug = computed(() => route.params.slug)
const campaign = computed(() => campaignStore.getBySlug(campaignSlug.value))
const campaignId = computed(() => campaign.value?.id)
const worldMapTabletopId = computed(() => campaign.value?.worldMapTabletopId ?? null)

const isGM = computed(() => campaignStore.isGMInActiveCampaign || authStore.isAdmin)

// ─── Canvas ──────────────────────────────────────────────────────────────────
let _broadcastStateUpdateRef = null
function broadcastStateUpdate(snapshot) {
    _broadcastStateUpdateRef?.(snapshot)
}

const {
    canvasContainerRef,
    canvasItems,
    transform,
    backgroundImage,
    mapScale,
    canvasTransformStyle,
    canvasSizeStyle,
    activeGhosts,
    canUndo,
    canRedo,
    undo,
    redo,
    selectedIds,
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
    registerTokenRef,
    handleWheel,
    handleContainerMousedown,
    handleTokenMousedown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    adjustZoom,
    increaseMapScale,
    decreaseMapScale,
    setBackgroundImage,
    clearBackgroundImage,
    setTokenVisibility,
    removeCultureToken,
    clearAll,
    loadState,
    saveState,
    recordSnapshot,
    rollLog,
    rollLogExpanded,
    setRollLogExpanded,
    clearRollLog,
    applyExternalState,
    pixelsPerMile,
    characterTokenSize,
    cultureTokenSize,
    cultureTokensLocked,
    increasePixelsPerMile,
    decreasePixelsPerMile,
    setCharacterTokenSize,
    setCultureTokenSize,
    setCultureTokensLocked,
} = useTabletopCanvas(campaignId, worldMapTabletopId, {
    isWorldMap: true,
    onStateSaved: (snapshot) => broadcastStateUpdate(snapshot),
})

const { broadcastStateUpdate: _syncBroadcast, broadcastCharacterUpdate } = useTabletopSync({
    tabletopId: worldMapTabletopId,
    campaignId,
    applyExternalState,
    onActiveTabletopChanged: () => { },
})
_broadcastStateUpdateRef = _syncBroadcast

// ─── Shared canvas ───────────────────────────────────────────────────────────
const sharedCanvas = useTabletopSharedCanvas()
sharedCanvas.init(canvasItems, saveState, recordSnapshot, { isWorldMap: true })
sharedCanvas.registerToggleCultureLock(() => {
    setCultureTokensLocked(!cultureTokensLocked.value)
})
watch(canvasItems, (items) => {
    sharedCanvas.syncFromCanvas(items)
}, { immediate: true, deep: true })

// Sync culture lock state to shared canvas so PinnedTokensContainer can read it
watch(cultureTokensLocked, (locked) => {
    sharedCanvas.setCultureTokensLockedState(locked)
}, { immediate: true })

// ─── Roll log ────────────────────────────────────────────────────────────────
const { clearBubbles } = useTabletopRollLog({
    canvasItems,
    rollLog,
    saveStateFn: saveState,
    tabletopId: worldMapTabletopId,
    campaignId,
})

// ─── Culture token helpers ────────────────────────────────────────────────────
function resolveCultureById(id) {
    if (!id) return null
    return conceptsStore.cultures.find(c => c.id === id) ?? null
}

/** Resolve the current portrait URL from the live store to avoid stale canvas snapshots (issue #5). */
function resolveCurrentPortraitUrl(item) {
    if (!item.characterId) return item.portraitUrl
    const char = charactersStore.getById(item.characterId)
        ?? campaignStore.campaignCharacters.find(c => c.id === item.characterId)
    if (!char) return item.portraitUrl
    return char.featuredArtUrls?.[0] ?? char.artUrls?.[0] ?? item.portraitUrl
}

function resolveCurrentName(item) {
    if (!item.characterId) return item.name
    const char = charactersStore.getById(item.characterId)
        ?? campaignStore.campaignCharacters.find(c => c.id === item.characterId)
    return char?.name ?? item.name
}

/** When a locked culture token is clicked, navigate to its detail page on CulturesPage. */
function handleCanvasItemClick(item, _e) {
    if (item.tokenType === 'culture' && cultureTokensLocked.value) {
        const culture = resolveCultureById(item.cultureId)
        if (culture?.name) {
            _router.push(`/cultures/${createSlug(culture.name)}`)
        }
    }
}

function removeCultureTokenFromCanvas(cultureId) {
    if (!cultureId) return
    recordSnapshot()
    removeCultureToken(cultureId)
}

// When cultureTokenSize changes, resize all existing culture tokens keeping center position
function setAndResizeCultureTokens(size) {
    setCultureTokenSize(size)
    for (const item of canvasItems.value) {
        if (item.tokenType === 'culture') {
            const oldSize = item.size
            item.x += (oldSize - size) / 2
            item.y += (oldSize - size) / 2
            item.size = size
        }
    }
    saveState()
}

// When characterTokenSize changes, resize all existing character tokens keeping center position
function setAndResizeCharacterTokens(size) {
    setCharacterTokenSize(size)
    for (const item of canvasItems.value) {
        if (item.tokenType !== 'culture') {
            const oldSize = item.size
            item.x += (oldSize - size) / 2
            item.y += (oldSize - size) / 2
            item.size = size
        }
    }
    saveState()
}

// ─── Token display ────────────────────────────────────────────────────────────
const displayCanvasItems = computed(() => {
    if (isGM.value) return canvasItems.value
    return canvasItems.value.filter(item => !item.isHidden)
})

// ─── Selection helpers ────────────────────────────────────────────────────────
const singleSelectedToken = computed(() => {
    if (selectedIds.value.size !== 1) return null
    const [id] = selectedIds.value
    return canvasItems.value.find(item => item.id === id) ?? null
})

const singleSelectedCharacter = computed(() => {
    const token = singleSelectedToken.value
    if (!token?.characterId) return null
    return charactersStore.getById(token.characterId)
        ?? campaignStore.campaignCharacters.find(c => c.id === token.characterId)
        ?? null
})

const canViewTokenInfo = computed(() => {
    if (!singleSelectedToken.value || !singleSelectedCharacter.value) return false
    if (isGM.value) return true
    const userId = authStore.user?.uid
    if (!userId) return false
    const charId = singleSelectedCharacter.value.id
    for (const myChar of charactersStore.filteredCharacters) {
        if (myChar.id === charId) return true
    }
    return false
})

const canEditTokenInfo = computed(() => {
    const char = singleSelectedCharacter.value
    if (!char) return false
    if (isGM.value) return true
    return !!authStore.user?.uid && char.ownerId === authStore.user?.uid
})

function toggleTokenVisibility() {
    const token = singleSelectedToken.value
    if (!token) return
    setTokenVisibility(token.id, !token.isHidden)
}

// ─── Cursor style ─────────────────────────────────────────────────────────────
const canvasCursorStyle = computed(() => {
    if (isPanning.value) return { cursor: 'grabbing' }
    if (isShiftHeld.value) return { cursor: `url('${rulerCursorUrl}') 8 8, crosshair` }
    return {}
})

// ─── Character sheet popup ────────────────────────────────────────────────────
const charSheetPopupOpen = ref(false)
const charSheetPopupCharacter = ref(null)

function openCharacterSheetPopup() {
    const char = singleSelectedCharacter.value
    if (!char) return
    charSheetPopupCharacter.value = char
    charSheetPopupOpen.value = true
}

function handleCanvasContainerMousedown(e) {
    handleContainerMousedown(e)
    if (e.button === 0 && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        clearBubbles?.()
    }
}

function onCharacterSaved(character) {
    broadcastCharacterUpdate(character)
}

// ─── World map tabletop setup ─────────────────────────────────────────────────
// Ensure a world map tabletop exists for this campaign; create one if not.
async function ensureWorldMap() {
    const cid = campaignId.value
    if (!cid) return

    // Fetch tabletops if not loaded
    if (!campaignStore.tabletops.length) {
        await campaignStore.fetchTabletops(cid)
    }

    let wmId = campaign.value?.worldMapTabletopId
    if (wmId) {
        // Verify the tabletop is in the store
        const exists = campaignStore.tabletops.some(t => t.id === wmId)
        if (!exists) {
            await campaignStore.fetchTabletops(cid)
        }
        loadState()
        return
    }

    // No world map yet – create one.
    // The backend sets worldMapTabletopId on the campaign during creation, so the
    // store is already updated via upsertCampaign() inside campaignStore.createTabletop().
    await campaignStore.createTabletop(cid, createDefaultWorldMap(cid))
    loadState()
}

watch(campaignId, async (id) => {
    if (!id) return
    const fetches = []
    if (!charactersStore.characters.length) fetches.push(charactersStore.fetch())
    if (!conceptsStore.cultures.length) fetches.push(conceptsStore.fetch())
    // Always re-fetch campaign characters to ensure NPC portrait URLs are current (issue #5).
    fetches.push(campaignStore.fetchCampaignCharacters(id))
    await Promise.all(fetches)
    await ensureWorldMap()
}, { immediate: true })

onUnmounted(() => {
    // Reset world map state so PinnedTokensContainer returns to its regular mode
    // when navigating away from the world map page (issue #6).
    sharedCanvas.deactivateWorldMap()
})
</script>

<style scoped>
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
    --vtt-toolbar-height: 38px;
}

.canvas-container.is-panning,
.canvas-container.is-panning * {
    cursor: grabbing !important;
}

.canvas {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    will-change: transform;
    z-index: 2;
}

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

.canvas-item {
    position: absolute;
    left: 0;
    top: 0;
    cursor: pointer;
    overflow: visible;
}

.canvas-item.is-dragging {
    cursor: grabbing;
    opacity: 0.6;
}

.canvas-item.is-hidden-token {
    opacity: 0.6;
}

.canvas-item.is-locked-culture {
    cursor: default;
}

/* Ensure locked culture tokens show the default cursor even on inner elements */
.canvas-item.is-locked-culture :deep(.culture-token-wrapper) {
    cursor: default;
}

/* Unlocked culture tokens on the canvas use the grab cursor */
.canvas-item :deep(.culture-token-wrapper) {
    cursor: grab;
}

.canvas-item--ghost {
    pointer-events: none;
}

.selection-rect {
    position: absolute;
    border: 1px solid var(--color-text-primary);
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
    z-index: 9998;
}

.tabletop-toolbar-portal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: calc(var(--z-badge) + 1);
}
</style>
