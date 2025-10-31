<template>
    <div class="selected-chips" :class="{ empty: selectedSources.length === 0 }">
        <div v-for="sourceId in selectedSources" :key="sourceId" class="chip"
            :class="{ 'chip-partial': isPartialSource(sourceId) }">
            <span class="chip-text">{{ getSourceName(sourceId) }}</span>
            <button class="chip-remove" @click="$emit('remove', sourceId)" type="button">
                <XMarkIcon class="chip-icon" />
            </button>
        </div>
        <span v-if="selectedSources.length === 0" class="empty-message">No tags</span>
    </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useSourcesStore } from '@/stores/sourcesStore'
import { computed } from 'vue'

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

const sourcesStore = useSourcesStore()

const sourceGroups = computed(() => ({
    'Ancestries': sourcesStore.sources.ancestries || [],
    'Cultures': sourcesStore.sources.cultures || [],
    'Mestieri': sourcesStore.sources.mestieri || [],
    'World Elements': sourcesStore.sources.worldElements || []
}))

const getSourceName = (sourceId) => {
    for (const group of Object.values(sourceGroups.value)) {
        const source = group.find(s => s.id === sourceId)
        if (source) return source.name
    }
    return 'Unknown'
}

const isPartialSource = (sourceId) => {
    return props.partialSources.includes(sourceId)
}
</script>

<style scoped>
.selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    padding: 0;
    min-height: 40px;
    justify-content: center;
    align-items: center;
}

.selected-chips.empty {
    justify-content: center;
    align-items: center;
}

.empty-message {
    color: var(--color-text-secondary);
    font-size: var(--font-size-12);
    font-style: italic;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-primary);
    color: var(--color-primary-text);
    border-radius: var(--radius-5);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
}

.chip-partial {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-secondary);
}

.chip-partial .chip-remove {
    color: var(--color-text-secondary);
}

.chip-text {
    line-height: 1;
}

.chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-primary-text);
    transition: var(--transition-opacity);
}

.chip-remove:hover {
    opacity: 0.7;
}

.chip-icon {
    width: 14px;
    height: 14px;
}
</style>
