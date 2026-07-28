<template>
    <div class="culture-token" :class="{
        'culture-token--placed': isPlaced,
        'culture-token--unplaced': !isPlaced,
        'culture-token--ghost': isGhost,
    }" :style="tokenStyle" draggable="true" @dragstart="$emit('dragstart', $event)" @dragend="$emit('dragend', $event)"
        @click="$emit('click', culture)">
        <img v-if="portraitUrl" :src="portraitUrl" :alt="culture?.name" class="culture-token__portrait" />
        <span v-else class="culture-token__initials" :style="initialsStyle">{{ initials }}</span>
        <div class="culture-token__label">{{ culture?.name }}</div>
        <button v-if="showRemoveFab && isPlaced" class="culture-token__remove" title="Remove from map"
            @click.stop="$emit('remove', culture)">
            ×
        </button>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    culture: { type: Object, default: null },
    /** Whether this culture token has been placed on the map */
    isPlaced: { type: Boolean, default: false },
    /** Pixel size of the token */
    size: { type: Number, default: 60 },
    /** Show the remove (x) button */
    showRemoveFab: { type: Boolean, default: false },
    /** Ghost mode for drag preview */
    isGhost: { type: Boolean, default: false },
})

defineEmits(['click', 'remove', 'dragstart', 'dragend'])

const portraitUrl = useOptimizedImage(
    () => props.culture?.featuredArtUrls?.[0] ?? props.culture?.artUrls?.[0] ?? null,
    MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL
)

const initials = computed(() => {
    if (!props.culture?.name) return '?'
    return props.culture.name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('')
})

const tokenStyle = computed(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
}))

const initialsStyle = computed(() => ({
    fontSize: `${Math.max(10, Math.round(props.size * 0.28))}px`,
}))
</script>

<style scoped>
.culture-token {
    position: relative;
    flex-shrink: 0;
    border-radius: var(--radius-10, 10px);
    overflow: hidden;
    border: 2px solid var(--color-primary, goldenrod);
    background: var(--overlay-black-heavy, rgba(0, 0, 0, 0.7));
    cursor: grab;
    user-select: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    transition: opacity var(--transition-normal, 0.2s), border-color var(--transition-normal, 0.2s);
}

.culture-token--unplaced {
    opacity: 0.5;
    border-color: var(--color-gray-medium, #666);
}

.culture-token--placed {
    opacity: 1;
    border-color: var(--color-primary, goldenrod);
}

.culture-token--ghost {
    opacity: 0.7;
    pointer-events: none;
    cursor: default;
}

.culture-token__portrait {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.culture-token__initials {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold, 700);
    font-family: var(--font-family-primary, sans-serif);
    color: var(--color-text-primary, #fff);
    letter-spacing: 0.04em;
}

.culture-token__label {
    position: absolute;
    bottom: -1.6em;
    left: 50%;
    transform: translateX(-50%);
    font-size: var(--font-size-11, 11px);
    font-family: var(--font-family-primary, sans-serif);
    color: var(--color-text-primary, #fff);
    white-space: nowrap;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.9);
    pointer-events: none;
    line-height: 1.3;
}

.culture-token__remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    background: var(--color-danger, red);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition-fast, 0.1s);
}

.culture-token:hover .culture-token__remove {
    opacity: 1;
}
</style>
