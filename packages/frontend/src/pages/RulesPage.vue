<template>
  <div class="rules-view">
    <div class="rules-container">

      <!-- NAVIGATION -->
      <!-- TABLE OF CONTENTS NAV BAR -->
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
import { onMounted } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import RulesNavigation from '@/components/features/rules/RulesNavigation.vue'
import RulesContentEditor from '@/components/features/rules/RulesContentEditor.vue'
import RulesImagePanel from '@/components/features/rules/RulesImagePanel.vue'
import { useRulesSectionManager } from '@/composables/useRulesSectionManager'
import { useRulesEditMode } from '@/composables/useRulesEditMode'
import { useRulesContentUpdates } from '@/composables/useRulesContentUpdates'

// Composables
const {
  currentSection,
  localSections,
  filteredSections,
  selectSection,
  createNewSection,
  confirmDeleteSection,
  updateSectionsOrder,
  updateLocalSections,
  initializeSections,
} = useRulesSectionManager()

const {
  isContentEditMode,
  isStructureEditMode,
  markAsChanged,
  toggleContentEditMode,
  toggleStructureEditMode,
  exitContentEditMode,
  handleUnsavedChanges,
  canPerformAction,
} = useRulesEditMode()

const {
  updateSectionName,
  updateImageUrl,
  updateContent,
} = useRulesContentUpdates(currentSection, markAsChanged)

// Enhanced methods that integrate composables
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
      toggleStructureEditMode() // Exit structure edit mode
      setTimeout(() => {
        toggleContentEditMode(currentSection.value) // Enter content edit mode for new section
        markAsChanged() // Mark as changed
      }, 100)
    }
  })
}

const handleToggleContentEditMode = () => {
  toggleContentEditMode(currentSection.value)
}

const handleToggleStructureEditMode = () => {
  toggleStructureEditMode()
}

const handleConfirmDeleteSection = (section) => {
  if (!canPerformAction('delete-section')) return
  confirmDeleteSection(section)
}

const handleUpdateSectionsOrder = () => {
  if (!canPerformAction('reorder-sections')) return
  updateSectionsOrder()
}

// Lifecycle
onMounted(async () => {
  try {
    await initializeSections()
  } catch (error) {
    console.error('Error in RulesPage mounted:', error)
  }
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
  background: var(--color-bg-primary);
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
