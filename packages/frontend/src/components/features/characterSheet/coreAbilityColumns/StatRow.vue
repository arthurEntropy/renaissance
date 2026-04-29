<template>
    <div :class="[rowClass, 'edit-hover-area']">
        <span class="stat-name" :class="stateClasses">{{ label }}</span>

        <!-- Range type (virtue: current/max) -->
        <template v-if="type === STAT_ROW_TYPES.RANGE">
            <FloatingActionButton v-if="canEdit" class="reset-button" :variant="FAB_TYPES.REFRESH"
                :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ON_HOVER" @click="emit('reset')" />
            <NumberInput :model-value="value.current" :disabled="!canEdit"
                @update:model-value="$emit('update', 'current', $event)" :min="0" :size="NUMBER_INPUT_SIZES.MEDIUM" />
            <span class="range-separator">/</span>
            <NumberInput :model-value="value.max" :disabled="!canEdit"
                :class="{ 'max-value-armor': armorDefenseBonus > 0 }"
                @update:model-value="$emit('update', 'max', $event)" :min="0" :size="NUMBER_INPUT_SIZES.MEDIUM" />
            <FloatingActionButton v-if="showAutoCalcButton && armorDefenseBonus <= 0" class="virtue-auto-calc-button"
                :variant="isAutoCalc ? FAB_TYPES.AUTO_CALC_ON : FAB_TYPES.AUTO_CALC" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="emit('toggle-auto-calc')" />
            <span class="armor-defense-bonus" :class="{ 'armor-defense-bonus--hidden': armorDefenseBonus <= 0 }">
                {{ armorDefenseBonus > 0 ? `+${armorDefenseBonus}` : '' }}
            </span>
            <FloatingActionButton v-if="showAutoCalcButton && armorDefenseBonus > 0"
                class="virtue-auto-calc-button virtue-auto-calc-armor"
                :variant="isAutoCalc ? FAB_TYPES.AUTO_CALC_ON : FAB_TYPES.AUTO_CALC" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="emit('toggle-auto-calc')" />
        </template>

        <!-- Single value type (weakness) -->
        <template v-else-if="type === STAT_ROW_TYPES.SINGLE">
            <FloatingActionButton v-if="canEdit && showInjuryRollButton" class="injury-roll-button"
                :variant="FAB_TYPES.INJURY" :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ON_HOVER"
                @click="emit('roll-injury')" />
            <FloatingActionButton v-if="canEdit && showAutoCalcButton" class="auto-calc-button"
                :variant="isAutoCalc ? FAB_TYPES.AUTO_CALC_ON : FAB_TYPES.AUTO_CALC" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="emit('toggle-auto-calc')" />
            <NumberInput :model-value="value" :disabled="!canEdit" @update:model-value="$emit('update', $event)"
                :min="0" :size="NUMBER_INPUT_SIZES.MEDIUM" />
        </template>

        <!-- Checkbox type (states) -->
        <template v-else-if="type === STAT_ROW_TYPES.STATE">
            <FloatingActionButton v-if="canEdit && showAutoCalcButton" class="auto-calc-button"
                :variant="isAutoCalc ? FAB_TYPES.AUTO_CALC_ON : FAB_TYPES.AUTO_CALC" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="emit('toggle-auto-calc')" />
            <input type="checkbox" :checked="firstState" :disabled="!canEdit"
                @change="$emit('update', 'first', $event.target.checked)" class="skill-checkbox"
                :class="{ 'state-active-checkbox': firstState }" />
            <input type="checkbox" :checked="secondState" :disabled="!canEdit"
                @change="$emit('update', 'second', $event.target.checked)" class="skill-checkbox"
                :class="{ 'state-active-checkbox': secondState }" />
        </template>
    </div>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'
import { STAT_ROW_TYPES } from '@shared/constants/characterConstants'

// Props
const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: value => Object.values(STAT_ROW_TYPES).includes(value)
    },
    label: {
        type: String,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: false
    },
    value: {
        type: [Object, Number],
        default: null
    },
    firstState: {
        type: Boolean,
        default: false
    },
    secondState: {
        type: Boolean,
        default: false
    },
    showAutoCalcButton: {
        type: Boolean,
        default: false
    },
    showInjuryRollButton: {
        type: Boolean,
        default: false
    },
    isAutoCalc: {
        type: Boolean,
        default: true
    },
    armorDefenseBonus: {
        type: Number,
        default: 0
    }
})

const { type, label, canEdit, value, firstState, secondState, showAutoCalcButton, showInjuryRollButton, isAutoCalc, armorDefenseBonus } = toRefs(props)

const emit = defineEmits(['update', 'reset', 'toggle-auto-calc', 'roll-injury'])

const rowClass = computed(() => {
    return {
        'virtue-row': type.value === STAT_ROW_TYPES.RANGE,
        'weakness-row': type.value === STAT_ROW_TYPES.SINGLE,
        'weakness-row--with-button': type.value === STAT_ROW_TYPES.SINGLE && (showAutoCalcButton.value || showInjuryRollButton.value),
        'state-row': type.value === STAT_ROW_TYPES.STATE,
        'state-row--with-button': type.value === STAT_ROW_TYPES.STATE && showAutoCalcButton.value
    }
})

const stateClasses = computed(() => {
    return {
        'state-active': type.value === STAT_ROW_TYPES.STATE && firstState.value
    }
})
</script>

<style scoped>
.virtue-row,
.weakness-row,
.state-row {
    display: grid;
    align-items: center;
    min-height: 25px;
    width: 100%;
    margin-top: var(--space-sm);
    position: relative;
}

.virtue-row {
    grid-template-columns: 75px 30px 40px 30px 30px 40px 30px;
}

.virtue-row .reset-button {
    justify-self: end;
    margin-right: 4px;
}

.weakness-row {
    grid-template-columns: 37% 63%;
}

.weakness-row--with-button {
    grid-template-columns: 75px 30px 65px;
}

.weakness-row--with-button .auto-calc-button {
    justify-self: end;
    margin-right: 4px;
}

.weakness-row--with-button .injury-roll-button {
    justify-self: end;
    margin-right: 4px;
}

.state-row {
    grid-template-columns: 36% 8% 8%;
}

.state-row input[type="checkbox"] {
    margin-left: 1px;
}

.state-row--with-button {
    grid-template-columns: 75px 30px 8% 8%;
}

.state-row--with-button .auto-calc-button {
    justify-self: end;
    margin-right: 4px;
}

.stat-name {
    font-size: var(--font-size-15);
    text-align: left;
}

.range-separator {
    text-align: center;
    font-size: var(--font-size-14);
    color: var(--color-text-muted);
}

.state-active {
    color: var(--color-danger);
    text-shadow: var(--glow-danger-sm);
}

.state-active-checkbox {
    box-shadow: var(--glow-danger-lg);
}

.armor-defense-bonus {
    font-size: var(--font-size-16);
    font-weight: bold;
    color: var(--color-accent-armor);
    align-self: center;
    padding: 2px 0 0 var(--space-lg);
    white-space: nowrap;
}

.armor-defense-bonus--hidden {
    visibility: hidden;
}

.max-value-armor :deep(input) {
    color: var(--color-accent-armor);
}

.virtue-auto-calc-button {
    justify-self: start;
    margin-left: 15px;
}

.virtue-auto-calc-armor :deep(.auto-text) {
    color: var(--color-accent-armor);
}

.virtue-auto-calc-armor :deep(.fab__icon--small),
.virtue-auto-calc-armor :deep(.fab__icon--large) {
    color: var(--color-accent-armor);
}
</style>
