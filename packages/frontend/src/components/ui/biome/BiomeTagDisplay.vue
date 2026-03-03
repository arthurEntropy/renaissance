<template>
    <!-- Only renders when at least one augment or inhibit tag is present -->
    <div v-if="hasTags" class="biome-influence-display">
        <!-- Augment group -->
        <div v-if="augmentTags.length" class="tag-group augment-group">
            <span class="group-label" :class="anyAugmentActive ? 'augment-label' : 'neutral-label'">+</span>
            <div class="tag-symbols">
                <BiomeTagSymbol v-for="tag in augmentTags" :key="tag" :tag="tag" :effect="BiomeTagEffect.AUGMENT"
                    :highlighted="activeTags.has(tag)" />
            </div>
        </div>

        <!-- Vertical divider between groups -->
        <div v-if="hasBothGroups" class="group-divider" />

        <!-- Inhibit group -->
        <div v-if="inhibitTags.length" class="tag-group inhibit-group">
            <span class="group-label" :class="anyInhibitActive ? 'inhibit-label' : 'neutral-label'">−</span>
            <div class="tag-symbols">
                <BiomeTagSymbol v-for="tag in inhibitTags" :key="tag" :tag="tag" :effect="BiomeTagEffect.INHIBIT"
                    :highlighted="activeTags.has(tag)" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { BiomeTagEffect } from '@shared/constants/biomeTags'
import BiomeTagSymbol from './BiomeTagSymbol.vue'

const props = defineProps({
    augmentTags: { type: Array, default: () => [] },
    inhibitTags: { type: Array, default: () => [] },
    activeTags: { type: Object, default: () => new Set() },
})

const hasTags = computed(() => props.augmentTags.length > 0 || props.inhibitTags.length > 0)
const hasBothGroups = computed(() => props.augmentTags.length > 0 && props.inhibitTags.length > 0)

const anyAugmentActive = computed(() => props.augmentTags.some(t => props.activeTags.has(t)))
const anyInhibitActive = computed(() => props.inhibitTags.some(t => props.activeTags.has(t)))
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.biome-influence-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-md);
    flex-wrap: wrap;
}

.tag-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.group-label {
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    transition: color var(--transition-fast);
}

.neutral-label {
    color: var(--color-white);
}

.augment-label {
    color: var(--color-success);
}

.inhibit-label {
    color: var(--color-danger);
}

.tag-symbols {
    display: flex;
    gap: 3px;
    align-items: center;
}

/* Vertical divider — matches equipment card dice-divider style */
.group-divider {
    width: 1px;
    align-self: stretch;
    flex-shrink: 0;
    background: linear-gradient(to bottom,
            transparent,
            var(--color-border-primary) 20%,
            var(--color-border-primary) 80%,
            transparent);
}
</style>
