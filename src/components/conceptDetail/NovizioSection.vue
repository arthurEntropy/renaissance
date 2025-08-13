<template>
  <div v-if="novizio || editable" class="concept-section novizio-section">
    <h2 class="section-header edit-hover-area">
      Novizio
      <EditButton v-if="editable" @click="toggleEdit" :is-editing="isSectionEditing" title="Edit Novizio" size="small"
        visibility="on-hover" />
    </h2>
    <div v-if="isSectionEditing && editable">
      <div class="novizio-intro-text">
        <text-editor v-model="localNovizio.flavorText" placeholder="Flavor text..." height="80px" :auto-height="true"
          class="novizio-text-editor" />
      </div>
      <div class="novizio-subsection">
        <strong>Martial Training</strong>
        <div class="martial-training-list">
          <div class="martial-training-item">
            <img src="@/assets/icons/melee.png" alt="Melee" class="martial-icon" />
            <span class="martial-label">Melee</span>
            <input type="text" v-model="localNovizio.melee" placeholder="Melee..."
              class="novizio-input full-width-input" />
          </div>
          <div class="martial-training-item">
            <img src="@/assets/icons/polearms.png" alt="Polearms" class="martial-icon" />
            <span class="martial-label">Polearms</span>
            <input type="text" v-model="localNovizio.polearms" placeholder="Polearms..."
              class="novizio-input full-width-input" />
          </div>
          <div class="martial-training-item">
            <img src="@/assets/icons/ranged.png" alt="Ranged" class="martial-icon" />
            <span class="martial-label">Ranged</span>
            <input type="text" v-model="localNovizio.ranged" placeholder="Ranged..."
              class="novizio-input full-width-input" />
          </div>
          <div class="martial-training-item">
            <img src="@/assets/icons/firearms.png" alt="Firearms" class="martial-icon" />
            <span class="martial-label">Firearms</span>
            <input type="text" v-model="localNovizio.firearms" placeholder="Firearms..."
              class="novizio-input full-width-input" />
          </div>
          <div class="martial-training-item">
            <img src="@/assets/icons/armor.png" alt="Armor" class="martial-icon" />
            <span class="martial-label">Armor</span>
            <input type="text" v-model="localNovizio.armor" placeholder="Armor..."
              class="novizio-input full-width-input" />
          </div>
        </div>
      </div>
      <div class="novizio-subsection">
        <strong>Engagement</strong>
        <text-editor v-model="localNovizio.engagement" placeholder="Engagement..." height="80px"
          class="novizio-text-editor" />
      </div>
      <div class="novizio-subsection">
        <strong>Mestieri Points (MP)</strong>
        <input type="number" min="1" v-model.number="localNovizio.initialMaxMP" placeholder="Initial Max MP..."
          class="novizio-input" />
      </div>
      <div class="novizio-subsection">
        <strong>Abilities</strong>
        <text-editor v-model="localNovizio.abilities" placeholder="Abilities..." height="80px"
          class="novizio-text-editor" />
      </div>
      <div class="edit-field-buttons">
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelEdit" />
      </div>
    </div>
    <div v-else>
      <div class="novizio-intro-text" v-if="novizio && novizio.flavorText">
        <i v-html="safeFlavorText"></i>
      </div>
      <div class="novizio-subsection" v-if="hasAnyNovizioData">
        <strong>Martial Training</strong>
        <div class="martial-training-list">
          <template v-if="hasAnyMartialTraining">
            <div class="martial-training-item" v-if="novizio && novizio.melee">
              <img src="@/assets/icons/melee.png" alt="Melee" class="martial-icon" />
              <span class="martial-label">Melee</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.melee.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'melee-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
            <div class="martial-training-item" v-if="novizio && novizio.polearms">
              <img src="@/assets/icons/polearms.png" alt="Polearms" class="martial-icon" />
              <span class="martial-label">Polearms</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.polearms.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'polearms-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
            <div class="martial-training-item" v-if="novizio && novizio.ranged">
              <img src="@/assets/icons/ranged.png" alt="Ranged" class="martial-icon" />
              <span class="martial-label">Ranged</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.ranged.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'ranged-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
            <div class="martial-training-item" v-if="novizio && novizio.firearms">
              <img src="@/assets/icons/firearms.png" alt="Firearms" class="martial-icon" />
              <span class="martial-label">Firearms</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.firearms.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'firearms-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
            <div class="martial-training-item" v-if="novizio && novizio.armor">
              <img src="@/assets/icons/armor.png" alt="Armor" class="martial-icon" />
              <span class="martial-label">Armor</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.armor.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'armor-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
          </template>
          <template v-else>
            <div class="martial-training-none">none</div>
          </template>
        </div>
      </div>
      <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.engagement">
        <strong>Engagement</strong>
        <div class="novizio-placeholder" v-html="safeEngagement"></div>
      </div>
      <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.initialMaxMP">
        <strong>Mestieri Points (MP)</strong>
        <div class="novizio-placeholder">Your maximum MP for this mestiere is {{ novizio.initialMaxMP }}.</div>
      </div>
      <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.abilities">
        <strong>Abilities</strong>
        <div class="novizio-placeholder" v-html="safeAbilities"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import TextEditor from '@/components/TextEditor.vue'
import ActionButton from '@/components/ActionButton.vue'
import EditButton from '@/components/EditButton.vue'
import { useEditMode } from '@/composables/useEditMode'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

// Props
const props = defineProps({
  novizio: {
    type: Object,
    default: null,
  },
  editable: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update', 'unsaved-changes', 'reset-unsaved-changes'])

// Helper function to get default novizio structure
const getDefaultNovizio = () => ({
  flavorText: '',
  melee: '',
  polearms: '',
  ranged: '',
  firearms: '',
  armor: '',
  engagement: '',
  initialMaxMP: 1,
  abilities: ''
})

// Reactive state
const localNovizio = ref(props.novizio ? { ...props.novizio } : getDefaultNovizio())
const isSectionEditing = ref(false)

// Edit mode composable
const editMode = useEditMode({
  onSave: () => {
    emit('update', { ...localNovizio.value })
    unsavedChanges.markAsSaved()
  },
  onCancel: (restoredData) => {
    if (restoredData) {
      localNovizio.value = { ...restoredData }
    }
    unsavedChanges.markAsSaved()
  }
})

// Unsaved changes composable
const unsavedChanges = useUnsavedChanges(emit, () => {
  return editMode.isEditing.value && editMode.hasUnsavedChanges(localNovizio.value)
})

// Computed properties
const hasAnyMartialTraining = computed(() => {
  const n = props.novizio || {}
  return [n.melee, n.polearms, n.ranged, n.firearms, n.armor].some(val => val && val.trim() !== '')
})

const hasAnyNovizioData = computed(() => {
  const n = props.novizio || {}
  return [n.flavorText, n.melee, n.polearms, n.ranged, n.firearms, n.armor, n.engagement, n.initialMaxMP, n.abilities].some(val => {
    if (typeof val === 'number') return val > 1
    return val && val.toString().trim() !== ''
  })
})

const safeFlavorText = computed(() => sanitizeHtml(props.novizio?.flavorText))
const safeEngagement = computed(() => sanitizeHtml(props.novizio?.engagement))
const safeAbilities = computed(() => sanitizeHtml(props.novizio?.abilities))

// Methods
const startEdit = () => {
  editMode.startEdit(localNovizio.value)
  isSectionEditing.value = true
}

const toggleEdit = () => {
  if (isSectionEditing.value) {
    // Save changes
    editMode.saveEdit(localNovizio.value)
    isSectionEditing.value = false
  } else {
    // Start editing
    editMode.startEdit(localNovizio.value)
    isSectionEditing.value = true
  }
}

const saveEdit = () => {
  editMode.saveEdit(localNovizio.value)
  isSectionEditing.value = false
}

const cancelEdit = () => {
  const restored = editMode.cancelEdit()
  if (restored) {
    localNovizio.value = { ...restored }
  }
  isSectionEditing.value = false
}

// Called by parent when master Save is clicked
const saveFromParent = () => {
  if (isSectionEditing.value && editMode.hasUnsavedChanges(localNovizio.value)) {
    saveEdit()
  }
}

// Optionally, called by parent to cancel edits (e.g., on modal close)
const cancelFromParent = () => {
  if (isSectionEditing.value && editMode.hasUnsavedChanges(localNovizio.value)) {
    cancelEdit()
  }
}

// Expose methods for parent component
defineExpose({
  saveFromParent,
  cancelFromParent
})

// Watchers
watch(() => props.novizio, (newVal) => {
  if (!isSectionEditing.value) {
    localNovizio.value = newVal ? { ...newVal } : getDefaultNovizio()
  }
}, { deep: true })

watch(localNovizio, () => {
  if (isSectionEditing.value) {
    unsavedChanges.checkForChanges()
  }
}, { deep: true })

watch(() => props.editable, (val) => {
  if (val) {
    isSectionEditing.value = false
  } else if (isSectionEditing.value) {
    if (editMode.hasUnsavedChanges(localNovizio.value)) {
      cancelEdit()
    } else {
      cancelEdit()
    }
    isSectionEditing.value = false
  }
})
</script>

<style scoped>
.edit-field-indicator {
  font-size: 1.2em;
  color: var(--color-gray-light);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  margin-left: 10px;
}

.edit-field-indicator:hover {
  opacity: 1;
}

.novizio-input {
  width: auto;
  min-width: 120px;
  max-width: 220px;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-gray-medium);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 1rem;
  display: inline-block;
  vertical-align: middle;
}

.novizio-input.full-width-input {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  max-width: none;
  margin-left: 0.5rem;
  margin-right: 0;
}

.novizio-section {
  background: var(--overlay-black-heavy) !important;
  border-radius: 8px;
  padding: 18px 18px 10px 18px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.novizio-section .section-header {
  margin-top: 0;
  margin-bottom: 1.2rem;
  color: var(--color-text-primary);
}

.novizio-intro-text {
  color: var(--color-text-secondary);
  font-size: 1.08rem;
  margin-bottom: 1.1rem;
  margin-top: -0.3rem;
  padding-left: 2px;
  padding-right: 2px;
}

.novizio-subsection {
  margin-bottom: 1.1rem;
}

.novizio-placeholder {
  color: var(--text-tertiary);
  font-size: 0.98rem;
  margin-top: 0.2rem;
  margin-left: 0.5rem;
}

.edit-field-buttons {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.martial-training-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.martial-training-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1.08rem;
}

.martial-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  background: var(--color-gray-light);
  border-radius: 4px;
  border: 1px solid var(--color-bg-secondary);
  padding: 2px;
}

.martial-label {
  min-width: 80px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.martial-placeholder {
  color: var(--text-tertiary);
  font-size: 0.98rem;
  margin-left: 0.5rem;
}

.martial-chip {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-gray-medium);
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.98rem;
  line-height: 1.5;
  display: inline-block;
}

.martial-training-none {
  color: var(--text-tertiary);
  font-size: 1rem;
  margin-left: 0.5rem;
  margin-top: 0.2rem;
}
</style>
