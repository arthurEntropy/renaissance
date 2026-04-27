<template>
    <div class="toolbar" @mousedown.stop @wheel.stop>
        <button class="tool-btn" :class="{ active: showPicker }" @click="$emit('toggle-picker', $event)">
            + Add Card
        </button>

        <div class="toolbar-divider" />

        <button class="tool-btn icon-btn" title="Zoom in (scroll up)" @click="$emit('zoom-in')">+</button>
        <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
        <button class="tool-btn icon-btn" title="Zoom out (scroll down)" @click="$emit('zoom-out')">−</button>
        <button class="tool-btn" title="Reset zoom and position" @click="$emit('reset-view')">
            <ArrowPathIcon class="btn-icon" /> Reset
        </button>

        <button class="tool-btn" :disabled="!canUndo" title="Undo (Ctrl/Cmd+Z)" @click="$emit('undo')">
            <ArrowUturnLeftIcon class="btn-icon" /> Undo
        </button>
        <button class="tool-btn" :disabled="!canRedo" title="Redo (Ctrl/Cmd+Shift+Z)" @click="$emit('redo')">
            <ArrowUturnRightIcon class="btn-icon" /> Redo
        </button>

        <div class="toolbar-divider" />

        <button class="tool-btn" :class="{ active: snapToGrid }" title="Toggle snap to grid"
            @click="$emit('toggle-snap')">
            <Squares2X2Icon class="btn-icon" /> Grid
        </button>
        <template v-if="snapToGrid">
            <button class="tool-btn icon-btn" title="Decrease grid size" @click="$emit('decrease-grid')">−</button>
            <span class="zoom-label" title="Grid size (px)">{{ gridSize }}px</span>
            <button class="tool-btn icon-btn" title="Increase grid size" @click="$emit('increase-grid')">+</button>
        </template>

        <div class="toolbar-divider" />

        <button v-if="itemCount > 0" class="tool-btn danger-btn" @click="$emit('clear-all')">
            Clear All
        </button>

        <span class="item-count" v-if="itemCount > 0">
            {{ itemCount }} card{{ itemCount !== 1 ? 's' : '' }}
        </span>
    </div>
</template>

<script setup>
import { ArrowPathIcon, Squares2X2Icon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/vue/24/outline'

defineProps({
    showPicker: Boolean,
    scale: Number,
    snapToGrid: Boolean,
    gridSize: Number,
    itemCount: Number,
    canUndo: Boolean,
    canRedo: Boolean,
})

defineEmits(['toggle-picker', 'zoom-in', 'zoom-out', 'reset-view', 'toggle-snap', 'increase-grid', 'decrease-grid', 'clear-all', 'undo', 'redo'])
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

.tool-btn.active {
    background: var(--color-primary);
    color: var(--color-black);
    border-color: var(--color-primary);
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
    background: var(--overlay-white-medium);
    margin: 0 var(--space-xs);
    flex-shrink: 0;
}

.zoom-label {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    min-width: 42px;
    text-align: center;
}

.item-count {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    margin-left: auto;
    padding-right: var(--space-xs);
}

.btn-icon {
    width: 14px;
    height: 14px;
}
</style>
