<template>
    <!-- SVG overlay for radius measurement: circle area, line, highlighted squares -->
    <svg class="measurement-overlay" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <defs>
            <marker id="radius-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"
                markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L8,3 z" :fill="mainColor" />
            </marker>
        </defs>

        <!-- Highlighted squares within the effective radius -->
        <rect v-for="sq in radiusSquares" :key="`rsq-${sq.col},${sq.row}`" :x="toSvgX(sq.col * gridSize)"
            :y="toSvgY(sq.row * gridSize)" :width="gridSize * transform.scale" :height="gridSize * transform.scale"
            fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5" />

        <!-- Muted dotted circles for named ranges lesser than the current radius -->
        <template v-for="range in lesserRanges" :key="`lr-${range.name}`">
            <circle :cx="toSvgX(origin.x)" :cy="toSvgY(origin.y)" :r="range.radiusPx * transform.scale" fill="none"
                stroke="rgba(255,255,255,0.28)" stroke-width="1.5" stroke-dasharray="4,3" />
            <!-- Waypoint dot on the radius line -->
            <circle :cx="toSvgX(range.waypointX)" :cy="toSvgY(range.waypointY)" r="3.5" fill="rgba(255,255,255,0.55)"
                stroke="rgba(0,0,0,0.35)" stroke-width="1" />
            <!-- Range name label beside the waypoint -->
            <text :x="toSvgX(range.waypointX) + 7" :y="toSvgY(range.waypointY) - 4" fill="rgba(255,255,255,0.6)"
                font-size="10" font-weight="600" font-family="var(--font-family-primary, sans-serif)">
                {{ range.name }}
            </text>
        </template>

        <!-- Main radius circle (fill + outline; color changes when on a named range) -->
        <circle v-if="effectiveRadiusPx > 0" :cx="toSvgX(origin.x)" :cy="toSvgY(origin.y)"
            :r="effectiveRadiusPx * transform.scale" :fill="circleFill" :stroke="mainColor" stroke-width="2" />

        <!-- Radius line with arrowhead pointing toward the cursor -->
        <line v-if="effectiveEndpoint && effectiveRadiusPx > 2" :x1="toSvgX(origin.x)" :y1="toSvgY(origin.y)"
            :x2="toSvgX(effectiveEndpoint.x)" :y2="toSvgY(effectiveEndpoint.y)" :stroke="mainColor" stroke-width="2"
            stroke-dasharray="6,3" marker-end="url(#radius-arrow)" />
    </svg>

    <!-- Distance popover near the effective endpoint -->
    <div v-if="effectiveEndpoint && effectiveRadiusFeet > 0" class="measurement-popover"
        :style="{ left: `${toSvgX(effectiveEndpoint.x) + 14}px`, top: `${toSvgY(effectiveEndpoint.y) - 38}px` }">
        <span v-if="currentNamedRange" class="measurement-range-name">{{ currentNamedRange.name }}</span>
        <div class="measurement-row">
            <span class="measurement-feet">{{ displayFeet }} ft</span>
            <span class="measurement-sep">/</span>
            <span class="measurement-squares">{{ effectiveSquares }} sq</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const RADIUS_RANGES = [
    { name: 'ADJACENT', feet: 5 },
    { name: 'SHORT', feet: 25 },
    { name: 'MEDIUM', feet: 50 },
    { name: 'LONG', feet: 100 },
    { name: 'FAR', feet: 200 },
]

const props = defineProps({
    /** Origin point in canvas-space coordinates (center of a grid square or token) */
    origin: { type: Object, required: true },
    /** Raw cursor position in canvas-space coordinates */
    currentPoint: { type: Object, default: null },
    /** Current canvas pan/zoom transform { x, y, scale } */
    transform: { type: Object, required: true },
    /** Grid cell size in canvas pixels (1 cell = 5 ft) */
    gridSize: { type: Number, required: true },
    /**
     * When true the radius snaps to the nearest named range.
     * When false the radius follows the cursor freely.
     */
    snapEnabled: { type: Boolean, default: false },
})

// ── Coordinate conversion ─────────────────────────────────────────────────────
const toSvgX = (cx) => cx * props.transform.scale + props.transform.x
const toSvgY = (cy) => cy * props.transform.scale + props.transform.y

// ── Raw distance from origin to cursor ───────────────────────────────────────
const rawRadiusPx = computed(() => {
    if (!props.currentPoint) return 0
    const dx = props.currentPoint.x - props.origin.x
    const dy = props.currentPoint.y - props.origin.y
    return Math.sqrt(dx * dx + dy * dy)
})

const rawRadiusFeet = computed(() => rawRadiusPx.value * 5 / props.gridSize)

// ── Direction unit vector toward cursor ──────────────────────────────────────
const direction = computed(() => {
    const r = rawRadiusPx.value
    if (r < 0.5 || !props.currentPoint) return null
    return {
        x: (props.currentPoint.x - props.origin.x) / r,
        y: (props.currentPoint.y - props.origin.y) / r,
    }
})

// ── Snap to nearest 5 ft increment (always-on default) ─────────────────────────────
const snappedTo5ft = computed(() => {
    const raw = rawRadiusFeet.value
    if (raw <= 0) return 0
    return Math.max(5, Math.round(raw / 5) * 5)
})

// ── Snap to nearest named range (when shift is held) ──────────────────────────
const snappedToRange = computed(() => {
    const raw = rawRadiusFeet.value
    if (raw <= 0) return 0
    const RANGE_FEET = [5, 25, 50, 100, 200]
    return RANGE_FEET.reduce((best, feet) =>
        Math.abs(feet - raw) < Math.abs(best - raw) ? feet : best, RANGE_FEET[0])
})

// ── Effective radius (5ft snap by default; named-range snap when shift held) ──
const effectiveRadiusFeet = computed(() =>
    props.snapEnabled ? snappedToRange.value : snappedTo5ft.value
)

const effectiveRadiusPx = computed(() => effectiveRadiusFeet.value * props.gridSize / 5)

const effectiveSquares = computed(() => Math.round(effectiveRadiusFeet.value / 5))
const displayFeet = computed(() => Math.round(effectiveRadiusFeet.value))

// ── Effective endpoint along the radius line ─────────────────────────────────
const effectiveEndpoint = computed(() => {
    const dir = direction.value
    if (!dir || effectiveRadiusPx.value <= 0) return null
    return {
        x: props.origin.x + dir.x * effectiveRadiusPx.value,
        y: props.origin.y + dir.y * effectiveRadiusPx.value,
    }
})

// ── Named range at current radius (exact match within 0.5 ft) ────────────────
const currentNamedRange = computed(() => {
    const feet = effectiveRadiusFeet.value
    return RADIUS_RANGES.find(r => Math.abs(r.feet - feet) < 0.5) ?? null
})

const isOnNamedRange = computed(() => currentNamedRange.value !== null)

// ── Visual colours ────────────────────────────────────────────────────────────
const mainColor = computed(() =>
    isOnNamedRange.value ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)'
)

const circleFill = computed(() =>
    isOnNamedRange.value
        ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
        : 'rgba(255,255,255,0.04)'
)

// ── Named ranges smaller than the effective radius (muted indicator circles) ─
const lesserRanges = computed(() => {
    const dir = direction.value
    if (!dir) return []
    const effective = effectiveRadiusFeet.value
    return RADIUS_RANGES
        .filter(r => r.feet < effective - 0.5)
        .map(r => {
            const radiusPx = r.feet * props.gridSize / 5
            return {
                name: r.name,
                radiusPx,
                waypointX: props.origin.x + dir.x * radiusPx,
                waypointY: props.origin.y + dir.y * radiusPx,
            }
        })
})

// ── Grid squares whose centre falls within the effective radius ──────────────
const radiusSquares = computed(() => {
    const r = effectiveRadiusPx.value
    if (r <= 0) return []
    const ox = props.origin.x
    const oy = props.origin.y
    const gs = props.gridSize
    const minCol = Math.floor((ox - r) / gs)
    const maxCol = Math.ceil((ox + r) / gs)
    const minRow = Math.floor((oy - r) / gs)
    const maxRow = Math.ceil((oy + r) / gs)
    const squares = []
    const rSq = r * r
    for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
            const cx = (col + 0.5) * gs
            const cy = (row + 0.5) * gs
            const dx = cx - ox
            const dy = cy - oy
            if (dx * dx + dy * dy <= rSq) {
                squares.push({ col, row })
            }
        }
    }
    return squares
})
</script>

<style scoped>
.measurement-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: var(--z-raised);
}

.measurement-popover {
    position: absolute;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-text-secondary);
    border-radius: 4px;
    padding: 3px 8px 2px;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-family-primary, sans-serif);
    pointer-events: none;
    z-index: var(--z-popover);
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    line-height: 1.6;
}

.measurement-range-name {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-primary);
    line-height: 1.2;
}

.measurement-row {
    display: flex;
    gap: 4px;
    align-items: center;
}

.measurement-sep {
    opacity: 0.45;
    font-weight: 400;
}

.measurement-squares {
    opacity: 0.75;
    font-size: 11px;
}
</style>
