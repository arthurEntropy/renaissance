<template>
  <div class="concept-section" v-if="hasContent || editable">
    <h2 class="section-header">
      Local Flavor
      <button v-if="editable" class="edit-section-button" @click="toggleEditing" title="Edit local flavor">
        ✎
      </button>
    </h2>

    <!-- Edit mode for local flavor data -->
    <div v-if="isSectionEditing && editable" class="section-editor">
      <!-- existing edit form content -->
      <div class="flavor-edit-grid">
        <!-- Names -->
        <div class="flavor-edit-item">
          <label for="names">Names</label>
          <textarea id="names" v-model="localData.names" class="modal-input flavor-textarea"
            placeholder="Who might you meet?"></textarea>
        </div>

        <!-- Occupations -->
        <div class="flavor-edit-item">
          <label for="occupations">Occupations</label>
          <textarea id="occupations" v-model="localData.occupations" class="modal-input flavor-textarea"
            placeholder="What do people do around here?"></textarea>
        </div>

        <!-- Public Houses -->
        <div class="flavor-edit-item">
          <label for="publicHouses">Public Houses</label>
          <textarea id="publicHouses" v-model="localData.publicHouses" class="modal-input flavor-textarea"
            placeholder="Where can a traveler find hospitality?"></textarea>
        </div>

        <!-- Points of Interest -->
        <div class="flavor-edit-item">
          <label for="pointsOfInterest">Points of Interest</label>
          <textarea id="pointsOfInterest" v-model="localData.pointsOfInterest" class="modal-input flavor-textarea"
            placeholder="What are the must-see spots?"></textarea>
        </div>

        <!-- Vittles -->
        <div class="flavor-edit-item">
          <label for="vittles">Vittles</label>
          <textarea id="vittles" v-model="localData.vittles" class="modal-input flavor-textarea"
            placeholder="What's on the menu?"></textarea>
        </div>

        <!-- Flora & Fauna -->
        <div class="flavor-edit-item">
          <label for="floraFauna">Flora & Fauna</label>
          <textarea id="floraFauna" v-model="localData.floraFauna" class="modal-input flavor-textarea"
            placeholder="What can be found in the wild?"></textarea>
        </div>
      </div>

      <div class="editor-buttons">
        <button class="button small" @click="saveChanges">Save</button>
        <button class="button small" @click="cancelEdit">Cancel</button>
      </div>
    </div>

    <!-- Display mode for local flavor data -->
    <div v-else class="two-column-grid">
      <InfoCard v-if="localData.names" title="Names" :content="localData.names" />

      <InfoCard v-if="localData.occupations" title="Occupations" :content="localData.occupations" />

      <InfoCard v-if="localData.publicHouses" title="Public Houses" :content="localData.publicHouses" />

      <InfoCard v-if="localData.pointsOfInterest" title="Points of Interest" :content="localData.pointsOfInterest" />

      <InfoCard v-if="localData.vittles" title="Vittles" :content="localData.vittles" />

      <InfoCard v-if="localData.floraFauna" title="Flora & Fauna" :content="localData.floraFauna" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import InfoCard from '@/components/conceptDetail/InfoCard.vue'
import { useEditMode } from '@/composables/useEditMode'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

// Props
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update', 'unsaved-changes', 'reset-unsaved-changes'])

// Reactive state
const localData = ref({
  names: '',
  occupations: '',
  publicHouses: '',
  vittles: '',
  pointsOfInterest: '',
  floraFauna: '',
})

// Edit mode composable
const editMode = useEditMode({
  onSave: (data) => {
    emit('update', { ...data })
    unsavedChanges.markAsSaved()
  },
  onCancel: (restoredData) => {
    if (restoredData) {
      localData.value = { ...restoredData }
    }
    unsavedChanges.markAsSaved()
  },
  onStartEdit: () => {
    unsavedChanges.markAsChanged()
  }
})

const isSectionEditing = ref(false)

// Unsaved changes composable
const unsavedChanges = useUnsavedChanges(emit, () => {
  return editMode.isEditing.value && editMode.hasUnsavedChanges(localData.value)
})

// Computed properties
const hasContent = computed(() => {
  return Boolean(
    localData.value.names ||
    localData.value.occupations ||
    localData.value.publicHouses ||
    localData.value.vittles ||
    localData.value.pointsOfInterest ||
    localData.value.floraFauna,
  )
})

// Methods
const toggleEditing = () => {
  if (!props.editable) return

  if (!editMode.isEditing.value) {
    editMode.startEdit(localData.value)
    isSectionEditing.value = true
  } else {
    editMode.saveEdit(localData.value)
    isSectionEditing.value = false
  }
}

const saveChanges = () => {
  editMode.saveEdit(localData.value)
  isSectionEditing.value = false
}

const cancelEdit = () => {
  const restored = editMode.cancelEdit()
  if (restored) {
    localData.value = { ...restored }
  }
  isSectionEditing.value = false
}

// Watchers
watch(() => props.data, (newValue) => {
  localData.value = { ...newValue }
}, { immediate: true })

watch(localData, () => {
  if (isSectionEditing.value) {
    unsavedChanges.checkForChanges()
  }
}, { deep: true })

watch(() => props.editable, (val) => {
  if (val) {
    isSectionEditing.value = false
  } else if (isSectionEditing.value) {
    if (editMode.hasUnsavedChanges(localData.value)) {
      cancelEdit()
    } else {
      cancelEdit()
    }
    isSectionEditing.value = false
  }
})
</script>

<style scoped>
.flavor-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

.flavor-edit-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.flavor-textarea {
  min-height: 80px;
  resize: vertical;
}

/* Responsive design */
@media (max-width: 600px) {
  .flavor-edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
