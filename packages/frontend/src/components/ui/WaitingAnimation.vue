<template>
    <div class="waiting-animation">
        <div class="spinner"></div>
    </div>
</template>

<script setup>
</script>

<style scoped>
.waiting-animation {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
}

.spinner {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border-width: 3px;
    border-style: solid;
    border-color: var(--color-gray-medium);
    border-top-color: var(--color-text-primary);
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>
