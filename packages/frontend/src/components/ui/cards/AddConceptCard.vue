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
    width: 250px;
    height: 270px;
    background: var(--overlay-white-medium);
    border: 2px dashed var(--overlay-white-subtle);
    border-radius: var(--radius-10);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-all);
    margin: var(--space-md);
}

.add-concept-card:hover {
    background: var(--overlay-white-subtle);
    border-color: var(--overlay-white-medium);
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
