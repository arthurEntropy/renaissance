<template>
    <select :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" class="modal-input">
        <option value="">-- Select Source --</option>
        <optgroup label="Ancestries">
            <option v-for="ancestry in sources.ancestries" :key="ancestry.id" :value="ancestry.id">
                {{ ancestry.name }}
            </option>
        </optgroup>
        <optgroup label="Cultures">
            <option v-for="culture in sources.cultures" :key="culture.id" :value="culture.id">
                {{ culture.name }}
            </option>
        </optgroup>
        <optgroup label="Mestieri">
            <option v-for="mestiere in sources.mestieri" :key="mestiere.id" :value="mestiere.id">
                {{ mestiere.name }}
            </option>
        </optgroup>
        <optgroup label="World Elements">
            <option v-for="worldElement in sources.worldElements" :key="worldElement.id" :value="worldElement.id">
                {{ worldElement.name }}
            </option>
        </optgroup>
    </select>
</template>

<script setup>
import { useSources } from '@/composables/useSources'

defineProps({
    id: {
        type: String,
        default: 'source'
    },
    modelValue: {
        type: String,
        default: ''
    }
})

defineEmits(['update:modelValue'])

const { sources } = useSources()
</script>
