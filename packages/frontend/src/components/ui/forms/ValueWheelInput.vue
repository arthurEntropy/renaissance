<template>
    <div class="wheel-wrapper">
        <button class="wheel-nav-btn wheel-nav-btn--left" @click="navigateWheel(-1)" :disabled="scrollIndex <= 0"
            type="button" :aria-label="prevAriaLabel">&#9664;</button>
        <div class="wheel-viewport">
            <div class="wheel-track" :style="trackStyle">
                <div v-for="(val, i) in effectiveValues" :key="val" class="wheel-item" :class="{
                    'wheel-item--selected': val === modelValue,
                    'wheel-item--centered': i === scrollIndex,
                }" :style="wheelItemStyle(i)" @click="handleWheelItemClick(i, val)">
                    <template v-if="allowCustom && i === scrollIndex && showCustomInput">
                        <input ref="customInputRef" class="wheel-custom-input" type="number" :min="customMin"
                            :max="customMax" v-model.number="customInputValue" @keydown.enter="applyCustomValue"
                            @keydown.escape.stop="showCustomInput = false" @blur="applyCustomValue" @click.stop />
                    </template>
                    <template v-else>
                        <span class="wheel-item-value">{{ formatVal(val) }}</span>
                        <span v-if="labels?.[val]" class="wheel-item-label">{{ labels[val] }}</span>
                    </template>
                </div>
            </div>
        </div>
        <button class="wheel-nav-btn wheel-nav-btn--right" @click="navigateWheel(1)"
            :disabled="scrollIndex >= effectiveValues.length - 1" type="button"
            :aria-label="nextAriaLabel">&#9654;</button>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
    modelValue: {
        type: Number,
        default: null,
    },
    values: {
        type: Array,
        required: true,
    },
    labels: {
        type: Object,
        default: null,
    },
    allowCustom: {
        type: Boolean,
        default: false,
    },
    showSign: {
        type: Boolean,
        default: false,
    },
    customMin: {
        type: Number,
        default: 1,
    },
    customMax: {
        type: Number,
        default: 100,
    },
    prevAriaLabel: {
        type: String,
        default: 'Previous value',
    },
    nextAriaLabel: {
        type: String,
        default: 'Next value',
    },
})

const emit = defineEmits(['update:modelValue'])

const ITEM_WIDTH = 48

const showCustomInput = ref(false)
const customInputRef = ref(null)
const customInputValue = ref(0)

const getInitialIndex = () => {
    if (props.modelValue != null) {
        const idx = props.values.indexOf(props.modelValue)
        if (idx >= 0) return idx
    }
    return Math.floor(props.values.length / 2)
}

const scrollIndex = ref(getInitialIndex())

// Include out-of-range custom values in the list
const effectiveValues = computed(() => {
    if (!props.allowCustom || props.modelValue == null) return props.values
    const v = props.modelValue
    if (v < props.values[0]) return [v, ...props.values]
    if (v > props.values[props.values.length - 1]) return [...props.values, v]
    return props.values
})

watch(() => props.modelValue, (val) => {
    if (val == null) return
    const idx = effectiveValues.value.indexOf(val)
    if (idx >= 0) scrollIndex.value = idx
})

const trackStyle = computed(() => ({
    transform: `translateX(${-(scrollIndex.value * ITEM_WIDTH + ITEM_WIDTH / 2)}px)`
}))

function wheelItemStyle(index) {
    const offset = Math.abs(index - scrollIndex.value)
    if (offset > 5) return { opacity: 0, pointerEvents: 'none' }
    return {
        opacity: 1 - offset * 0.2,
        transform: `scale(${1 - offset * 0.08})`,
    }
}

function formatVal(val) {
    if (props.showSign && val > 0) return `+${val}`
    return `${val}`
}

function handleWheelItemClick(index, val) {
    if (index === scrollIndex.value) {
        if (!props.allowCustom) return
        customInputValue.value = val
        showCustomInput.value = true
        nextTick(() => {
            const el = customInputRef.value
            const input = Array.isArray(el) ? el[0] : el
            input?.focus()
            input?.select()
        })
    } else {
        scrollIndex.value = index
        emit('update:modelValue', val)
    }
}

function applyCustomValue() {
    showCustomInput.value = false
    const val = Math.round(customInputValue.value)
    if (isNaN(val) || val < props.customMin || val > props.customMax) return
    emit('update:modelValue', val)
}

function navigateWheel(direction) {
    const newIndex = Math.max(0, Math.min(effectiveValues.value.length - 1, scrollIndex.value + direction))
    scrollIndex.value = newIndex
    emit('update:modelValue', effectiveValues.value[newIndex])
}
</script>

<style scoped>
.wheel-wrapper {
    position: relative;
}

.wheel-nav-btn {
    position: absolute;
    z-index: 3;
    top: 43%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-secondary);
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: var(--font-size-10);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-color);
}

.wheel-nav-btn--left {
    left: 4px;
}

.wheel-nav-btn--right {
    right: 4px;
}

.wheel-nav-btn:hover:not(:disabled) {
    color: var(--color-primary);
}

.wheel-nav-btn:disabled {
    opacity: 0.2;
    cursor: not-allowed;
}

.wheel-viewport {
    width: 100%;
    overflow: hidden;
    position: relative;
    height: 64px;
    mask-image: linear-gradient(to right, transparent, black 14%, black 86%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 14%, black 86%, transparent);
}

.wheel-track {
    position: absolute;
    left: 50%;
    top: 0;
    height: 100%;
    display: flex;
    align-items: stretch;
    transition: transform var(--duration-fast) var(--ease-smooth);
    will-change: transform;
}

.wheel-item {
    width: 48px;
    flex: 0 0 48px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease;
    user-select: none;
}

.wheel-item-value {
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    font-family: var(--font-family-primary);
    transition: var(--transition-color), font-size var(--duration-fast) ease;
    line-height: 1;
    margin-top: -10px;
}

.wheel-item-label {
    position: absolute;
    bottom: 6px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: var(--font-size-10);
    color: var(--color-text-muted);
    font-style: italic;
    white-space: nowrap;
    transition: var(--transition-color);
    line-height: 1;
    pointer-events: none;
}

.wheel-item--centered .wheel-item-value {
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}

.wheel-item--centered .wheel-item-label {
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
}

.wheel-item--selected .wheel-item-value {
    color: var(--color-primary);
    text-shadow: var(--glow-gold-sm);
}

.wheel-item--selected .wheel-item-label {
    color: var(--color-primary);
}

.wheel-item--centered.wheel-item--selected .wheel-item-value {
    font-size: var(--font-size-24);
}

.wheel-custom-input {
    width: 40px;
    background: var(--overlay-black-heavy);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-5);
    color: var(--color-primary);
    font-size: var(--font-size-24);
    font-family: var(--font-family-primary);
    text-align: center;
    padding: 2px 0;
    outline: none;
    margin-top: -10px;
}

.wheel-custom-input::-webkit-inner-spin-button,
.wheel-custom-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.wheel-custom-input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
}
</style>
