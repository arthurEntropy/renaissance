<template>
    <div class="concept-section" :class="{ 'flush-top': flush }" v-if="hasContent || isEditMode">
        <h2 v-if="title" class="section-header" :class="{ 'edit-hover-area': showEditButton }">
            {{ title }}
            <FloatingActionButton v-if="showEditButton" type="edit" :is-active="isSectionEditing"
                @click="$emit('toggle-edit')" size="small" visibility="always" />
        </h2>
        <div v-if="!hasContent && isEditMode && !isSectionEditing" class="empty-section-placeholder">
            {{ emptyMessage }}
        </div>
        <slot />
    </div>
</template>

<script setup>
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'

defineProps({
    title: {
        type: String,
        default: ''
    },
    hasContent: {
        type: Boolean,
        required: true
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    emptyMessage: {
        type: String,
        default: 'No content added yet.'
    },
    showEditButton: {
        type: Boolean,
        default: false
    },
    isSectionEditing: {
        type: Boolean,
        default: false
    },
    flush: {
        type: Boolean,
        default: false
    }
})

defineEmits(['toggle-edit'])
</script>

<style scoped>
.concept-section {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: var(--space-lg);
    text-align: left;
}

.concept-section.flush-top {
    margin-top: 0;
}

.section-header {
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-sm);
    font-size: var(--font-size-32);
}

.section-header.edit-hover-area {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.empty-section-placeholder {
    padding: var(--space-xl);
    margin: var(--space-md) 0;
    text-align: center;
    color: var(--color-text-secondary);
    font-style: italic;
    background: var(--color-bg-secondary);
    border: 2px dashed var(--color-border-secondary);
    border-radius: var(--radius-10);
}
</style>
