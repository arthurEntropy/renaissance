<template>
    <div :class="rowClass">
        <span class="skill-name" :class="stateClasses">{{ label }}</span>

        <!-- Range type (virtue: current/max) -->
        <template v-if="type === 'range'">
            <NumberInput :model-value="value.current" @update:model-value="$emit('update', 'current', $event)" :min="0"
                size="small" />
            <span>/</span>
            <NumberInput :model-value="value.max" @update:model-value="$emit('update', 'max', $event)" :min="0"
                size="small" />
        </template>

        <!-- Single value type (weakness) -->
        <template v-else-if="type === 'single'">
            <NumberInput :model-value="value" @update:model-value="$emit('update', $event)" :min="0" size="small" />
        </template>

        <!-- Checkbox type (states) -->
        <template v-else-if="type === 'state'">
            <input type="checkbox" :checked="firstState" @change="$emit('update', 'first', $event.target.checked)"
                class="skill-checkbox" :class="{ 'state-active-checkbox': firstState }" />
            <input type="checkbox" :checked="secondState" @change="$emit('update', 'second', $event.target.checked)"
                class="skill-checkbox" :class="{ 'state-active-checkbox': secondState }" />
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import NumberInput from '@/components/NumberInput.vue'

// Props
const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: value => ['range', 'single', 'state'].includes(value)
    },
    label: {
        type: String,
        required: true
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

// Emits
defineEmits(['update'])

// Computed
const rowClass = computed(() => {
    return {
        'virtue-row': props.type === 'range',
        'weakness-row': props.type === 'single',
        'state-row': props.type === 'state'
    }
})

const stateClasses = computed(() => {
    return {
        'state-active': props.type === 'state' && props.firstState
    }
})
</script>

<style scoped>
.virtue-row,
.weakness-row,
.state-row {
    display: grid;
    align-items: center;
    height: 25px;
    width: 100%;
    margin-top: 10px;
}

.virtue-row {
    grid-template-columns: 35% 19% 8% 19% 19%;
}

.weakness-row {
    grid-template-columns: 35% 65%;
}

.state-row {
    grid-template-columns: 35% 10% 10% 45%;
}

.skill-name {
    font-size: var(--font-size-14);
}

.state-active {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-sm-danger);
}

.state-active-checkbox {
    box-shadow: var(--shadow-glow-condition);
}
</style>
