<template>
  <div class="character-bio-section">
    <!-- Background Modal -->
    <div v-if="backgroundModal.isOpen.value" class="modal-overlay" @click.self="closeBackgroundModal">
      <div class="modal-content background-modal">
        <div class="modal-header">
          <h3>Personality, Background & Notes</h3>
          <button v-if="!backgroundModal.isEditMode.value" class="edit-button" @click.stop="startBackgroundEdit">
            Edit
          </button>
          <div v-else class="edit-actions">
            <button class="cancel-button" @click.stop="cancelBackgroundEdit">
              Cancel
            </button>
            <button class="save-button" @click.stop="saveBackgroundEdit">
              Save
            </button>
          </div>
        </div>

        <!-- View mode -->
        <div v-if="!backgroundModal.isEditMode.value" class="background-modal-content">
          <div v-html="formattedBackground" class="background-full-text"></div>
        </div>

        <!-- Edit mode with TextEditor -->
        <div v-else class="background-modal-editor">
          <TextEditor v-model="editedCharacter.personalityAndBackground"
            :placeholder="'Describe your character\'s personality, history, and notable background...'"
            height="300px" />
        </div>
      </div>
    </div>

    <div class="bio-section-content">
      <!-- Character Art -->
      <div class="character-art">
        <img v-if="character.artUrls && character.artUrls.length > 0" :src="character.artUrls[0] || defaultArtUrl"
          class="character-art-image" @click="openFullSizeCharacterArtModal(character.artUrls[0])" />
        <img v-else :src="defaultArtUrl" class="character-art-image"
          @click="openFullSizeCharacterArtModal(defaultArtUrl)" />
      </div>

      <!-- Bio Information -->
      <div class="bio-info">
        <!-- Name (click to edit) -->
        <div class="character-name-container" :class="{ editing: isEditing('name') }">
          <template v-if="isEditing('name')">
            <input type="text" v-model="editedCharacter.name" class="form-input inline-edit" @blur="saveField('name')"
              @keyup.enter="saveField('name')" ref="nameInput" />
          </template>
          <template v-else>
            <span class="character-name" @click.stop="startEditingWithRefs('name')">{{
              character.name || 'Unnamed Character'
              }}</span>
          </template>

          <!-- Pronouns (click to edit) -->
          <div class="pronouns-container" @click.stop="startEditingWithRefs('pronouns')"
            :class="{ editing: isEditing('pronouns') }">
            <template v-if="isEditing('pronouns')">
              <input type="text" v-model="editedCharacter.pronouns" class="form-input inline-edit pronouns-input"
                @blur="saveField('pronouns')" @keyup.enter="saveField('pronouns')" placeholder="Add pronouns"
                ref="pronounsInput" />
            </template>
            <template v-else>
              <span v-if="character.pronouns" class="character-pronouns">({{ character.pronouns }})</span>
              <span v-else class="empty-field">(Add pronouns)</span>
            </template>
          </div>
        </div>

        <div class="bio-details">
          <!-- Ancestries (click to edit) -->
          <div class="bio-detail" @click.stop="
            !isEditing('ancestries') && startEditingWithRefs('ancestries')
            " :class="{ editing: isEditing('ancestries') }">
            <span class="bio-label">Ancestries:</span>
            <template v-if="isEditing('ancestries')">
              <div class="tag-selector" @click.stop>
                <div v-for="ancestry in selectedAncestries" :key="ancestry.id" class="selected-tag">
                  <span>{{ ancestry.name }}</span>
                  <button @click.stop="removeAncestry(ancestry.id)" class="remove-tag">
                    ×
                  </button>
                </div>
                <select v-model="ancestrySelector.selectedId.value" @change="addAncestry" class="tag-dropdown"
                  @click.stop @blur.prevent="null" ref="ancestriesSelect">
                  <option value="">Add...</option>
                  <option v-for="ancestry in availableAncestries" :key="ancestry.id" :value="ancestry.id">
                    {{ ancestry.name }}
                  </option>
                </select>
              </div>
            </template>
            <template v-else>
              <span class="bio-value" @click.stop="startEditingWithRefs('ancestries')">
                {{ displayAncestries || 'None' }}
              </span>
            </template>
          </div>

          <!-- Cultures (click to edit) -->
          <div class="bio-detail" @click.stop="
            !isEditing('cultures') && startEditingWithRefs('cultures')
            " :class="{ editing: isEditing('cultures') }">
            <span class="bio-label">Cultures:</span>
            <template v-if="isEditing('cultures')">
              <div class="tag-selector" @click.stop>
                <div v-for="culture in selectedCultures" :key="culture.id" class="selected-tag">
                  <span>{{ culture.name }}</span>
                  <button @click.stop="removeCulture(culture.id)" class="remove-tag">
                    ×
                  </button>
                </div>
                <select v-model="cultureSelector.selectedId.value" @change="addCulture" class="tag-dropdown" @click.stop
                  @blur.prevent="null" ref="culturesSelect">
                  <option value="">Add...</option>
                  <option v-for="culture in availableCultures" :key="culture.id" :value="culture.id">
                    {{ culture.name }}
                  </option>
                </select>
              </div>
            </template>
            <template v-else>
              <span class="bio-value" @click.stop="startEditingWithRefs('cultures')">
                {{ displayCultures || 'None' }}
              </span>
            </template>
          </div>

          <!-- XP (always an input) -->
          <div class="bio-detail xp-field">
            <span class="bio-label">XP:</span>
            <NumberInput :model-value="editedCharacter.xp" @update:model-value="
              (value) => {
                editedCharacter.xp = value
                saveField('xp')
              }
            " :min="0" size="small" />
          </div>
        </div>
      </div>

      <!-- Personality and Background Section -->
      <div class="personality-background-section">
        <span class="bio-label" style="margin-bottom: 5px">Personality, Background & Notes</span>

        <!-- View Mode (scrollable and clickable to open modal) -->
        <div class="background-content scrollable" @click="openBackgroundModal">
          <template v-if="character.personalityAndBackground">
            <div v-html="formattedBackground" class="background-scroll-content"></div>
          </template>
          <span v-else class="empty-background">What's your vibe? What's your story? Where are you going?</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useAncestriesStore } from '@/stores/ancestriesStore'
import { useCulturesStore } from '@/stores/culturesStore'
import { useInlineEditor } from '@/composables/useInlineEditor'
import { useModal } from '@/composables/useModal'
import { useTagSelector } from '@/composables/useTagSelector'
import { formatText } from '../../../utils/stringUtils'
import TextEditor from '@/components/TextEditor.vue'
import NumberInput from '@/components/NumberInput.vue'

// Props
const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  defaultArtUrl: {
    type: String,
    required: true,
  },
})

// Emits
const emit = defineEmits(['open-full-size-art', 'update-character'])

// Stores
const ancestryStore = useAncestriesStore()
const cultureStore = useCulturesStore()

// Composables
const updateCharacter = (updatedCharacter) => {
  emit('update-character', updatedCharacter)
}

const {
  editingField,
  editedData: editedCharacter,
  startEditing,
  saveField,
  isEditing,
  setFieldRef,
  syncData
} = useInlineEditor(computed(() => props.character), updateCharacter)

const backgroundModal = useModal({
  confirmOnClose: true,
  confirmMessage: 'Discard changes?'
})

const ancestrySelector = useTagSelector(
  computed(() => ancestryStore.ancestries),
  computed(() => editedCharacter.value.ancestryIds),
  (updatedIds) => {
    editedCharacter.value.ancestryIds = updatedIds
    saveField('ancestryIds')
  }
)

const cultureSelector = useTagSelector(
  computed(() => cultureStore.cultures),
  computed(() => editedCharacter.value.cultureIds),
  (updatedIds) => {
    editedCharacter.value.cultureIds = updatedIds
    saveField('cultureIds')
  }
)

// Template refs
const nameInput = ref(null)
const pronounsInput = ref(null)
const ancestriesSelect = ref(null)
const culturesSelect = ref(null)
// Watchers
watch(
  () => props.character,
  (newCharacter) => {
    syncData(newCharacter)
  },
  { deep: true }
)

// Computed properties
const displayAncestries = computed(() => ancestrySelector.displayText.value)
const displayCultures = computed(() => cultureSelector.displayText.value)
const selectedAncestries = computed(() => ancestrySelector.selectedItems.value)
const selectedCultures = computed(() => cultureSelector.selectedItems.value)
const availableAncestries = computed(() => ancestrySelector.availableItems.value)
const availableCultures = computed(() => cultureSelector.availableItems.value)

const formattedBackground = computed(() => {
  if (!props.character.personalityAndBackground) return ''
  return formatText(props.character.personalityAndBackground)
})
// Methods
const openFullSizeCharacterArtModal = (imageUrl) => {
  emit('open-full-size-art', imageUrl)
}

// Override the composable's startEditing to handle template refs
const startEditingWithRefs = (field) => {
  startEditing(field)

  // Set up template refs for focusing
  if (field === 'name') setFieldRef('name', nameInput.value)
  else if (field === 'pronouns') setFieldRef('pronouns', pronounsInput.value)
  else if (field === 'ancestries') setFieldRef('ancestries', ancestriesSelect.value)
  else if (field === 'cultures') setFieldRef('cultures', culturesSelect.value)
}

// Background modal methods
const openBackgroundModal = () => {
  backgroundModal.openModal()
  editedCharacter.value = { ...props.character }
}

const closeBackgroundModal = () => {
  backgroundModal.closeModal()
}

const startBackgroundEdit = () => {
  backgroundModal.startEdit(props.character.personalityAndBackground || '')
}

const cancelBackgroundEdit = () => {
  const tempContent = backgroundModal.cancelEdit()
  editedCharacter.value.personalityAndBackground = tempContent
}

const saveBackgroundEdit = () => {
  backgroundModal.saveEdit(() => {
    const updatedCharacter = {
      ...props.character,
      personalityAndBackground: editedCharacter.value.personalityAndBackground,
    }
    emit('update-character', updatedCharacter)
  })
}

// Tag selector methods (use composable methods)
const addAncestry = () => ancestrySelector.addItem()
const removeAncestry = (id) => ancestrySelector.removeItem(id)
const addCulture = () => cultureSelector.addItem()
const removeCulture = (id) => cultureSelector.removeItem(id)

const handleOutsideClick = (event) => {
  if (
    event.target.closest('.remove-tag') ||
    event.target.closest('.selected-tag') ||
    event.target.closest('.tag-dropdown')
  ) {
    return
  }

  if (editingField.value) {
    const clickedInsideEditArea =
      event.target.closest('.editing') ||
      event.target.closest('.tag-selector')
    if (!clickedInsideEditArea) {
      saveField(editingField.value)
    }
  }
}
// Lifecycle hooks
onMounted(() => {
  ancestryStore.fetchAncestries()
  cultureStore.fetchCultures()
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.character-bio-section {
  display: flex;
  flex-direction: column;
  background-color: black;
  border-radius: 5px;
  padding: 15px;
  position: relative;
  margin-bottom: 10px;
  flex: 3;
}

.bio-section-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

/* Character Art */
.character-art {
  flex: 0 0 auto;
  text-align: center;
  cursor: pointer;
}

.character-art-image {
  width: 170px;
  height: 170px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* Bio Info */
.bio-info {
  flex: 1;
  min-width: 200px;
}

.character-name-container {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  flex-wrap: wrap;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.character-name-container:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.character-name {
  margin: 0;
  font-size: 24px;
  color: white;
}

.pronouns-container {
  display: inline-block;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.pronouns-container:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.character-pronouns {
  margin-left: 5px;
  font-size: 14px;
  color: #aaa;
  font-style: italic;
}

.bio-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bio-detail {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.bio-detail:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.bio-detail.editing {
  background-color: rgba(255, 255, 255, 0.1);
}

.bio-label {
  color: #aaa;
  font-size: 12px;
}

.bio-value {
  color: white;
  flex-grow: 1;
  font-size: 14px;
}

.empty-field {
  color: #666;
  font-style: italic;
  font-size: 0.9rem;
}

/* XP Field */
.xp-field {
  flex-direction: row;
  justify-content: left;
  align-items: center;
  gap: 10px;
  cursor: default;
}

.xp-field:hover {
  background-color: transparent;
}

/* Inline Edit Styles */
.form-input.inline-edit {
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  padding: 5px 8px;
  font-size: 1rem;
  width: 100%;
  min-width: 200px;
  outline: none;
  box-shadow: none;
  box-sizing: border-box;
}

.form-input.inline-edit:focus {
  border-color: #666;
  box-shadow: 0 0 0 2px rgba(100, 100, 100, 0.5);
}

.pronouns-input {
  width: 80px;
}

.small-input {
  max-width: 80px;
}

/* Tag Selector */
.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 5px;
  min-height: 34px;
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  flex-grow: 1;
}

.selected-tag {
  display: flex;
  align-items: center;
  background-color: #444;
  border-radius: 15px;
  padding: 3px 8px;
  font-size: 0.9rem;
  color: white;
  font-size: 12px;
}

.remove-tag {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: 5px;
  padding: 0 2px;
  line-height: 1;
}

.remove-tag:hover {
  color: white;
}

.tag-dropdown {
  background-color: #333;
  border: 1px solid #555;
  color: white;
  padding: 5px;
  border-radius: 4px;
  cursor: pointer;
}

/* Personality & Background Section */
.personality-background-section {
  display: flex;
  flex-direction: column;
  flex: 3;
  position: relative;
  height: 165px;
}

.background-content.scrollable {
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  height: 100%;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  overflow-y: auto;
}

.background-content:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.background-scroll-content {
  line-height: 1.25;
}

/* Modal specific styles */
.background-modal {
  width: 90%;
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #444;
}

.modal-header h3 {
  margin: 0;
  color: white;
}

.edit-button {
  background-color: #444;
  border: none;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.edit-button:hover {
  background-color: #555;
}

.edit-actions {
  display: flex;
  gap: 10px;
}

.background-modal-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  text-align: left;
}

.background-full-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

.background-modal-editor {
  height: 400px;
  margin: 10px 0;
}

.empty-background {
  color: #888;
  font-style: italic;
}

.background-full-text :deep(p),
.background-scroll-content :deep(p) {
  margin: 0;
}

/* Responsive Styles */
@media (max-width: 1024px) {
  .bio-section-content {
    flex-direction: column;
  }

  .bio-info,
  .personality-background-section {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 767px) {
  .character-name-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .character-pronouns {
    margin-left: 0;
    margin-top: 5px;
  }
}
</style>
