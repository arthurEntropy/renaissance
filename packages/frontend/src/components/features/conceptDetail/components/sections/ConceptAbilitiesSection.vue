<template>
    <div v-if="hasAbilities || isEditMode" class="section-panel">
        <ConceptSection title="Abilities" :has-content="hasAbilities" :is-edit-mode="isEditMode"
            empty-message="No abilities added yet.">

            <template v-if="hasAbilities" #header-center>
                <SortingDropdown v-model="groupingOption" :options="groupingOptions" placeholder="Group by..." />
                <SortingDropdown v-model="sortOption" :options="sortOptions" placeholder="Order by..." />
            </template>

            <template v-if="isEditMode" #header-right>
                <FloatingActionButton type="add" visibility="always" @click="$emit('add-ability')" />
            </template>

            <!-- Grouped by school display -->
            <template v-if="isGroupedBySchool">
                <!-- Ungrouped abilities (no school) shown above groups, no header -->
                <MasonryGrid v-if="noSchoolAbilities.length > 0" :column-width="350" :gap="20" :row-height="10"
                    class="cards-container">
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
                    :row-height="10" :grouped-items="schoolGroupedAbilities" persistence-key="concept-abilities-groups"
                    class="cards-container">
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
            <MasonryGrid v-else :column-width="350" :gap="20" :row-height="10" class="cards-container">
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
import SortingDropdown from '@/components/ui/dropdowns/SortingDropdown.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { sortItems } from '@/utils/sortItems'
import { ABILITY_SORT_OPTIONS, filterAdminSortOptions } from '@/constants/sortOptions'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useAuthStore } from '@/stores/authStore'

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

const sortOptions = computed(() => filterAdminSortOptions(ABILITY_SORT_OPTIONS, isAdmin.value))
const groupingOptions = [
    { value: 'school', label: 'School' }
]

const sortOption = ref('xp-asc')
const groupingOption = ref('')

useFilterPersistence('concept-abilities', { sortOption, groupingOption })

const isGroupedBySchool = computed(() => groupingOption.value === 'school')

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
