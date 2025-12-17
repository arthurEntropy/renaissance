<template>
    <NavigationControls :has-previous="hasPrevious && !isMultiEdit" :has-next="hasNext && !isMultiEdit"
        @navigate="$emit('navigate', $event)">
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-content edit-art-modal">
                <div class="modal-layout">
                    <!-- Left Column: Image and URL -->
                    <div class="left-column">
                        <ArtImageSection :url="localArt.url" :isMultiEdit="isMultiEdit" />

                        <ArtUrlTypeRow v-model:url="localArt.url" v-model:type="localArt.tags.type"
                            :selectedType="localArt.tags.type" :isMultiEdit="isMultiEdit" />

                        <ArtTagsDisplay :selectedSources="localArt.tags.sources" :partialSources="partialSources"
                            @remove="removeSource" />
                    </div>

                    <!-- Right Column: Tag Search and Options -->
                    <div class="right-column">
                        <ArtTagsSelector ref="tagsSelectorRef" v-model:searchQuery="searchQuery"
                            :selectedSources="localArt.tags.sources" @toggle="toggleSource" />
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="modal-buttons">
                    <ActionButton v-if="!isNew && !isMultiEdit" variant="danger" size="large" text="Delete"
                        @click="handleDelete" />
                    <ActionButton v-if="isNew" variant="primary" size="large" text="Save" @click="handleSave" />
                    <ActionButton v-if="isMultiEdit" variant="primary" size="large" text="Save Changes"
                        @click="handleSave" />
                    <ActionButton variant="neutral" size="large" text="Close" @click="$emit('close')" />
                </div>
            </div>
        </div>
    </NavigationControls>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import NavigationControls from '@/components/ui/NavigationControls.vue'
import ArtImageSection from '@/components/editModals/artModal/ArtImageSection.vue'
import ArtUrlTypeRow from '@/components/editModals/artModal/ArtUrlTypeRow.vue'
import ArtTagsDisplay from '@/components/editModals/artModal/ArtTagsDisplay.vue'
import ArtTagsSelector from '@/components/editModals/artModal/ArtTagsSelector.vue'
import { useSourcesStore } from '@/stores/sourcesStore'

const props = defineProps({
    art: {
        type: Object,
        default: null
    },
    hasPrevious: {
        type: Boolean,
        default: false
    },
    hasNext: {
        type: Boolean,
        default: false
    },
    isMultiEdit: {
        type: Boolean,
        default: false
    },
    multiEditData: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['close', 'save', 'delete', 'navigate'])

// Store
const sourcesStore = useSourcesStore()

// Local state - for multi-edit, use aggregated data
const localArt = ref({
    id: props.art?.id || null,
    url: props.art?.url || '',
    tags: {
        type: props.isMultiEdit && props.multiEditData
            ? props.multiEditData.type
            : (props.art?.tags?.type || 'faces'),
        sources: props.isMultiEdit && props.multiEditData
            ? [...props.multiEditData.universalSources, ...props.multiEditData.partialSources]
            : (props.art?.tags?.sources || [])
    },
    isDeleted: props.art?.isDeleted || false
})

// Track which sources are partial (not on all items) for styling
const partialSources = ref(props.multiEditData?.partialSources || [])

const isNew = computed(() => !props.art || !props.art.id)
const searchQuery = ref('')
const tagsSelectorRef = ref(null)

// Watch for prop changes (when navigating between art items)
// Don't update if we're already editing the same item (prevents overwriting during autosave)
watch(() => props.art?.id, (newId, oldId) => {
    if (newId !== oldId && props.art) {
        localArt.value = {
            id: props.art.id || null,
            url: props.art.url || '',
            tags: {
                type: props.art.tags?.type || 'faces',
                sources: props.art.tags?.sources || []
            },
            isDeleted: props.art.isDeleted || false
        }
    }
})

// Autosave watcher with debounce
let saveTimeout = null
watch(localArt, (newValue) => {
    // Only autosave if we have a URL and this is not a new item and not multi-editing
    if (!isNew.value && !props.isMultiEdit && newValue.url.trim().length > 0) {
        // Clear existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout)
        }
        // Debounce save by 500ms
        saveTimeout = setTimeout(() => {
            emit('save', { ...newValue })
        }, 500)
    }
}, { deep: true })

const toggleSource = (sourceId) => {
    const index = localArt.value.tags.sources.indexOf(sourceId)
    if (index > -1) {
        localArt.value.tags.sources.splice(index, 1)
    } else {
        localArt.value.tags.sources.push(sourceId)
        // If it was partial and we're adding it, remove from partial list
        if (props.isMultiEdit) {
            const partialIndex = partialSources.value.indexOf(sourceId)
            if (partialIndex > -1) {
                partialSources.value.splice(partialIndex, 1)
            }
        }
    }

    // Clear search and focus input for quick multi-selection
    searchQuery.value = ''
    if (tagsSelectorRef.value?.searchInputRef) {
        tagsSelectorRef.value.searchInputRef.focus()
    }
}

const removeSource = (sourceId) => {
    const index = localArt.value.tags.sources.indexOf(sourceId)
    if (index > -1) {
        localArt.value.tags.sources.splice(index, 1)
    }
}

const handleDelete = () => {
    if (confirm('Are you sure you want to delete this art? This will remove it from all tagged sources.')) {
        emit('delete', localArt.value)
    }
}

const handleSave = () => {
    if (props.isMultiEdit && props.multiEditData) {
        // For multi-edit, calculate which sources to add and remove
        const originalUniversalSources = props.multiEditData.universalSources
        const originalPartialSources = props.multiEditData.partialSources
        const currentSources = localArt.value.tags.sources
        const currentPartialSources = partialSources.value

        // Sources to add: anything in current that:
        // 1. Wasn't in original universal sources AND
        // 2. Either wasn't partial originally, OR was partial but is no longer partial (user clicked it)
        const sourcesToAdd = currentSources.filter(id => {
            if (originalUniversalSources.includes(id)) return false
            // If it's still partial (gray), don't add it
            if (currentPartialSources.includes(id)) return false
            // Otherwise add it (either new, or was partial and user made it universal)
            return true
        })

        // Sources to remove: anything in original (universal or partial) that's not in current
        const originalAllSources = [...originalUniversalSources, ...originalPartialSources]
        const sourcesToRemove = originalAllSources.filter(id => !currentSources.includes(id))

        emit('save', {
            isMultiEdit: true,
            type: localArt.value.tags.type,
            sourcesToAdd,
            sourcesToRemove
        })
    } else {
        emit('save', { ...localArt.value })
    }
}

// Keyboard navigation
const handleKeyNavigation = (event) => {
    // Don't navigate if user is typing in an input field
    if (event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable) {
        return
    }

    switch (event.key) {
        case 'ArrowLeft':
            if (props.hasPrevious) {
                emit('navigate', -1)
            }
            break
        case 'ArrowRight':
            if (props.hasNext) {
                emit('navigate', 1)
            }
            break
        case 'Escape':
            emit('close')
            break
    }
}

// Lifecycle
onMounted(async () => {
    await sourcesStore.fetchSources()
    window.addEventListener('keydown', handleKeyNavigation)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyNavigation)
})
</script>

<style scoped>
.edit-art-modal {
    max-width: 1200px;
    max-height: 90vh;
    overflow-y: auto;
}

/* Two-column layout for wider viewports */
.modal-layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

@media (min-width: 1024px) {
    .modal-layout {
        flex-direction: row;
        gap: var(--space-xl);
        height: calc(90vh - 120px);
    }

    .left-column {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .right-column {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .right-column :deep(.multi-select) {
        display: flex;
        flex-direction: column;
        height: 100%;
        margin-bottom: 0;
    }
}

.modal-buttons {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
    margin-top: var(--space-xl);
    padding-top: var(--space-lg);
    border-top: 1px solid var(--color-border-secondary);
}
</style>
