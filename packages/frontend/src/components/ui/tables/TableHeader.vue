<template>
    <div class="table-header edit-trigger">
        <div class="header-left">
            <div v-if="collapsible" class="title-container clickable" @click="$emit('toggle-collapse')">
                <component :is="isCollapsed ? ChevronRightIcon : ChevronDownIcon" class="collapse-icon" />
                <h2>{{ title }}</h2>
            </div>
            <h2 v-else>{{ title }}</h2>

            <FloatingActionButton v-if="showEditButton" type="edit" size="small" visibility="on-hover"
                :is-active="isEditMode" @click="$emit('toggle-edit')" />
            <slot name="header-left" />
        </div>
        <div class="header-center">
            <slot name="header-center" />
        </div>
        <div class="header-right">
            <slot name="header-right" />
        </div>
    </div>
</template>

<script setup>
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

defineProps({
    title: {
        type: String,
        required: true
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    showEditButton: {
        type: Boolean,
        default: true
    },
    collapsible: {
        type: Boolean,
        default: false
    },
    isCollapsed: {
        type: Boolean,
        default: false
    }
})

defineEmits(['toggle-edit', 'toggle-collapse'])
</script>

<style scoped>
.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
}

.title-container {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
}

.title-container.clickable {
    cursor: pointer;
    user-select: none;
}

.collapse-icon {
    width: 20px;
    height: 20px;
    color: var(--color-text-secondary);
}

.title-container:hover .collapse-icon {
    color: var(--color-primary);
}

.header-center {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
}

.header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
}

h2 {
    margin: var(--space-xs);
}
</style>
