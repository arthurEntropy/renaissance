<template>
    <div class="search-results-list">
        <div v-if="groupedSearchResults.length === 0" class="no-results">No results found.</div>
        <template v-for="group in groupedSearchResults" :key="group.section.id">
            <div :class="['search-section-header', { 'search-section-header--clickable': group.nameOnly }]"
                @click="group.nameOnly ? emit('selectResult', group.nameOnlyResult) : null"
                v-html="group.highlightedName" />
            <template v-for="subGroup in group.subsectionGroups" :key="subGroup.subsection ?? '__none__'">
                <div v-if="subGroup.subsection" class="search-subsection-header"
                    v-html="subGroup.highlightedSubsection" />
                <div v-for="hit in subGroup.hits" :key="`${group.section.id}-${hit.matchIndex}`" class="search-hit-item"
                    @click="emit('selectResult', hit)" v-html="hit.highlightedSnippet" />
            </template>
        </template>
    </div>
</template>

<script setup>
defineProps({
    groupedSearchResults: {
        type: Array,
        required: true,
    },
})

const emit = defineEmits(['selectResult'])
</script>

<style scoped>
.search-results-list {
    flex: 1;
    overflow-y: auto;
}

.search-section-header {
    padding: var(--space-md) var(--space-lg) var(--space-xs);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-top: 1px solid var(--overlay-white-subtle);
}

.search-section-header:first-child {
    border-top: none;
}

.search-section-header--clickable {
    cursor: pointer;
    padding-bottom: var(--space-md);
}

.search-section-header--clickable:hover {
    color: var(--color-white);
    background-color: var(--overlay-white-subtle);
}

.search-subsection-header {
    padding: var(--space-xs) var(--space-lg) var(--space-xs) var(--space-xl);
    font-size: var(--font-size-12);
    font-style: italic;
    color: var(--color-accent-cyan);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.search-hit-item {
    margin: var(--space-md) 0;
    padding: 0 var(--space-lg) 0 var(--space-xl);
    cursor: pointer;
    font-size: var(--font-size-12);
    color: var(--color-gray-medium);
    line-height: var(--line-height-normal);
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    max-height: calc(var(--font-size-12) * 3);
    transition: var(--transition-color-bg);
    border-bottom: 1px solid var(--overlay-white-subtle);
}

.search-hit-item:hover {
    color: var(--color-text-secondary);
    background-color: var(--overlay-white-subtle);
}

.no-results {
    padding: var(--space-md) var(--space-lg);
    color: var(--color-gray-medium);
    font-size: var(--font-size-14);
}

:deep(mark) {
    background: var(--color-accent-yellow, #f5c842);
    color: var(--color-text-dark, #1a1a1a);
    border-radius: 2px;
    padding: 0 1px;
}
</style>
