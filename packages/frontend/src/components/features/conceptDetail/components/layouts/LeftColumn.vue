<template>
    <div class="concept-column-left">
        <!-- Featured Art -->
        <ConceptImageSection title="Featured Art" :show-title="false" :is-edit-mode="isEditMode" :grid-columns="5"
            mode="manual" />

        <!-- Novizio Section -->
        <NovizioSection ref="novizioSection" :editable="isEditMode" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- Faces - Auto Mode -->
        <ConceptImageSection title="Faces" :images="[]" :is-edit-mode="isEditMode" :grid-columns="5" mode="auto"
            auto-source-type="faces" />

        <!-- Places - Auto Mode -->
        <ConceptImageSection title="Places" :images="[]" :is-edit-mode="isEditMode" :grid-columns="5" mode="auto"
            auto-source-type="places" />

        <!-- Maps - Auto Mode -->
        <ConceptImageSection title="Maps" :images="[]" :is-edit-mode="isEditMode" :grid-columns="5" mode="auto"
            auto-source-type="maps" />

        <!-- Playlists -->
        <PlaylistSection :editable="isEditMode" />
    </div>
</template>

<script setup>
import ConceptImageSection from '../ConceptImageSection.vue'
import NovizioSection from '../NovizioSection.vue'
import PlaylistSection from '../PlaylistSection.vue'

defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

defineEmits([
    'unsaved-changes',
    'reset-unsaved-changes'
])
</script>

<style scoped></style>
