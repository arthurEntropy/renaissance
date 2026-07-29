<template>
    <div ref="trackerRef" class="bane-boon-tracker" @mousedown.prevent.stop="handleMousedown">
        <img :src="BG_IMAGE_URL" class="bane-boon-bg" alt="" draggable="false" />
        <div class="bane-boon-indicator" :style="indicatorStyle" />
    </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useCampaignStore } from '@/stores/campaignStore'

const BG_IMAGE_URL = 'https://cdn.midjourney.com/620642b1-2018-4893-8891-865056e5478c/0_0.png'

const campaignStore = useCampaignStore()

const trackerRef = ref(null)

// Local override during drag for immediate visual feedback
const localPosition = ref(null)

const position = computed(() =>
    localPosition.value !== null
        ? localPosition.value
        : (campaignStore.activeCampaign?.baneBoonPosition ?? 0.5)
)

const indicatorStyle = computed(() => ({
    left: `${position.value * 100}%`,
}))

// ── Drag handling ─────────────────────────────────────────────────────────────

function resolvePosition(e) {
    const el = trackerRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    localPosition.value = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
}

function handleMousedown(e) {
    resolvePosition(e)
    window.addEventListener('mousemove', handleMousemove)
    window.addEventListener('mouseup', handleMouseup)
}

function handleMousemove(e) {
    resolvePosition(e)
}

function handleMouseup() {
    window.removeEventListener('mousemove', handleMousemove)
    window.removeEventListener('mouseup', handleMouseup)
    persist()
}

function persist() {
    const pos = localPosition.value
    if (pos === null) return
    const campaignId = campaignStore.activeCampaign?.id
    if (!campaignId) return
    campaignStore.updateBaneBoonPosition(campaignId, pos)
    localPosition.value = null
}

onUnmounted(() => {
    window.removeEventListener('mousemove', handleMousemove)
    window.removeEventListener('mouseup', handleMouseup)
})
</script>

<style scoped>
.bane-boon-tracker {
    position: relative;
    width: 100%;
    aspect-ratio: 139 / 34;
    cursor: ew-resize;
    user-select: none;
    overflow: hidden;
    flex-shrink: 0;
}

.bane-boon-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
}

.bane-boon-indicator {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-accent-gold, #f0b429);
    pointer-events: none;
    animation: bane-boon-glow 2s ease-in-out infinite alternate;
}

@keyframes bane-boon-glow {
    from {
        box-shadow:
            0 0 6px 2px rgba(240, 180, 41, 0.7),
            0 0 14px 5px rgba(240, 120, 0, 0.3);
    }

    to {
        box-shadow:
            0 0 14px 6px rgba(255, 220, 80, 1),
            0 0 28px 12px rgba(240, 150, 0, 0.55);
    }
}
</style>
