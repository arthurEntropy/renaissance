<template>
    <div class="description-container edit-hover-area">
        <EditButton v-if="isEditMode" @click="toggleEdit" :is-editing="isEditingDescription" title="Edit description"
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
import EditButton from '@/components/ui/buttons/EditButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import { useInlineEditor } from '../composables/useInlineEditor'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const props = defineProps({
    description: {
        type: String,
        default: ''
    },
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:description'])

// Local reactive state
const localDescription = ref(props.description)
const descriptionEditor = ref(null)

// Inline editing functionality
const {
    isEditing: isEditingDescription,
    startEdit,
    saveEdit,
    cancelEdit: cancelDescriptionEdit
} = useInlineEditor(
    () => props.description,
    (value) => {
        localDescription.value = value
    }
)

// Computed properties
const safeDescription = computed(() => {
    return sanitizeHtml(props.description || 'No description provided.')
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
    emit('update:description', localDescription.value)
    saveEdit()
}

const cancelEdit = () => {
    localDescription.value = props.description
    cancelDescriptionEdit()
}

// Watch for prop changes
watch(() => props.description, (newDesc) => {
    if (!isEditingDescription.value) {
        localDescription.value = newDesc
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
    margin-top: 10px;
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
    padding: 16px;
}
</style>
