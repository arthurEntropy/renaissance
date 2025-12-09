<template>
    <div class="equipment-row-details">
        <div class="details-content">
            <!-- Carried Checkbox -->
            <div class="detail-item checkbox-item">
                <input type="checkbox" class="equipment-checkbox" :checked="equipmentRow.isCarried"
                    :disabled="!isEditMode" @change="handleCarriedChange($event.target.checked)" />
                <em class="carried-label">carried</em>
            </div>

            <!-- Wielding Checkbox -->
            <div class="detail-item checkbox-item">
                <input type="checkbox" class="equipment-checkbox" :class="{
                    'disabled-checkbox': !canWield
                }" :checked="equipmentRow.isWielding" :disabled="!canWield || !isEditMode"
                    @change="handleWieldingChange($event.target.checked)" />
                <em class="carried-label" :class="{
                    'disabled-text': !canWield
                }">
                    wielding
                </em>
            </div>

            <div class="detail-item">
                <!-- Quantity -->
                <div class="detail-item">
                    <em class="carried-label">qty</em>
                    <NumberInput :model-value="equipmentRow.quantity" :disabled="!isEditMode"
                        @update:model-value="handleQuantityChange" :min="1" size="small" class="quantity-input" />
                </div>

                <!-- Carried Weight -->
                <div class="detail-item carried-weight">
                    <em class="carried-label">=</em>
                    <span>{{ displayWeight }}</span>
                    <em class="carried-label">lbs</em>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'

const equipmentTypesStore = useEquipmentTypesStore()

const props = defineProps({
    equipmentRow: {
        type: Object,
        required: true
    },
    index: {
        type: Number,
        required: true
    },
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update-carried', 'update-wielding', 'update-quantity'])

// Computed properties
const canWield = computed(() => {
    if (!props.equipmentRow.isCarried || !props.equipmentRow.equipment) {
        return false
    }
    const equipmentType = equipmentTypesStore.getById(props.equipmentRow.equipment.type)
    return equipmentType?.name === 'Weapon'
})

const displayWeight = computed(() => {
    if (props.equipmentRow.isCarried && props.equipmentRow.equipment) {
        const value = props.equipmentRow.equipment.weight * props.equipmentRow.quantity
        if (typeof value !== 'number' || isNaN(value)) {
            return '0'
        }
        return Number.isInteger(value) ? value.toString() : value.toFixed(1)
    }
    return '0'
})

// Event handlers
const handleCarriedChange = (isCarried) => {
    emit('update-carried', props.index, isCarried)
}

const handleWieldingChange = (isWielding) => {
    // Only allow wielding if the item can be wielded
    const shouldWield = isWielding && canWield.value
    emit('update-wielding', props.index, shouldWield)
}

const handleQuantityChange = (value) => {
    // Ensure minimum quantity of 1
    const quantity = Math.max(1, value)
    emit('update-quantity', props.index, quantity)
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.equipment-row-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background-color: var(--overlay-white-medium);
    border-radius: var(--radius-10);
    width: 100%;
    margin-left: 0;
    box-sizing: border-box;
}

.details-content {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-14);
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-grow: 1;
    justify-content: flex-start;
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

.disabled-checkbox {
    opacity: 0.5;
    cursor: not-allowed;
}

.disabled-text {
    color: var(--color-text-muted);
}

.carried-label {
    font-style: italic;
    color: var(--color-text-secondary);
}

.carried-weight {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--font-size-14);
}

.carried-weight span {
    display: inline-block;
    min-width: 25px;
    text-align: right;
}

.quantity-input {
    width: 40px;
    font-size: var(--font-size-12);
}
</style>
