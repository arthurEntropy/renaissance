<template>
    <div v-if="hasEquipment || isEditMode" class="section-panel">
        <ConceptSection title="Equipment" :has-content="hasEquipment" :is-edit-mode="isEditMode"
            empty-message="No equipment added yet.">

            <template v-if="hasEquipment" #header-center>
                <SortingPicker v-model="groupingOption" :options="groupingOptions" label="Group by:"
                    placeholder="None" />
                <SortingPicker v-model="sortOption" :options="sortOptions" label="Order by:" />
            </template>

            <template v-if="isEditMode" #header-right>
                <FloatingActionButton :variant="FAB_TYPES.ADD" :visibility="FAB_VISIBILITIES.ALWAYS"
                    @click="$emit('add-equipment')" />
            </template>

            <!-- Grouped by type display -->
            <template v-if="isGroupedByType">
                <!-- Ungrouped equipment (no type) shown above groups -->
                <MasonryGrid v-if="noTypeEquipment.length > 0" :gap="20" :row-height="10" justify-content="start"
                    class="cards-container">
                    <EquipmentCard v-for="item in noTypeEquipment" :key="item.id" :equipment="item"
                        :editable="isEditMode" :sources="sources" :art-expanded="true" :engagement-success-options="[]"
                        :character="character" :show-improvement-toggle="!!character"
                        @edit="$emit('edit-equipment', item)" :collapsible="false"
                        :show-improvements="getEquipmentShowImprovements(item.id)"
                        @update:showImprovements="updateEquipmentShowImprovements(item.id, $event)"
                        @update="handleCharacterUpdate" />
                </MasonryGrid>
                <!-- Type-grouped equipment -->
                <GroupedMasonryGrid v-if="typeGroupedEquipment.length > 0" :gap="20" :row-height="10"
                    justify-content="start" :grouped-items="typeGroupedEquipment"
                    persistence-key="concept-equipment-groups" class="cards-container">
                    <template #default="{ item }">
                        <EquipmentCard :equipment="item" :editable="isEditMode" :sources="sources" :art-expanded="true"
                            :engagement-success-options="[]" :character="character"
                            :show-improvement-toggle="!!character" @edit="$emit('edit-equipment', item)"
                            :collapsible="false" :show-improvements="getEquipmentShowImprovements(item.id)"
                            @update:showImprovements="updateEquipmentShowImprovements(item.id, $event)"
                            @update="handleCharacterUpdate" />
                    </template>
                </GroupedMasonryGrid>
            </template>

            <!-- Ungrouped display -->
            <MasonryGrid v-else :gap="20" :row-height="10" justify-content="start" class="cards-container">
                <EquipmentCard v-for="item in sortedEquipment" :key="item.id" :equipment="item" :editable="isEditMode"
                    :sources="sources" :art-expanded="true" :engagement-success-options="[]" :character="character"
                    :show-improvement-toggle="!!character" @edit="$emit('edit-equipment', item)" :collapsible="false"
                    :show-improvements="getEquipmentShowImprovements(item.id)"
                    @update:showImprovements="updateEquipmentShowImprovements(item.id, $event)"
                    @update="handleCharacterUpdate" />
            </MasonryGrid>

        </ConceptSection>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ConceptSection from '../shared/ConceptSection.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import GroupedMasonryGrid from '@/components/ui/layouts/GroupedMasonryGrid.vue'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_VISIBILITIES } from '@/constants/fab'
import { sortItems } from '@/utils/sortItems'
import { EQUIPMENT_SORT_OPTIONS, filterAdminSortOptions } from '@/constants/sortOptions'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useAuthStore } from '@/stores/authStore'

const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()
const sourcesStore = useSourcesStore()
const conceptsStore = useConceptsStore()
const authStore = useAuthStore()

defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

defineEmits(['edit-equipment', 'add-equipment'])

const concept = computed(() => conceptsStore.selectedConcept)
const character = computed(() => charactersStore.selectedCharacter)
const sources = computed(() => sourcesStore.allSourcesFlat)
const isAdmin = computed(() => authStore.isAdmin)

const sortOptions = computed(() => filterAdminSortOptions(EQUIPMENT_SORT_OPTIONS, isAdmin.value))

const groupingOptions = [
    { value: 'type', label: 'Type' }
]

const sortOption = ref('name-asc')
const groupingOption = ref('')

useFilterPersistence('concept-equipment', { sortOption, groupingOption })

const isGroupedByType = computed(() => groupingOption.value === 'type')

const equipment = computed(() =>
    equipmentStore.equipment.filter(e => e.source === concept.value?.id)
)

const sortedEquipment = computed(() => sortItems(equipment.value, sortOption.value))

const noTypeEquipment = computed(() =>
    sortedEquipment.value.filter(e => !e.type)
)

const typeGroupedEquipment = computed(() => {
    if (!isGroupedByType.value) return []
    const groups = {}
    sortedEquipment.value.filter(e => e.type).forEach(item => {
        const type = equipmentTypesStore.items.find(t => t.id === item.type)
        const typeName = type?.name || 'Unknown Type'
        if (!groups[item.type]) {
            groups[item.type] = { id: item.type, name: typeName, collapsed: false, items: [] }
        }
        groups[item.type].items.push(item)
    })
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
})

const hasEquipment = computed(() => equipment.value.length > 0)

// Track improvement visibility per equipment item
const improvementVisibility = ref(new Map())

const getEquipmentShowImprovements = (equipmentId) => {
    return improvementVisibility.value.get(equipmentId) || false
}

const updateEquipmentShowImprovements = (equipmentId, showImprovements) => {
    improvementVisibility.value.set(equipmentId, showImprovements)
}

const handleCharacterUpdate = async (updatedCharacter) => {
    if (updatedCharacter && character.value) {
        await charactersStore.update(updatedCharacter)
    }
}
</script>

<style scoped>
.section-panel {
    background: var(--overlay-black-medium);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
}
</style>
