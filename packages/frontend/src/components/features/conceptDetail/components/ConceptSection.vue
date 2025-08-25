<template>
    <div class="concept-section" v-if="hasContent || isEditMode">
        <h2 v-if="title" class="section-header" :class="{ 'edit-hover-area': showEditButton }">
            {{ title }}
            <EditButton v-if="showEditButton" :is-editing="isSectionEditing" @click="$emit('toggle-edit')"
                :title="`Edit ${title.toLowerCase()}`" size="small" visibility="on-hover" />
        </h2>
        <div v-if="!hasContent && isEditMode && !isSectionEditing" class="empty-section-placeholder">
            {{ emptyMessage }}
        </div>
        <slot />
    </div>
</template>

<script setup>
import EditButton from '@/components/ui/buttons/EditButton.vue'

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
    text-align: center;
    color: var(--color-text-tertiary);
    font-style: italic;
    background: var(--color-bg-secondary);
    border: 2px dashed var(--color-border-secondary);
    border-radius: var(--radius-10);
}
</style>
