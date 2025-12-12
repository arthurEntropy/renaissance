<template>
    <div class="concept-column-right">
        <!-- Title -->
        <ConceptTitle :is-edit-mode="isEditMode" :expansion="expansion" />

        <!-- Description -->
        <ConceptDescription :is-edit-mode="isEditMode" />

        <!-- Traits & Abilities -->
        <ConceptAbilitiesSection :abilities="abilities" :is-edit-mode="isEditMode" :sources="sources"
            :character="character" @edit-ability="$emit('edit-ability', $event)" @add-ability="$emit('add-ability')" />

        <!-- Local Flavor -->
        <LocalFlavorSection :editable="isEditMode" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- Hooks -->
        <HooksSection :editable="isEditMode" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- Wares -->
        <ConceptEquipmentSection :equipment="equipment" :is-edit-mode="isEditMode" :sources="sources"
            @edit-equipment="$emit('edit-equipment', $event)" @add-equipment="$emit('add-equipment')" />
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
    },
    character: {
        type: Object,
        default: null
    }
})

defineEmits([
    'edit-ability',
    'edit-equipment',
    'add-ability',
    'add-equipment',
    'unsaved-changes',
    'reset-unsaved-changes'
])
</script>

<style scoped></style>
