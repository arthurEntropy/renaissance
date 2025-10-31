<template>
    <NavigationControls :has-previous="hasPrevious && !isMultiEdit" :has-next="hasNext && !isMultiEdit"
        @navigate="$emit('navigate', $event)">
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-content edit-art-modal">
                <div class="modal-layout">
                    <!-- Left Column: Image and URL -->
                    <div class="left-column">
                        <!-- Image Preview or Multi-Edit Notice -->
                        <div v-if="isMultiEdit" class="multi-edit-notice">
                            <h2>Edit Multiple Items</h2>
                            <p>Multiple items selected</p>
                        </div>
                        <div v-else class="image-preview-section">
                            <div v-if="localArt.url" class="image-preview">
                                <img :src="localArt.url" alt="Art preview" />
                            </div>
                            <div v-else class="image-preview-placeholder">
                                <span>No image URL provided</span>
                            </div>
                        </div>

                        <!-- URL and Type Row (hidden in multi-edit mode) -->
                        <div v-if="!isMultiEdit" class="form-group url-type-row">
                            <label for="art-url">Image URL</label>
                            <input id="art-url" v-model="localArt.url" type="text" class="modal-input"
                                placeholder="https://..." />
                            <div class="type-toggle">
                                <button type="button" class="type-button"
                                    :class="{ 'faces': true, 'selected': localArt.tags.type === 'faces' }"
                                    @click="setType('faces')">
                                    <UserCircleIcon class="icon-sm" />
                                </button>
                                <button type="button" class="type-button"
                                    :class="{ 'places': true, 'selected': localArt.tags.type === 'places' }"
                                    @click="setType('places')">
                                    <PhotoIcon class="icon-sm" />
                                </button>
                                <button type="button" class="type-button"
                                    :class="{ 'maps': true, 'selected': localArt.tags.type === 'maps' }"
                                    @click="setType('maps')">
                                    <MapIcon class="icon-sm" />
                                </button>
                            </div>
                        </div>

                        <!-- Type Toggle for Multi-Edit -->
                        <div v-if="isMultiEdit" class="form-group">
                            <div class="type-toggle">
                                <button type="button" class="type-button"
                                    :class="{ 'faces': true, 'selected': localArt.tags.type === 'faces' }"
                                    @click="setType('faces')">
                                    <UserCircleIcon class="icon-sm" />
                                </button>
                                <button type="button" class="type-button"
                                    :class="{ 'places': true, 'selected': localArt.tags.type === 'places' }"
                                    @click="setType('places')">
                                    <PhotoIcon class="icon-sm" />
                                </button>
                                <button type="button" class="type-button"
                                    :class="{ 'maps': true, 'selected': localArt.tags.type === 'maps' }"
                                    @click="setType('maps')">
                                    <MapIcon class="icon-sm" />
                                </button>
                            </div>
                        </div>

                        <!-- Selected Tags (Chips) -->
                        <div class="selected-chips" :class="{ empty: localArt.tags.sources.length === 0 }">
                            <div v-for="sourceId in localArt.tags.sources" :key="sourceId" class="chip"
                                :class="{ 'chip-partial': isPartialSource(sourceId) }">
                                <span class="chip-text">{{ getSourceName(sourceId) }}</span>
                                <button class="chip-remove" @click="removeSource(sourceId)" type="button">
                                    <XMarkIcon class="chip-icon" />
                                </button>
                            </div>
                            <span v-if="localArt.tags.sources.length === 0" class="empty-message">No tags</span>
                        </div>
                    </div>

                    <!-- Right Column: Tag Search and Options -->
                    <div class="right-column">
                        <!-- Source Multi-Select -->
                        <div class="form-group multi-select">
                            <!-- Search Bar -->
                            <input ref="searchInput" v-model="searchQuery" type="text" class="sources-search"
                                placeholder="Search tags..." @input="filterSources" />

                            <!-- Source Lists by Category -->
                            <div class="sources-columns">
                                <div v-for="(groupSources, groupName) in filteredSourceGroups" :key="groupName"
                                    class="source-column">
                                    <h4 v-if="groupSources.length > 0" class="source-group-title">{{ groupName }}</h4>
                                    <div class="source-items">
                                        <button v-for="source in groupSources" :key="source.id" type="button"
                                            class="source-item"
                                            :class="{ selected: localArt.tags.sources.includes(source.id) }"
                                            @click="toggleSource(source.id)">
                                            {{ source.name }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="modal-buttons">
                    <ActionButton v-if="!isNew && !isMultiEdit" variant="danger" size="large" text="Delete"
                        @click="handleDelete" />
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
import { XMarkIcon, UserCircleIcon, PhotoIcon, MapIcon } from '@heroicons/vue/24/outline'
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
const searchInput = ref(null)

// Watch for prop changes (when navigating between art items)
watch(() => props.art, (newArt) => {
    if (newArt) {
        localArt.value = {
            id: newArt.id || null,
            url: newArt.url || '',
            tags: {
                type: newArt.tags?.type || 'faces',
                sources: newArt.tags?.sources || []
            },
            isDeleted: newArt.isDeleted || false
        }
    }
}, { deep: true })

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

// Source groups
const sourceGroups = computed(() => ({
    'Ancestries': sourcesStore.sources.ancestries || [],
    'Cultures': sourcesStore.sources.cultures || [],
    'Mestieri': sourcesStore.sources.mestieri || [],
    'World Elements': sourcesStore.sources.worldElements || []
}))

// Filtered source groups based on search
const filteredSourceGroups = computed(() => {
    if (!searchQuery.value.trim()) {
        return sourceGroups.value
    }

    const query = searchQuery.value.toLowerCase()
    const filtered = {}

    Object.keys(sourceGroups.value).forEach(groupName => {
        const matchingSources = sourceGroups.value[groupName].filter(source =>
            source.name.toLowerCase().includes(query)
        )
        if (matchingSources.length > 0) {
            filtered[groupName] = matchingSources
        }
    })

    return filtered
})

// Get source name by ID
const getSourceName = (sourceId) => {
    for (const group of Object.values(sourceGroups.value)) {
        const source = group.find(s => s.id === sourceId)
        if (source) return source.name
    }
    return 'Unknown'
}

const setType = (type) => {
    localArt.value.tags.type = type
}

const isPartialSource = (sourceId) => {
    return props.isMultiEdit && partialSources.value.includes(sourceId)
}

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
    if (searchInput.value) {
        searchInput.value.focus()
    }
}

const removeSource = (sourceId) => {
    const index = localArt.value.tags.sources.indexOf(sourceId)
    if (index > -1) {
        localArt.value.tags.sources.splice(index, 1)
    }
}

const filterSources = () => {
    // Reactive filtering handled by computed property
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

.edit-art-modal h2 {
    margin-top: 0;
    margin-bottom: var(--space-lg);
    color: var(--color-text-primary);
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
        /* Account for modal padding and buttons */
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

    .right-column .multi-select {
        display: flex;
        flex-direction: column;
        height: 100%;
        margin-bottom: 0;
    }
}

.image-preview-section {
    margin-bottom: var(--space-lg);
}

@media (min-width: 1024px) {
    .image-preview-section {
        margin-bottom: 0;
        flex: 1;
        display: flex;
        align-items: stretch;
        justify-content: center;
        min-height: 0;
    }
}

.image-preview {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: var(--radius-10);
    overflow: hidden;
}

@media (min-width: 1024px) {
    .image-preview {
        aspect-ratio: 1/1;
        width: auto;
        height: 100%;
        max-width: 100%;
    }
}

.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.image-preview-placeholder {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: var(--radius-10);
    background: var(--color-bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--color-border-secondary);
    color: var(--color-text-secondary);
}

@media (min-width: 1024px) {
    .image-preview-placeholder {
        aspect-ratio: 1/1;
        width: auto;
        height: 100%;
        max-width: 100%;
    }
}

.multi-edit-notice {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: var(--radius-10);
    background: var(--color-bg-tertiary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    border: 2px solid var(--color-primary);
    color: var(--color-text-primary);
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
}

@media (min-width: 1024px) {
    .multi-edit-notice {
        aspect-ratio: 1/1;
        width: auto;
        height: 100%;
        max-width: 100%;
        margin-bottom: 0;
    }
}

.multi-edit-notice h2 {
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--space-xs) 0;
}

.multi-edit-notice h3 {
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-semibold);
    margin: 0;
}

.multi-edit-notice p {
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    margin: 0;
}

.form-group {
    margin-bottom: var(--space-sm);
}

.form-group label {
    display: block;
    margin-bottom: var(--space-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

/* URL and Type Row */
.url-type-row {
    display: flex;
    gap: var(--space-md);
    align-items: center;
    width: 100%;
}

.url-type-row label {
    margin-bottom: 0;
    white-space: nowrap;
}

.url-type-row input {
    flex: 1;
}

.type-toggle {
    display: flex;
    gap: var(--space-xs);
}

.type-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
    border: 1px solid transparent;
    cursor: pointer;
    transition: var(--transition-all);
    opacity: 0.5;
}

.type-button.faces {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(96, 165, 250);
}

.type-button.places {
    background: rgba(16, 185, 129, 0.2);
    color: rgb(52, 211, 153);
}

.type-button.maps {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(248, 113, 113);
}

.type-button.selected {
    opacity: 1;
    border-color: var(--color-border-primary);
}

.type-button:hover {
    opacity: 0.8;
}

.type-button.selected:hover {
    opacity: 1;
}

.icon-sm {
    width: 16px;
    height: 16px;
}

.multi-select {
    display: flex;
    flex-direction: column;
}

/* Selected Chips - Top Row */
.selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    padding: 0;
    min-height: 40px;
    justify-content: center;
    align-items: center;
}

.selected-chips.empty {
    justify-content: center;
    align-items: center;
}

.empty-message {
    color: var(--color-text-secondary);
    font-size: var(--font-size-12);
    font-style: italic;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-primary);
    color: var(--color-primary-text);
    border-radius: var(--radius-5);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
}

.chip-partial {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-secondary);
}

.chip-partial .chip-remove {
    color: var(--color-text-secondary);
}

.chip-text {
    line-height: 1;
}

.chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-primary-text);
    transition: var(--transition-opacity);
}

.chip-remove:hover {
    opacity: 0.7;
}

.chip-icon {
    width: 14px;
    height: 14px;
}

/* Source Search - Middle Row */
.sources-search {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
    font-family: inherit;
    margin-bottom: var(--space-md);
}

.sources-search:focus {
    outline: none;
    border-color: var(--color-primary);
}

/* Source Lists - Bottom Row in Columns */
.sources-columns {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-md);
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space-sm);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-5);
    border: 1px solid var(--color-border-secondary);
    width: 100%;
}

@media (min-width: 1024px) {
    .sources-columns {
        flex: 1;
        max-height: none;
        overflow-y: auto;
    }
}

@media (max-width: 1024px) {
    .sources-columns {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 640px) {
    .sources-columns {
        grid-template-columns: 1fr;
    }
}

.source-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.source-group-title {
    margin: 0 0 var(--space-xs) 0;
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid var(--color-border-secondary);
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.source-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.source-item {
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    text-align: left;
    cursor: pointer;
    transition: var(--transition-all);
}

.source-item:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border-primary);
}

.source-item.selected {
    background: rgba(59, 130, 246, 0.2);
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

/* Scrollbar for source columns */
.sources-columns::-webkit-scrollbar {
    width: 8px;
}

.sources-columns::-webkit-scrollbar-track {
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-5);
}

.sources-columns::-webkit-scrollbar-thumb {
    background: var(--color-border-secondary);
    border-radius: var(--radius-5);
}

.sources-columns::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-primary);
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
