<template>
  <div class="number-input-container" :class="sizeClass">
    <input type="number" :value="modelValue" @input="$emit('update:modelValue', Number(($event.target).value))"
      :min="min" :max="max" :step="step" :class="inputClass" />
    <div class="spinner-buttons">
      <button @click="increment" class="spinner-up">▲</button>
      <button @click="decrement" class="spinner-down">▼</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: null },
  max: { type: Number, default: null },
  step: { type: Number, default: 1 },
  size: { type: String, default: 'small', validator: (v) => ['tiny', 'small', 'large'].includes(v) },
})

const emit = defineEmits(['update:modelValue'])

const sizeClass = computed(() => `number-input-${props.size}`)
const inputClass = computed(() => `input-${props.size}`)

function increment() {
  if (props.max === null || props.modelValue < props.max) {
    const next = Math.min(props.modelValue + props.step, props.max ?? Infinity)
    emit('update:modelValue', next)
  }
}

function decrement() {
  if (props.min === null || props.modelValue > props.min) {
    const next = Math.max(props.modelValue - props.step, props.min ?? -Infinity)
    emit('update:modelValue', next)
  }
}
</script>

<style scoped>
.number-input-container {
  position: relative;
  display: inline-block;
}

.number-input-tiny {
  height: 16px;
  width: 40px;
}

.number-input-small {
  height: 20px;
  width: 40px;
}

.number-input-large {
  height: 24px;
  width: 40px;
}

input[type='number'] {
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
  appearance: textfield;
  background-color: var(--overlay-white-subtle);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-4);
  color: white;
  text-align: center;
  padding: 0 14px 0 4px;
  /* Add right padding to make room for buttons */
  width: 100%;
  box-sizing: border-box;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-tiny {
  font-size: var(--font-size-10);
}

.input-small {
  font-size: var(--font-size-16);
}

.input-large {
  font-size: var(--font-size-20);
}

/* Spinner buttons styling */
.spinner-buttons {
  position: absolute;
  top: 1px;
  /* Account for input border */
  bottom: 1px;
  /* Account for input border */
  right: 1px;
  /* Position just inside the input border */
  width: 12px;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: var(--transition-opacity);
  pointer-events: none;
  /* Initially hidden from interaction */
  z-index: var(--z-overlay);
  /* Ensure buttons are above input */
  border-radius: 0 var(--radius-3) var(--radius-3) 0;
  /* Match input's right border radius */
  overflow: hidden;
  /* Ensure buttons don't exceed container */
}

.number-input-container:hover .spinner-buttons {
  opacity: 1;
  pointer-events: auto;
  /* Enable interaction on hover */
}

.spinner-up,
.spinner-down {
  background: var(--overlay-black-medium);
  border: none;
  color: white;
  padding: 0;
  height: 50%;
  width: 100%;
  font-size: var(--font-size-10);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-up {
  border-radius: 0 var(--radius-3) 0 0;
}

.spinner-down {
  border-radius: 0 0 var(--radius-3) 0;
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
