<template>
    <div class="concept-header-container">
        <div v-if="isEditingTitle" class="editable-title">
            <input type="text" v-model="localTitle" class="concept-input concept-input-title" ref="titleInput"
                @blur="saveTitle" @keyup.enter="saveTitle" @keyup.esc="cancelEdit" />
        </div>
        <template v-else>
            <h1 class="concept-title edit-hover-area" @click="enhancedStartEdit">
                {{ concept.name }}
                <FloatingActionButton v-if="isEditMode" type="edit" @click="enhancedStartEdit" size="small"
                    visibility="on-hover" />
            </h1>
            <div v-if="expansionLogoUrl" class="expansion-badge-wrapper"
                :title="expansion ? `Expansion: ${expansion.name}` : 'Expansion'">
                <img :src="expansionLogoUrl" alt="Expansion Logo" class="expansion-badge" />
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useInlineEditor } from '../composables/useInlineEditor'
import { useConceptsStore } from '@/stores/conceptsStore'

const props = defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    },
    expansion: {
        type: Object,
        default: null
    }
})

// Get concept from store
const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedItem)

// Local reactive state
const localTitle = ref(concept.value?.name || '')
const titleInput = ref(null)

// Inline editing functionality
const {
    isEditing: isEditingTitle,
    startEdit,
    saveEdit,
    cancelEdit: cancelTitleEdit,
    focusElement
} = useInlineEditor(
    () => concept.value?.name || '',
    (value) => {
        localTitle.value = value
    }
)

// Computed properties
const expansionLogoUrl = computed(() => {
    return props.expansion && props.expansion.logoUrl ? props.expansion.logoUrl : ''
})

// Methods
const saveTitle = () => {
    if (concept.value) {
        concept.value.name = localTitle.value
    }
    saveEdit()
}

const cancelEdit = () => {
    localTitle.value = concept.value?.name || ''
    cancelTitleEdit()
}

// Enhanced start edit to focus input
const enhancedStartEdit = async () => {
    if (!props.isEditMode) return
    startEdit()
    await focusElement(titleInput)
}
</script>

<style scoped>
.concept-header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    gap: var(--space-md);
}

.concept-title {
    font-size: var(--font-size-40);
    font-weight: bold;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.2;
    cursor: pointer;
    position: relative;
}

.editable-title {
    flex: 1;
}
</style>
