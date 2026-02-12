<template>
  <CharacterSheetSection custom-class="character-profile" min-width="400px">
    <CharacterArt />
    <CharacterVitals @close-sheet="$emit('close-sheet')" />

    <!-- Bio & Notes Button -->
    <FloatingActionButton type="notes" size="small" visibility="always" class="notes-button" @click="openModal" />

    <!-- XP Badge -->
    <div class="xp-badge">
      <span class="xp-label">XP:</span>
      <NumberInput :model-value="character.xp || 0" :disabled="!canEdit" @update:model-value="updateXP" :min="0"
        size="small" />
    </div>

    <!-- Bio Modal (View/Edit) -->
    <div v-if="isModalOpen" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content bio-modal edit-hover-area" @click.stop>
        <FloatingActionButton v-if="canEdit && !isEditMode" type="edit" size="small" visibility="on-hover"
          class="edit-button-overlay" @click.stop="startEdit" />

        <!-- View Mode -->
        <div v-if="!isEditMode" class="full-text-content">
          <div v-if="hasBio" v-html="safeFormattedBio" class="full-text"></div>
          <p v-else class="empty-text">{{ EMPTY_BIO_MESSAGE }}</p>
        </div>

        <!-- Edit Mode -->
        <template v-else>
          <div class="modal-body">
            <TextEditor v-model="editedContent" :auto-height="true" :placeholder="EMPTY_BIO_MESSAGE" height="300px" />
          </div>
          <div class="modal-footer">
            <div class="form-buttons">
              <ActionButton variant="success" size="small" text="Save" @click="saveChanges" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </CharacterSheetSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import CharacterArt from './CharacterArt.vue'
import CharacterVitals from './CharacterVitals.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import { useCharactersStore } from '@/stores/charactersStore'

defineEmits(['close-sheet'])

const charactersStore = useCharactersStore()

const character = computed(() => charactersStore.selectedCharacter)
const canEdit = computed(() => charactersStore.canEditSelectedCharacter)

const updateXP = (newValue) => {
  character.value.xp = newValue
}

// Bio Modal State
const EMPTY_BIO_MESSAGE = "What's your vibe? What's your story? Where are you going?"

const hasBio = computed(() => !!character.value?.personalityAndBackground)

const isModalOpen = ref(false)
const isEditMode = ref(false)
const editedContent = ref('')

const safeFormattedBio = computed(() => {
  if (!hasBio.value) return ''
  const html = marked.parse(character.value.personalityAndBackground, { breaks: true })
  return sanitizeHtml(html)
})

const hasUnsavedChanges = computed(() => {
  return editedContent.value !== (character.value?.personalityAndBackground || '')
})

const openModal = () => {
  isModalOpen.value = true
  isEditMode.value = false
}

const startEdit = () => {
  editedContent.value = character.value?.personalityAndBackground || ''
  isEditMode.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  isEditMode.value = false
}

const handleOverlayClick = () => {
  if (isEditMode.value && hasUnsavedChanges.value) {
    const shouldDiscard = confirm('Discard unsaved changes?')
    if (shouldDiscard) {
      closeModal()
    }
  } else {
    closeModal()
  }
}

const saveChanges = () => {
  if (character.value) {
    character.value.personalityAndBackground = editedContent.value
    isEditMode.value = false
  }
}
</script>

<style scoped>
.character-profile {
  flex-direction: row;
  gap: var(--space-md);
  position: relative;
  overflow: hidden;
}

.notes-button {
  position: absolute;
  bottom: 4px;
  right: 90px;
  z-index: var(--z-raised);
}

.xp-badge {
  position: absolute;
  bottom: 0px;
  right: 0px;
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  background-color: var(--color-gray-dark);
  padding: var(--space-xs) var(--space-md);
  border-top-left-radius: var(--radius-15);
  z-index: var(--z-raised);
}

.xp-label {
  font-size: var(--font-size-12);
  font-style: italic;
}

/* Bio Modal Styles */
.edit-button-overlay {
  position: absolute;
  z-index: var(--z-raised);
  top: var(--space-md);
  right: var(--space-md);
}

.bio-modal {
  max-width: var(--width-modal);
  max-height: 90%;
  padding: var(--space-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  position: relative;
}

.full-text-content {
  max-height: 80vh;
  overflow-y: auto;
  text-align: left;
}

.full-text-content h2 {
  margin-top: 0;
  margin-bottom: var(--space-lg);
  color: var(--color-white);
  font-size: var(--font-size-24);
}

.full-text {
  line-height: var(--line-height-normal);
  font-size: var(--font-size-16);
  color: var(--color-white);
}

.full-text :deep(p) {
  margin: 0 0 var(--space-md) 0;
}

.full-text :deep(p:last-child) {
  margin-bottom: 0;
}

.empty-text {
  color: var(--color-gray-light);
  font-style: italic;
  font-size: var(--font-size-16);
}

@media (max-width: var(--breakpoint-lg)) {
  .character-profile {
    flex-direction: column;
  }
}
</style>
