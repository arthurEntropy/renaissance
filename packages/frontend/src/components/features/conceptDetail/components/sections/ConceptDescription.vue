<template>
    <div class="description-container edit-hover-area">

        <!-- Edit button -->
        <FloatingActionButton v-if="isEditMode" type="edit" @click="toggleEdit" :is-active="isEditingDescription"
            size="small" visibility="always" class="edit-button-overlay" />

        <!-- Edit mode -->
        <div v-if="isEditingDescription" class="editable-description">
            <TextEditor v-model="localDescription" height="200px" ref="descriptionEditor" placeholder="description"
                :auto-height="true" />
            <div class="description-editor-buttons">
                <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelEdit" />
            </div>
        </div>

        <!-- Display mode -->
        <div v-else class="concept-description rich-text-content" :class="{ 'cursor-pointer': isEditMode }"
            @click="startEdit" v-html="safeDescription" />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useConceptsStore } from '@/stores/conceptsStore'

const props = defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)

const localDescription = ref(concept.value?.description || '')
const isEditingDescription = ref(false)

const safeDescription = computed(() => {
    return sanitizeHtml(concept.value?.description || 'No description provided.')
})

const startEdit = () => {
    isEditingDescription.value = true
}

const toggleEdit = () => {
    if (!props.isEditMode) return

    if (isEditingDescription.value) {
        saveDescription()
    } else {
        startEdit()
    }
}

const saveDescription = async () => {
    if (concept.value) {
        concept.value.description = localDescription.value
        await conceptsStore.update(concept.value)
    }
    isEditingDescription.value = false
}

const cancelEdit = () => {
    localDescription.value = concept.value?.description || ''
    isEditingDescription.value = false
}

watch(() => concept.value?.description, (newDesc) => {
    if (!isEditingDescription.value) {
        localDescription.value = newDesc || ''
    }
})
</script>

<style scoped>
@import '@/styles/rich-text-content.css';

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
    color: var(--color-text-primary);
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
