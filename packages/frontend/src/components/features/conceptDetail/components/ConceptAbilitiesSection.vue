<template>
    <ConceptSection title="Traits & Abilities" :has-content="hasAbilities" :is-edit-mode="isEditMode"
        empty-message="No abilities added yet. Create abilities in the 'Abilities' section and assign them to this concept.">
        <MasonryGrid ref="masonryGridRef" :column-width="350" :gap="10" :row-height="10" class="cards-container">
            <AbilityCard v-for="ability in sortedAbilities" :key="ability.id" :ability="ability" :editable="isEditMode"
                :sources="sources" :collapsible="false" :showImprovements="getAbilityShowImprovements(ability.id)"
                @update:showImprovements="updateAbilityShowImprovements(ability.id, $event)"
                @height-changed="handleCardHeightChanged" @edit="$emit('edit-ability', ability)" :character="character"
                :show-improvement-toggle="!!character" :show-add-to-character="!!charactersStore.selectedCharacter" />
        </MasonryGrid>
        <div v-if="isEditMode" class="add-button-container">
            <FloatingActionButton type="add" @click="$emit('add-ability')" />
        </div>
    </ConceptSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import ConceptSection from './ConceptSection.vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useCharactersStore } from '@/stores/charactersStore'

const charactersStore = useCharactersStore()

const props = defineProps({
    abilities: {
        type: Array,
        default: () => []
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    sources: {
        type: Array,
        default: () => []
    },
    conceptId: {
        type: String,
        default: null
    },
    character: {
        type: Object,
        default: null
    }
})

defineEmits(['edit-ability', 'add-ability'])

// State for tracking improvement visibility per ability
const improvementVisibility = ref(new Map())
const masonryGridRef = ref(null)

const getAbilityShowImprovements = (abilityId) => {
    return improvementVisibility.value.get(abilityId) || false
}

const updateAbilityShowImprovements = (abilityId, showImprovements) => {
    improvementVisibility.value.set(abilityId, showImprovements)
}

const handleCardHeightChanged = () => {
    // Update masonry layout when card heights change
    if (masonryGridRef.value) {
        masonryGridRef.value.updateLayout()
    }
}

const hasAbilities = computed(() => {
    return props.abilities && props.abilities.length > 0
})

const sortedAbilities = computed(() => {
    // Sort by XP (ascending), then by name (A-Z)
    return [...props.abilities].sort((a, b) => {
        const xpA = a.xp ?? 0;
        const xpB = b.xp ?? 0;
        if (xpA !== xpB) return xpA - xpB;
        return (a.name || '').localeCompare(b.name || '');
    });
})
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
