<template>
    <div class="admin-page">
        <h1>Admin</h1>
        <ExpansionManager />
        <!-- Future admin sections can be added here -->
    </div>
</template>

<script setup>
import ExpansionManager from '@/components/features/admin/ExpansionManager.vue'
</script>

<style scoped>
.admin-page {
    max-width: 700px;
    margin: var(--space-xl);
    padding: var(--space-xl);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
}
</style>