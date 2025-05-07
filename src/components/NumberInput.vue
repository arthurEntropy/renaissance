<template>
    <div class="number-input-container" :class="sizeClass">
      <input 
        type="number"
        :value="modelValue"
        @input="$emit('update:modelValue', Number($event.target.value))"
        :min="min"
        :max="max"
        :step="step"
        :class="inputClass"
      />
      <div class="spinner-buttons">
        <button @click="increment" class="spinner-up">▲</button>
        <button @click="decrement" class="spinner-down">▼</button>
      </div>
    </div>
</template>
  
<script>
  export default {
    name: 'NumberInput',
    props: {
      modelValue: {
        type: Number,
        required: true
      },
      min: {
        type: Number,
        default: null
      },
      max: {
        type: Number,
        default: null
      },
      step: {
        type: Number,
        default: 1
      },
      size: {
        type: String,
        default: 'small',
        validator: (value) => ['tiny', 'small', 'large'].includes(value)
      }
    },
    computed: {
      sizeClass() {
        return `number-input-${this.size}`;
      },
      inputClass() {
        return `input-${this.size}`;
      }
    },
    methods: {
      increment() {
        if (this.max === null || this.modelValue < this.max) {
          this.$emit('update:modelValue', Math.min(this.modelValue + this.step, this.max !== null ? this.max : Infinity));
        }
      },
      decrement() {
        if (this.min === null || this.modelValue > this.min) {
          this.$emit('update:modelValue', Math.max(this.modelValue - this.step, this.min !== null ? this.min : -Infinity));
        }
      }
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
  width: 30px;
}

.number-input-small {
  height: 20px;
  width: 40px;
}

.number-input-large {
  height: 24px;
  width: 40px;
}

input[type="number"] {
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
  appearance: textfield;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  text-align: center;
  padding: 0 14px 0 4px; /* Add right padding to make room for buttons */
  width: 100%;
  box-sizing: border-box;
}

input[type="number"]::-webkit-inner-spin-button, 
input[type="number"]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}

.input-tiny {
  font-size: 10px;
}

.input-small {
  font-size: 16px;
}

.input-large {
  font-size: 20px;
}

/* Spinner buttons styling */
.spinner-buttons {
  position: absolute;
  top: 1px; /* Account for input border */
  bottom: 1px; /* Account for input border */
  right: 1px; /* Position just inside the input border */
  width: 12px;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none; /* Initially hidden from interaction */
  z-index: 1; /* Ensure buttons are above input */
  border-radius: 0 3px 3px 0; /* Match input's right border radius */
  overflow: hidden; /* Ensure buttons don't exceed container */
}

.number-input-container:hover .spinner-buttons {
  opacity: 1;
  pointer-events: auto; /* Enable interaction on hover */
}

.spinner-up, .spinner-down {
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  padding: 0;
  height: 50%;
  width: 100%;
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-up {
  border-radius: 0 3px 0 0;
}

.spinner-down {
  border-radius: 0 0 3px 0;
}

.spinner-up:hover, .spinner-down:hover {
  background: rgba(0, 0, 0, 0.9);
}

input:focus {
  outline: none;
  border-color: #666;
  box-shadow: 0 0 3px rgba(255, 255, 255, 0.2);
}
</style>