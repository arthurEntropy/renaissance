<template>
  <div class="modal-overlay" @click.self="confirmClose">
    <div class="rules-modal-container">
      <!-- Left sidebar with navigation -->
      <div class="rules-navigation">
        <div class="rules-nav-header">
          <h3>Table of Contents</h3>
          <button 
            class="structure-edit-toggle"
            @click="toggleStructureEditMode"
            :class="{ 'active': isStructureEditMode }"
            :disabled="isContentEditMode"
            :name="isStructureEditMode ? 'Exit Structure Edit Mode' : 'Edit Structure'"
          >
            {{ isStructureEditMode ? '✓' : '≡' }}
          </button>
        </div>
        
        <!-- Structure edit mode actions -->
        <div v-if="isStructureEditMode" class="structure-actions">
          <button 
            class="add-section-btn"
            @click="createNewSection"
            name="Add new section"
          >+ Add New Section</button>
        </div>
        
        <!-- Rule sections list - draggable when in structure edit mode -->
        <draggable
          v-if="isStructureEditMode"
          v-model="localSections"
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost-section"
          @end="updateSectionsOrder"
          class="rule-sections-list"
          :disabled="isContentEditMode"
        >
          <template #item="{ element }">
            <div 
              :class="['rule-section-item', { active: currentSection?.id === element.id }]"
              @click="selectSection(element.id)"
            >
              <span class="section-name">{{ element.name }}</span>
              <!-- Edit controls -->
              <div class="section-controls">
                <span 
                  class="drag-handle" 
                  name="Drag to reorder"
                >⋮⋮</span>
                <span 
                  class="delete-section" 
                  @click.stop="confirmDeleteSection(element)" 
                  name="Delete section"
                >×</span>
              </div>
            </div>
          </template>
        </draggable>
        
        <!-- Non-draggable version for view/content edit mode -->
        <div v-else class="rule-sections-list">
          <div 
            v-for="section in sortedSections" 
            :key="section.id"
            :class="['rule-section-item', { active: currentSection?.id === section.id }]"
            @click="selectSection(section.id)"
          >
            <span class="section-name">{{ section.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- Right content area -->
      <div class="rules-content">
        <div class="rules-content-header">
          <button 
            v-if="currentSection"
            class="content-edit-toggle" 
            @click="toggleContentEditMode"
            :class="{ 'active': isContentEditMode }"
            :disabled="isStructureEditMode"
            :name="isContentEditMode ? 'Save Changes' : 'Edit Content'"
          >
            {{ isContentEditMode ? '✓' : '✎' }}
          </button>
          <button class="close-button" @click="confirmClose">×</button>
        </div>
        
        <div v-if="currentSection" class="rules-content-body">
          <!-- Name editor -->
          <div class="section-name-container">
            <input 
              v-if="isContentEditMode"
              type="text" 
              v-model="currentSection.name" 
              class="section-name-input"
              @input="markAsChanged"
            />
            <h2 v-else>{{ currentSection.name }}</h2>
          </div>
          
          <!-- Content editor -->
          <div class="section-content-container">
            <TextEditor 
              v-if="isContentEditMode"
              v-model="currentSection.content"
              height="calc(100vh - 200px)"
              @update:modelValue="markAsChanged"
            />
            <div v-else class="content-display" v-html="formattedContent"></div>
          </div>
        </div>
        
        <div v-else class="no-selection">
          <p>Select a section from the table of contents or create a new one.</p>
          <button 
            v-if="sortedSections.length === 0"
            class="button button-primary"
            @click="createFirstSection"
          >
            Create First Section
          </button>
        </div>
      </div>
    </div>
    
    <DeleteConfirmationModal
      v-if="showDeleteConfirmationModal"
      :name="sectionToDelete?.name || 'this section'"
      @close="closeDeleteConfirmationModal"
      @confirm="deleteSection"
    />
  </div>
</template>

<script>
import { useRulesStore } from '@/stores/rulesStore';
import RulesService from '@/services/RulesService';
import TextEditor from '@/components/TextEditor.vue';
import draggable from 'vuedraggable';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';

export default {
  components: {
    TextEditor,
    draggable,
    DeleteConfirmationModal
  },
  
  props: {
    initialSectionId: {
      type: String,
      default: null
    }
  },
  
  emits: ['close'],
  
  data() {
    return {
      rulesStore: useRulesStore(),
      isContentEditMode: false,
      isStructureEditMode: false,
      currentSection: null,
      selectedSectionId: null,
      localSections: [],
      showDeleteConfirmationModal: false,
      sectionToDelete: null,
      unsavedChanges: false
    };
  },
  
  computed: {
    sortedSections() {
      return this.rulesStore.sections ? [...this.rulesStore.sections].sort((a, b) => a.index - b.index) : [];
    },
    
    formattedContent() {
      if (!this.currentSection?.content) return '';
      return this.currentSection.content;
    },
    
    // Easily determine if we're in any edit mode
    isInEditMode() {
      return this.isContentEditMode || this.isStructureEditMode;
    }
  },
  
  watch: {
    sortedSections: {
      immediate: true,
      handler(newValue) {
        this.localSections = JSON.parse(JSON.stringify(newValue));
      }
    }
  },
  
  async created() {
    try {
      await this.rulesStore.fetchRules();
      if (this.initialSectionId) {
        this.selectSection(this.initialSectionId);
      } else if (this.sortedSections && this.sortedSections.length > 0) {
        this.selectSection(this.sortedSections[0].id);
      }
    } catch (error) {
      console.error('Error in RulesModal created:', error);
    }
  },
  
  methods: {
    async selectSection(sectionId) {
      // Prevent section switching during content edit mode with unsaved changes
      if (this.isContentEditMode) {
        if (this.unsavedChanges) {
          if (confirm('You have unsaved changes. Do you want to save before selecting another section?')) {
            await this.saveSection();
          } else {
            this.unsavedChanges = false;
          }
        } else {
          return; // Don't allow section switching in content edit mode even if no changes
        }
      }
      
      // Clear current section first to avoid visual issues with multiple sections appearing selected
      this.currentSection = null;
      this.$nextTick(() => {
        // Filter the section locally from the loaded sections
        this.currentSection = this.rulesStore.sections.find(section => section.id === sectionId) || null;
        this.selectedSectionId = sectionId;
      });
    },
    
    async createNewSection() {
      // Don't allow creating sections in content edit mode
      if (this.isContentEditMode) return;
      
      try {
        // Create the new section
        const newSection = await RulesService.createSection();
        // Refresh data
        await this.rulesStore.fetchRules();
        
        if (newSection && newSection.id) {
          // Exit structure edit mode
          this.isStructureEditMode = false;
          
          // Select the newly created section
          await this.selectSection(newSection.id);
          
          // Enter content edit mode after a short delay to ensure the section is selected
          this.$nextTick(() => {
            this.isContentEditMode = true;
            this.unsavedChanges = true; // Mark as changed so user will be prompted if they navigate away
          });
        }
      } catch (error) {
        console.error("Error creating new section:", error);
      }
    },
    
    createFirstSection() {
      this.createNewSection();
    },
    
    async saveSection() {
      if (this.currentSection) {
        await RulesService.updateSection(this.currentSection);
        await this.rulesStore.fetchRules();
        this.unsavedChanges = false;
      }
    },
    
    markAsChanged() {
      this.unsavedChanges = true;
    },
    
    toggleContentEditMode() {
      // Don't allow entering content edit mode if structure edit mode is active
      if (this.isStructureEditMode) return;
      
      if (this.isContentEditMode) {
        // Switching from edit to view mode - save changes
        this.saveSection();
      }
      this.isContentEditMode = !this.isContentEditMode;
    },
    
    toggleStructureEditMode() {
      // Don't allow entering structure edit mode if content edit mode is active
      if (this.isContentEditMode) return;
      
      this.isStructureEditMode = !this.isStructureEditMode;
    },
    
    confirmDeleteSection(section) {
      // Don't allow deletion in content edit mode
      if (this.isContentEditMode) return;
      
      this.sectionToDelete = section;
      this.showDeleteConfirmationModal = true;
    },
    
    closeDeleteConfirmationModal() {
      this.showDeleteConfirmationModal = false;
      this.sectionToDelete = null;
    },
    
    async deleteSection() {
      await RulesService.deleteSection(this.sectionToDelete);
      await this.rulesStore.fetchRules();
      this.closeDeleteConfirmationModal();
      
      // If the deleted section was the current section, select another one
      if (this.currentSection && this.currentSection.id === this.sectionToDelete.id) {
        this.currentSection = null;
        
        if (this.sortedSections.length > 0) {
          this.selectSection(this.sortedSections[0].id);
        }
      }
    },
    
    confirmClose() {
      if (this.isContentEditMode && this.unsavedChanges) {
        if (confirm('You have unsaved changes. Are you sure you want to close?')) {
          this.$emit('close');
        }
      } else {
        this.$emit('close');
      }
    },
    
    async updateSectionsOrder() {
      // Don't allow reordering in content edit mode
      if (this.isContentEditMode) return;
      
      try {
        await RulesService.reorderSections(this.localSections);
        await this.rulesStore.fetchRules();
      } catch (error) {
        console.error("Error updating section order:", error);
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  z-index: 1100;
}

.rules-modal-container {
  display: flex;
  width: 90vw;
  height: 90vh;
  max-width: 1400px;
  background: rgb(17, 17, 17);
  border-radius: 8px;
  overflow: hidden;
}

/* Navigation sidebar styles */
.rules-navigation {
  width: 250px;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px 0;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.rules-nav-header {
  padding: 0 15px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.rules-nav-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.structure-actions {
  padding: 10px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.add-section-btn {
  width: 100%;
  background: #4CAF50;
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

.structure-edit-toggle, .content-edit-toggle {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}

.structure-edit-toggle.active, .content-edit-toggle.active {
  background: #4CAF50;
  border-color: #4CAF50;
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
  transition: background-color 0.2s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.rule-section-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.rule-section-item.active {
  background-color: rgba(255, 255, 255, 0.1);
  border-left: 3px solid #4CAF50;
}

.section-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
}

.rules-content-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.edit-mode-toggle, .close-button {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 5px 10px;
}

.close-button {
  font-size: 24px;
  padding: 0 10px;
}

.content-edit-toggle {
  margin-right: auto;
}

.rules-content-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.section-name-container {
  margin-bottom: 20px;
}

.section-name-container h2 {
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-name-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #444;
  padding: 10px;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.section-content-container {
  margin-top: 10px;
}

.content-display {
  text-align: left;
  line-height: 1.6;
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

.content-edit-toggle:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .rules-modal-container {
    flex-direction: column;
  }

  .rules-navigation {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>