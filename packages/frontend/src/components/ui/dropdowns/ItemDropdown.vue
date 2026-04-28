<template>
    <div v-if="show" class="item-dropdown" :style="{ top: position.y + 'px', left: position.x + 'px' }">
        <div v-if="items.length > 0" :class="customClass">
            <button v-for="(item, index) in items" :key="getItemKey(item, index)" class="item-option"
                @click="$emit('select', item)">
                <slot name="item" :item="item">
                    {{ getItemLabel(item) }}
                </slot>
            </button>
        </div>

        <div v-else class="item-dropdown-empty">
            <slot name="empty">
                {{ emptyMessage }}
            </slot>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    position: {
        type: Object,
        default: () => ({ x: 0, y: 0 })
    },
    items: {
        type: Array,
        default: () => []
    },
    emptyMessage: {
        type: String,
        default: 'No items available'
    },
    itemKey: {
        type: String,
        default: 'id'
    },
    itemLabel: {
        type: String,
        default: 'name'
    },
    customClass: {
        type: String,
        default: ''
    }
})

defineEmits(['select'])

const getItemKey = (item, index) => {
    return typeof item === 'object' ? (item[props.itemKey] ?? index) : item
}

const getItemLabel = (item) => {
    return typeof item === 'object' ? item[props.itemLabel] : item
}
</script>

<style scoped>
.item-dropdown {
    position: fixed;
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-gray-light);
    border-radius: var(--radius-5);
    padding: var(--space-sm);
    z-index: var(--z-dropdown);
    max-width: 250px;
    max-height: 400px;
    overflow-y: auto;
    box-shadow: var(--shadow-sm);
}

.item-option {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--space-xs) 8px;
    margin-bottom: 3px;
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: none;
    border-radius: var(--radius-5);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--font-size-14);
    transition: var(--transition-background);
}

.item-option:hover {
    background-color: var(--color-bg-tertiary);
}

.item-dropdown-empty {
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-xs);
    text-align: center;
    font-size: var(--font-size-14);
}
</style>
