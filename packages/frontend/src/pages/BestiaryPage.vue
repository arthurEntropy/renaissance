<template>
    <div class="bestiary-page">
        <FilterBar v-model:search-query="searchQuery" v-model:selected-tags="selectedTypes" v-model:group-by="groupBy"
            v-model:order-by="orderBy" :tag-groups="tagGroups" tag-picker-mode="cascade" :group-options="groupOptions"
            :order-options="orderOptions" :stats="stats" :show-add-button="authStore.isAdmin"
            search-placeholder="Search beasts..." @add="handleCreate">
            <template #controls-center>
                <BiomeTagsCyclePicker v-model:augment-tags="augmentTags" v-model:inhibit-tags="inhibitTags" compact />
            </template>
        </FilterBar>
        <ConceptsLayout v-bind="layoutProps" :concepts="filteredBeasts" :grouped-concepts="groupedBeasts"
            :show-filter-bar="false" :show-add-button="false" @select="handleSelect" @deselect="handleDeselect"
            @create="handleCreate" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import BiomeTagsCyclePicker from '@/components/ui/biome/BiomeTagsCyclePicker.vue'
import { useCharactersLayout } from '@/composables/useCharactersLayout'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useBeastTypesStore } from '@/stores/beastTypesStore'
import { useAuthStore } from '@/stores/authStore'
import { FILTER_SPECIAL_TAG_GROUP_LABEL } from '@/constants/filterBar'
import { filterBeasts, groupBeastsByType } from '@/utils/bestiaryFilters'
import CharacterService from '@/services/entities/characterService'

const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const abilitiesStore = useAbilitiesStore()
const beastTypesStore = useBeastTypesStore()
const authStore = useAuthStore()

const { characters, layoutProps, handleSelect, handleDeselect, handleCreate } = useCharactersLayout(
    charactersStore,
    equipmentStore,
    abilitiesStore,
    CharacterService,
    { beastMode: true, adminOnlySelect: true }
)

const searchQuery = ref('')
const selectedTypes = ref([])
const groupBy = ref('')
const orderBy = ref('')
const augmentTags = ref([])
const inhibitTags = ref([])
useFilterPersistence('bestiary-controls', { searchQuery, selectedTypes, groupBy, orderBy, augmentTags, inhibitTags })

onMounted(() => beastTypesStore.fetch())

const tagGroups = computed(() => [{
    label: FILTER_SPECIAL_TAG_GROUP_LABEL,
    items: [{
        id: 'beast-type', name: 'Beast Type',
        items: beastTypesStore.items.map(type => ({ id: type.id, name: type.name })),
    }],
}])
const groupOptions = [{ value: 'beast-type', label: 'Beast Type' }]
const orderOptions = [
    { value: 'challenge-asc', label: 'Challenge (Low to High)' },
    { value: 'challenge-desc', label: 'Challenge (High to Low)' },
]

const filteredBeasts = computed(() => filterBeasts(characters.value, {
    searchQuery: searchQuery.value,
    selectedTypes: selectedTypes.value,
    augmentTags: augmentTags.value,
    inhibitTags: inhibitTags.value,
    orderBy: orderBy.value,
}))

const stats = computed(() => [{ label: 'Beasts', value: filteredBeasts.value.length }])
const groupedBeasts = computed(() => {
    if (groupBy.value !== 'beast-type') return null
    return groupBeastsByType(filteredBeasts.value, beastTypesStore.items)
})
</script>

<style scoped>
.bestiary-page {
    width: 90%;
    min-width: 0;
    max-width: 82%;
    margin: 0 auto;
}

.bestiary-page :deep(.concepts-view) {
    width: 100%;
}
</style>
