<template>
    <div class="table-header edit-trigger">
        <div class="header-left">
            <h2>{{ title }}</h2>
            <EditButton size="small" visibility="on-hover" :is-edit-mode="isEditMode" @click="$emit('toggle-edit')" />
        </div>
        <div class="header-right">
            <slot name="header-right" />
        </div>
    </div>
</template>

<script setup>
import EditButton from '@/components/ui/buttons/EditButton.vue'

defineProps({
    title: {
        type: String,
        required: true
    },
    isEditMode: {
        type: Boolean,
        default: false
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
