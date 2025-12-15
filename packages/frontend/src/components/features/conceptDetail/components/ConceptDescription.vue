<template>
    <div class="description-container edit-hover-area">
        <FloatingActionButton v-if="isEditMode" type="edit" @click="toggleEdit" :is-active="isEditingDescription"
            size="small" visibility="on-hover" class="edit-button-overlay" />

        <div v-if="isEditingDescription" class="editable-description">
            <TextEditor v-model="localDescription" height="200px" ref="descriptionEditor" placeholder="description"
                :auto-height="true" />
            <div class="description-editor-buttons">
                <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelEdit" />
            </div>
        </div>

        <div v-else class="concept-description" @click="isEditMode && startEdit" v-html="safeDescription" />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import { useInlineEditor } from '../composables/useInlineEditor'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useConceptsStore } from '@/stores/conceptsStore'

const props = defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

// Get concept from store
const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)

// Local reactive state
const localDescription = ref(concept.value?.description || '')
const descriptionEditor = ref(null)

// Inline editing functionality
const {
    isEditing: isEditingDescription,
    startEdit,
    saveEdit,
    cancelEdit: cancelDescriptionEdit
} = useInlineEditor(
    () => concept.value?.description || '',
    (value) => {
        localDescription.value = value
    }
)

// Computed properties
const safeDescription = computed(() => {
    return sanitizeHtml(concept.value?.description || 'No description provided.')
})

// Methods
const toggleEdit = () => {
    if (!props.isEditMode) return

    if (isEditingDescription.value) {
        saveDescription()
    } else {
        startEdit()
    }
}

const saveDescription = () => {
    if (concept.value) {
        concept.value.description = localDescription.value
    }
    saveEdit()
}

const cancelEdit = () => {
    localDescription.value = concept.value?.description || ''
    cancelDescriptionEdit()
}

// Watch for concept changes
watch(() => concept.value?.description, (newDesc) => {
    if (!isEditingDescription.value) {
        localDescription.value = newDesc || ''
    }
})
</script>

<style scoped>
/* Description styling */
.description-container {
    position: relative;
}

.description-editor-buttons {
    display: flex;
    justify-content: flex-start;
    margin-top: var(--space-xs);
}

.concept-description {
    text-align: left;
    font-size: var(--font-size-18);
    line-height: var(--line-height-normal);
    padding: var(--space-xs);
    border-radius: var(--radius-5);
}

.editable-description {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    padding: var(--space-md);
}
</style>
