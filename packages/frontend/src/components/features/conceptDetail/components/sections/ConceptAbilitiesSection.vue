<template>
    <ConceptSection title="Abilities" :has-content="hasAbilities" :is-edit-mode="isEditMode"
        empty-message="No abilities added yet.">
        <MasonryGrid :column-width="350" :gap="10" :row-height="10" class="cards-container">
            <AbilityCard v-for="ability in sortedAbilities" :key="ability.id" :ability="ability" :editable="isEditMode"
                :sources="sources" :collapsible="false" :showImprovements="getAbilityShowImprovements(ability.id)"
                @update:showImprovements="updateAbilityShowImprovements(ability.id, $event)"
                @edit="$emit('edit-ability', ability)" :character="character" :show-improvement-toggle="!!character"
                :showSuccesses="getAbilityShowSuccesses(ability.id)"
                @update:showSuccesses="updateAbilityShowSuccesses(ability.id, $event)"
                @update="handleCharacterUpdate" />
        </MasonryGrid>
        <div v-if="isEditMode" class="add-button-container">
            <FloatingActionButton type="add" visibility="always" @click="$emit('add-ability')" />
        </div>
    </ConceptSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import ConceptSection from '../shared/ConceptSection.vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useConceptsStore } from '@/stores/conceptsStore'

const charactersStore = useCharactersStore()
const abilitiesStore = useAbilitiesStore()
const sourcesStore = useSourcesStore()
const conceptsStore = useConceptsStore()

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

// Sorted abilities by XP cost, then name
const sortedAbilities = computed(() => {
    return [...abilities.value].sort((a, b) => {
        const xpA = a.xp ?? 0
        const xpB = b.xp ?? 0
        if (xpA !== xpB) return xpA - xpB
        return (a.name || '').localeCompare(b.name || '')
    })
})

const handleCharacterUpdate = async (updatedCharacter) => {
    if (updatedCharacter && character.value) {
        await charactersStore.update(updatedCharacter)
    }
}
</script>

<style scoped>
.add-button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    position: relative;
    min-height: 40px;
}
</style>
