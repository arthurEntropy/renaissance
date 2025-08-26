<template>
    <div class="character-sheet-section" :class="customClass" :style="dynamicStyles">
        <slot />
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    // Optional custom class for specific sections
    customClass: {
        type: String,
        default: ''
    },
    // Optional minimum width
    minWidth: {
        type: String,
        default: null
    },
    // Optional maximum width
    maxWidth: {
        type: String,
        default: null
    }
})

const dynamicStyles = computed(() => {
    const styles = {}
    if (props.minWidth) {
        styles.minWidth = props.minWidth
    }
    if (props.maxWidth) {
        styles.maxWidth = props.maxWidth
    }
    return styles
})
</script>

<style scoped>
.character-sheet-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background-color: var(--color-bg-secondary);
    border-radius: var(--radius-5);
    padding: var(--space-lg);
    position: relative;
    width: 100%;
    min-width: 0;
}

/* Responsive adjustments */
@media (max-width: var(--breakpoint-sm)) {
    .character-sheet-section {
        padding: var(--space-md);
    }
}
</style>
