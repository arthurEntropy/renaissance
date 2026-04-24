<template>
    <div class="grouped-masonry-container">
        <div class="grouped-display">
            <GroupSection v-for="(group, index) in groupedItems" :key="group.id || group.name"
                :group="{ ...group, collapsed: groupCollapsedState[group.id || group.name] ?? group.collapsed ?? false }"
                :column-width="columnWidth" :gap="gap" :row-height="rowHeight"
                :justify-content="justifyContent"
                :ref="el => { if (el) groupSectionRefs[index] = el }" @toggle-collapse="toggleGroupCollapse(index)">
                <template #items="{ items }">
                    <div v-for="item in items" :key="item.id" class="masonry-item">
                        <slot :item="item" />
                    </div>
                </template>
            </GroupSection>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import GroupSection from '@/components/ui/groups/GroupSection.vue'
import { useFilterPersistence } from '@/composables/useFilterPersistence'

const LAYOUT_UPDATE_DEBOUNCE_MS = 100

const props = defineProps({
    groupedItems: {
        type: Array,
        default: () => []
    },
    columnWidth: {
        type: Number,
        default: 375
    },
    gap: {
        type: Number,
        default: 15
    },
    rowHeight: {
        type: Number,
        default: 10
    },
    justifyContent: {
        type: String,
        default: 'center'
    },
    persistenceKey: {
        type: String,
        default: null
    }
})

const groupSectionRefs = ref([])
let layoutUpdateTimeout = null

// Track collapsed state for all groups
const groupCollapsedState = ref({})

if (props.persistenceKey) {
    useFilterPersistence(props.persistenceKey, { groupCollapsedState })
}

const toggleGroupCollapse = (index) => {
    if (!props.groupedItems[index]) return

    const group = props.groupedItems[index]
    const groupKey = group.id || group.name
    const currentCollapsed = groupCollapsedState.value[groupKey] ?? group.collapsed ?? false

    groupCollapsedState.value = { ...groupCollapsedState.value, [groupKey]: !currentCollapsed }

    nextTick(() => {
        updateLayoutImmediate()
    })
}

const updateLayoutImmediate = () => {
    groupSectionRefs.value.forEach(groupSection => {
        if (groupSection?.updateLayout) {
            groupSection.updateLayout()
        }
    })
}

const updateLayout = () => {
    // Debounced layout update to prevent flickering
    if (layoutUpdateTimeout) {
        clearTimeout(layoutUpdateTimeout)
    }
    layoutUpdateTimeout = setTimeout(() => {
        updateLayoutImmediate()
        layoutUpdateTimeout = null
    }, LAYOUT_UPDATE_DEBOUNCE_MS)
}

watch(() => props.groupedItems, () => {
    updateLayout()
}, { deep: true, flush: 'post' })

onBeforeUnmount(() => {
    if (layoutUpdateTimeout) {
        clearTimeout(layoutUpdateTimeout)
        layoutUpdateTimeout = null
    }
})

defineExpose({ updateLayout })
</script>

<style scoped>
.grouped-masonry-container {
    width: 100%;
}

.grouped-display {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
}

.masonry-item {
    width: 100%;
}
</style>
