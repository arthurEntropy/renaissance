<template>
    <div class="art-grid-container">
        <div v-if="paginatedArt.length > 0" class="art-grid" :class="`grid-size-${gridSize}`">
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
import ArtCard from './ArtCard.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

defineProps({
    paginatedArt: {
        type: Array,
        required: true
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

const handleCardClick = (event, art) => {
    emit('cardClick', event, art)
}
</script>

<style scoped>
.art-grid-container {
    min-width: 100%;
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

.art-grid.grid-size-small :deep(.art-source-tag) {
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
