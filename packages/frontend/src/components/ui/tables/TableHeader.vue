<template>
    <div class="table-header edit-trigger">
        <div class="header-left">
            <h2>{{ title }}</h2>
            <FloatingActionButton v-if="showEditButton" type="edit" size="small" visibility="on-hover"
                :is-active="isEditMode" @click="$emit('toggle-edit')" />
        </div>
        <div class="header-right">
            <slot name="header-right" />
        </div>
    </div>
</template>

<script setup>
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'

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
    }
})

defineEmits(['toggle-edit'])
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
    gap: var(--space-md);
}

.header-right {
    display: flex;
    align-items: center;
}

h2 {
    margin: var(--space-xs);
}
</style>
