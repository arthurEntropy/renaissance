<template>
    <!-- SVG overlay for measurement lines and highlighted squares -->
    <svg class="measurement-overlay" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <defs>
            <marker id="msr-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"
                markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.9)" />
            </marker>
        </defs>

        <!-- Highlighted path squares (expanded to token footprint width) -->
        <rect v-show="showPaths && !isWorldMap" v-for="sq in pathSquares" :key="`${sq.col},${sq.row}`"
            :x="toSvgX(sq.col * gridSize)" :y="toSvgY(sq.row * gridSize)" :width="gridSize * transform.scale"
            :height="gridSize * transform.scale" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)"
            stroke-width="1" />

        <!-- Waypoint markers (intermediate locked waypoints, not the start) -->
        <circle v-for="(wp, i) in innerWaypoints" :key="`wp-${i}`" :cx="toSvgX(wp.x)" :cy="toSvgY(wp.y)" r="5"
            fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.6)" stroke-width="1.5" />

        <!-- Measurement line segments (last segment carries the arrowhead) -->
        <template v-if="lineSegments.length > 0">
            <line v-for="(seg, i) in lineSegments" :key="`seg-${i}`" :x1="toSvgX(seg[0].x)" :y1="toSvgY(seg[0].y)"
                :x2="toSvgX(seg[1].x)" :y2="toSvgY(seg[1].y)" stroke="rgba(255,255,255,0.9)" stroke-width="2"
                stroke-dasharray="6,3" :marker-end="i === lineSegments.length - 1 ? 'url(#msr-arrow)' : null" />
        </template>
    </svg>

    <!-- Distance popover positioned near the current measurement endpoint -->
    <div v-if="currentPoint && (isWorldMap ? worldMapDistanceMiles > 0 : totalFeet > 0)" class="measurement-popover"
        :style="{ left: `${toSvgX(currentPoint.x) + 14}px`, top: `${toSvgY(currentPoint.y) - 30}px` }">
        <template v-if="isWorldMap">
            <span class="measurement-feet">{{ worldMapDistanceLabel }}</span>
        </template>
        <template v-else>
            <span class="measurement-feet">{{ totalFeet }} ft</span>
            <span class="measurement-sep">/</span>
            <span class="measurement-squares">{{ totalSquares }} sq</span>
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    /** Locked waypoints (including origin) in canvas-space coordinates, snapped to grid centres */
    waypoints: { type: Array, required: true },
    /** Current cursor/token position in canvas-space coordinates */
    currentPoint: { type: Object, default: null },
    /** Current canvas pan/zoom transform { x, y, scale } */
    transform: { type: Object, required: true },
    /** Grid cell size in canvas pixels */
    gridSize: { type: Number, required: true },
    /** When true, use exact Euclidean distance instead of Chebyshev grid distance */
    exactMode: { type: Boolean, default: false },
    /** When false, path squares are hidden; only the measurement line/arrow is shown */
    showPaths: { type: Boolean, default: true },
    /** Size of the token in grid squares (e.g. 1 = 1x1, 2 = 2x2, 3 = 3x3) */
    tokenSize: { type: Number, default: 1 },
    /**
     * World map mode: when set to a positive number, distances are shown in miles
     * (or feet if < 1 mile) using this as the pixels-per-mile ratio.
     * When null/0, the overlay uses its normal feet/squares display.
     */
    pixelsPerMile: { type: Number, default: 0 },
})

// ── Coordinate conversion ─────────────────────────────────────────────────────
// The SVG is positioned absolutely inside the canvas-container (same coordinate
// space), so canvas coords convert to container coords via the canvas transform.
const toSvgX = (cx) => cx * props.transform.scale + props.transform.x
const toSvgY = (cy) => cy * props.transform.scale + props.transform.y

// ── Point lists ───────────────────────────────────────────────────────────────
const allPoints = computed(() => {
    if (!props.currentPoint || props.waypoints.length === 0) return []
    return [...props.waypoints, props.currentPoint]
})

const lineSegments = computed(() => {
    const pts = allPoints.value
    if (pts.length < 2) return []
    return pts.slice(0, -1).map((p, i) => [p, pts[i + 1]])
})

// Intermediate locked waypoints (all except the origin) shown as dot markers
const innerWaypoints = computed(() => props.waypoints.slice(1))

// ── Grid cell helpers ─────────────────────────────────────────────────────────
const toCell = (v) => Math.floor(v / props.gridSize)

/** Walk from one grid cell to another using Chebyshev (diagonal = 1 step) */
const chebyshevCells = (from, to) => {
    let c = toCell(from.x), r = toCell(from.y)
    const ec = toCell(to.x), er = toCell(to.y)
    const cells = []
    while (c !== ec || r !== er) {
        cells.push({ col: c, row: r })
        if (c !== ec) c += c < ec ? 1 : -1
        if (r !== er) r += r < er ? 1 : -1
    }
    cells.push({ col: ec, row: er })
    return cells
}

/** Bresenham's line – used in exact mode to show the cells the straight line crosses */
const bresenhamCells = (from, to) => {
    let c0 = toCell(from.x), r0 = toCell(from.y)
    const c1 = toCell(to.x), r1 = toCell(to.y)
    const cells = []
    const dc = Math.abs(c1 - c0), dr = Math.abs(r1 - r0)
    const sc = c0 < c1 ? 1 : -1, sr = r0 < r1 ? 1 : -1
    let err = dc - dr
    while (true) {
        cells.push({ col: c0, row: r0 })
        if (c0 === c1 && r0 === r1) break
        const e2 = 2 * err
        if (e2 > -dr) { err -= dr; c0 += sc }
        if (e2 < dc) { err += dc; r0 += sr }
    }
    return cells
}

/** All highlighted grid squares across all segments, deduplicated, expanded for token footprint */
const pathSquares = computed(() => {
    const seen = new Set()
    const squares = []
    // Half-radius of token footprint in cells (e.g. size=3 → halfR=1 → -1..+1 offset)
    const halfR = Math.floor(props.tokenSize / 2)
    for (const [from, to] of lineSegments.value) {
        const cells = props.exactMode ? bresenhamCells(from, to) : chebyshevCells(from, to)
        for (const cell of cells) {
            for (let dc = -halfR; dc < props.tokenSize - halfR; dc++) {
                for (let dr = -halfR; dr < props.tokenSize - halfR; dr++) {
                    const key = `${cell.col + dc},${cell.row + dr}`
                    if (!seen.has(key)) {
                        seen.add(key)
                        squares.push({ col: cell.col + dc, row: cell.row + dr })
                    }
                }
            }
        }
    }
    return squares
})

// ── Distance calculations ─────────────────────────────────────────────────────
const segChebyshev = (from, to) =>
    Math.max(Math.abs(toCell(to.x) - toCell(from.x)), Math.abs(toCell(to.y) - toCell(from.y)))

const segEuclideanFeet = (from, to) => {
    const dx = to.x - from.x, dy = to.y - from.y
    return Math.sqrt(dx * dx + dy * dy) * (5 / props.gridSize)
}

const totalSquares = computed(() => {
    if (lineSegments.value.length === 0) return 0
    if (props.exactMode)
        return Math.round(lineSegments.value.reduce((s, [a, b]) => s + segEuclideanFeet(a, b), 0) / 5)
    return lineSegments.value.reduce((s, [a, b]) => s + segChebyshev(a, b), 0)
})

const totalFeet = computed(() => {
    if (lineSegments.value.length === 0) return 0
    if (props.exactMode)
        return Math.round(lineSegments.value.reduce((s, [a, b]) => s + segEuclideanFeet(a, b), 0))
    return totalSquares.value * 5
})

// ── World map distance (miles or feet) ─────────────────────────────────────
const isWorldMap = computed(() => props.pixelsPerMile > 0)

const worldMapDistancePx = computed(() => {
    if (!isWorldMap.value || lineSegments.value.length === 0) return 0
    return lineSegments.value.reduce((sum, [a, b]) => {
        const dx = b.x - a.x, dy = b.y - a.y
        return sum + Math.sqrt(dx * dx + dy * dy)
    }, 0)
})

const worldMapDistanceMiles = computed(() =>
    worldMapDistancePx.value / props.pixelsPerMile
)

const worldMapDistanceLabel = computed(() => {
    const miles = worldMapDistanceMiles.value
    if (miles <= 0) return ''
    if (miles < 1) {
        const feet = Math.round(miles * 5280)
        return `${feet} ft`
    }
    if (miles >= 10) return `${Math.round(miles)} mi`
    return `${miles % 1 === 0 ? miles : parseFloat(miles.toFixed(2))} mi`
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
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-family-primary, sans-serif);
    pointer-events: none;
    z-index: var(--z-popover);
    white-space: nowrap;
    display: flex;
    gap: 4px;
    align-items: center;
    line-height: 1.7;
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
