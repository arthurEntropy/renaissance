<template>
    <div class="total-weight-container">
        <span class="total-weight-carried">Total Carried:</span>
        <span class="equipment-lbs-carried">{{ totalWeight }} lbs</span>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { calculateTotalWeight } from '@/utils/weightUtils'

const props = defineProps({
    equipmentRows: {
        type: Array,
        required: true,
        default: () => []
    }
})

const totalWeight = computed(() => {
    return calculateTotalWeight(props.equipmentRows)
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.total-weight-container {
    display: flex;
    align-items: center;
    background-color: var(--color-gray-dark);
    padding: var(--space-xs) 10px;
    border-radius: var(--radius-5);
    width: auto;
    gap: var(--space-xs);
}

.total-weight-carried {
    font-size: var(--font-size-10);
    font-style: italic;
    white-space: nowrap;
    margin-top: 2px;
}

.equipment-lbs-carried {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
    min-width: 55px;
    text-align: right;
}
</style>
