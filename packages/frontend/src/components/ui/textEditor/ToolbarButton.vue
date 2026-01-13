<template>
    <button @click.stop.prevent="handleClick" :class="{ 'is-active': isActive }" :disabled="disabled" :title="title"
        class="toolbar-button">
        <component v-if="icon" :is="icon" class="icon" />
        <span v-else>{{ label }}</span>
    </button>
</template>

<script setup>
const props = defineProps({
    label: {
        type: String,
        required: false
    },
    icon: {
        type: [Object, Function],
        required: false
    },
    title: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    action: {
        type: Function,
        required: true
    }
})

const handleClick = () => {
    props.action()
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.toolbar-button {
    background: var(--color-gray-medium);
    border: none;
    color: var(--color-white);
    padding: 2px;
    border-radius: var(--radius-5);
    cursor: pointer;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-11);
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 19px;
    min-width: 19px;
}

.toolbar-button .icon {
    width: 12px;
    height: 12px;
}

.toolbar-button.is-active {
    background: var(--color-gray-light);
    color: var(--color-white);
}

.toolbar-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
