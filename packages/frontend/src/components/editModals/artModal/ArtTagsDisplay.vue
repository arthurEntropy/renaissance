<template>
    <div class="selected-tags" :class="{ empty: selectedSources.length === 0 }">
        <ChipTag v-for="sourceId in selectedSources" :key="sourceId" :sourceId="sourceId"
            :variant="isPartialSource(sourceId) ? 'secondary' : 'primary'" removable
            @remove="$emit('remove', sourceId)" />
        <span v-if="selectedSources.length === 0" class="empty-message">No tags</span>
    </div>
</template>

<script setup>
import ChipTag from '@/components/ui/chips/ChipTag.vue'

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

const isPartialSource = (sourceId) => {
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
