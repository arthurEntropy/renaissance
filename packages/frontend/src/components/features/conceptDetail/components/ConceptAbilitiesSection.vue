<template>
    <ConceptSection title="Traits & Abilities" :has-content="hasAbilities" :is-edit-mode="isEditMode"
        empty-message="No abilities added yet. Create abilities in the 'Abilities' section and assign them to this concept.">
        <MasonryGrid :column-width="350" :gap="10" :row-height="10" class="cards-container">
            <AbilityCard v-for="ability in sortedAbilities" :key="ability.id" :ability="ability" :editable="isEditMode"
                :sources="sources" :collapsible="false" :improvements="ability.improvements || []"
                @edit="$emit('edit-ability', ability)" :showSource="false" />
        </MasonryGrid>
    </ConceptSection>
</template>

<script setup>
import { computed } from 'vue'
import ConceptSection from './ConceptSection.vue'
import AbilityCard from '@/components/ui/cards/AbilityCard.vue'
import MasonryGrid from '@/components/ui/cards/MasonryGrid.vue'

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
    }
})

defineEmits(['edit-ability'])

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
/* No component-specific styles needed - using shared cards-container */
</style>
