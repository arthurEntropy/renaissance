<template>
    <button v-if="show" :class="buttonClass" @click="$emit('click', $event)" :title="title" type="button">
        <PlusIcon :class="iconClass" />
    </button>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: 'Add item'
    },
    variant: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary'].includes(value)
    },
    size: {
        type: String,
        default: 'medium',
        validator: (value) => ['small', 'medium'].includes(value)
    },
    position: {
        type: String,
        default: 'bottom-center',
        validator: (value) => ['bottom-center', 'bottom-right', 'inline'].includes(value)
    }
})

defineEmits(['click'])

const buttonClass = computed(() => {
    const classes = ['add-button']

    // Size variants
    if (props.size === 'small') {
        classes.push('add-button--small')
    } else {
        classes.push('add-button--medium')
    }

    // Color variants
    if (props.variant === 'primary') {
        classes.push('add-button--primary')
    } else {
        classes.push('add-button--secondary')
    }

    // Position variants
    if (props.position === 'bottom-center') {
        classes.push('add-button--center')
    } else if (props.position === 'bottom-right') {
        classes.push('add-button--right')
    } else {
        classes.push('add-button--inline')
    }

    return classes.join(' ')
})

const iconClass = computed(() => {
    return props.size === 'small' ? 'add-button__icon--small' : 'add-button__icon--medium'
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.add-button {
    border-radius: var(--radius-full);
    border: none;
    box-shadow: var(--shadow-elevation-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-color-bg), box-shadow var(--transition-normal);
    padding: 0;
}

/* Size variants */
.add-button--small {
    width: 20px;
    height: 20px;
}

.add-button--medium {
    width: 24px;
    height: 24px;
    z-index: var(--z-dropdown);
}

/* Icon sizes */
.add-button__icon--small {
    width: 12px;
    height: 12px;
}

.add-button__icon--medium {
    width: 16px;
    height: 16px;
}

/* Position variants */
.add-button--center {
    position: absolute;
    left: 50%;
    bottom: -11px;
    transform: translateX(-50%);
}

.add-button--right {
    position: absolute;
    bottom: 12px;
    right: 12px;
}

.add-button--inline {
    position: relative;
    margin-left: 5px;
    margin-top: 5px;
}

/* Color variants */
.add-button--primary {
    background: var(--color-primary);
    color: var(--color-primary-text);
}

.add-button--primary:hover {
    background: var(--color-primary-hover);
    color: var(--color-primary-text);
}

.add-button--secondary {
    background: linear-gradient(135deg, var(--color-gray-medium) 60%, var(--color-gray-dark) 100%);
    color: var(--color-text-primary);
}

.add-button--secondary:hover {
    background: linear-gradient(135deg, var(--color-gray-light) 60%, var(--color-gray-medium) 100%);
}
</style>