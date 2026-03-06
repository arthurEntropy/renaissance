<template>
    <select :value="modelValue" class="category-filter" aria-label="Filter by ability school"
        @change="$emit('update:modelValue', $event.target.value)">
        <option value="">All Schools</option>
        <option value="__none__">No School</option>
        <optgroup v-for="group in schoolGroups" :key="group.sourceId" :label="group.sourceName">
            <option v-for="school in group.schools" :key="school.id" :value="school.id">
                {{ school.name }}
            </option>
        </optgroup>
    </select>
</template>

<script setup>
import { computed } from 'vue'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useSourcesStore } from '@/stores/sourcesStore'

defineProps({
    modelValue: {
        type: String,
        default: '',
    },
})

defineEmits(['update:modelValue'])

const abilitySchoolsStore = useAbilitySchoolsStore()
const sourcesStore = useSourcesStore()

const schoolGroups = computed(() => {
    const schools = abilitySchoolsStore.items || []

    // Group schools by sourceId
    const groupMap = new Map()
    for (const school of schools) {
        const sourceId = school.sourceId || 'general'
        if (!groupMap.has(sourceId)) {
            groupMap.set(sourceId, [])
        }
        groupMap.get(sourceId).push(school)
    }

    // Sort schools within each group alphabetically
    for (const group of groupMap.values()) {
        group.sort((a, b) => a.name.localeCompare(b.name))
    }

    // Build sorted groups: sort by source name, with 'general' last
    return [...groupMap.entries()]
        .map(([sourceId, schools]) => ({
            sourceId,
            sourceName: sourcesStore.getSourceName(sourceId),
            schools,
        }))
        .sort((a, b) => {
            if (a.sourceId === 'general') return 1
            if (b.sourceId === 'general') return -1
            return a.sourceName.localeCompare(b.sourceName)
        })
})
</script>
