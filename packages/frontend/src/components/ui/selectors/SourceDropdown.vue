<template>
    <select :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :class="selectClass">
        <option value="">{{ placeholder }}</option>
        <optgroup v-for="(group, groupName) in sourceGroups" :key="groupName" :label="groupName">
            <option v-for="item in group" :key="item.id" :value="item.id">
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
    }
})

defineEmits(['update:modelValue'])

const sourcesStore = useSourcesStore()
const sources = computed(() => sourcesStore.sources)

const sourceGroups = computed(() => ({
    'Ancestries': sources.value.ancestries || [],
    'Cultures': sources.value.cultures || [],
    'Mestieri': sources.value.mestieri || [],
    'World Elements': sources.value.worldElements || []
}))
</script>
