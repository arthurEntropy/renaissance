<template>
    <div class="toolbar-group">
        <slot />
    </div>
</template>

<script setup>
// This component is just a visual grouping container
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.toolbar-group {
    display: flex;
    gap: var(--space-xs);
    padding: 0 var(--space-sm);
    border-right: 1px solid var(--color-gray-medium);
}

.toolbar-group:last-child {
    border-right: none;
    padding-right: 0;
}

.toolbar-group:first-child {
    padding-left: 0;
}
</style>
