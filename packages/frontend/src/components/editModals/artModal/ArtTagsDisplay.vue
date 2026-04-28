<template>
    <div class="selected-tags" :class="{ empty: selectedSources.length === 0 }">
        <ChipTag v-for="sourceId in selectedSources" :key="sourceId" :sourceId="sourceId"
            :variant="isPartialSource(sourceId) ? CHIP_TAG_VARIANTS.GRAY : CHIP_TAG_VARIANTS.PRIMARY" :hoverable="false"
            removable @remove="$emit('remove', sourceId)" />
        <span v-if="selectedSources.length === 0" class="empty-message">No tags</span>
    </div>
</template>

<script setup>
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import { CHIP_TAG_VARIANTS } from '@/constants/chipTag'

const props = defineProps({
    selectedSources: {
        type: Array,
        required: true
    },
    partialSources: {
        type: Array,
        default: () => []
    }
})

defineEmits(['remove'])

function isPartialSource(sourceId) {
    return props.partialSources.includes(sourceId)
}
</script>

<style scoped>
.selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    padding: 0;
    min-height: 40px;
    justify-content: flex-start;
    align-items: center;
}

.selected-tags.empty {
    justify-content: center;
}

.empty-message {
    color: var(--color-text-secondary);
    font-size: var(--font-size-12);
    font-style: italic;
}
</style>
