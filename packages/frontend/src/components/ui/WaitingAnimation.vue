<template>
    <div class="waiting-animation">
        <LoadingSpinner size="medium" />
    </div>
</template>

<script setup>
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
</script>

<style scoped>
.waiting-animation {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
}
</style>
