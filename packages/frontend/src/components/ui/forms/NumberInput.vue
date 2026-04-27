<template>
  <div class="number-input-container">
    <input type="number" :value="modelValue" :disabled="disabled"
      @input="$emit('update:modelValue', Number(($event.target).value))" @keydown.enter="($event.target).blur()"
      :min="min" :max="max" :step="step" :class="`input-${size}`" />
    <div v-if="!disabled" :class="['spinner-buttons', `spinner-buttons-${size}`]">
      <button @click="increment" class="spinner-up" aria-label="Increment" type="button">▲</button>
      <button @click="decrement" class="spinner-down" aria-label="Decrement" type="button">▼</button>
    </div>
  </div>
</template>

<script setup>
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: null },
  max: { type: Number, default: null },
  step: { type: Number, default: 1 },
  size: {
    type: String,
    default: NUMBER_INPUT_SIZES.MEDIUM,
    validator: (v) => Object.values(NUMBER_INPUT_SIZES).includes(v)
  },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const increment = () => {
  if (props.max === null || props.modelValue < props.max) {
    const next = Math.min(props.modelValue + props.step, props.max ?? Infinity)
    emit('update:modelValue', next)
  }
}

const decrement = () => {
  if (props.min === null || props.modelValue > props.min) {
    const next = Math.max(props.modelValue - props.step, props.min ?? -Infinity)
    emit('update:modelValue', next)
  }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.number-input-container {
  position: relative;
  display: inline-block;
  height: var(--space-xl);
  width: 40px;
}

input[type='number'] {
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
  appearance: textfield;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  color: var(--color-white);
  text-align: center;
  padding: 0 var(--space-sm) 0 var(--space-xs);
  width: 100%;
  box-sizing: border-box;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number']:disabled {
  opacity: 0.7;
  cursor: default;
}

.input-small {
  font-size: var(--font-size-12);
}

.input-medium {
  font-size: var(--font-size-16);
}

.input-large {
  font-size: var(--font-size-20);
}

.spinner-buttons {
  position: absolute;
  right: 1px;
  width: var(--space-md);
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: var(--transition-opacity);
  pointer-events: none;
  z-index: var(--z-overlay);
  border-radius: 0 var(--radius-5) var(--radius-5) 0;
  overflow: hidden;
}

.spinner-buttons-small {
  top: 2px;
  width: 10px;
}

.spinner-buttons-medium {
  top: 2px;
  bottom: -1px;
}

.spinner-buttons-large {
  top: 3px;
  right: 2px;
}

.number-input-container:hover .spinner-buttons {
  opacity: 1;
  pointer-events: auto;
}

.spinner-up,
.spinner-down {
  background: var(--overlay-black-medium);
  border: none;
  color: var(--color-primary);
  padding: 0;
  height: 50%;
  width: 100%;
  font-size: var(--font-size-10);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-buttons-small .spinner-up,
.spinner-buttons-small .spinner-down {
  font-size: 6px;
}

.spinner-up {
  border-radius: 0 var(--radius-5) 0 0;
}

.spinner-down {
  border-radius: 0 0 var(--radius-5) 0;
}

.spinner-up:hover,
.spinner-down:hover {
  background: var(--overlay-black-heavy);
}

input:focus {
  outline: none;
  border-color: var(--color-gray-light);
  box-shadow: var(--shadow-glow-sm);
}
</style>
