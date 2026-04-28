<template>
    <div class="mana-pool-display">
        <!-- Pill container -->
        <div class="mana-pool-pill">
            <!-- Label -->
            <span class="mana-pool-label">Mana Pool:</span>

            <!-- Colorless untapped aggregate -->
            <button v-if="colorlessUntapped > 0" class="mana-pip-btn" title="Tap colorless mana" type="button"
                draggable="true" @click="tapOneColorless"
                @dragstart="onDragStart($event, { type: 'colorless', tapped: false })" @dragend="onDragEnd">
                <ManaSymbol :color="ManaColor.COLORLESS" :value="String(colorlessUntapped)" />
            </button>

            <!-- Colorless tapped aggregate -->
            <button v-if="colorlessTapped > 0" class="mana-pip-btn tapped" title="Untap colorless mana" type="button"
                draggable="true" @click="untapOneColorless"
                @dragstart="onDragStart($event, { type: 'colorless', tapped: true })" @dragend="onDragEnd">
                <ManaSymbol :color="ManaColor.COLORLESS" :value="String(colorlessTapped)" />
            </button>

            <!-- Colored pips -->
            <template v-for="color in COLORED_MANA" :key="color">
                <button v-for="(tapped, idx) in getColorPips(color)" :key="`${color}-${idx}`" class="mana-pip-btn"
                    :class="{ tapped }" :title="tapped ? `Untap (${color} mana)` : `Tap (${color} mana)`" type="button"
                    draggable="true" @click="onPipClick(color, idx)"
                    @dragstart="onDragStart($event, { type: 'colored', color, idx })" @dragend="onDragEnd">
                    <ManaSymbol :color="color" />
                </button>
            </template>

            <!-- Action buttons cluster: untap, delete, add —— separated from pips -->
            <div class="actions-cluster">
                <!-- Untap all — only visible when there is tapped mana -->
                <FloatingActionButton v-if="anyTapped" :variant="FAB_TYPES.REFRESH" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ALWAYS" title="Untap all mana" @click="untapAll" />

                <!-- Clear all / drop-to-delete — visible when there is mana; becomes drop zone while dragging -->
                <div v-if="anyMana || dragging" class="delete-slot"
                    :class="{ 'drop-zone': dragging, 'drop-zone--over': dropOver }"
                    @dragover.prevent="dragging && (dropOver = true)" @dragleave="dropOver = false"
                    @drop.prevent="dragging && onDrop()">
                    <FloatingActionButton v-if="!dragging" :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" title="Clear mana pool" @click="clearPool" />
                    <FloatingActionButton v-else :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" class="drop-zone-fab" />
                </div>

                <!-- Add FAB + circular color picker -->
                <div class="add-btn-wrapper">
                    <FloatingActionButton :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" title="Add mana to pool" @click="toggleCircleMenu" />
                    <!-- Backdrop closes the menu when clicking outside -->
                    <div v-if="circleMenuOpen" class="circle-menu-backdrop" @click="circleMenuOpen = false" />
                    <!-- Circular menu -->
                    <div v-if="circleMenuOpen" class="circle-menu" @click.stop>
                        <!-- Outer color buttons: W U B R G evenly spaced -->
                        <button v-for="{ color, angle } in COLORED_POSITIONS" :key="color" class="circle-color-btn"
                            :style="colorBtnStyle(angle)" :title="color.charAt(0).toUpperCase() + color.slice(1)"
                            type="button" @click="handleAddMana(color)">
                            <ManaSymbol :color="color" />
                        </button>
                        <!-- Colorless center -->
                        <button class="circle-color-btn circle-center" title="Colorless" type="button"
                            @click="handleAddMana(ManaColor.COLORLESS)">
                            <ManaSymbol :color="ManaColor.COLORLESS" value="1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { ManaColor, MANA_COLOR_ORDER } from '@shared/constants/manaColors'
import ManaSymbol from '@/components/ui/mana/ManaSymbol.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const COLORED_MANA = MANA_COLOR_ORDER.filter((c) => c !== ManaColor.COLORLESS)

// W U B R G evenly spaced starting at top (−90°), clockwise
const COLORED_POSITIONS = COLORED_MANA.map((color, i) => ({
    color,
    angle: -90 + (360 / COLORED_MANA.length) * i,
}))

const CIRCLE_RADIUS = 28 // px from center to symbol center

// Composables
const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

// Local state
const circleMenuOpen = ref(false)
const dragging = ref(false)
const dropOver = ref(false)
const dragPayload = ref(null)

// Computed
function getColorPips(color) {
    const raw = selectedCharacter.value?.manaPool?.[color]
    return Array.isArray(raw) ? raw : []
}

const colorlessUntapped = computed(
    () => getColorPips(ManaColor.COLORLESS).filter((t) => !t).length,
)
const colorlessTapped = computed(
    () => getColorPips(ManaColor.COLORLESS).filter((t) => !!t).length,
)

const anyTapped = computed(() =>
    MANA_COLOR_ORDER.some((c) => getColorPips(c).some((t) => t)),
)

const anyMana = computed(() =>
    MANA_COLOR_ORDER.some((c) => getColorPips(c).length > 0),
)

// Methods
function colorBtnStyle(angle) {
    const rad = (angle * Math.PI) / 180
    const x = Math.round(CIRCLE_RADIUS * Math.cos(rad))
    const y = Math.round(CIRCLE_RADIUS * Math.sin(rad))
    return { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }
}

function onPipClick(color, idx) {
    selectedCharacter.value.manaPool[color][idx] =
        !selectedCharacter.value.manaPool[color][idx]
}

function tapOneColorless() {
    const pips = selectedCharacter.value.manaPool[ManaColor.COLORLESS]
    const idx = pips.indexOf(false)
    if (idx !== -1) pips[idx] = true
}

function untapOneColorless() {
    const pips = selectedCharacter.value.manaPool[ManaColor.COLORLESS]
    const idx = pips.indexOf(true)
    if (idx !== -1) pips[idx] = false
}

function untapAll() {
    for (const c of MANA_COLOR_ORDER) {
        selectedCharacter.value.manaPool[c] = selectedCharacter.value.manaPool[
            c
        ].map(() => false)
    }
}

function clearPool() {
    for (const c of MANA_COLOR_ORDER) {
        selectedCharacter.value.manaPool[c] = []
    }
}

function toggleCircleMenu() {
    circleMenuOpen.value = !circleMenuOpen.value
}

function handleAddMana(color) {
    if (!selectedCharacter.value) return
    selectedCharacter.value.manaPool[color].push(false)
    circleMenuOpen.value = false
}

function onDragStart(event, payload) {
    dragPayload.value = payload
    dragging.value = true
    // Custom ghost at full opacity so the mana circle is clearly visible
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    const ghost = el.cloneNode(true)
    Object.assign(ghost.style, {
        position: 'fixed',
        top: rect.top + 'px',
        left: rect.left + 'px',
        margin: '0',
        opacity: '1',
        transform: 'none',
        pointerEvents: 'none',
        zIndex: '9999',
    })
    // For colorless buttons the digit shows the aggregate count; override to "1"
    // to make clear that only one pip will be removed.
    if (payload.type === 'colorless') {
        const digit = ghost.querySelector('.mana-digit')
        if (digit) digit.textContent = '1'
    }
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(
        ghost,
        Math.round(rect.width / 2),
        Math.round(rect.height / 2),
    )
    requestAnimationFrame(() => ghost.remove())
}

function onDragEnd() {
    dragging.value = false
    dropOver.value = false
    dragPayload.value = null
}

function onDrop() {
    const p = dragPayload.value
    if (!p) return

    if (p.type === 'colored') {
        selectedCharacter.value.manaPool[p.color].splice(p.idx, 1)
    } else if (p.type === 'colorless') {
        const pips = selectedCharacter.value.manaPool[ManaColor.COLORLESS]
        const idx = pips.indexOf(p.tapped)
        if (idx !== -1) pips.splice(idx, 1)
    }

    dragging.value = false
    dropOver.value = false
    dragPayload.value = null
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.mana-pool-display {
    display: flex;
    align-items: center;
}

.mana-pool-label {
    font-size: var(--font-size-14);
    font-style: italic;
    white-space: nowrap;
    margin-right: var(--space-xs);
}

/* Pill container (matches MPDisplay) */
.mana-pool-pill {
    background-color: var(--color-gray-dark);
    padding: var(--space-xs) var(--space-lg);
    border-radius: var(--radius-15);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-xs);
}

/* Action buttons cluster */
.actions-cluster {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin-left: var(--space-sm);
}

/* Delete / drop-zone slot */
.delete-slot {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Drop zone (dragging state) — uses outline instead of border so it never shifts layout. */
.drop-zone {
    border-radius: var(--radius-full);
    outline: 2px dashed var(--color-danger);
    outline-offset: 1px;
    transition:
        background var(--transition-fast),
        box-shadow var(--transition-fast);
}

.drop-zone--over {
    background: rgba(244, 67, 54, 0.2);
    box-shadow: var(--glow-danger-sm);
}

.drop-zone-fab {
    pointer-events: none;
    background: transparent !important;
    border-color: transparent !important;
}

/* Per-pip tap button */
.mana-pip-btn {
    appearance: none;
    -webkit-appearance: none;
    background: none;
    border: none;
    padding: 0;
    line-height: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 50%;
    transition:
        opacity var(--transition-fast),
        transform var(--transition-fast);
}

.mana-pip-btn:hover {
    opacity: 0.8;
}

.mana-pip-btn:active {
    cursor: grabbing;
}

.mana-pip-btn.tapped {
    opacity: 0.25;
    transform: rotate(90deg);
}

.mana-pip-btn.tapped:hover {
    opacity: 0.45;
}

/* Add button + circle menu */
.add-btn-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.circle-menu {
    position: absolute;
    right: 50%;
    bottom: 50%;
    transform: translate(50%, 50%);
    width: 0;
    height: 0;
    z-index: var(--z-dropdown);
    pointer-events: none;
}

/* Individual color buttons are positioned relative to the circle center */
.circle-color-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    appearance: none;
    -webkit-appearance: none;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    padding: 0;
    box-shadow: var(--shadow-sm);
    transition:
        transform var(--transition-fast),
        box-shadow var(--transition-fast);
}

.circle-color-btn:hover {
    box-shadow:
        var(--shadow-elevation-md),
        0 0 0 2px var(--color-border-focus, rgba(255, 255, 255, 0.35));
    z-index: 1;
}

.circle-center {
    transform: translate(-50%, -50%) !important;
    background: var(--color-bg-primary);
}

.circle-center:hover {
    box-shadow:
        var(--shadow-elevation-md),
        0 0 0 2px var(--color-border-focus, rgba(255, 255, 255, 0.35));
}

/* Click-outside overlay */
.circle-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-dropdown) - 1);
}
</style>
