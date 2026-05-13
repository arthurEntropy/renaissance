<template>
    <div class="form-group multi-select">
        <!-- Source Lists by Category -->
        <div class="sources-columns">
            <div v-for="(groupSources, groupName) in sourceGroups" :key="groupName" class="source-column"
                :class="{ cultures: groupName === 'Cultures' }">
                <h4 v-if="groupSources.length > 0" class="source-group-title">{{ groupName }}</h4>
                <div class="source-items">
                    <button v-for="source in groupSources" :key="source.id" type="button" class="source-item"
                        :class="{ selected: selectedSources.includes(source.id) }" @click="$emit('toggle', source.id)">
                        {{ source.name }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'

defineProps({
    selectedSources: {
        type: Array,
        required: true
    }
})

defineEmits(['toggle'])

const sourcesStore = useSourcesStore()

const sourceGroups = computed(() => ({
    'Ancestries': sourcesStore.sources.ancestries || [],
    'Cultures': sourcesStore.sources.cultures || [],
    'Mestieri': sourcesStore.sources.mestieri || [],
    'World': sourcesStore.sources.worldElements || []
}))
</script>

<style scoped>
.form-group {
    display: flex;
    flex-direction: column;
}

.multi-select {
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: 100%;
}

.sources-columns {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--space-md);
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space-sm);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-5);
    border: 1px solid var(--color-border-secondary);
    width: 100%;
}

@media (min-width: 1024px) {
    .sources-columns {
        flex: 1;
        max-height: none;
        overflow-y: auto;
    }
}

@media (max-width: 1024px) {
    .sources-columns {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .sources-columns {
        grid-template-columns: 1fr;
    }
}

.source-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    min-width: 0;
}

.source-column.cultures {
    grid-column: span 2;
}

.source-group-title {
    margin: 0 0 var(--space-xs) 0;
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid var(--color-border-secondary);
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.source-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.source-column.cultures .source-items {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-xs);
}

.source-item {
    padding: calc(var(--space-xs) * 0.75) var(--space-xs);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: 11px;
    font-family: var(--font-family-primary);
    text-align: left;
    cursor: pointer;
    transition: var(--transition-normal);
    line-height: 1.15;
    overflow-wrap: anywhere;
    width: 100%;
}

.source-item:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border-primary);
}

.source-item.selected {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-black);
    font-weight: var(--font-weight-semibold);
}
</style>
