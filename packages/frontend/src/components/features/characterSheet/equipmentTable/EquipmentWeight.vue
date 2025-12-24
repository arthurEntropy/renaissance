<template>
    <div class="total-weight-container">
        <span class="total-weight-carried">Total Carried:</span>
        <span class="equipment-lbs-carried">{{ totalWeight }} lbs</span>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    equipmentItems: {
        type: Array,
        required: true,
        default: () => []
    }
})

const totalWeight = computed(() => {
    return Math.round(
        props.equipmentItems.reduce((sum, item) => {
            if (!item.equipment) return sum
            return item.isCarried ? sum + item.equipment.weight * item.quantity : sum
        }, 0)
    )
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.total-weight-container {
    display: flex;
    align-items: center;
    background-color: var(--color-gray-dark);
    padding: var(--space-xs) var(--space-lg);
    border-radius: var(--radius-15);
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
