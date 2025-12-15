<template>
  <div class="rules-view">
    <div class="rules-container">

      <!-- NAVIGATION -->
      <RulesNavigation :filteredSections="filteredSections" :currentSection="currentSection"
        :localSections="localSections" :isStructureEditMode="isStructureEditMode" :isContentEditMode="isContentEditMode"
        @selectSection="handleSelectSection" @toggleStructureEditMode="handleToggleStructureEditMode"
        @createNewSection="handleCreateNewSection" @confirmDeleteSection="handleConfirmDeleteSection"
        @updateSectionsOrder="handleUpdateSectionsOrder" @updateLocalSections="updateLocalSections" />

      <!-- CONTENT AREA -->
      <div class="rules-content">
        <div v-if="currentSection" class="rules-content-body">
          <div class="section-layout">

            <!-- CONTENT EDITOR -->
            <RulesContentEditor :currentSection="currentSection" :isContentEditMode="isContentEditMode"
              :isStructureEditMode="isStructureEditMode" @toggleContentEditMode="handleToggleContentEditMode"
              @updateSectionName="updateSectionName" @updateImageUrl="updateImageUrl" @updateContent="updateContent" />

            <!-- IMAGE PANEL -->
            <RulesImagePanel :currentSection="currentSection" :isContentEditMode="isContentEditMode" />
          </div>
        </div>

        <!-- No section selected message -->
        <div v-else class="no-selection">
          <p>
            Select a section from the table of contents or create a new one.
          </p>
          <ActionButton v-if="filteredSections.length === 0" variant="primary" size="small" text="Create First Section"
            @click="handleCreateNewSection" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import RulesNavigation from '@/components/features/rules/RulesNavigation.vue'
import RulesContentEditor from '@/components/features/rules/RulesContentEditor.vue'
import RulesImagePanel from '@/components/features/rules/RulesImagePanel.vue'
import { useRulesStore } from '@/stores/rulesStore'
import { createSlug, findConceptBySlug } from '@/utils/urlHelpers'
import RulesService from '@/services/entities/rulesService'

// Router
const route = useRoute()
const router = useRouter()
const rulesStore = useRulesStore()

// Section management state
const currentSection = ref(null)
const selectedSectionId = ref(null)
const localSections = ref([])
const sectionToDelete = ref(null)

// Computed
const filteredSections = computed(() => {
  return rulesStore.sections
    ? [...rulesStore.sections]
      .filter(section => !section.isDeleted)
      .sort((a, b) => a.index - b.index)
    : []
})

// Watch for changes to filtered sections and update local copy
watch(filteredSections, (newValue) => {
  localSections.value = JSON.parse(JSON.stringify(newValue))
}, { immediate: true })

// Watch for route changes (browser back/forward)
watch(() => route.params.id, (newId) => {
  if (newId) {
    const sectionFromUrl = findConceptBySlug(filteredSections.value || [], newId)
    if (sectionFromUrl && currentSection.value?.id !== sectionFromUrl.id) {
      selectSection(sectionFromUrl.id, { skipUrlUpdate: true })
    }
  }
})

// Section management methods
const selectSection = async (sectionId, { onUnsavedChanges, skipUrlUpdate = false } = {}) => {
  if (currentSection.value?.id === sectionId) return

  if (onUnsavedChanges) {
    const shouldSave = await onUnsavedChanges()
    if (shouldSave === false) return
  }

  const section = filteredSections.value?.find(s => s.id === sectionId)
  if (section) {
    currentSection.value = { ...section }
    selectedSectionId.value = sectionId
    localStorage.setItem('lastSelectedSectionId', sectionId)

    if (!skipUrlUpdate) {
      const slug = createSlug(section.name)
      if (route.params.id !== slug) {
        router.push(`/rules/${slug}`)
      }
    }
  }
}

const createNewSection = async ({ onSuccess } = {}) => {
  try {
    const newSection = await RulesService.create()
    await rulesStore.fetch()

    const sectionToSelect = filteredSections.value?.find(
      s => (s.id && s.id === newSection.id) || (!s.id && s.name === newSection.name)
    )

    if (sectionToSelect) {
      await selectSection(sectionToSelect.id)
      if (onSuccess) {
        onSuccess(sectionToSelect)
      }
    } else {
      console.error("Couldn't find the newly created section")
    }

    return newSection
  } catch (error) {
    console.error('Error creating new section:', error)
    throw error
  }
}

const confirmDeleteSection = (section) => {
  sectionToDelete.value = section
  if (window.confirm(`Are you sure you want to delete "${section.name}"?`)) {
    return deleteSection()
  } else {
    sectionToDelete.value = null
    return Promise.resolve(false)
  }
}

const deleteSection = async () => {
  if (!sectionToDelete.value) return

  const deletedSectionId = sectionToDelete.value.id
  const sectionToUpdate = { ...sectionToDelete.value, isDeleted: true }

  try {
    sectionToDelete.value = null
    await RulesService.update(sectionToUpdate)
    await rulesStore.fetch()

    if (currentSection.value && currentSection.value.id === deletedSectionId) {
      currentSection.value = null
      if (filteredSections.value?.length > 0) {
        selectSection(filteredSections.value[0].id)
      }
    }

    return true
  } catch (error) {
    console.error('Error deleting section:', error)
    throw error
  }
}

const updateSectionsOrder = async () => {
  try {
    await RulesService.reorderSections(localSections.value)
    await rulesStore.fetch()
  } catch (error) {
    console.error('Error updating section order:', error)
    throw error
  }
}

const updateLocalSections = (newSections) => {
  localSections.value = newSections
}

const initializeSections = async () => {
  try {
    await rulesStore.fetch()

    const sections = rulesStore.sections || []
    const availableSections = sections
      .filter(section => !section.isDeleted)
      .sort((a, b) => a.index - b.index)

    if (route.params.id) {
      const sectionFromUrl = findConceptBySlug(availableSections, route.params.id)
      if (sectionFromUrl) {
        await selectSection(sectionFromUrl.id, { skipUrlUpdate: true })
        return
      }
    }

    const lastSelectedSectionId = localStorage.getItem('lastSelectedSectionId')
    const sectionExists = lastSelectedSectionId &&
      availableSections.some(section => section.id === lastSelectedSectionId)

    if (sectionExists) {
      selectSection(lastSelectedSectionId)
    } else if (availableSections.length > 0) {
      selectSection(availableSections[0].id)
    }
  } catch (error) {
    console.error('Error initializing sections:', error)
    throw error
  }
}

// Edit mode state
const isContentEditMode = ref(false)
const isStructureEditMode = ref(false)
const unsavedChanges = ref(false)

const markAsChanged = () => {
  unsavedChanges.value = true
}

const saveSection = async (section) => {
  if (section) {
    await RulesService.update(section)
    await rulesStore.fetch()
    unsavedChanges.value = false
  }
}

const toggleContentEditMode = async (currentSection) => {
  // Don't allow entering content edit mode if structure edit mode is active
  if (isStructureEditMode.value) return false

  if (isContentEditMode.value) {
    await saveSection(currentSection)
  }
  isContentEditMode.value = !isContentEditMode.value
  return true
}

const toggleStructureEditMode = () => {
  // Don't allow entering structure edit mode if content edit mode is active
  if (isContentEditMode.value) return false

  isStructureEditMode.value = !isStructureEditMode.value
  return true
}

const exitContentEditMode = () => {
  isContentEditMode.value = false
}

const handleUnsavedChanges = async (currentSection) => {
  if (isContentEditMode.value && unsavedChanges.value) {
    if (confirm('You have unsaved changes. Do you want to save before continuing?')) {
      await saveSection(currentSection)
      return true
    } else {
      unsavedChanges.value = false
      return true
    }
  }
  return true
}

const canPerformAction = (action) => {
  switch (action) {
    case 'content-edit':
      return !isStructureEditMode.value
    case 'structure-edit':
      return !isContentEditMode.value
    case 'create-section':
      return !isContentEditMode.value
    case 'delete-section':
      return !isContentEditMode.value
    case 'reorder-sections':
      return !isContentEditMode.value
    default:
      return true
  }
}

// Content update helpers
const updateSectionName = (newName) => {
  if (currentSection.value) {
    currentSection.value.name = newName
    markAsChanged()
  }
}

const updateImageUrl = (newUrl) => {
  if (currentSection.value) {
    currentSection.value.imageUrl = newUrl
    markAsChanged()
  }
}

const updateContent = (newContent) => {
  if (currentSection.value) {
    currentSection.value.content = newContent
    markAsChanged()
  }
}

// Event Handlers
const handleSelectSection = async (sectionId) => {
  await selectSection(sectionId, {
    onUnsavedChanges: async () => {
      const shouldContinue = await handleUnsavedChanges(currentSection.value)
      if (shouldContinue) {
        exitContentEditMode()
      }
      return shouldContinue
    }
  })
}

const handleCreateNewSection = async () => {
  if (!canPerformAction('create-section')) return

  await createNewSection({
    onSuccess: () => {
      toggleStructureEditMode()
      setTimeout(() => {
        toggleContentEditMode(currentSection.value)
        markAsChanged()
      }, 100) // Slight delay to ensure UI updates
    }
  })
}

const handleToggleContentEditMode = () => toggleContentEditMode(currentSection.value)

const handleToggleStructureEditMode = () => toggleStructureEditMode()

const handleConfirmDeleteSection = (section) => {
  if (!canPerformAction('delete-section')) return
  confirmDeleteSection(section)
}

const handleUpdateSectionsOrder = () => {
  if (!canPerformAction('reorder-sections')) return
  updateSectionsOrder()
}

onMounted(async () => {
  await initializeSections()
})
</script>

<style scoped>
.rules-view {
  margin-top: -18px;
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
  width: 80%;
  overflow: hidden;
}

.rules-container {
  display: flex;
  flex: 1;
  background: var(--overlay-black-heavy);
  overflow: hidden;
}

/* Content area styles */
.rules-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: var(--font-size-18);
  line-height: var(--line-height-normal);
}

.rules-content-body {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.section-layout {
  display: flex;
  height: 100%;
  position: relative;
  overflow-y: auto;
}

/* Section content styles */
.content-display {
  text-align: left;
  line-height: var(--line-height-loose);
}

.content-display :deep(h2) {
  font-size: var(--font-size-36);
  margin: 1.5em 0 0 0;
  color: var(--color-primary);
  font-weight: var(--font-weight-normal);
}

.content-display :deep(h3) {
  margin: 1.5em 0 0 0;
  font-size: var(--font-size-24);
  color: var(--color-accent-cyan);
}

.content-display img {
  width: 100%;
  height: auto;
  display: block;
  margin: 0.5em 0;
}

.no-selection {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--color-gray-medium);
  text-align: center;
  padding: var(--space-xl);
}

/* Responsive adjustments */
@media (max-width: var(--breakpoint-md)) {
  .rules-container {
    flex-direction: column;
  }

  .section-layout {
    flex-direction: column;
  }
}
</style>
