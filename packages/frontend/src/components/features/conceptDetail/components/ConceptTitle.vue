<template>
    <div class="concept-header-container">
        <div v-if="isEditingTitle" class="editable-title">
            <input type="text" v-model="localTitle" class="concept-input concept-input-title" ref="titleInput"
                @blur="saveTitle" @keyup.enter="saveTitle" @keyup.esc="cancelEdit" />
        </div>
        <template v-else>
            <h1 class="concept-title edit-hover-area" @click="enhancedStartEdit">
                {{ concept.name }}
                <EditButton v-if="isEditMode" @click="enhancedStartEdit" title="Edit title" size="small"
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
import EditButton from '@/components/ui/buttons/EditButton.vue'
import { useInlineEditor } from '../composables/useInlineEditor'

const props = defineProps({
    concept: {
        type: Object,
        required: true
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

const emit = defineEmits(['update:name'])

// Local reactive state
const localTitle = ref(props.concept.name)
const titleInput = ref(null)

// Inline editing functionality
const {
    isEditing: isEditingTitle,
    startEdit,
    saveEdit,
    cancelEdit: cancelTitleEdit,
    focusElement
} = useInlineEditor(
    () => props.concept.name,
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
    emit('update:name', localTitle.value)
    saveEdit()
}

const cancelEdit = () => {
    localTitle.value = props.concept.name
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
    gap: 16px;
}

.concept-title {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.2;
    cursor: pointer;
    position: relative;
}

.concept-title:hover {
    color: var(--color-primary);
}

.editable-title {
    flex: 1;
}
</style>
