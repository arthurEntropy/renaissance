<template>
    <div class="physical-stats">
        <span class="physical-stat">
            <span class="physical-stat-label">Age: </span>
            <span class="physical-stat-value">{{ props.age }}</span>
        </span>
        <span class="physical-stat">
            <span class="physical-stat-label">Height: </span>
            <span class="physical-stat-value">{{ props.heightFeet }}' {{ props.heightInches }}"</span>
        </span>
        <span class="physical-stat">
            <span class="physical-stat-label">Weight: </span>
            <span class="physical-stat-value">{{ props.weight }} lbs</span>
        </span>
    </div>
</template>

<script setup>
const props = defineProps({
    age: { type: Number, default: 0 },
    heightFeet: { type: Number, default: 0 },
    heightInches: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
})
</script>

<style scoped>
.physical-stats {
    display: flex;
    justify-content: center;
    gap: var(--space-sm);
    font-size: var(--font-size-10);
    font-style: italic;
    color: var(--color-gray-light);
    line-height: var(--line-height-none);
}

.physical-stat-label {
    color: inherit;
}

.physical-stat-value {
    color: var(--color-text-primary);
    font-style: normal;
}
</style>
