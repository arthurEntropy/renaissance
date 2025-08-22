<template>
    <div v-if="show" class="item-selector-container">
        <div v-if="title" class="item-selector-title">
            <h3>{{ title }}</h3>
            <span @click="$emit('close')" class="close-selector">×</span>
        </div>

        <!-- Choice Mode: Show options for custom vs library -->
        <div v-if="showChoiceMode && choiceOptions.length > 0" class="choice-options-container">
            <div v-for="option in choiceOptions" :key="option.key" class="choice-option"
                @click="$emit('choice', option.key)">
                <component :is="option.icon" class="choice-option-icon" />
                {{ option.label }}
            </div>
        </div>

        <!-- Normal Mode: Show item selection -->
        <template v-else>
            <div class="item-selector-header">
                <input type="text" :value="searchQuery" :placeholder="searchPlaceholder" class="item-search"
                    @input="handleSearch" />
                <span v-if="!title" @click="$emit('close')" class="close-selector">×</span>
            </div>
            <div class="item-options-container">
                <template v-for="(items, source) in groupedItems" :key="source">
                    <div class="item-source-group">
                        <div class="source-header">{{ getSourceName(source) }}</div>
                        <div v-for="item in items" :key="item.id" class="item-option" @click="$emit('select', item)">
                            <slot name="item-display" :item="item">
                                {{ item.name }}
                                <span v-if="item.mp" class="item-cost">({{ item.mp }} MP)</span>
                                <span v-if="item.weight" class="item-weight">({{ item.weight }} lbs)</span>
                            </slot>
                        </div>
                    </div>
                </template>
                <div v-if="Object.keys(groupedItems).length === 0" class="no-items-message">
                    {{ noItemsMessage }}
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
const _props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''
    },
    groupedItems: {
        type: Object,
        default: () => ({})
    },
    searchQuery: {
        type: String,
        default: ''
    },
    searchPlaceholder: {
        type: String,
        default: 'Search items...'
    },
    noItemsMessage: {
        type: String,
        default: 'No items found'
    },
    getSourceName: {
        type: Function,
        required: true
    },
    // Choice mode props
    showChoiceMode: {
        type: Boolean,
        default: false
    },
    choiceOptions: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['close', 'select', 'search', 'choice'])

const handleSearch = (event) => {
    emit('search', event.target.value)
}
</script>

<style scoped>
.item-selector-container {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 500px;
    max-height: 80vh;
    background-color: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    z-index: var(--z-modal);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-elevation-lg);
}

.item-selector-title {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-lg) var(--space-lg) var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--overlay-white-subtle);
    position: relative;
}

.item-selector-title h3 {
    margin: 0;
    font-size: var(--font-size-24);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
}

.item-selector-title .close-selector {
    position: absolute;
    right: var(--space-lg);
}

.item-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg);
}

/* Adjust padding when title is present */
.item-selector-title+.item-selector-header {
    padding-top: var(--space-md);
    border-top: none;
}

.item-search {
    flex: 1;
    padding: var(--space-sm) 12px;
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    background-color: var(--overlay-white-subtle);
    color: var(--color-white);
    font-size: var(--font-size-16);
}

.close-selector {
    font-size: var(--font-size-24);
    margin-left: 15px;
    cursor: pointer;
    color: var(--color-gray-light);
}

.close-selector:hover {
    color: var(--color-white);
}

.choice-options-container {
    padding: var(--space-md);
}

.choice-option {
    padding: var(--space-lg);
    cursor: pointer;
    transition: var(--transition-background);
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-5);
}

.choice-option-icon {
    width: 20px;
    height: 20px;
    margin-right: var(--space-md);
    color: var(--color-primary);
}

.choice-option:hover {
    background-color: var(--overlay-white-subtle);
}

.choice-option:not(:last-child) {
    margin-bottom: var(--space-xs);
}

.item-options-container {
    overflow-y: auto;
    max-height: calc(80vh - 60px);
    padding: var(--space-md);
}

.item-source-group {
    margin-bottom: 15px;
}

.source-header {
    font-weight: var(--font-weight-bold);
    color: var(--color-gray-light);
    padding: var(--space-xs) 0;
    border-bottom: 1px solid var(--overlay-white-subtle);
    margin-bottom: 8px;
}

.item-option {
    padding: var(--space-sm) 12px;
    cursor: pointer;
    border-radius: var(--radius-5);
    transition: var(--transition-background);
}

.item-option:hover {
    background-color: var(--overlay-white-subtle);
}

.item-cost,
.item-weight {
    color: var(--color-gray-light);
    font-size: var(--font-size-14);
    margin-left: 5px;
}

.no-items-message {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--space-lg);
    font-style: italic;
}
</style>
