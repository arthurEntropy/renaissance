<template>
    <div class="art-card" :class="{ 'selected': isSelected }" @click="handleClick" @keydown.enter="handleClick"
        @keydown.space.prevent="handleClick" tabindex="0" role="button"
        :aria-label="`Select ${art?.tags?.type || 'art'} art`" :data-art-id="art.id">
        <div class="art-image">
            <img :src="optimizedImageUrl" :alt="`${art?.tags?.type || 'art'} art`" />
        </div>
        <div class="art-info">
            <div class="art-tags">
                <span class="art-type" :class="art?.tags?.type">
                    <component :is="typeIcon" class="icon-sm" />
                </span>
                <ChipTag v-for="sourceId in art?.tags?.sources || []" :key="sourceId" :sourceId="sourceId"
                    variant="secondary" />
            </div>
        </div>
        <!-- Selection indicator -->
        <div v-if="isSelected" class="selection-indicator">
            <CheckIcon class="selection-checkmark" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { UserCircleIcon, PhotoIcon, MapIcon, CheckIcon } from '@heroicons/vue/24/outline'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

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

const optimizedImageUrl = useOptimizedImage(() => props.art?.url, MIDJOURNEY_IMAGE_CONTEXTS.SMALL)

const typeIcon = computed(() => {
    const icons = {
        faces: UserCircleIcon,
        places: PhotoIcon,
        maps: MapIcon
    }
    return icons[props.art?.tags?.type] || UserCircleIcon
})

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
    background: var(--color-type-faces-bg);
    color: var(--color-type-faces);
}

.art-type.places {
    background: var(--color-type-places-bg);
    color: var(--color-type-places);
}

.art-type.maps {
    background: var(--color-type-maps-bg);
    color: var(--color-type-maps);
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
    width: 20px;
    height: 20px;
    color: var(--color-primary-text);
    stroke-width: 3;
}
</style>
