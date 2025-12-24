<template>
    <div :class="rowClass">
        <span class="stat-name" :class="stateClasses">{{ label }}</span>

        <!-- Range type (virtue: current/max) -->
        <template v-if="type === STAT_ROW_TYPES.RANGE">
            <NumberInput :model-value="value.current" :disabled="!canEdit"
                @update:model-value="$emit('update', 'current', $event)" :min="0" size="small" />
            <span class="range-separator">/</span>
            <NumberInput :model-value="value.max" :disabled="!canEdit"
                @update:model-value="$emit('update', 'max', $event)" :min="0" size="small" />
        </template>

        <!-- Single value type (weakness) -->
        <template v-else-if="type === STAT_ROW_TYPES.SINGLE">
            <NumberInput :model-value="value" :disabled="!canEdit" @update:model-value="$emit('update', $event)"
                :min="0" size="small" />
        </template>

        <!-- Checkbox type (states) -->
        <template v-else-if="type === STAT_ROW_TYPES.STATE">
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
    }
})

const { type, label, canEdit, value, firstState, secondState } = toRefs(props)

defineEmits(['update'])

const rowClass = computed(() => {
    return {
        'virtue-row': type.value === STAT_ROW_TYPES.RANGE,
        'weakness-row': type.value === STAT_ROW_TYPES.SINGLE,
        'state-row': type.value === STAT_ROW_TYPES.STATE
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
}

.virtue-row {
    grid-template-columns: 40% 12% 8% 12%
}

.weakness-row {
    grid-template-columns: 40% 65%;
}

.state-row {
    grid-template-columns: 39% 8% 8%;
}

.stat-name {
    font-size: var(--font-size-14);
    text-align: left;
}

.range-separator {
    text-align: center;
    font-size: var(--font-size-14);
    color: var(--color-text-muted);
}

.state-active {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-danger-sm);
}

.state-active-checkbox {
    box-shadow: var(--shadow-glow-danger-md);
}
</style>
