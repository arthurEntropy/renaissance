<template>
    <div class="section-card full-width-section world-map-section">
        <div class="section-header">
            <h2 class="section-title">World Map</h2>

            <FloatingActionButton :variant="FAB_TYPES.EXPAND" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ALWAYS" title="Open full-page world map" @click="openWorldMap" />
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="world-map-loading">
            <p>Loading world map…</p>
        </div>

        <!-- Preview -->
        <div v-else ref="previewRef" class="world-map-preview" :class="{ 'is-panning': isPanning }"
            :style="previewAspectRatio ? { aspectRatio: previewAspectRatio } : {}" @wheel.prevent="onWheel"
            @mousedown="onMousedown" @contextmenu.prevent>
            <div class="preview-canvas" :style="canvasStyle">
                <img v-if="worldMap?.backgroundImage?.url" :src="worldMap.backgroundImage.url" class="preview-bg"
                    draggable="false" />

                <div v-else class="preview-empty">
                    <span class="preview-empty-text">
                        No map image set
                    </span>
                </div>

                <!-- World map tokens -->
                <div v-for="item in worldMap?.items || []" :key="item.id" class="preview-token" :style="{
                    transform: `translate(${item.x}px, ${item.y}px)`
                }">
                    <CultureToken v-if="item.tokenType === 'culture'" :culture="resolveCultureById(item.cultureId)"
                        :is-placed="true" :size="item.size" :show-remove-fab="false" />

                    <TabletopToken v-else :name="item.name" :portrait-url="item.portraitUrl" :is-beast="item.isBeast"
                        :is-npc="item.isNpc" :size="item.size" :grid-size="1" :in-engagement="false" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {
    computed,
    ref,
    watch,
    nextTick,
    onMounted,
    onBeforeUnmount
} from 'vue'
import { useRouter } from 'vue-router'

import { useCampaignStore } from '@/stores/campaignStore'
import { useConceptsStore } from '@/stores/conceptsStore'

import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CultureToken from '@/components/features/worldMap/CultureToken.vue'
import TabletopToken from '@/components/features/tabletop/TabletopToken.vue'

import {
    FAB_TYPES,
    FAB_SIZES,
    FAB_VISIBILITIES
} from '@/constants/fab'

const MAX_SCALE = 4

const props = defineProps({
    campaignSlug: {
        type: String,
        required: true
    }
})

const router = useRouter()

const campaignStore = useCampaignStore()
const conceptsStore = useConceptsStore()

const campaign = computed(() =>
    campaignStore.getBySlug(props.campaignSlug)
)

const campaignId = computed(() => campaign.value?.id)

const isLoading = ref(false)

const worldMap = computed(() => {
    const wmId = campaign.value?.worldMapTabletopId
    if (!wmId) return null

    return campaignStore.tabletops.find(t => t.id === wmId) ?? null
})

watch(
    campaignId,
    async id => {
        if (!id) return

        const wmId = campaign.value?.worldMapTabletopId

        if (wmId) {
            if (!campaignStore.tabletops.some(t => t.id === wmId)) {
                isLoading.value = true
                await campaignStore.fetchTabletops(id)
                isLoading.value = false
            }

            return
        }

        // World map will be created when the GM opens the full page.
    },
    { immediate: true }
)

function openWorldMap() {
    router.push(`/campaigns/${props.campaignSlug}/world-map`)
}

function resolveCultureById(id) {
    if (!id) return null
    return conceptsStore.cultures.find(c => c.id === id) ?? null
}

/* ------------------------------------------------------------------
* Preview transform state
* ------------------------------------------------------------------ */

const previewRef = ref(null)

const previewTransform = ref({
    x: 0,
    y: 0,
    scale: 1
})

const fitScale = ref(1)

const isPanning = ref(false)

const panStart = ref({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0
})

const resizeObserver = ref(null)

/* ------------------------------------------------------------------
* Map dimensions
* ------------------------------------------------------------------ */

const mapWidth = computed(() => {
    if (!worldMap.value?.backgroundImage) return 0

    return (
        worldMap.value.backgroundImage.naturalWidth *
        (worldMap.value.mapScale ?? 1)
    )
})

const mapHeight = computed(() => {
    if (!worldMap.value?.backgroundImage) return 0

    return (
        worldMap.value.backgroundImage.naturalHeight *
        (worldMap.value.mapScale ?? 1)
    )
})

const previewAspectRatio = computed(() => {
    if (!mapWidth.value || !mapHeight.value) return null

    return `${mapWidth.value} / ${mapHeight.value}`
})

const canvasStyle = computed(() => ({
    width: mapWidth.value
        ? `${mapWidth.value}px`
        : '100%',

    height: mapHeight.value
        ? `${mapHeight.value}px`
        : '100%',

    transform: `translate(${previewTransform.value.x}px, ${previewTransform.value.y}px) scale(${previewTransform.value.scale})`,
    transformOrigin: '0 0'
}))
/* ------------------------------------------------------------------
* Transform helpers
* ------------------------------------------------------------------ */

/**
 * Calculates the bounds that keep the map completely inside the preview.
 *
 * When zoomed in:
 *   - The map can move until its edge reaches the viewport edge.
 *
 * When zoomed out / fitted:
 *   - The map remains centered if it is smaller than the viewport.
 */
function getTransformBounds(scale = previewTransform.value.scale) {
    const container = previewRef.value

    if (!container || !mapWidth.value || !mapHeight.value) {
        return {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        }
    }

    const {
        width: containerWidth,
        height: containerHeight
    } = container.getBoundingClientRect()

    const scaledWidth = mapWidth.value * scale
    const scaledHeight = mapHeight.value * scale

    const minX = Math.min(
        containerWidth - scaledWidth,
        0
    )

    const maxX = Math.max(
        containerWidth - scaledWidth,
        0
    )

    const minY = Math.min(
        containerHeight - scaledHeight,
        0
    )

    const maxY = Math.max(
        containerHeight - scaledHeight,
        0
    )

    return {
        minX,
        maxX,
        minY,
        maxY
    }
}

function clampTransform(transform) {
    const bounds = getTransformBounds(transform.scale)

    return {
        ...transform,
        x: Math.min(
            bounds.maxX,
            Math.max(bounds.minX, transform.x)
        ),
        y: Math.min(
            bounds.maxY,
            Math.max(bounds.minY, transform.y)
        )
    }
}

/**
 * Calculates the default view:
 * - Entire map visible
 * - Width fills available space
 * - Centered vertically/horizontally when necessary
 */
function fitToContainer() {
    const container = previewRef.value

    if (!container || !mapWidth.value || !mapHeight.value) {
        return
    }

    const {
        width: containerWidth,
        height: containerHeight
    } = container.getBoundingClientRect()

    const scale = containerWidth / mapWidth.value

    fitScale.value = scale

    const scaledWidth = mapWidth.value * scale
    const scaledHeight = mapHeight.value * scale

    previewTransform.value = {
        scale,
        x: (containerWidth - scaledWidth) / 2,
        y: (containerHeight - scaledHeight) / 2
    }

    previewTransform.value = clampTransform(
        previewTransform.value
    )
}

/**
 * Keeps the current zoom level but re-centers/clamps after resize.
 */
function constrainCurrentTransform() {
    previewTransform.value = clampTransform(
        previewTransform.value
    )
}


/* ------------------------------------------------------------------
* Resize handling
* ------------------------------------------------------------------ */

function setupResizeObserver() {
    if (!previewRef.value) return

    resizeObserver.value = new ResizeObserver(() => {
        if (!previewTransform.value.scale ||
            previewTransform.value.scale === fitScale.value) {
            fitToContainer()
            return
        }

        constrainCurrentTransform()
    })

    resizeObserver.value.observe(previewRef.value)
}


/* ------------------------------------------------------------------
* Map loading / initialization
* ------------------------------------------------------------------ */

watch(
    worldMap,
    async map => {
        if (!map?.backgroundImage) {
            fitScale.value = 1

            previewTransform.value = {
                x: 0,
                y: 0,
                scale: 1
            }

            return
        }

        await nextTick()

        fitToContainer()
    },
    {
        immediate: true
    }
)

onMounted(() => {
    nextTick(() => {
        setupResizeObserver()
        fitToContainer()
    })
})

onBeforeUnmount(() => {
    resizeObserver.value?.disconnect()

    removePanListeners()
})
/* ------------------------------------------------------------------
* Zoom
* ------------------------------------------------------------------ */

function onWheel(e) {
    const container = previewRef.value

    if (!container || !mapWidth.value || !mapHeight.value) {
        return
    }

    const rect = container.getBoundingClientRect()

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomFactor = e.deltaY < 0
        ? 1.12
        : 1 / 1.12

    const current = previewTransform.value

    const newScale = Math.max(
        fitScale.value,
        Math.min(
            fitScale.value * MAX_SCALE,
            current.scale * zoomFactor
        )
    )

    // Keep the point under the mouse stationary while zooming.
    const mapX = (mouseX - current.x) / current.scale
    const mapY = (mouseY - current.y) / current.scale

    const nextTransform = {
        scale: newScale,
        x: mouseX - mapX * newScale,
        y: mouseY - mapY * newScale
    }

    previewTransform.value = clampTransform(nextTransform)
}


/* ------------------------------------------------------------------
* Panning
* ------------------------------------------------------------------ */

function onMousedown(e) {
    // Preserve existing behavior: right mouse button pans.
    if (e.button !== 2) return

    isPanning.value = true

    panStart.value = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        startX: previewTransform.value.x,
        startY: previewTransform.value.y
    }

    window.addEventListener(
        'mousemove',
        onMousemove
    )

    window.addEventListener(
        'mouseup',
        onMouseup
    )
}

function onMousemove(e) {
    if (!isPanning.value) return

    const nextTransform = {
        ...previewTransform.value,

        x:
            panStart.value.startX +
            (e.clientX - panStart.value.mouseX),

        y:
            panStart.value.startY +
            (e.clientY - panStart.value.mouseY)
    }

    previewTransform.value = clampTransform(
        nextTransform
    )
}

function onMouseup() {
    if (!isPanning.value) return

    isPanning.value = false

    removePanListeners()
}

function removePanListeners() {
    window.removeEventListener(
        'mousemove',
        onMousemove
    )

    window.removeEventListener(
        'mouseup',
        onMouseup
    )
}

</script>

<style scoped>
@import '../campaigns/lobby/lobbyShared.css';

.world-map-section {
    gap: var(--space-md);
}

.world-map-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
}

.world-map-preview {
    position: relative;
    width: 100%;
    border-radius: var(--radius-10);
    overflow: hidden;
    background: var(--overlay-black-heavy);
    user-select: none;
    touch-action: none;
}

.world-map-preview.is-panning {
    cursor: grabbing;
}

.preview-canvas {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    will-change: transform;
}

.preview-bg {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    -webkit-user-drag: none;
}

.preview-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-empty-text {
    font-size: var(--font-size-14);
    color: var(--color-text-muted);
    font-style: italic;
}

.preview-token {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
}

/*
 * Preview is read-only:
 * suppress token hover/click behavior.
 */
.preview-token :deep(.character-token) {
    cursor: default;
    pointer-events: none;
}

.preview-token :deep(.character-token:hover) {
    transform: none;
}

.preview-token :deep(.culture-token-wrapper) {
    cursor: default;
    pointer-events: none;
}
</style>
