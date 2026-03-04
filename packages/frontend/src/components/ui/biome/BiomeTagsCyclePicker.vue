<template>
    <div class="biome-tags-cycle-picker">
        <div v-for="group in groupedTags" :key="group.label" class="picker-group">
            <span class="picker-group-label">{{ group.label }}</span>
            <div class="picker-tags">
                <button v-for="tag in group.tags" :key="tag" type="button" class="picker-tag-btn"
                    :class="tagStateClass(tag)" :title="tagTitle(tag)" @click="cycleTag(tag)">
                    <BiomeTagSymbol :tag="tag" :effect="tagEffect(tag)" :active="tagEffect(tag) !== null" />
                    <span class="picker-tag-label">{{ BIOME_TAG_LABELS[tag] }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { BiomeTagEffect, BiomeTagGroup, BIOME_TAG_GROUPS, BIOME_TAG_GROUP_LABELS, BIOME_TAG_LABELS } from '@shared/constants/biomeTags'
import BiomeTagSymbol from './BiomeTagSymbol.vue'

const props = defineProps({
    augmentTags: { type: Array, default: () => [] },
    inhibitTags: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:augmentTags', 'update:inhibitTags'])

const groupedTags = Object.values(BiomeTagGroup).map(group => ({
    label: BIOME_TAG_GROUP_LABELS[group],
    tags: BIOME_TAG_GROUPS[group],
}))

// Returns BiomeTagEffect.AUGMENT, BiomeTagEffect.INHIBIT, or null for a given tag
function tagEffect(tag) {
    if (props.augmentTags.includes(tag)) return BiomeTagEffect.AUGMENT
    if (props.inhibitTags.includes(tag)) return BiomeTagEffect.INHIBIT
    return null
}

// Cycles: neutral → augment → inhibit → neutral
function cycleTag(tag) {
    const current = tagEffect(tag)
    const nextAugment = [...props.augmentTags]
    const nextInhibit = [...props.inhibitTags]

    if (current === null) {
        // neutral → augment
        nextAugment.push(tag)
    } else if (current === BiomeTagEffect.AUGMENT) {
        // augment → inhibit
        nextAugment.splice(nextAugment.indexOf(tag), 1)
        nextInhibit.push(tag)
    } else {
        // inhibit → neutral
        nextInhibit.splice(nextInhibit.indexOf(tag), 1)
    }

    emit('update:augmentTags', nextAugment)
    emit('update:inhibitTags', nextInhibit)
}

function tagStateClass(tag) {
    const effect = tagEffect(tag)
    if (effect === BiomeTagEffect.AUGMENT) return 'state-augment'
    if (effect === BiomeTagEffect.INHIBIT) return 'state-inhibit'
    return 'state-neutral'
}

function tagTitle(tag) {
    const effect = tagEffect(tag)
    const label = BIOME_TAG_LABELS[tag]
    if (effect === BiomeTagEffect.AUGMENT) return `${label}: +1d (click to inhibit)`
    if (effect === BiomeTagEffect.INHIBIT) return `${label}: −1d (click to clear)`
    return `${label}: neutral (click to augment)`
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.biome-tags-cycle-picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.picker-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.picker-group-label {
    font-size: var(--font-size-10);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.picker-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
}

.picker-tag-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--overlay-white-subtle);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    padding: 2px var(--space-xs);
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: var(--font-size-12);
    transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.picker-tag-btn:hover {
    background: var(--overlay-white-medium);
    color: var(--color-text-primary);
}

.picker-tag-btn.state-augment {
    background: var(--overlay-white-medium);
    border-color: var(--color-success);
    color: var(--color-success);
}

.picker-tag-btn.state-inhibit {
    background: var(--overlay-white-medium);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.picker-tag-label {
    line-height: 1;
}
</style>
