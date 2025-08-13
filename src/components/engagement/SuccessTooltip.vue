<template>
    <div class="success-tooltip" :style="{ top: position.y + 'px', left: position.x + 'px' }">
        <div class="tooltip-description">{{ success.description }}</div>
        <div v-if="success.sources && success.sources.length > 0" class="tooltip-source">
            From: {{ success.sources.join(', ') }}
        </div>
    </div>
</template>

<script setup>
// Props
defineProps({
    success: {
        type: Object,
        required: true
    },
    position: {
        type: Object,
        required: true,
        validator: (pos) => {
            return pos && typeof pos.x === 'number' && typeof pos.y === 'number';
        }
    }
})
</script>

<style scoped>
.success-tooltip {
    position: fixed;
    z-index: 1000;
    background: var(--overlay-black-medium);
    color: var(--color-text-primary);
    padding: 14px;
    border-radius: 8px;
    font-size: 12px;
    pointer-events: none;
    box-shadow: 0 2px 12px var(--overlay-black-medium);
    max-width: 260px;
    white-space: pre-line;
    text-align: left;
}

.tooltip-description {
    margin-bottom: 8px;
}

.tooltip-source {
    color: var(--color-gray-light);
    font-size: 10px;
    font-style: italic;
}
</style>
