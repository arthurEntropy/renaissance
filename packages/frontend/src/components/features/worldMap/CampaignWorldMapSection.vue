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

        <!-- Preview canvas -->
        <div v-else class="world-map-preview" ref="previewRef" @wheel.prevent="onWheel" @mousedown="onMousedown"
            @mousemove="onMousemove" @mouseup="onMouseup" @mouseleave="onMouseup">

            <div class="preview-canvas" :style="canvasStyle">
                <img v-if="worldMap?.backgroundImage?.url" :src="worldMap.backgroundImage.url" class="preview-bg"
                    draggable="false" />
                <div v-else class="preview-empty">
                    <span class="preview-empty-text">No map image set</span>
                </div>

                <!-- Tokens on the world map -->
                <div v-for="item in worldMap?.items || []" :key="item.id" class="preview-token"
                    :style="{ transform: `translate(${item.x}px, ${item.y}px)` }">
                    <div class="preview-token-dot"
                        :class="item.tokenType === 'culture' ? 'preview-token-dot--culture' : item.isNpc ? 'preview-token-dot--npc' : 'preview-token-dot--pc'" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaignStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    campaignSlug: { type: String, required: true },
})

const router = useRouter()
const campaignStore = useCampaignStore()

const campaign = computed(() => campaignStore.getBySlug(props.campaignSlug))
const campaignId = computed(() => campaign.value?.id)
const isLoading = ref(false)

// The world map tabletop
const worldMap = computed(() => {
    const wmId = campaign.value?.worldMapTabletopId
    if (!wmId) return null
    return campaignStore.tabletops.find(t => t.id === wmId) ?? null
})

// Ensure world map tabletop exists when campaign is ready
watch(campaignId, async (id) => {
    if (!id) return
    const wmId = campaign.value?.worldMapTabletopId
    if (wmId) {
        // Fetch tabletops to make sure world map is loaded
        if (!campaignStore.tabletops.some(t => t.id === wmId)) {
            isLoading.value = true
            await campaignStore.fetchTabletops(id)
            isLoading.value = false
        }
        return
    }
    // No world map yet — GM creates it on first visit to full page
}, { immediate: true })

function openWorldMap() {
    router.push(`/campaigns/${props.campaignSlug}/world-map`)
}

// ─── Zoomable/draggable preview canvas ───────────────────────────────────────
const previewRef = ref(null)
const previewTransform = ref({ x: 0, y: 0, scale: 1 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0, tx: 0, ty: 0 })

const canvasStyle = computed(() => ({
    transform: `translate(${previewTransform.value.x}px, ${previewTransform.value.y}px) scale(${previewTransform.value.scale})`,
    transformOrigin: '0 0',
    width: worldMap.value?.backgroundImage
        ? `${worldMap.value.backgroundImage.naturalWidth * (worldMap.value.mapScale ?? 1)}px`
        : '100%',
    height: worldMap.value?.backgroundImage
        ? `${worldMap.value.backgroundImage.naturalHeight * (worldMap.value.mapScale ?? 1)}px`
        : '100%',
}))

// Reset view when world map loads/changes
watch(worldMap, (map) => {
    if (!map?.backgroundImage) {
        previewTransform.value = { x: 0, y: 0, scale: 1 }
        return
    }
    // Fit the map to the preview container
    const container = previewRef.value
    if (!container) return
    const { width, height } = container.getBoundingClientRect()
    const mapW = map.backgroundImage.naturalWidth * (map.mapScale ?? 1)
    const mapH = map.backgroundImage.naturalHeight * (map.mapScale ?? 1)
    const scale = Math.min(width / mapW, height / mapH, 1)
    previewTransform.value = {
        scale,
        x: (width - mapW * scale) / 2,
        y: (height - mapH * scale) / 2,
    }
}, { immediate: true })

function onWheel(e) {
    const container = previewRef.value
    if (!container) return
    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const newScale = Math.max(0.05, Math.min(4, previewTransform.value.scale * factor))
    const cx = (mouseX - previewTransform.value.x) / previewTransform.value.scale
    const cy = (mouseY - previewTransform.value.y) / previewTransform.value.scale
    previewTransform.value = {
        scale: newScale,
        x: mouseX - cx * newScale,
        y: mouseY - cy * newScale,
    }
}

function onMousedown(e) {
    if (e.button !== 0) return
    isPanning.value = true
    panStart.value = {
        x: e.clientX,
        y: e.clientY,
        tx: previewTransform.value.x,
        ty: previewTransform.value.y,
    }
}

function onMousemove(e) {
    if (!isPanning.value) return
    previewTransform.value = {
        ...previewTransform.value,
        x: panStart.value.tx + (e.clientX - panStart.value.x),
        y: panStart.value.ty + (e.clientY - panStart.value.y),
    }
}

function onMouseup() {
    isPanning.value = false
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
    height: 320px;
    border-radius: var(--radius-10);
    overflow: hidden;
    background: var(--overlay-black-heavy);
    cursor: grab;
    user-select: none;
}

.world-map-preview:active {
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
}

.preview-token-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.8);
}

.preview-token-dot--pc {
    background: var(--color-token-border-pc, #4a9eff);
}

.preview-token-dot--npc {
    background: var(--color-token-border-npc, #ff6b35);
}

.preview-token-dot--culture {
    background: var(--color-primary, goldenrod);
    border-radius: var(--radius-3, 3px);
}
</style>
