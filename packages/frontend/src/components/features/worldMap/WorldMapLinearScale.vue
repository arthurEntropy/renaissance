<template>
    <!-- Linear scale bar showing real-world distance at the current zoom level -->
    <div class="world-map-scale" :style="containerStyle">
        <div class="scale-bar-wrap">
            <div class="scale-bar" :style="barStyle" />
            <div class="scale-ticks">
                <div class="scale-tick scale-tick--left" />
                <div class="scale-tick scale-tick--mid" />
                <div class="scale-tick scale-tick--right" />
            </div>
        </div>
        <div class="scale-labels">
            <span class="scale-label scale-label--zero">0</span>
            <span class="scale-label scale-label--half">{{ halfLabel }}</span>
            <span class="scale-label scale-label--full">{{ fullLabel }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    /** Current canvas transform { x, y, scale } */
    transform: { type: Object, required: true },
    /** How many canvas pixels represent one mile */
    pixelsPerMile: { type: Number, default: 40 },
})

// Target bar width in screen pixels (target ~160px; we'll snap to a nice distance)
const TARGET_BAR_PX = 160

// Compute the most legible round distance that makes a bar close to TARGET_BAR_PX wide.
const niceDistance = computed(() => {
    // Screen pixels per mile at current zoom
    const screenPxPerMile = props.pixelsPerMile * props.transform.scale

    // Raw miles that would fill the target width
    const rawMiles = TARGET_BAR_PX / screenPxPerMile

    // Snap to a "nice" number of miles
    const niceMiles = [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000]
    return niceMiles.reduce((best, m) => {
        return Math.abs(m - rawMiles) < Math.abs(best - rawMiles) ? m : best
    }, niceMiles[0])
})

// Actual bar width in screen pixels for the snapped distance
const barWidthPx = computed(() =>
    niceDistance.value * props.pixelsPerMile * props.transform.scale
)

const halfLabel = computed(() => formatDistance(niceDistance.value / 2))
const fullLabel = computed(() => formatDistance(niceDistance.value))

function formatDistance(miles) {
    if (miles < 1) {
        const feet = Math.round(miles * 5280)
        return `${feet} ft`
    }
    if (miles >= 10) return `${Math.round(miles)} mi`
    return `${miles % 1 === 0 ? miles : miles.toFixed(2).replace(/\.?0+$/, '')} mi`
}

const barStyle = computed(() => ({
    width: `${barWidthPx.value}px`,
}))

const containerStyle = computed(() => ({
    // Keep the bar right-aligned so it doesn't shift when chatlog expands
}))
</script>

<style scoped>
.world-map-scale {
    position: absolute;
    bottom: 52px;
    /* Above the toolbar */
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    pointer-events: none;
    z-index: var(--z-raised, 10);
    user-select: none;
}

.scale-bar-wrap {
    position: relative;
    height: 12px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.scale-bar {
    height: 4px;
    background: var(--color-text-primary, #ffffff);
    border-radius: 2px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
    min-width: 30px;
    transition: width 0.15s ease;
}

.scale-ticks {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    width: 100%;
}

.scale-tick {
    width: 2px;
    height: 8px;
    background: var(--color-text-primary, #ffffff);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.scale-labels {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.scale-label {
    font-size: var(--font-size-11, 11px);
    font-family: var(--font-family-primary, sans-serif);
    color: var(--color-text-primary, #ffffff);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.7);
    line-height: 1.2;
}

.scale-label--zero {
    align-self: flex-start;
}

.scale-label--half {
    align-self: center;
}

.scale-label--full {
    align-self: flex-end;
}
</style>
