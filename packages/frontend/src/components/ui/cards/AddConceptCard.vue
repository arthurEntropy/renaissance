<template>
    <div class="add-concept-card" @click="$emit('click')">
        <div class="add-icon">+</div>
        <div class="add-text">Add {{ conceptName }}</div>
    </div>
</template>

<script setup>
defineProps({
    conceptName: {
        type: String,
        required: true
    }
})

defineEmits(['click'])
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.add-concept-card {
    width: 200px;
    height: 228px;
    background: var(--overlay-white-subtle);
    border: 2px dashed var(--color-border-secondary);
    border-radius: var(--radius-5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-all);
    margin: var(--space-md);
    padding: var(--space-xl);
}

.add-concept-card:hover {
    background-color: var(--overlay-black-heavy);
    border-color: var(--color-white);
}

.add-icon {
    font-size: var(--font-size-32);
    font-weight: var(--font-weight-light);
    color: var(--color-gray-light);
    margin-bottom: 10px;
}

.add-text {
    color: var(--color-gray-light);
    font-size: var(--font-size-16);
}

@media (max-width: var(--breakpoint-sm)) {
    .add-concept-card {
        width: 80%;
        margin-left: 10px;
        margin-right: 10px;
    }
}
</style>
