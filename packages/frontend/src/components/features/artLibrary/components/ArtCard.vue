<template>
    <div class="art-card" :class="{ 'selected': isSelected }" @click="handleClick" :data-art-id="art.id">
        <div class="art-image">
            <img :src="art.url" :alt="`Art ${art.id}`" />
        </div>
        <div class="art-info">
            <div class="art-tags">
                <span class="art-type" :class="art.tags.type">
                    <UserCircleIcon v-if="art.tags.type === 'faces'" class="icon-sm" />
                    <PhotoIcon v-if="art.tags.type === 'places'" class="icon-sm" />
                    <MapIcon v-if="art.tags.type === 'maps'" class="icon-sm" />
                </span>
                <span v-for="sourceId in art.tags.sources" :key="sourceId" class="art-source-tag">
                    {{ getSourceName(sourceId) }}
                </span>
            </div>
        </div>
        <!-- Selection indicator -->
        <div v-if="isSelected" class="selection-indicator">
            <div class="selection-checkmark">✓</div>
        </div>
    </div>
</template>

<script setup>
import { UserCircleIcon, PhotoIcon, MapIcon } from '@heroicons/vue/24/outline'
import { useSourcesStore } from '@/stores/sourcesStore'

const props = defineProps({
    art: {
        type: Object,
        required: true
    },
    isSelected: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click'])

const sourcesStore = useSourcesStore()

const getSourceName = (sourceId) => {
    const allSources = [
        ...sourcesStore.sources.ancestries || [],
        ...sourcesStore.sources.cultures || [],
        ...sourcesStore.sources.mestieri || [],
        ...sourcesStore.sources.worldElements || []
    ]
    const source = allSources.find(s => s.id === sourceId)
    return source ? source.name : 'Unknown'
}

const handleClick = (event) => {
    emit('click', event, props.art)
}
</script>

<style scoped>
.art-card {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition-all);
    box-shadow: var(--shadow-elevation-sm);
    position: relative;
}

.art-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-elevation-md);
}

.art-card.selected {
    outline: 3px solid var(--color-text-primary);
    outline-offset: -3px;
}

.art-image {
    width: 100%;
    aspect-ratio: 1;
    background: var(--color-bg-tertiary);
    overflow: hidden;
}

.art-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.art-info {
    padding: var(--space-md);
}

.art-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
}

.art-type {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
}

.art-type.faces {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(96, 165, 250);
}

.art-type.places {
    background: rgba(16, 185, 129, 0.2);
    color: rgb(52, 211, 153);
}

.art-type.maps {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(248, 113, 113);
}

.art-source-tag {
    display: inline-block;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    background: var(--color-gray-dark);
    color: var(--color-text-secondary);
}

.icon-sm {
    width: 16px;
    height: 16px;
}

.selection-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background: var(--color-text-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-elevation-md);
    z-index: 10;
}

.selection-checkmark {
    color: var(--color-primary-text);
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-bold);
    line-height: 1;
}
</style>
