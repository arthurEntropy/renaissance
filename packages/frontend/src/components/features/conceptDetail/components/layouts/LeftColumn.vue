<template>
    <div class="concept-column-left">
        <!-- Featured Art -->
        <ConceptImageSection title="Featured Art" :show-title="false" :images="concept.artUrls || []"
            :is-edit-mode="isEditMode" :grid-columns="5" mode="manual"
            @update:images="$emit('update:featured-art', $event)" />

        <!-- Novizio Section -->
        <NovizioSection ref="novizioSection" :novizio="concept.novizio" :editable="isEditMode"
            @update="$emit('update:novizio', $event)" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- Faces - Auto Mode -->
        <ConceptImageSection title="Faces" :images="[]" :is-edit-mode="isEditMode" :grid-columns="5" mode="auto"
            auto-source-type="faces" :auto-source-id="concept.id" />

        <!-- Places - Auto Mode -->
        <ConceptImageSection title="Places" :images="[]" :is-edit-mode="isEditMode" :grid-columns="5" mode="auto"
            auto-source-type="places" :auto-source-id="concept.id" />

        <!-- Maps - Auto Mode -->
        <ConceptImageSection title="Maps" :images="[]" :is-edit-mode="isEditMode" :grid-columns="5" mode="auto"
            auto-source-type="maps" :auto-source-id="concept.id" />

        <!-- Playlists -->
        <PlaylistSection :playlists="concept.playlists || []" :editable="isEditMode"
            @update="$emit('update:playlists', $event)" />
    </div>
</template>

<script setup>
import ConceptImageSection from '../ConceptImageSection.vue'
import NovizioSection from '../NovizioSection.vue'
import PlaylistSection from '../PlaylistSection.vue'

defineProps({
    concept: {
        type: Object,
        required: true
    },
    isEditMode: {
        type: Boolean,
        default: false
    }
})

defineEmits([
    'update:featured-art',
    'update:novizio',
    'update:faces',
    'update:places',
    'update:playlists',
    'unsaved-changes',
    'reset-unsaved-changes'
])
</script>

<style scoped></style>
