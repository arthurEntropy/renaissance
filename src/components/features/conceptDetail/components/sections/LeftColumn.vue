<template>
    <div class="concept-left-column">
        <!-- Featured Art -->
        <ConceptImageSection title="Featured Art" :show-title="false" :images="concept.artUrls || []"
            :is-edit-mode="isEditMode" :grid-columns="5" @update:images="$emit('update:featured-art', $event)" />

        <!-- Novizio Section -->
        <NovizioSection ref="novizioSection" :novizio="concept.novizio" :editable="isEditMode"
            @update="$emit('update:novizio', $event)" @unsaved-changes="$emit('unsaved-changes', $event)"
            @reset-unsaved-changes="$emit('reset-unsaved-changes')" />

        <!-- Faces -->
        <ConceptImageSection title="Faces" :images="concept.faces || []" :is-edit-mode="isEditMode" :grid-columns="5"
            @update:images="$emit('update:faces', $event)" />

        <!-- Places -->
        <ConceptImageSection title="Places" :images="concept.places || []" :is-edit-mode="isEditMode" :grid-columns="5"
            @update:images="$emit('update:places', $event)" />

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

<style scoped>
.concept-left-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: left;
    max-width: 500px;
    text-align: left;
}

@media (max-width: var(--breakpoint-lg)) {
    .concept-left-column {
        max-width: 100%;
        margin-bottom: 1rem;
    }
}
</style>
