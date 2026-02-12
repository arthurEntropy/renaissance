<template>
    <div class="grouped-masonry-container">
        <div class="grouped-display">
            <GroupSection v-for="(group, index) in groupedItems" :key="group.id || group.name"
                :group="{ ...group, collapsed: groupCollapsedState.get(group.id || group.name) ?? group.collapsed ?? false }"
                :column-width="columnWidth" :gap="gap" :row-height="rowHeight"
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
import { ref, watch, nextTick } from 'vue'
import GroupSection from '@/components/ui/groups/GroupSection.vue'

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
    }
})

const groupSectionRefs = ref([])

// Track collapsed state for all groups
const groupCollapsedState = ref(new Map())

const toggleGroupCollapse = (index) => {
    if (!props.groupedItems[index]) return

    const group = props.groupedItems[index]
    const groupKey = group.id || group.name
    const currentCollapsed = groupCollapsedState.value.get(groupKey) ?? group.collapsed ?? false
    const newCollapsed = !currentCollapsed

    groupCollapsedState.value.set(groupKey, newCollapsed)

    nextTick(() => {
        updateLayout()
    })
}

const updateLayout = () => {
    groupSectionRefs.value.forEach(groupSection => {
        if (groupSection?.updateLayout) {
            groupSection.updateLayout()
        }
    })
}

watch(() => props.groupedItems, () => {
    nextTick(() => {
        updateLayout()
    })
}, { deep: true })

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
