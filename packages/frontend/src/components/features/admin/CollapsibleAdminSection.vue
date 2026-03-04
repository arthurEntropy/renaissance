<template>
    <div class="collapsible-section">
        <h2 class="section-header" @click="toggle">
            <ChevronRightIcon v-if="collapsed" class="chevron-icon" />
            <ChevronDownIcon v-else class="chevron-icon" />
            <span>{{ title }}</span>
        </h2>
        <div v-if="!collapsed" class="section-content">
            <slot />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

defineProps({
    title: {
        type: String,
        required: true
    }
})

const collapsed = ref(true)

const toggle = () => {
    collapsed.value = !collapsed.value
}
</script>

<style scoped>
.collapsible-section {
    margin-bottom: 3rem;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: var(--font-size-32);
    color: var(--color-white);
    cursor: pointer;
    user-select: none;
    padding: 0.5rem 0;
    transition: color var(--duration-fast);
}

.section-header:hover {
    color: var(--color-primary);
}

.chevron-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
}

.section-content {
    margin-top: 1.5rem;
}
</style>
