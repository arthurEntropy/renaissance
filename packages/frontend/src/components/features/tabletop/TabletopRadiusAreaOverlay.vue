<template>
    <template v-for="area in visibleAreas" :key="area.id">
        <!-- SVG overlay for a single persistent radius area -->
        <svg class="radius-area-overlay" xmlns="http://www.w3.org/2000/svg" overflow="visible">

            <!-- Highlighted grid squares (body – click to select + open colour picker) -->
            <rect v-for="sq in getSquares(area)" :key="`sq-${area.id}-${sq.col},${sq.row}`"
                :x="toSvgX(sq.col * gridSize)" :y="toSvgY(sq.row * gridSize)" :width="gridSize" :height="gridSize"
                :fill="areaFill(area)" :stroke="areaStroke(area)" stroke-width="0.5" class="radius-area-body"
                :data-area-id="area.id" @mousedown="e => e.button === 0 && e.stopPropagation()"
                @click.stop="onBodyClick(area, $event)" @contextmenu.prevent.stop />

            <!-- Invisible wider hit-target ring for edge resize drag -->
            <circle :cx="toSvgX(area.originX)" :cy="toSvgY(area.originY)" :r="radiusPxSvg(area) + 6 / transform.scale"
                fill="none" stroke="transparent" stroke-width="13" class="radius-area-edge-hit"
                :style="{ cursor: getEdgeCursor(area) }" :data-area-id="area.id" @mouseenter="onEdgeEnter(area)"
                @mouseleave="onEdgeLeave(area)"
                @mousedown="e => { if (e.button === 0) { e.stopPropagation(); onEdgeMousedown(area) } }"
                @contextmenu.prevent.stop />

            <!-- Visible circle outline -->
            <circle :cx="toSvgX(area.originX)" :cy="toSvgY(area.originY)" :r="radiusPxSvg(area)" fill="none"
                :stroke="areaMainColor(area)" stroke-width="2" class="radius-area-outline" pointer-events="none" />

            <!-- Selection halo – solid white ring outside the outline, matching the token selection style.
                 Offset by 2.5 screen-px (1px outer half of the colored ring + 1.5px inner half of halo)
                 so the halo sits entirely outside the colored outline. -->
            <circle v-if="selectedAreaId === area.id" :cx="toSvgX(area.originX)" :cy="toSvgY(area.originY)"
                :r="radiusPxSvg(area) + 2.5 / transform.scale" fill="none" stroke="var(--color-white)" stroke-width="3"
                pointer-events="none" vector-effect="non-scaling-stroke" />

            <!-- Anchor circle for free (non-token) areas: visible on hover, drag to move -->
            <circle v-if="!area.tokenId && hoveredAreaId === area.id" :cx="toSvgX(area.originX)"
                :cy="toSvgY(area.originY)" :r="3.5 / transform.scale" fill="rgba(255,255,255,0.55)"
                stroke="rgba(0,0,0,0.35)" stroke-width="1" class="radius-area-anchor"
                @mousedown="e => { if (e.button === 0) { e.stopPropagation(); onAnchorMousedown(area, e) } }" />
        </svg>
    </template>

    <!-- Colour picker popover – teleported to body so it isn't affected by the canvas stacking context -->
    <Teleport to="body">
        <div v-if="colorPickerArea" class="radius-color-popover"
            :style="{ left: `${colorPickerPos.x}px`, top: `${colorPickerPos.y}px` }" @mousedown.stop @click.stop>
            <input type="color" class="radius-color-input" :value="colorPickerArea.color"
                @input="onColorInput($event.target.value)" />
            <input type="text" class="radius-label-input" :value="colorPickerArea.label ?? ''" placeholder="Label…"
                @change="onLabelChange($event.target.value)" />
            <FloatingActionButton :variant="FAB_TYPES.TRASH" :visibility="FAB_VISIBILITIES.ALWAYS"
                @click="onDeleteClick" />
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_VISIBILITIES } from '@/constants/fab'
import radiusCursorUrl from '@/assets/icons/cursor/radius.png'

const props = defineProps({
    areas: { type: Array, required: true },
    transform: { type: Object, required: true },
    gridSize: { type: Number, required: true },
    selectedAreaId: { type: String, default: null },
    /** ID of the area currently being resized (hidden while measurement overlay shows it) */
    editingAreaId: { type: String, default: null },
    /** ID of the area the cursor is inside, computed in the composable via mousemove */
    hoveredAreaId: { type: String, default: null },
    /** Canvas-space cursor position { x, y } for computing edge-resize cursor direction */
    hoveredCanvasPos: { type: Object, default: null },
})

const emit = defineEmits([
    'select',        // (id)
    'deselect',      // ()
    'resize-start',  // (id) – mousedown on edge outline starts resize drag
    'move-start',    // (id, clientX, clientY) – mousedown on anchor circle starts move drag
    'set-color',     // (id, color)
    'set-label',     // (id, label)
    'remove-area',   // (id)
])

// Hide the area currently being resized (measurement overlay shows it instead)
const visibleAreas = computed(() =>
    props.editingAreaId
        ? props.areas.filter(a => a.id !== props.editingAreaId)
        : props.areas
)

// ── Coordinate helpers ─────────────────────────────────────────────────────────
// The overlay is rendered inside the .canvas div, which already has the pan/zoom
// CSS transform applied. So SVG user units == canvas-space pixels; no manual
// transform offset or scale is needed here.
const toSvgX = (cx) => cx
const toSvgY = (cy) => cy

const radiusPxSvg = (area) => area.radiusFeet * props.gridSize / 5

// ── Colors ─────────────────────────────────────────────────────────────────────
const areaMainColor = (area) => {
    const c = area.color ?? '#ffffff'
    return c === '#ffffff' ? 'rgba(255,255,255,0.9)' : hexWithAlpha(c, 0.9)
}

const areaFill = (area) => {
    const c = area.color ?? '#ffffff'
    return c === '#ffffff' ? 'rgba(255,255,255,0.1)' : hexWithAlpha(c, 0.1)
}

const areaStroke = (area) => {
    const c = area.color ?? '#ffffff'
    return c === '#ffffff' ? 'rgba(255,255,255,0.18)' : hexWithAlpha(c, 0.18)
}

const hexWithAlpha = (hex, alpha) => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

// ── Grid squares ───────────────────────────────────────────────────────────────
const _squareCache = new Map()

const getSquares = (area) => {
    const key = `${area.id}:${area.originX}:${area.originY}:${area.radiusFeet}:${props.gridSize}`
    if (_squareCache.has(key)) return _squareCache.get(key)
    const r = area.radiusFeet * props.gridSize / 5
    const ox = area.originX
    const oy = area.originY
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
            if (dx * dx + dy * dy <= rSq) squares.push({ col, row })
        }
    }
    if (_squareCache.size > 200) _squareCache.clear()
    _squareCache.set(key, squares)
    return squares
}

// ── Edge cursor (direction from origin to pointer, mapped to resize-cursor) ───
const hoveringAreaId = ref(null)

const getEdgeCursor = (area) => {
    if (hoveringAreaId.value !== area.id || !props.hoveredCanvasPos) return 'default'
    return `url('${radiusCursorUrl}') 8 8, nwse-resize`
}

const onEdgeEnter = (area) => { hoveringAreaId.value = area.id }
const onEdgeLeave = (area) => {
    if (hoveringAreaId.value === area.id) hoveringAreaId.value = null
}

// ── Edge resize drag (mousedown → drag → mouseup commits via composable) ──────
const onEdgeMousedown = (area) => {
    colorPickerArea.value = null
    emit('resize-start', area.id)
}

// ── Body click: select + open colour picker ────────────────────────────────────
const colorPickerArea = ref(null)
const colorPickerPos = ref({ x: 0, y: 0 })

const onBodyClick = (area, e) => {
    emit('select', area.id)
    colorPickerArea.value = area
    colorPickerPos.value = { x: e.clientX + 8, y: e.clientY + 8 }
}

const onColorInput = (color) => {
    if (!colorPickerArea.value) return
    emit('set-color', colorPickerArea.value.id, color)
    colorPickerArea.value = { ...colorPickerArea.value, color }
}

const onLabelChange = (label) => {
    if (!colorPickerArea.value) return
    emit('set-label', colorPickerArea.value.id, label)
    colorPickerArea.value = { ...colorPickerArea.value, label }
}

const onDeleteClick = () => {
    if (!colorPickerArea.value) return
    const id = colorPickerArea.value.id
    colorPickerArea.value = null
    emit('remove-area', id)
}

// Close the color picker when the area is deselected or focus moves elsewhere
watch(() => props.selectedAreaId, (newVal) => {
    if (!newVal) colorPickerArea.value = null
})

// ── Anchor circle drag (non-token areas only) ─────────────────────────────────
const onAnchorMousedown = (area, e) => {
    colorPickerArea.value = null
    emit('move-start', area.id, e.clientX, e.clientY)
}
</script>

<style scoped>
.radius-area-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    /* z-index: 0 keeps the overlay above the map image but below canvas-items
       (which each have z-index ≥ 1), ensuring tokens always receive clicks. */
    z-index: 0;
}

/* Re-enable pointer events on the body squares */
.radius-area-body {
    pointer-events: all;
    cursor: pointer;
    vector-effect: non-scaling-stroke;
}

/* Edge resize ring: only the stroke ring is hit-testable, not the fill area.
   This prevents the interior squares from triggering a resize on click. */
.radius-area-edge-hit {
    pointer-events: visibleStroke;
    vector-effect: non-scaling-stroke;
}

/* Keep stroke widths constant in screen pixels at all zoom levels */
.radius-area-outline {
    pointer-events: none;
    vector-effect: non-scaling-stroke;
}

.radius-area-anchor {
    pointer-events: all;
    cursor: grab;
    vector-effect: non-scaling-stroke;
}

.radius-color-popover {
    position: fixed;
    background: var(--color-bg-secondary, #1e1e2e);
    border: 1px solid var(--color-text-secondary, rgba(255, 255, 255, 0.3));
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 9999;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
}

.radius-label-input {
    font-size: 12px;
    font-family: var(--font-family-primary, sans-serif);
    color: var(--color-text-primary, #fff);
    background: transparent;
    border: 1px solid var(--overlay-white-medium, rgba(255, 255, 255, 0.2));
    border-radius: 4px;
    padding: 3px 6px;
    width: 120px;
    outline: none;
}

.radius-label-input::placeholder {
    color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
}

.radius-label-input:focus {
    border-color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
}

.radius-color-input {
    width: 28px;
    height: 28px;
    padding: 1px;
    border: 1px solid var(--overlay-white-medium, rgba(255, 255, 255, 0.2));
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
}
</style>
