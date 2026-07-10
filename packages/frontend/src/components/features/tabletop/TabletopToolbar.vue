<template>
    <div class="toolbar" @mousedown.stop @wheel.stop>

        <!-- Undo/Redo Controls -->
        <button class="tool-btn" :disabled="!canUndo" title="Undo (Ctrl/Cmd+Z)" @click="$emit('undo')">
            <ArrowUturnLeftIcon class="btn-icon" />
        </button>
        <button class="tool-btn" :disabled="!canRedo" title="Redo (Ctrl/Cmd+Shift+Z)" @click="$emit('redo')">
            <ArrowUturnRightIcon class="btn-icon" />
        </button>

        <div class="toolbar-divider" />

        <!-- Zoom controls -->
        <span class="section-label">Zoom</span>
        <button class="tool-btn icon-btn" title="Zoom in (scroll up)" @click="$emit('zoom-in')">+</button>
        <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
        <button class="tool-btn icon-btn" title="Zoom out (scroll down)" @click="$emit('zoom-out')">−</button>

        <div class="toolbar-divider" />

        <!-- Grid size (grid is always on) -->
        <span class="section-label">Grid</span>
        <input type="color" class="grid-color-input" :value="gridColor" title="Grid line colour"
            @input="$emit('update-grid-color', $event.target.value)" />
        <input type="range" class="grid-opacity-slider" min="0" max="1" step="0.01" :value="gridOpacity"
            title="Grid opacity" @input="$emit('update-grid-opacity', parseFloat($event.target.value))" />
        <button class="tool-btn icon-btn" title="Decrease grid size" @click="$emit('decrease-grid')">−</button>
        <span class="zoom-label" title="Grid size (px)">{{ gridSize }}px</span>
        <button class="tool-btn icon-btn" title="Increase grid size" @click="$emit('increase-grid')">+</button>

        <div class="toolbar-divider" />

        <!-- Background map image -->
        <template v-if="showBgInput">
            <input ref="bgInputRef" v-model="bgUrlDraft" type="url" placeholder="Image URL…" class="bg-url-input"
                @mousedown.stop @keydown.enter.stop="submitBgUrl" @keydown.escape.stop="cancelBgInput" />
            <button class="tool-btn" @click="submitBgUrl">Apply</button>
            <button class="tool-btn" @click="cancelBgInput">Cancel</button>
        </template>
        <template v-else>
            <button class="tool-btn" @click="openBgInput">
                <MapIcon class="btn-icon" /> {{ hasBackground ? 'Change Map' : 'Set Map' }}
            </button>
            <button v-if="hasBackground" class="tool-btn danger-btn" title="Remove background map"
                @click="$emit('clear-background')">
                Clear Map
            </button>
        </template>

        <div class="toolbar-divider" />

        <button v-if="itemCount > 0" class="tool-btn danger-btn" @click="$emit('clear-all')">
            Clear All Tokens
        </button>

        <!-- Measurement path display toggle -->
        <label class="toolbar-checkbox">
            <input type="checkbox" :checked="showPaths" @change="$emit('update-show-paths', $event.target.checked)" />
            Show Paths When Measuring
        </label>

        <!-- GM-only controls pushed to the right -->
        <template v-if="isGM">
            <div class="toolbar-spacer" />

            <!-- Tabletop switcher button -->
            <button class="tool-btn tool-btn--tabletop-name"
                :title="`Switch tabletop (current: ${currentTabletopName})`" @click="showSwitcher = true">
                <MapIcon class="btn-icon" />
                <span class="tabletop-name-label">{{ currentTabletopName }}</span>
            </button>

            <!-- Active tabletop FAB -->
            <button class="tool-btn tool-btn--fab" :class="isCurrentTabletopActive ? 'tool-btn--fab-active' : ''"
                :title="isCurrentTabletopActive ? 'Deactivate this tabletop' : 'Set as active tabletop'"
                @click="$emit('toggle-active-tabletop')">
                <BoltIcon v-if="isCurrentTabletopActive" class="btn-icon" />
                <BoltSlashIcon v-else class="btn-icon" />
            </button>
        </template>
    </div>

    <!-- Tabletop Switcher Modal -->
    <TabletopSwitcherModal v-if="showSwitcher" :tabletops="tabletops" :current-tabletop-id="currentTabletopId"
        :active-tabletop-id="activeTabletopId" @close="showSwitcher = false" @switch-tabletop="handleSwitchTabletop" />
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { ArrowUturnLeftIcon, ArrowUturnRightIcon, MapIcon, BoltIcon, BoltSlashIcon } from '@heroicons/vue/24/outline'
import TabletopSwitcherModal from './TabletopSwitcherModal.vue'

const props = defineProps({
    scale: Number,
    gridSize: Number,
    gridColor: String,
    gridOpacity: Number,
    itemCount: Number,
    canUndo: Boolean,
    canRedo: Boolean,
    hasBackground: Boolean,
    showPaths: { type: Boolean, default: true },
    isGM: { type: Boolean, default: false },
    tabletops: { type: Array, default: () => [] },
    currentTabletopId: { type: String, default: null },
    activeTabletopId: { type: String, default: null },
    currentTabletopName: { type: String, default: '' },
})

const emit = defineEmits(['zoom-in', 'zoom-out', 'increase-grid', 'decrease-grid', 'clear-all', 'undo', 'redo', 'set-background', 'clear-background', 'update-grid-color', 'update-grid-opacity', 'update-show-paths', 'toggle-active-tabletop', 'switch-tabletop'])

const showBgInput = ref(false)
const bgUrlDraft = ref('')
const bgInputRef = ref(null)
const showSwitcher = ref(false)

const isCurrentTabletopActive = computed(
    () => !!props.currentTabletopId && props.currentTabletopId === props.activeTabletopId
)

const openBgInput = () => {
    showBgInput.value = true
    nextTick(() => bgInputRef.value?.focus())
}

const submitBgUrl = () => {
    const url = bgUrlDraft.value.trim()
    if (url) emit('set-background', url)
    showBgInput.value = false
    bgUrlDraft.value = ''
}

const cancelBgInput = () => {
    showBgInput.value = false
    bgUrlDraft.value = ''
}

const handleSwitchTabletop = (tabletopId) => {
    showSwitcher.value = false
    emit('switch-tabletop', tabletopId)
}
</script>

<style scoped>
.toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-md);
    background: var(--overlay-black-heavy);
    border-top: 1px solid var(--overlay-white-medium);
    z-index: var(--z-interactive);
    font-family: var(--font-family-primary);
}

.tool-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    background: var(--overlay-white-medium);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    padding: 4px 10px;
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
    white-space: nowrap;
}

.tool-btn:disabled {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
}

.tool-btn:hover {
    background: var(--overlay-white-heavy);
    color: var(--color-accent-gold);
}

.tool-btn.icon-btn {
    padding: 4px 8px;
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-bold);
    line-height: 1;
}

.tool-btn.danger-btn:hover {
    background: var(--color-danger);
    color: var(--color-danger-text);
    border-color: var(--color-danger);
}

.toolbar-divider {
    width: 1px;
    height: 20px;
    background: var(--overlay-white-heavy);
    margin: 0 var(--space-sm);
    flex-shrink: 0;
}

.section-label {
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    color: var(--color-text-secondary);
    margin-right: var(--space-xs);
}

.zoom-label {
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    color: var(--color-text-secondary);
    min-width: 42px;
    text-align: center;
}

.item-count {
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    color: var(--color-text-muted);
    margin-left: auto;
    padding-right: var(--space-xs);
}

.toolbar-checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    color: var(--color-text-secondary);
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
}

.toolbar-checkbox input[type="checkbox"] {
    cursor: pointer;
    accent-color: var(--color-primary);
}

.bg-url-input {
    background: var(--overlay-white-medium);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    padding: 4px 8px;
    width: 240px;
    outline: none;
}

.bg-url-input:focus {
    border-color: var(--color-primary);
}

.grid-color-input {
    width: 24px;
    height: 24px;
    padding: 1px;
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
}

.grid-opacity-slider {
    width: 72px;
    cursor: pointer;
    accent-color: var(--color-text-secondary);
}

.btn-icon {
    width: 14px;
    height: 14px;
}

/* Push GM controls to the far right */
.toolbar-spacer {
    flex: 1;
}

/* Active-tabletop FAB */
.tool-btn--fab {
    padding: 4px 8px;
    border-radius: var(--radius-full);
    width: 28px;
    height: 28px;
    justify-content: center;
}

.tool-btn--fab-active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-black);
}

.tool-btn--fab-active:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
    color: var(--color-black);
}

/* Tabletop name/switcher button */
.tool-btn--tabletop-name {
    max-width: 180px;
}

.tabletop-name-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
