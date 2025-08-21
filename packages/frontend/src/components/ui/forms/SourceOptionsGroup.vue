<template>
    <template v-for="(group, groupName) in sourceGroups" :key="groupName">
        <optgroup :label="groupName">
            <option v-for="item in group" :key="item.id" :value="item.id">
                {{ item.name }}
            </option>
        </optgroup>
    </template>
</template>

<script setup>
import { computed } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'

const props = defineProps({
    sources: {
        type: Object,
        default: null // If not provided, will use store
    }
})

const sourcesStore = useSourcesStore()
const sourcesData = computed(() => props.sources || sourcesStore.sources)

const sourceGroups = computed(() => ({
    'Ancestries': sourcesData.value.ancestries || [],
    'Cultures': sourcesData.value.cultures || [],
    'Mestieri': sourcesData.value.mestieri || [],
    'World Elements': sourcesData.value.worldElements || []
}))
</script>
