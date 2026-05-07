<template>
    <div v-if="hasAbilities || isEditMode" class="section-panel">
        <ConceptSection title="Abilities" :has-content="hasAbilities" :is-edit-mode="isEditMode"
            empty-message="No abilities added yet.">

            <template v-if="showOrganizationControls" #header-center>
                <SortingPicker v-model="groupingOption" :options="groupingOptions" label="Group by:"
                    placeholder="Ungrouped" />
                <SortingPicker v-model="sortOption" :options="sortOptions" label="Order by:" />
            </template>

            <template v-if="isEditMode" #header-right>
                <FloatingActionButton :variant="FAB_TYPES.ADD" :visibility="FAB_VISIBILITIES.ALWAYS"
                    @click="$emit('add-ability')" />
            </template>

            <!-- Grouped by school display -->
            <template v-if="isGroupedBySchool">
                <!-- Ungrouped abilities (no school) shown above groups, no header -->
                <MasonryGrid v-if="noSchoolAbilities.length > 0" :column-width="350" :gap="20" :row-height="10"
                    justify-content="start" class="cards-container">
                    <AbilityCard v-for="ability in noSchoolAbilities" :key="ability.id" :ability="ability"
                        :editable="isEditMode" :sources="sources" :collapsible="false"
                        :showImprovements="getAbilityShowImprovements(ability.id)"
                        @update:showImprovements="updateAbilityShowImprovements(ability.id, $event)"
                        @edit="$emit('edit-ability', ability)" :character="character"
                        :show-improvement-toggle="!!character" :showSuccesses="getAbilityShowSuccesses(ability.id)"
                        @update:showSuccesses="updateAbilityShowSuccesses(ability.id, $event)"
                        @update="handleCharacterUpdate" />
                </MasonryGrid>
                <!-- School-grouped abilities -->
                <GroupedMasonryGrid v-if="schoolGroupedAbilities.length > 0" :column-width="350" :gap="20"
                    :row-height="10" justify-content="start" :grouped-items="schoolGroupedAbilities"
                    :persistence-key="`concept-abilities-school-groups-${concept?.id}`" class="cards-container">
                    <template #default="{ item }">
                        <AbilityCard :ability="item" :editable="isEditMode" :sources="sources" :collapsible="false"
                            :showImprovements="getAbilityShowImprovements(item.id)"
                            @update:showImprovements="updateAbilityShowImprovements(item.id, $event)"
                            @edit="$emit('edit-ability', item)" :character="character"
                            :show-improvement-toggle="!!character" :showSuccesses="getAbilityShowSuccesses(item.id)"
                            @update:showSuccesses="updateAbilityShowSuccesses(item.id, $event)"
                            @update="handleCharacterUpdate" />
                    </template>
                </GroupedMasonryGrid>
            </template>

            <!-- Grouped by mana color display -->
            <template v-else-if="isGroupedByManaColor">
                <GroupedMasonryGrid v-if="manaColorGroupedAbilities.length > 0" :column-width="350" :gap="20"
                    :row-height="10" justify-content="start" :grouped-items="manaColorGroupedAbilities"
                    :persistence-key="`concept-abilities-mana-color-groups-${concept?.id}`" class="cards-container">
                    <template #default="{ item }">
                        <AbilityCard :ability="item" :editable="isEditMode" :sources="sources" :collapsible="false"
                            :showImprovements="getAbilityShowImprovements(item.id)"
                            @update:showImprovements="updateAbilityShowImprovements(item.id, $event)"
                            @edit="$emit('edit-ability', item)" :character="character"
                            :show-improvement-toggle="!!character" :showSuccesses="getAbilityShowSuccesses(item.id)"
                            @update:showSuccesses="updateAbilityShowSuccesses(item.id, $event)"
                            @update="handleCharacterUpdate" />
                    </template>
                </GroupedMasonryGrid>
            </template>

            <!-- Ungrouped display -->
            <MasonryGrid v-else :column-width="350" :gap="20" :row-height="10" justify-content="start"
                class="cards-container">
                <AbilityCard v-for="ability in sortedAbilities" :key="ability.id" :ability="ability"
                    :editable="isEditMode" :sources="sources" :collapsible="false"
                    :showImprovements="getAbilityShowImprovements(ability.id)"
                    @update:showImprovements="updateAbilityShowImprovements(ability.id, $event)"
                    @edit="$emit('edit-ability', ability)" :character="character" :show-improvement-toggle="!!character"
                    :showSuccesses="getAbilityShowSuccesses(ability.id)"
                    @update:showSuccesses="updateAbilityShowSuccesses(ability.id, $event)"
                    @update="handleCharacterUpdate" />
            </MasonryGrid>


        </ConceptSection>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ConceptSection from '../shared/ConceptSection.vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import GroupedMasonryGrid from '@/components/ui/layouts/GroupedMasonryGrid.vue'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_VISIBILITIES } from '@/constants/fab'
import { sortItems } from '@/utils/sortItems'
import { ABILITY_SORT_OPTIONS, filterAdminSortOptions } from '@/constants/sortOptions'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useAuthStore } from '@/stores/authStore'
import { getManaCostColors } from '@/utils/calculateManaCost'
import { ConceptType } from '@shared/constants/conceptTypes'
import {
    ManaColor,
    MANA_COLOR_GROUP_ORDER,
    MANA_COLOR_GROUP_LABELS,
} from '@/constants/manaColors'

const charactersStore = useCharactersStore()
const abilitiesStore = useAbilitiesStore()
const sourcesStore = useSourcesStore()
const conceptsStore = useConceptsStore()
const abilitySchoolsStore = useAbilitySchoolsStore()
const authStore = useAuthStore()

defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

defineEmits(['edit-ability', 'add-ability'])

const concept = computed(() => conceptsStore.selectedConcept)
const character = computed(() => charactersStore.selectedCharacter)
const sources = computed(() => sourcesStore.allSourcesFlat)

const abilities = computed(() =>
    abilitiesStore.abilities.filter(a => a.source === concept.value?.id)
)

const hasAbilities = computed(() => abilities.value?.length > 0)

// Track improvement visibility per ability
const improvementVisibility = ref(new Map())
// Track successes visibility per ability
const successesVisibility = ref(new Map())

const getAbilityShowImprovements = (abilityId) => {
    return improvementVisibility.value.get(abilityId) || false
}

const updateAbilityShowImprovements = (abilityId, showImprovements) => {
    improvementVisibility.value.set(abilityId, showImprovements)
}

const getAbilityShowSuccesses = (abilityId) => {
    return successesVisibility.value.get(abilityId) || false
}

const updateAbilityShowSuccesses = (abilityId, showSuccesses) => {
    successesVisibility.value.set(abilityId, showSuccesses)
}

const isAdmin = computed(() => authStore.isAdmin)
const isMestiereConcept = computed(() => concept.value?.conceptType === ConceptType.MESTIERE)

const isChannelerConcept = computed(() =>
    concept.value?.name?.toLowerCase() === 'channeler'
)

const showOrganizationControls = computed(() => hasAbilities.value && isMestiereConcept.value)

const sortOptions = computed(() => filterAdminSortOptions(ABILITY_SORT_OPTIONS, isAdmin.value))
const groupingOptions = computed(() => {
    const options = [{ value: 'school', label: 'School' }]
    if (isChannelerConcept.value) {
        options.push({ value: 'mana-color', label: 'Mana Color' })
    }
    return options
})

const sortOption = ref('xp-asc')
const groupingOption = ref('')

useFilterPersistence(`concept-abilities-${concept.value?.id}`, { sortOption, groupingOption })

const isGroupedBySchool = computed(() => isMestiereConcept.value && groupingOption.value === 'school')
const isGroupedByManaColor = computed(() => isMestiereConcept.value && groupingOption.value === 'mana-color')

const sortedAbilities = computed(() => sortItems(abilities.value, sortOption.value))

const noSchoolAbilities = computed(() =>
    sortedAbilities.value.filter(a => !a.school)
)

const schoolGroupedAbilities = computed(() => {
    if (!isGroupedBySchool.value) return []
    const groups = {}
    sortedAbilities.value.filter(a => a.school).forEach(ability => {
        const school = abilitySchoolsStore.getById(ability.school)
        const schoolName = school?.name || 'Unknown School'
        if (!groups[ability.school]) {
            groups[ability.school] = { id: ability.school, name: schoolName, collapsed: false, items: [] }
        }
        groups[ability.school].items.push(ability)
    })
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
})

const manaColorGroupedAbilities = computed(() => {
    if (!isGroupedByManaColor.value) return []
    const groups = {}
    sortedAbilities.value.forEach(ability => {
        let key
        if (!ability.manaCost) {
            key = 'none'
        } else {
            const colors = getManaCostColors(ability.manaCost)
            if (colors.size === 0) key = ManaColor.COLORLESS
            else if (colors.size === 1) key = [...colors][0]
            else key = ManaColor.MULTICOLOR
        }
        if (!groups[key]) {
            groups[key] = { id: key, name: MANA_COLOR_GROUP_LABELS[key] || key, collapsed: false, items: [] }
        }
        groups[key].items.push(ability)
    })
    return Object.values(groups).sort((a, b) => {
        const ai = MANA_COLOR_GROUP_ORDER.indexOf(a.id)
        const bi = MANA_COLOR_GROUP_ORDER.indexOf(b.id)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
})

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
