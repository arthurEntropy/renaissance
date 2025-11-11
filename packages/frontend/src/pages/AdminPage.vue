<template>
    <div class="admin-page">
        <UserManager />
        <BackgroundManager />
        <ExpansionManager />
    </div>
</template>

<script setup>
import ExpansionManager from '@/components/features/admin/ExpansionManager.vue'
import UserManager from '@/components/features/admin/UserManager.vue'
import BackgroundManager from '@/components/features/admin/BackgroundManager.vue'
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