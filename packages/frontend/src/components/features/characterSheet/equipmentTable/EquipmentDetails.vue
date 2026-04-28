<template>
    <div class="equipment-row-details">
        <div class="details-content">
            <!-- Checkbox Group -->
            <div class="checkbox-group">
                <div class="detail-item checkbox-item">
                    <input type="checkbox" class="equipment-checkbox" :checked="equipmentItem.isCarried"
                        :disabled="!isEditMode" @change="handleCarriedChange($event.target.checked)" />
                    <em class="carried-label">Carried</em>
                </div>

                <div class="detail-item checkbox-item">
                    <input type="checkbox" class="equipment-checkbox" :checked="equipmentItem.isWielding"
                        :disabled="!equipmentItem.isCarried || !isEditMode"
                        @change="handleWieldingChange($event.target.checked)" />
                    <em class="carried-label">
                        Wielding
                    </em>
                </div>
            </div>

            <!-- Divider -->
            <div class="details-divider"></div>

            <!-- Quantity and Weight Group -->
            <div class="quantity-weight-group">
                <div class="detail-item">
                    <em class="carried-label">Qty:</em>
                    <NumberInput :model-value="equipmentItem.quantity" :disabled="!isEditMode"
                        @update:model-value="handleQuantityChange" :min="1" :size="NUMBER_INPUT_SIZES.SMALL"
                        class="quantity-input" />
                </div>

                <div class="detail-item carried-weight">
                    <span>{{ displayWeight }}</span>
                    <em class="carried-label"> lbs total</em>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'

const props = defineProps({
    equipmentItem: {
        type: Object,
        required: true
    },
    itemId: {
        type: String,
        required: true
    },
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update-carried', 'update-wielding', 'update-quantity'])

const displayWeight = computed(() => {
    if (props.equipmentItem.isCarried && props.equipmentItem.equipment) {
        const value = props.equipmentItem.equipment.weight * props.equipmentItem.quantity
        if (typeof value !== 'number' || isNaN(value)) {
            return '0'
        }
        return Number.isInteger(value) ? value.toString() : value.toFixed(1)
    }
    return '0'
})

// Event handlers
const handleCarriedChange = (isCarried) => {
    emit('update-carried', props.itemId, isCarried)
}

const handleWieldingChange = (isWielding) => {
    const shouldWield = isWielding && props.equipmentItem.isCarried
    emit('update-wielding', props.itemId, shouldWield)
}

const handleQuantityChange = (value) => {
    const quantity = Math.max(1, value)
    emit('update-quantity', props.itemId, quantity)
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.equipment-row-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 8px 4px 8px;
    background-color: var(--overlay-white-medium);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-10);
    width: 100%;
    min-width: 0;
    margin-left: 0;
    margin-top: -20px;
    box-sizing: border-box;
}

.details-content {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    align-items: center;
    gap: var(--space-md);
    font-size: var(--font-size-12);
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
    justify-content: center;
}

.quantity-weight-group {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex: 1;
    justify-content: center;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 2px;
}

.checkbox-item {
    margin-left: -5px;
}

.equipment-checkbox {
    width: 12px;
    height: 12px;
    cursor: pointer;
    margin-left: var(--space-sm);
    font-size: var(--font-size-10);
    left: 0px;
}

.equipment-checkbox:checked:after {
    left: 0px;
    top: -2px;
}

.carried-label {
    font-style: italic;
    color: var(--color-text-secondary);
    margin-left: 2px;
}

.carried-weight {
    font-weight: bold;
    font-size: var(--font-size-12);
}

.carried-weight span {
    display: inline-block;
    min-width: 25px;
    text-align: right;
}

.quantity-input {
    top: 2px;
}

.details-divider {
    width: 1px;
    align-self: stretch;
    background: linear-gradient(to bottom,
            transparent,
            var(--color-border-primary) 20%,
            var(--color-border-primary) 80%,
            transparent);
}
</style>
