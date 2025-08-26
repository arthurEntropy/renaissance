<template>
    <div class="concept-column-right">
        <!-- Title -->
        <ConceptTitle :concept="concept" :is-edit-mode="isEditMode" :expansion="expansion"
            @update:name="$emit('update:name', $event)" />

        <!-- Description -->
        <ConceptDescription :description="concept.description" :is-edit-mode="isEditMode"
            @update:description="$emit('update:description', $event)" />

        <!-- Traits & Abilities -->
        <ConceptAbilitiesSection :abilities="abilities" :is-edit-mode="isEditMode" :sources="sources"
            @edit-ability="$emit('edit-ability', $event)" />

        <!-- Local Flavor -->
        <LocalFlavorSection :data="{
            names: concept.names,
            occupations: concept.occupations,
            publicHouses: concept.publicHouses,
            vittles: concept.vittles,
            pointsOfInterest: concept.pointsOfInterest,
            floraFauna: concept.floraFauna,
        }" :editable="isEditMode" @update="$emit('update:local-flavor', $event)"
            @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- Hooks -->
        <HooksSection :hooks="concept.hooks || []" :editable="isEditMode" @update="$emit('update:hooks', $event)"
            @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- Wares -->
        <ConceptEquipmentSection :equipment="equipment" :is-edit-mode="isEditMode" :sources="sources"
            @edit-equipment="$emit('edit-equipment', $event)" />
    </div>
</template>

<script setup>
import ConceptTitle from '../ConceptTitle.vue'
import ConceptDescription from '../ConceptDescription.vue'
import ConceptAbilitiesSection from '../ConceptAbilitiesSection.vue'
import ConceptEquipmentSection from '../ConceptEquipmentSection.vue'
import LocalFlavorSection from '../LocalFlavorSection.vue'
import HooksSection from '../HooksSection.vue'

defineProps({
    concept: {
        type: Object,
        required: true
    },
    abilities: {
        type: Array,
        default: () => []
    },
    equipment: {
        type: Array,
        default: () => []
    },
    sources: {
        type: Array,
        default: () => []
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    expansion: {
        type: Object,
        default: null
    }
})

defineEmits([
    'update:name',
    'update:description',
    'update:local-flavor',
    'update:hooks',
    'edit-ability',
    'edit-equipment',
    'unsaved-changes',
    'reset-unsaved-changes'
])
</script>

<style scoped></style>
