<template>
    <select :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :class="selectClass">
        <option value="">{{ placeholder }}</option>
        <optgroup v-for="group in sourceGroups" :key="group.label" :label="group.label">
            <option v-if="showGroupOptions" :value="`type:${group.typeKey}`">All {{ group.label }}</option>
            <option v-for="item in group.items" :key="item.id" :value="item.id">
                {{ item.name }}
            </option>
        </optgroup>
    </select>
</template>

<script setup>
import { computed } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'

defineProps({
    id: {
        type: String,
        default: 'source'
    },
    modelValue: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: '-- Select Source --'
    },
    selectClass: {
        type: String,
        default: 'modal-input'
    },
    showGroupOptions: {
        type: Boolean,
        default: false
    }
})

defineEmits(['update:modelValue'])

const sourcesStore = useSourcesStore()
const sources = computed(() => sourcesStore.sources)

const sourceGroups = computed(() => [
    { label: 'Ancestries', typeKey: 'ancestry', items: sources.value.ancestries || [] },
    { label: 'Cultures', typeKey: 'culture', items: sources.value.cultures || [] },
    { label: 'Mestieri', typeKey: 'mestiere', items: sources.value.mestieri || [] },
    { label: 'World Elements', typeKey: 'worldElement', items: sources.value.worldElements || [] },
])
</script>
