<template>
    <div class="concept-layout-mobile">
        <!-- 1. Featured Art -->
        <ConceptImageSection title="Featured Art" :show-title="false" :is-edit-mode="isEditMode" :grid-columns="3"
            mode="manual" />

        <!-- 2. Concept title and description -->
        <ConceptTitle :is-edit-mode="isEditMode" :expansion="expansion" />

        <ConceptDescription :is-edit-mode="isEditMode" />

        <!-- 3. Traits & Abilities -->
        <ConceptAbilitiesSection :abilities="abilities" :is-edit-mode="isEditMode" :sources="sources"
            :character="character" @edit-ability="$emit('edit-ability', $event)" @add-ability="$emit('add-ability')" />

        <!-- 4. Faces - Auto Mode -->
        <ConceptImageSection title="Faces" :is-edit-mode="isEditMode" :grid-columns="3" mode="auto"
            auto-source-type="faces" />

        <!-- 5. Local Flavor -->
        <LocalFlavorSection :editable="isEditMode" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- 6. Places - Auto Mode -->
        <ConceptImageSection title="Places" :is-edit-mode="isEditMode" :grid-columns="3" mode="auto"
            auto-source-type="places" />

        <!-- 7. Maps - Auto Mode -->
        <ConceptImageSection title="Maps" :is-edit-mode="isEditMode" :grid-columns="3" mode="auto"
            auto-source-type="maps" />

        <!-- 8. Hooks -->
        <HooksSection :editable="isEditMode" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- 9. Wares (Equipment) -->
        <ConceptEquipmentSection :equipment="equipment" :is-edit-mode="isEditMode" :sources="sources"
            @edit-equipment="$emit('edit-equipment', $event)" @add-equipment="$emit('add-equipment')" />

        <!-- 10. Playlists -->
        <PlaylistSection :editable="isEditMode" />

        <!-- Novizio Section -->
        <NovizioSection ref="novizioSection" :editable="isEditMode" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />
    </div>
</template>

<script setup>
import ConceptTitle from '../ConceptTitle.vue'
import ConceptDescription from '../ConceptDescription.vue'
import ConceptAbilitiesSection from '../ConceptAbilitiesSection.vue'
import ConceptEquipmentSection from '../ConceptEquipmentSection.vue'
import ConceptImageSection from '../ConceptImageSection.vue'
import LocalFlavorSection from '../LocalFlavorSection.vue'
import HooksSection from '../HooksSection.vue'
import PlaylistSection from '../PlaylistSection.vue'
import NovizioSection from '../NovizioSection.vue'

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
