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

            <!-- Grouped display -->
            <GroupedMasonryGrid v-if="isGrouped" :gap="20" :row-height="10" justify-content="start"
                :grouped-items="groupedEquipment" persistence-key="concept-equipment-groups" class="cards-container">
                <template #default="{ item }">
                    <EquipmentCard :equipment="item" :editable="isEditMode" :sources="sources" :art-expanded="true"
                        :engagement-success-options="engagementSuccessOptions" :character="character"
                        :show-improvement-toggle="!!character" @edit="$emit('edit-equipment', item)"
                        :collapsible="false" :show-improvements="getEquipmentShowImprovements(item.id)"
                        @update:showImprovements="updateEquipmentShowImprovements(item.id, $event)"
                        @update="handleCharacterUpdate" />
                </template>
            </GroupedMasonryGrid>

            <!-- Ungrouped display -->
            <MasonryGrid v-else :gap="20" :row-height="10" justify-content="start" class="cards-container">
                <EquipmentCard v-for="item in sortedEquipment" :key="item.id" :equipment="item" :editable="isEditMode"
                    :sources="sources" :art-expanded="true" :engagement-success-options="engagementSuccessOptions"
                    :character="character" :show-improvement-toggle="!!character" @edit="$emit('edit-equipment', item)"
                    :collapsible="false" :show-improvements="getEquipmentShowImprovements(item.id)"
                    @update:showImprovements="updateEquipmentShowImprovements(item.id, $event)"
                    @update="handleCharacterUpdate" />
            </MasonryGrid>

        </ConceptSection>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import ConceptSection from '../shared/ConceptSection.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import GroupedMasonryGrid from '@/components/ui/layouts/GroupedMasonryGrid.vue'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_VISIBILITIES } from '@/constants/fab'
import { sortItems } from '@/utils/sortItems'
import { EQUIPMENT_SORT_OPTIONS, EQUIPMENT_GROUP_BY_OPTIONS, filterAdminSortOptions } from '@/constants/sortOptions'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useAuthStore } from '@/stores/authStore'
import { useEngagementSuccessesStore } from '@/stores/engagementSuccessesStore'

const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const keepingStore = useKeepingStore()
const sourcesStore = useSourcesStore()
const conceptsStore = useConceptsStore()
const authStore = useAuthStore()
const engagementSuccessesStore = useEngagementSuccessesStore()

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
const engagementSuccessOptions = computed(() => engagementSuccessesStore.items)

const sortOptions = computed(() => filterAdminSortOptions(EQUIPMENT_SORT_OPTIONS, isAdmin.value))

const groupingOptions = EQUIPMENT_GROUP_BY_OPTIONS.filter(o => o.value !== 'source')

const sortOption = ref('keeping-asc')
const groupingOption = ref('')

useFilterPersistence('concept-equipment', { sortOption, groupingOption })

const isGrouped = computed(() => !!groupingOption.value)

const groupedEquipment = computed(() => {
    if (!groupingOption.value) return []
    const groups = {}
    sortedEquipment.value.forEach(item => {
        let groupId = ''
        let groupName = ''
        let groupIndex = 0
        if (groupingOption.value === 'source') {
            groupId = item.source || '__unknown-source__'
            groupName = sourcesStore.getSourceName(item.source) || 'Unknown Source'
        } else if (groupingOption.value === 'type') {
            groupId = item.type || '__unknown-type__'
            groupName = equipmentTypesStore.getById(item.type)?.name || 'Unknown Type'
        } else if (groupingOption.value === 'subtype') {
            groupId = item.subtype || '__unknown-subtype__'
            groupName = equipmentSubtypesStore.getById(item.subtype)?.name || 'Unknown Subtype'
        } else if (groupingOption.value === 'grade') {
            groupId = item.grade || '__unknown-grade__'
            const grade = equipmentGradesStore.getById(item.grade)
            groupName = grade?.name || 'Unknown Grade'
            groupIndex = grade?.index ?? 999
        }
        if (!groups[groupId]) {
            groups[groupId] = { id: groupId, name: groupName, index: groupIndex, collapsed: false, items: [] }
        }
        groups[groupId].items.push(item)
    })
    return Object.values(groups).sort((a, b) => {
        if (groupingOption.value === 'grade') return a.index - b.index
        return a.name.localeCompare(b.name)
    })
})

const equipment = computed(() =>
    equipmentStore.equipment.filter(e => e.source === concept.value?.id)
)

const sortedEquipment = computed(() => {
    if (sortOption.value === 'keeping-asc' || sortOption.value === 'keeping-desc') {
        const dir = sortOption.value === 'keeping-asc' ? 1 : -1
        return [...equipment.value].sort((a, b) => {
            const aCost = keepingStore.getById(a.keeping)?.cost ?? 0
            const bCost = keepingStore.getById(b.keeping)?.cost ?? 0
            return dir * (aCost - bCost)
        })
    }
    return sortItems(equipment.value, sortOption.value)
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
        // Merge changes into selectedCharacter.value in place so the store reference
        // stays connected to allItems, preventing stale auto-saves from overwriting
        // the addition after the server round-trip.
        Object.assign(character.value, updatedCharacter)
        await charactersStore.update(character.value)
    }
}

onMounted(async () => {
    if (engagementSuccessesStore.items.length === 0) {
        await engagementSuccessesStore.fetch()
    }
})
</script>

<style scoped>
.section-panel {
    background: var(--overlay-black-medium);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
}
</style>
