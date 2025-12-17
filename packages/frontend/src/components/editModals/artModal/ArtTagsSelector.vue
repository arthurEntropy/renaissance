<template>
    <div class="form-group multi-select">
        <!-- Search Bar -->
        <input ref="searchInputRef" :value="searchQuery" @input="$emit('update:searchQuery', $event.target.value)"
            type="text" class="sources-search" placeholder="Search tags..." />

        <!-- Source Lists by Category -->
        <div class="sources-columns">
            <div v-for="(groupSources, groupName) in filteredGroups" :key="groupName" class="source-column">
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
import { ref, computed } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'

const props = defineProps({
    searchQuery: {
        type: String,
        required: true
    },
    selectedSources: {
        type: Array,
        required: true
    }
})

defineEmits(['update:searchQuery', 'toggle'])

const searchInputRef = ref(null)

defineExpose({
    searchInputRef
})

const sourcesStore = useSourcesStore()

const sourceGroups = computed(() => ({
    'Ancestries': sourcesStore.sources.ancestries || [],
    'Cultures': sourcesStore.sources.cultures || [],
    'Mestieri': sourcesStore.sources.mestieri || [],
    'World Elements': sourcesStore.sources.worldElements || []
}))

const filteredGroups = computed(() => {
    if (!props.searchQuery.trim()) {
        return sourceGroups.value
    }

    const query = props.searchQuery.toLowerCase()
    const filtered = {}

    Object.keys(sourceGroups.value).forEach(groupName => {
        const matchingSources = sourceGroups.value[groupName].filter(source =>
            source.name.toLowerCase().includes(query)
        )
        if (matchingSources.length > 0) {
            filtered[groupName] = matchingSources
        }
    })

    return filtered
})
</script>

<style scoped>
.form-group {
    display: flex;
    flex-direction: column;
}

.multi-select {
    display: flex;
    flex-direction: column;
}

.sources-search {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
    font-family: inherit;
    margin-bottom: var(--space-md);
}

.sources-search:focus {
    outline: none;
    border-color: var(--color-primary);
}

.sources-columns {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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
        grid-template-columns: repeat(2, 1fr);
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

.source-item {
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    text-align: left;
    cursor: pointer;
    transition: var(--transition-all);
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
