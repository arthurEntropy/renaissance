<template>
    <div class="biome-tag-selector">
        <template v-for="(group, idx) in BIOME_TAG_GROUPS_ORDERED" :key="group.groupKey">
            <div v-if="idx > 0" class="group-divider" />
            <div class="tag-group">
                <span class="group-label">{{ group.label }}</span>
                <div class="tag-list">
                    <label v-for="tag in group.tags" :key="tag" class="tag-checkbox">
                        <input type="checkbox" :checked="modelValue.includes(tag)" @change="handleChange(tag)" />
                        <BiomeTagSymbol :tag="tag" :active="modelValue.includes(tag)" />
                        <span class="tag-name">{{ BIOME_TAG_LABELS[tag] }}</span>
                    </label>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { BiomeTagGroup, BIOME_TAG_GROUPS, BIOME_TAG_GROUP_LABELS, BIOME_TAG_LABELS } from '@shared/constants/biomeTags'
import BiomeTagSymbol from './BiomeTagSymbol.vue'

const props = defineProps({
    modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

const BIOME_TAG_GROUPS_ORDERED = Object.values(BiomeTagGroup).map(group => ({
    groupKey: group,
    label: BIOME_TAG_GROUP_LABELS[group],
    tags: BIOME_TAG_GROUPS[group],
}))

function handleChange(tag) {
    const next = [...props.modelValue]
    const idx = next.indexOf(tag)
    if (idx >= 0) {
        next.splice(idx, 1)
    } else {
        next.push(tag)
    }
    emit('update:modelValue', next)
}
</script>

<style scoped>
.biome-tag-selector {
    display: flex;
    flex-direction: row;
    gap: var(--space-md);
    flex-wrap: wrap;
}

.group-divider {
    width: 1px;
    align-self: stretch;
    background: var(--color-border-primary);
}

.tag-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.group-label {
    font-size: var(--font-size-10);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.tag-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.tag-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    cursor: pointer;
    font-size: var(--font-size-12);
    color: var(--color-text-primary);
}

.tag-name {
    line-height: 1;
}
</style>
