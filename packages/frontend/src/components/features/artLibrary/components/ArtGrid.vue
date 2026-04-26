<template>
    <div class="art-grid-container">
        <!-- Grouped Display -->
        <div v-if="groupedArt && groupedArt.length > 0" class="grouped-art">
            <div v-for="(group, index) in groupedArt" :key="group.name" class="art-group">
                <h3 class="group-header" @click="toggleGroup(index)">
                    <ChevronRightIcon v-if="collapsedGroups[index]" class="chevron-icon" />
                    <ChevronDownIcon v-else class="chevron-icon" />
                    <span>{{ group.name }} <span class="group-count">({{ group.items.length }})</span></span>
                </h3>
                <div v-if="!collapsedGroups[index]" class="art-grid" :class="`grid-size-${gridSize}`">
                    <ArtCard v-for="artItem in group.items" :key="artItem.id" :art="artItem"
                        :isSelected="selectedItems.includes(artItem.id)" @click="handleCardClick" />
                </div>
            </div>
        </div>

        <!-- Standard Display (no grouping) -->
        <div v-else-if="paginatedArt.length > 0" class="art-grid" :class="`grid-size-${gridSize}`">
            <ArtCard v-for="artItem in paginatedArt" :key="artItem.id" :art="artItem"
                :isSelected="selectedItems.includes(artItem.id)" @click="handleCardClick" />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
            <p>No art found matching your filters.</p>
            <ActionButton variant="primary" size="large" text="Add First Art" @click="$emit('add')" />
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import ArtCard from './ArtCard.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
    paginatedArt: {
        type: Array,
        required: true
    },
    groupedArt: {
        type: Array,
        default: null
    },
    gridSize: {
        type: String,
        required: true
    },
    selectedItems: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['cardClick', 'add'])

// Track collapsed state for each group
const collapsedGroups = ref({})

// Reset collapsed state when grouped art changes
watch(() => props.groupedArt, (newGroupedArt) => {
    if (newGroupedArt) {
        // Initialize all groups as expanded
        collapsedGroups.value = {}
    }
}, { immediate: true })

const toggleGroup = (index) => {
    collapsedGroups.value[index] = !collapsedGroups.value[index]
}

const handleCardClick = (event, art) => {
    emit('cardClick', event, art)
}
</script>

<style scoped>
.art-grid-container {
    min-width: 100%;
}

.grouped-art {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
}

.art-group {
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
    cursor: pointer;
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
    transition: var(--transition-normal);
}

.group-count {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
}

/* Large Grid (default) */
.art-grid.grid-size-large {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-lg);
}

@media (min-width: 1400px) {
    .art-grid.grid-size-large {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 1100px) {
    .art-grid.grid-size-large {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 768px) {
    .art-grid.grid-size-large {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 480px) {
    .art-grid.grid-size-large {
        grid-template-columns: 1fr;
    }
}

/* Small Grid (1/4 size - 8 columns) */
.art-grid.grid-size-small {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-md);
}

@media (min-width: 1400px) {
    .art-grid.grid-size-small {
        grid-template-columns: repeat(8, 1fr);
    }
}

@media (max-width: 1100px) {
    .art-grid.grid-size-small {
        grid-template-columns: repeat(6, 1fr);
    }
}

@media (max-width: 768px) {
    .art-grid.grid-size-small {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 480px) {
    .art-grid.grid-size-small {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Small size adjustments */
.art-grid.grid-size-small :deep(.art-card) {
    border-radius: var(--radius-5);
}

.art-grid.grid-size-small :deep(.art-image) {
    aspect-ratio: 1;
}

.art-grid.grid-size-small :deep(.art-info) {
    padding: var(--space-xs);
}

.art-grid.grid-size-small :deep(.art-tags) {
    gap: 2px;
}

.art-grid.grid-size-small :deep(.art-type) {
    padding: 2px 4px;
}

.art-grid.grid-size-small :deep(.chip) {
    padding: 2px 4px;
    font-size: var(--font-size-10);
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: var(--space-xl) var(--space-lg);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    color: var(--color-text-secondary);
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.empty-state p {
    margin-bottom: var(--space-lg);
    font-size: var(--font-size-18);
}
</style>
