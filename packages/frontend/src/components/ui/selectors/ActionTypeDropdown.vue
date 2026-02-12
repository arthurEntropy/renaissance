<template>
    <select :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :class="selectClass">
        <option value="">{{ placeholder }}</option>
        <option v-for="item in actionTypes" :key="item.id" :value="item.id">
            {{ item.name }}
        </option>
    </select>
</template>

<script setup>
import { computed } from 'vue'
import { useActionTypesStore } from '@/stores/actionTypesStore'

defineProps({
    id: {
        type: String,
        default: 'actionType'
    },
    modelValue: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: '-- Select Type --'
    },
    selectClass: {
        type: String,
        default: 'modal-input'
    }
})

defineEmits(['update:modelValue'])

const actionTypesStore = useActionTypesStore()
const actionTypes = computed(() => actionTypesStore.items)
</script>
