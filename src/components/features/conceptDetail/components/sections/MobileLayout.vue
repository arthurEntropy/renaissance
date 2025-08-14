<template>
    <div class="mobile-layout">
        <!-- 1. Featured Art -->
        <ConceptImageSection title="Featured Art" :show-title="false" :images="concept.artUrls || []"
            :is-edit-mode="isEditMode" :grid-columns="3" @update:images="$emit('update:featured-art', $event)" />

        <!-- 2. Concept title and description -->
        <ConceptTitle :concept="concept" :is-edit-mode="isEditMode" :expansion="expansion"
            @update:name="$emit('update:name', $event)" />

        <ConceptDescription :description="concept.description" :is-edit-mode="isEditMode"
            @update:description="$emit('update:description', $event)" />

        <!-- 3. Traits & Abilities -->
        <ConceptAbilitiesSection :abilities="abilities" :is-edit-mode="isEditMode" :sources="sources"
            @edit-ability="$emit('edit-ability', $event)" />

        <!-- 4. Faces -->
        <ConceptImageSection title="Faces" :images="concept.faces || []" :is-edit-mode="isEditMode" :grid-columns="3"
            @update:images="$emit('update:faces', $event)" />

        <!-- 5. Local Flavor -->
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

        <!-- 6. Places -->
        <ConceptImageSection title="Places" :images="concept.places || []" :is-edit-mode="isEditMode" :grid-columns="3"
            @update:images="$emit('update:places', $event)" />

        <!-- 7. Hooks -->
        <HooksSection :hooks="concept.hooks || []" :editable="isEditMode" @update="$emit('update:hooks', $event)"
            @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- 8. Wares (Equipment) -->
        <ConceptEquipmentSection :equipment="equipment" :is-edit-mode="isEditMode" :sources="sources"
            @edit-equipment="$emit('edit-equipment', $event)" />

        <!-- 9. Playlists -->
        <PlaylistSection :playlists="concept.playlists || []" :editable="isEditMode"
            @update="$emit('update:playlists', $event)" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- Novizio Section -->
        <NovizioSection ref="novizioSection" :novizio="concept.novizio" :editable="isEditMode"
            @update="$emit('update:novizio', $event)" @unsaved-changes="$emit('unsaved-changes', $event)"
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
    'update:featured-art',
    'update:name',
    'update:description',
    'update:local-flavor',
    'update:hooks',
    'update:faces',
    'update:places',
    'update:playlists',
    'update:novizio',
    'edit-ability',
    'edit-equipment',
    'unsaved-changes',
    'reset-unsaved-changes'
])
</script>

<style scoped>
.mobile-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: var(--space-lg);
}
</style>
