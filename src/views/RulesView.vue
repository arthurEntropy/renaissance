<template>
  <div class="rules-view">
    <div class="rules-container">

      <!-- TABLE OF CONTENTS NAV BAR -->
      <div class="rules-navigation">
        <div class="rules-nav-header">
          <h3>Table of Contents</h3>
          <button class="structure-edit-toggle" @click="toggleStructureEditMode"
            :class="{ active: isStructureEditMode }" :disabled="isContentEditMode">
            {{ isStructureEditMode ? '✓' : '≡' }}
          </button>
        </div>

        <!-- Draggable rule sections when in structure edit mode -->
        <draggable v-if="isStructureEditMode" v-model="localSections" item-key="id" handle=".drag-handle"
          ghost-class="ghost-section" @end="updateSectionsOrder" class="rule-sections-list"
          :disabled="isContentEditMode">
          <template #item="{ element }">
            <div :class="[
              'rule-section-item',
              { active: currentSection?.id === element.id },
            ]" @click="selectSection(element.id)">
              <span class="section-name">{{ element.name }}</span>
              <!-- Edit controls -->
              <div class="section-controls">
                <span class="drag-handle" name="Drag to reorder">⋮⋮</span>
                <span class="delete-section" @click.stop="confirmDeleteSection(element)" name="Delete section">×</span>
              </div>
            </div>
          </template>
        </draggable>

        <!-- Non-draggable rule sections when not in structure edit mode -->
        <div v-else class="rule-sections-list">
          <div v-for="section in filteredSections" :key="section.id" :class="[
            'rule-section-item',
            { active: currentSection?.id === section.id },
          ]" @click="selectSection(section.id)">
            <span class="section-name">{{ section.name }}</span>
          </div>
        </div>

        <!-- Add new section button -->
        <div v-if="isStructureEditMode" class="bottom-actions">
          <button class="add-section-btn" @click="createNewSection" name="Add new section">
            + Add New Section
          </button>
        </div>
      </div>

      <!-- CONTENT AREA -->
      <div class="rules-content">
        <div v-if="currentSection" class="rules-content-body">
          <div class="section-layout">

            <!-- LEFT SIDE WITH SECTION TITLE & CONTENT -->
            <div class="content-side">

              <!-- Name with edit button and name edit field -->
              <div class="section-name-container">
                <div class="section-header">
                  <input v-if="isContentEditMode" type="text" v-model="currentSection.name" class="section-name-input"
                    @input="markAsChanged" />
                  <h2 v-else>{{ currentSection.name }}</h2>
                  <button class="content-edit-toggle" @click="toggleContentEditMode"
                    :class="{ active: isContentEditMode }" :disabled="isStructureEditMode"
                    :name="isContentEditMode ? 'Save Changes' : 'Edit Content'">
                    {{ isContentEditMode ? '✓' : '✎' }}
                  </button>
                </div>
              </div>


              <div class="section-content-container">
                <!-- Image URL input and text editor - visible when in content edit mode -->
                <div v-if="isContentEditMode" class="image-url-container">
                  <label for="section-image-url">Side Image URL:</label>
                  <input id="section-image-url" type="text" v-model="currentSection.imageUrl" class="image-url-input"
                    placeholder="Enter image URL (optional)" @input="markAsChanged" />
                </div>
                <TextEditor v-if="isContentEditMode" v-model="currentSection.content" height="calc(100vh - 200px)"
                  @update:modelValue="markAsChanged" />

                <!-- Section content when not in content edit mode -->
                <div v-else class="content-display" v-html="currentSection?.content ? currentSection.content : ''">
                </div>
              </div>
            </div>

            <!-- RIGHT SIDE WITH IMAGE -->
            <div class="image-side">
              <div class="side-image" :style="{
                backgroundImage: currentSection.imageUrl
                  ? `url(${currentSection.imageUrl})`
                  : 'url(/images/side-decoration.jpg)',
              }">
                <div v-if="isContentEditMode && !currentSection.imageUrl" class="add-image-placeholder">
                  <span>Add Side Image</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No section selected message -->
        <div v-else class="no-selection">
          <p>
            Select a section from the table of contents or create a new one.
          </p>
          <button v-if="filteredSections.length === 0" class="button button-primary" @click="createNewSection">
            Create First Section
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRulesStore } from '@/stores/rulesStore'
import RulesService from '@/services/RulesService'
import TextEditor from '@/components/TextEditor.vue'
import draggable from 'vuedraggable'

export default {
  components: {
    TextEditor,
    draggable,
  },

  data() {
    return {
      rulesStore: useRulesStore(),
      isContentEditMode: false,
      isStructureEditMode: false,
      currentSection: null,
      selectedSectionId: null,
      localSections: [],
      sectionToDelete: null,
      unsavedChanges: false,
    }
  },

  computed: {
    filteredSections() {
      // Filter out deleted and sort sections by index
      return this.rulesStore.sections
        ? [...this.rulesStore.sections]
          .filter(section => !section.isDeleted)
          .sort((a, b) => a.index - b.index)
        : []
    },
  },

  watch: {
    filteredSections: {
      immediate: true,
      handler(newValue) {
        this.localSections = JSON.parse(JSON.stringify(newValue))
      },
    },
  },

  async created() {
    try {
      await this.rulesStore.fetchRules()

      // Select the last selected section from localStorage if available.
      // We're assuming the user likely wants to continue where they left off.
      const lastSelectedSectionId = localStorage.getItem(
        'lastSelectedSectionId',
      )
      const sectionExists =
        lastSelectedSectionId &&
        this.filteredSections.some(
          (section) => section.id === lastSelectedSectionId,
        )
      if (sectionExists) {
        this.selectSection(lastSelectedSectionId)
      } else if (this.filteredSections && this.filteredSections.length > 0) {
        this.selectSection(this.filteredSections[0].id)
      }
    } catch (error) {
      console.error('Error in RulesView created:', error)
    }
  },

  methods: {
    async selectSection(sectionId) {
      // Skip if we're trying to select the already selected section
      if (this.currentSection?.id === sectionId) return
      // Handle unsaved changes if in content edit mode
      if (this.isContentEditMode && this.unsavedChanges) {
        if (
          confirm(
            'You have unsaved changes. Do you want to save before selecting another section?',
          )
        ) {
          await this.saveSection()
        } else {
          this.unsavedChanges = false
        }
      }
      // Exit content edit mode when switching sections
      if (this.isContentEditMode) {
        this.isContentEditMode = false
      }
      // Clear current section first to avoid visual issues with multiple sections appearing selected
      this.currentSection = null
      this.$nextTick(() => {
        // Filter the section from the filtered sections
        this.currentSection =
          this.filteredSections.find(
            (section) => section.id === sectionId,
          ) || null
        this.selectedSectionId = sectionId
        // Save the selected section ID to localStorage
        localStorage.setItem('lastSelectedSectionId', sectionId)
      })
    },

    async createNewSection() {
      // Don't allow creating sections in content edit mode
      if (this.isContentEditMode) return
      try {
        // Create the new section and refresh the sections list
        const newSection = await RulesService.createSection()
        await this.rulesStore.fetchRules()

        // Confirm the section was created and select it
        const sectionToSelect = this.filteredSections.find(
          (s) =>
            (s.id && s.id === newSection.id) ||
            (!s.id && s.name === newSection.name),
        )
        if (sectionToSelect) {
          this.isStructureEditMode = false
          await this.selectSection(sectionToSelect.id)
          setTimeout(() => {
            this.isContentEditMode = true // Default to editing new section
            this.unsavedChanges = true // Mark as changed
          }, 100)
        } else {
          console.error("Couldn't find the newly created section")
        }
      } catch (error) {
        console.error('Error creating new section:', error)
      }
    },

    async saveSection() {
      if (this.currentSection) {
        await RulesService.updateSection(this.currentSection)
        await this.rulesStore.fetchRules()
        this.unsavedChanges = false
      }
    },

    markAsChanged() {
      this.unsavedChanges = true
    },

    toggleContentEditMode() {
      // Don't allow entering content edit mode if structure edit mode is active
      if (this.isStructureEditMode) return

      if (this.isContentEditMode) {
        this.saveSection()
      }
      this.isContentEditMode = !this.isContentEditMode
    },

    toggleStructureEditMode() {
      // Don't allow entering structure edit mode if content edit mode is active
      if (this.isContentEditMode) return

      this.isStructureEditMode = !this.isStructureEditMode
    },

    confirmDeleteSection(section) {
      // Don't allow deletion in content edit mode
      if (this.isContentEditMode) return

      this.sectionToDelete = section
      if (
        window.confirm(`Are you sure you want to delete "${section.name}"?`)
      ) {
        this.deleteSection()
      } else {
        this.sectionToDelete = null
      }
    },

    async deleteSection() {
      // Store the section ID before it gets set to null
      const deletedSectionId = this.sectionToDelete.id

      // Create a new object to ensure we're not modifying a potentially frozen object
      const sectionToUpdate = { ...this.sectionToDelete, isDeleted: true }

      try {
        this.sectionToDelete = null
        await RulesService.updateSection(sectionToUpdate)
        await this.rulesStore.fetchRules()
        // If the deleted section was the current section, select another one
        if (this.currentSection && this.currentSection.id === deletedSectionId) {
          this.currentSection = null
          if (this.filteredSections.length > 0) {
            this.selectSection(this.filteredSections[0].id)
          }
        }
      } catch (error) {
        console.error('Error deleting section:', error)
      }
    },

    async updateSectionsOrder() {
      // Don't allow reordering in content edit mode
      if (this.isContentEditMode) return

      try {
        await RulesService.reorderSections(this.localSections)
        await this.rulesStore.fetchRules()
      } catch (error) {
        console.error('Error updating section order:', error)
      }
    },
  },
}
</script>

<style scoped>
.rules-view {
  /* Adjusted to fit space below top nav */
  margin-top: -20px;
  height: 93.5vh;
  display: flex;
  flex-direction: column;
  width: 80%;
}

.rules-container {
  display: flex;
  flex: 1;
  background: rgb(17, 17, 17);
  overflow: hidden;
}

/* Navigation sidebar styles */
.rules-navigation {
  width: 250px;
  background: rgb(28, 28, 28);
  padding: 15px 0;
  display: flex;
  flex-direction: column;
}

.rules-nav-header {
  padding: 0 15px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rules-nav-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.bottom-actions {
  padding: 10px 15px;
}

.add-section-btn {
  width: 100%;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}

.structure-edit-toggle,
.content-edit-toggle {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}

.structure-edit-toggle.active,
.content-edit-toggle.active {
  background: #4caf50;
  border-color: #4caf50;
}

.content-edit-toggle:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.rule-sections-list {
  flex: 1;
  overflow-y: auto;
}

.rule-section-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.rule-section-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.rule-section-item:hover .section-name {
  color: white;
}

.rule-section-item.active {
  background-color: rgba(255, 255, 255, 0.1);
  border-left: 3px solid white;
}

.rule-section-item.active .section-name {
  color: white;
}

.section-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: goldenrod;
  transition: color 0.2s;
}

.section-controls {
  display: flex;
  gap: 5px;
  opacity: 0.5;
}

.rule-section-item:hover .section-controls {
  opacity: 1;
}

.drag-handle {
  cursor: move;
  user-select: none;
}

.delete-section {
  cursor: pointer;
  padding: 0 5px;
}

.delete-section:hover {
  color: #f44336;
}

.ghost-section {
  opacity: 0.5;
  background: #333;
}

/* Content area styles */
.rules-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 1.1rem;
  line-height: 1.5;
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
}

.content-side {
  width: 65%;
  height: 100%;
  padding: 20px;
  position: relative;
  z-index: 2;
  overflow-y: auto;
}

.image-side {
  width: 45%;
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  z-index: 1;
}

/* Section header and name styles */
.section-name-container {
  margin-bottom: 20px;
  position: relative;
  z-index: 3;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.section-name-container h2 {
  margin: 0;
  text-transform: uppercase;
  font-style: italic;
  font-weight: normal;
}

.section-name-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #444;
  padding: 10px;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 10px;
  flex: 1;
}

/* Content container */
.section-content-container {
  position: relative;
}

/* Image styles */
.side-image {
  position: sticky;
  top: 0;
  height: 100%;
  background-size: cover;
  background-position: right;
  box-shadow: inset 200px 0 100px -50px rgb(17, 17, 17);
}

.side-image::before {
  display: none;
}

/* Image URL input styles */
.image-url-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.image-url-container label {
  font-size: 14px;
  color: #aaa;
}

.image-url-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #444;
  padding: 8px;
  color: white;
  border-radius: 4px;
}

/* Placeholder for when no image is set */
.add-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  color: #aaa;
  font-style: italic;
  border: 2px dashed #555;
  border-radius: 8px;
}

.no-selection {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
  text-align: center;
  padding: 20px;
}

/* Section content styles */
.content-display {
  text-align: left;
  line-height: 1.6;
}

.content-display :deep(h2) {
  font-size: 36px;
  margin: 1.5em 0 0 0;
  color: goldenrod;
  font-weight: normal;
}

.content-display :deep(h3) {
  margin: 1.5em 0 0 0;
  font-size: 24px;
  color: lightseagreen;
}

.content-display img {
  width: 100%;
  height: auto;
  display: block;
  margin: 0.5em 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .rules-container {
    flex-direction: column;
  }

  .rules-navigation {
    width: 100%;
    height: auto;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .section-layout {
    flex-direction: column;
  }

  .content-side {
    width: 100%;
    padding: 15px;
    overflow-y: visible;
    height: auto;
  }

  .image-side {
    position: relative;
    width: 100%;
    height: 200px;
    margin-top: 20px;
  }

  .section-content-container {
    padding-right: 0;
  }

  .side-image {
    position: relative;
    height: 200px;
  }

  .side-image::before {
    width: 30%;
  }
}
</style>
