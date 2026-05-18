<template>
    <div class="group-section">
        <h3 class="group-header">
            <ChevronRightIcon v-if="group.collapsed" class="chevron-icon" @click="$emit('toggle-collapse')" />
            <ChevronDownIcon v-else class="chevron-icon" @click="$emit('toggle-collapse')" />

            <span @click="$emit('toggle-collapse')" class="group-name">
                {{ group.name }} <span class="group-count">({{ group.items.length }})</span>
            </span>
        </h3>
        <div v-if="!group.collapsed" class="group-content">
            <MasonryGrid :gap="gap" :row-height="rowHeight" :justify-content="justifyContent" ref="masonryGridRef">
                <div v-for="item in group.items" :key="item.id" class="masonry-item-wrapper">
                    <slot name="items" :items="[item]" />
                </div>
            </MasonryGrid>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'

defineProps({
    group: {
        type: Object,
        required: true,
        validator: (value) => {
            return value.name && Array.isArray(value.items) && typeof value.collapsed === 'boolean'
        }
    },
    gap: {
        type: Number,
        default: 15
    },
    rowHeight: {
        type: Number,
        default: 10
    },
    justifyContent: {
        type: String,
        default: 'center'
    }
})

defineEmits(['toggle-collapse'])

const masonryGridRef = ref(null)

// Expose updateLayout for parent components to trigger recalculation
const updateLayout = () => {
    if (masonryGridRef.value?.updateLayout) {
        masonryGridRef.value.updateLayout()
    }
}

defineExpose({ updateLayout })
</script>

<style scoped>
.group-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.group-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    margin: 0;
    padding-bottom: var(--space-sm);
    border-bottom: 2px solid var(--color-border-secondary);
    user-select: none;
    transition: var(--transition-color);
}

.group-header:hover {
    color: var(--color-primary-hover);
}

.chevron-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    cursor: pointer;
    transition: var(--transition-normal);
}

.group-name {
    flex: 1;
    cursor: pointer;
    text-align: left;
}

.group-count {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
}

.group-content {
    width: 100%;
}

.masonry-item-wrapper {
    position: relative;
    width: 100%;
}
</style>
