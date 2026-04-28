<template>
    <FilterBar :show-search="false" :multiselect="true" :show-size-toggle="true" :type-toggles="typeToggles"
        :tag-groups="tagGroups" :stats="stats" :group-options="groupingOptions" :order-options="orderingOptions"
        :show-add-button="true" add-button-label="+ Add Art" v-model:selectedTags="sourceFilters"
        v-model:selectedTypes="typeFilters" v-model:gridSize="gridSize" v-model:groupBy="groupBy"
        v-model:orderBy="orderBy" @add="$emit('add')">
        <template #actions>
            <ActionButton :variant="showDuplicates ? 'danger' : 'neutral'" size="small"
                :text="showDuplicates ? 'Show All' : 'Show Duplicates'" @click="showDuplicates = !showDuplicates" />
        </template>
    </FilterBar>
</template>

<script setup>
import { computed } from 'vue'
import { UserCircleIcon, PhotoIcon, MapIcon } from '@heroicons/vue/24/outline'
import FilterBar from '@/components/ui/FilterBar.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useSourcesStore } from '@/stores/sourcesStore'
import { SPECIAL_FILTERS } from '../composables/useArtFilters'

const props = defineProps({
    totalCount: { type: Number, required: true },
    faceCount: { type: Number, required: true },
    placeCount: { type: Number, required: true },
    mapCount: { type: Number, required: true }
})

defineEmits(['add'])

const gridSize = defineModel('gridSize')
const typeFilters = defineModel('typeFilters')
const sourceFilters = defineModel('sourceFilters')
const groupBy = defineModel('groupBy')
const orderBy = defineModel('orderBy')
const showDuplicates = defineModel('showDuplicates')

const sourcesStore = useSourcesStore()

const typeToggles = [
    { value: 'faces', label: 'Faces', icon: UserCircleIcon, colorClass: 'faces' },
    { value: 'places', label: 'Places', icon: PhotoIcon, colorClass: 'places' },
    { value: 'maps', label: 'Maps', icon: MapIcon, colorClass: 'maps' },
]

const specialFilterOptions = [
    { id: SPECIAL_FILTERS.NO_TAGS, name: 'No Tags' },
    { id: SPECIAL_FILTERS.NO_ANCESTRY, name: 'No Ancestry Tag' },
    { id: SPECIAL_FILTERS.NO_CULTURE, name: 'No Culture Tag' },
    { id: SPECIAL_FILTERS.NO_MESTIERI, name: 'No Mestieri Tag' },
]

const tagGroups = computed(() => {
    const groups = [
        { label: 'Special Filters', items: specialFilterOptions },
    ]
    const s = sourcesStore.sources
    if (s.ancestries?.length) groups.push({ label: 'Ancestries', items: s.ancestries })
    if (s.cultures?.length) groups.push({ label: 'Cultures', items: s.cultures })
    if (s.mestieri?.length) groups.push({ label: 'Mestieri', items: s.mestieri })
    if (s.worldElements?.length) groups.push({ label: 'World Elements', items: s.worldElements })
    return groups
})

const stats = computed(() => [
    { label: 'Total', value: props.totalCount },
    { label: 'Faces', value: props.faceCount },
    { label: 'Places', value: props.placeCount },
    { label: 'Maps', value: props.mapCount },
])

const groupingOptions = [
    { value: 'type', label: 'Type' },
    { value: 'ancestry', label: 'Ancestry' },
    { value: 'culture', label: 'Culture' },
    { value: 'mestieri', label: 'Mestieri' },
    { value: 'worldElement', label: 'World Element' },
    { value: 'dateAddedOldToNew', label: 'Date - Old to New' },
    { value: 'dateAddedNewToOld', label: 'Date - New to Old' },
]

const orderingOptions = [...groupingOptions]
</script>
