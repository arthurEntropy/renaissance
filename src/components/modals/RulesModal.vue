<template>
    <div class="modal-overlay" @click.self="confirmClose">
      <div class="rules-modal-container">
        <!-- Left sidebar with navigation -->
        <div class="rules-navigation">
          <div class="rules-nav-header">
            <h3>Table of Contents</h3>
            <button 
              v-if="isEditMode" 
              class="add-section-btn"
              @click="createNewSection"
              title="Add new section"
            >+</button>
          </div>
          
          <!-- Rule sections list -->
          <draggable
            v-if="isEditMode"
            v-model="localSections"
            item-key="id"
            handle=".drag-handle"
            ghost-class="ghost-section"
            @end="updateSectionsOrder"
            class="rule-sections-list"
          >
            <template #item="{ element }">
              <div 
                :class="['rule-section-item', { active: currentSection?.id === element.id }]"
                @click="selectSection(element.id)"
              >
                <span class="section-title">{{ element.title }}</span>
                <!-- Edit controls -->
                <div class="section-controls">
                  <span 
                    v-if="isEditMode"
                    class="drag-handle" 
                    title="Drag to reorder"
                  >⋮⋮</span>
                  <span 
                    v-if="isEditMode" 
                    class="delete-section" 
                    @click.stop="confirmDeleteSection(element)" 
                    title="Delete section"
                  >×</span>
                </div>
              </div>
            </template>
          </draggable>
          
          <!-- Non-draggable version for view mode -->
          <div v-else class="rule-sections-list">
            <div 
              v-for="section in sortedSections" 
              :key="section.id"
              :class="['rule-section-item', { active: currentSection?.id === section.id }]"
              @click="selectSection(section.id)"
            >
              <span class="section-title">{{ section.title }}</span>
            </div>
          </div>
        </div>
        
        <!-- Right content area -->
        <div class="rules-content">
          <!-- Header with edit toggle -->
          <div class="rules-content-header">
            <button 
              class="edit-mode-toggle" 
              @click="toggleEditMode"
              :title="isEditMode ? 'Save Changes' : 'Edit Mode'"
            >
              {{ isEditMode ? '✓' : '✎' }}
            </button>
            <button class="close-button" @click="confirmClose">×</button>
          </div>
          
          <!-- Content area -->
          <div v-if="currentSection" class="rules-content-body">
            <!-- Title editor -->
            <div class="section-title-container">
              <input 
                v-if="isEditMode"
                type="text" 
                v-model="currentSection.title" 
                class="section-title-input"
                @change="saveSection"
              />
              <h2 v-else>{{ currentSection.title }}</h2>
            </div>
            
            <!-- Content editor -->
            <div class="section-content-container">
              <TextEditor 
                v-if="isEditMode"
                v-model="currentSection.content"
                height="calc(100vh - 200px)"
                @update:modelValue="saveSection"
              />
              <div v-else class="content-display" v-html="formattedContent"></div>
            </div>
          </div>
          
          <!-- No section selected -->
          <div v-else class="no-selection">
            <p>Select a section from the table of contents or create a new one.</p>
            <button 
              v-if="isEditMode && sortedSections.length === 0"
              class="button button-primary"
              @click="createNewSection"
            >
              Create First Section
            </button>
          </div>
        </div>
      </div>
      
      <!-- Delete confirmation modal -->
      <DeleteConfirmationModal
        v-if="showDeleteConfirmationModal"
        :name="sectionToDelete?.title || 'this section'"
        @close="closeDeleteConfirmationModal"
        @confirm="deleteSection"
      />
    </div>
  </template>
  
  <script>
  import { useRulesStore } from '@/stores/rulesStore';
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
      const rulesStore = useRulesStore();
      
      return {
        rulesStore,
        isEditMode: false,
        currentSection: null,
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
        
        // Only select a section if we have one
        if (this.initialSectionId) {
        this.selectSection(this.initialSectionId);
        } else if (this.sortedSections && this.sortedSections.length > 0) {
        // If no initial section specified, select the first one
        this.selectSection(this.sortedSections[0].id);
        }
    } catch (error) {
        console.error('Error in RulesModal created:', error);
    }
    },
    
    methods: {
        async selectSection(sectionId) {
        // Only attempt to fetch if we have a valid section ID
        if (sectionId) {
            try {
            await this.rulesStore.fetchSection(sectionId);
            this.selectedSectionId = sectionId;
            } catch (error) {
            console.error('Error selecting section:', error);
            }
        }
        },
      
      async createNewSection() {
        try {
            const newSection = await this.rulesStore.createSection();
            // Add null check before accessing the id property
            if (newSection && newSection.id) {
            this.selectedSectionId = newSection.id;
            this.editedSection = { ...newSection };
            this.isEditingSection = true;
            } else {
            console.error("Failed to create new section - response was undefined");
            }
        } catch (error) {
            console.error("Error creating new section:", error);
            // Optionally show user feedback about the error
        }
    },
      
      async saveSection() {
        if (this.currentSection) {
          await this.rulesStore.updateSection(this.currentSection);
          this.unsavedChanges = false;
        }
      },
      
      toggleEditMode() {
        if (this.isEditMode) {
          // Switching from edit to view mode - save changes
          this.saveSection();
        }
        this.isEditMode = !this.isEditMode;
      },
      
      confirmDeleteSection(section) {
        this.sectionToDelete = section;
        this.showDeleteConfirmationModal = true;
      },
      
      closeDeleteConfirmationModal() {
        this.showDeleteConfirmationModal = false;
        this.sectionToDelete = null;
      },
      
      async deleteSection() {
        const id = this.sectionToDelete.id;
        await this.rulesStore.deleteSection(id);
        this.closeDeleteConfirmationModal();
        
        // Select another section if available
        if (this.sortedSections.length > 0) {
          await this.selectSection(this.sortedSections[0].id);
        } else {
          this.currentSection = null;
        }
      },
      
      confirmClose() {
        if (this.isEditMode && this.unsavedChanges) {
          if (confirm('You have unsaved changes. Are you sure you want to close?')) {
            this.$emit('close');
          }
        } else {
          this.$emit('close');
        }
      },
      
      async updateSectionsOrder() {
        const orderedIds = this.localSections.map(section => section.id);
        await this.rulesStore.reorderSections(orderedIds);
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
  
  .add-section-btn {
    background: #4CAF50;
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
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
  
  .section-title {
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
  
  .edit-mode-toggle {
    margin-right: auto;
  }
  
  .rules-content-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }
  
  .section-title-container {
    margin-bottom: 20px;
  }
  
  .section-title-container h2 {
    margin: 0;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .section-title-input {
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