<template>
  <div class="character-bio-section">

    <!-- Background Modal -->
    <div v-if="isBackgroundModalOpen" class="modal-overlay" @click.self="closeBackgroundModal">
      <div class="modal-content background-modal">
        <div class="modal-header">
          <h3>Personality & Background</h3>
          <button 
            v-if="!isBackgroundEditMode" 
            class="edit-button" 
            @click.stop="startBackgroundEdit"
          >
            Edit
          </button>
          <div v-else class="edit-actions">
            <button class="cancel-button" @click.stop="cancelBackgroundEdit">Cancel</button>
            <button class="save-button" @click.stop="saveBackgroundEdit">Save</button>
          </div>
        </div>
        
        <!-- View mode -->
        <div v-if="!isBackgroundEditMode" class="background-modal-content">
          <div v-html="formattedBackground" class="background-full-text"></div>
        </div>
        
        <!-- Edit mode with TextEditor -->
        <div v-else class="background-modal-editor">
          <TextEditor 
            v-model="editedCharacter.personalityAndBackground" 
            :placeholder="'Describe your character\'s personality, history, and notable background...'"
            height="300px"
          />
        </div>
      </div>
    </div>

    <div class="bio-section-content">
      <!-- Character Art -->
      <div class="character-art">
        <img
          v-if="character.artUrls && character.artUrls.length > 0"
          :src="character.artUrls[0] || defaultArtUrl"
          class="character-art-image"
          @click="openFullSizeCharacterArtModal(character.artUrls[0])"
        />
        <img 
          v-else 
          :src="defaultArtUrl" 
          class="character-art-image"
          @click="openFullSizeCharacterArtModal(defaultArtUrl)"
        />
      </div>

      <!-- Bio Information (with inline editing) -->
      <div class="bio-info">
        <!-- Name (click to edit) -->
        <div class="character-name-container" :class="{ 'editing': editingField === 'name' }">
          <template v-if="editingField === 'name'">
            <input
              type="text"
              v-model="editedCharacter.name"
              class="form-input inline-edit"
              @blur="saveField('name')"
              @keyup.enter="saveField('name')"
              ref="nameInput"
            />
          </template>
          <template v-else>
            <span class="character-name" @click.stop="startEditing('name')">{{ character.name || 'Unnamed Character' }}</span>
          </template>

          <!-- Pronouns (click to edit) -->
          <div class="pronouns-container" @click.stop="startEditing('pronouns')" :class="{ 'editing': editingField === 'pronouns' }">
            <template v-if="editingField === 'pronouns'">
              <input
                type="text"
                v-model="editedCharacter.pronouns"
                class="form-input inline-edit pronouns-input"
                @blur="saveField('pronouns')"
                @keyup.enter="saveField('pronouns')"
                placeholder="Add pronouns"
                ref="pronounsInput"
              />
            </template>
            <template v-else>
              <span v-if="character.pronouns" class="character-pronouns">({{ character.pronouns }})</span>
              <span v-else class="empty-field">(Add pronouns)</span>
            </template>
          </div>
        </div>
        
        <div class="bio-details">
          <!-- Ancestries (click to edit) -->
          <div class="bio-detail" @click.stop="editingField !== 'ancestries' && startEditing('ancestries')" :class="{ 'editing': editingField === 'ancestries' }">
            <span class="bio-label">Ancestries:</span>
            <template v-if="editingField === 'ancestries'">
              <div class="tag-selector" @click.stop>
                <div v-for="ancestry in selectedAncestries" :key="ancestry.id" class="selected-tag">
                  <span>{{ ancestry.name }}</span>
                  <button @click.stop="removeAncestry(ancestry.id)" class="remove-tag">×</button>
                </div>
                <select 
                  v-model="selectedAncestryId" 
                  @change="addAncestry" 
                  class="tag-dropdown"
                  @click.stop
                  @blur.prevent="null"
                  ref="ancestriesSelect"
                >
                  <option value="">Add...</option>
                  <option 
                    v-for="ancestry in availableAncestries" 
                    :key="ancestry.id" 
                    :value="ancestry.id"
                  >
                    {{ ancestry.name }}
                  </option>
                </select>
              </div>
            </template>
            <template v-else>
              <span class="bio-value" @click.stop="startEditing('ancestries')">
                {{ displayAncestries || 'None' }}
              </span>
            </template>
          </div>

          <!-- Cultures (click to edit) -->
          <div class="bio-detail" @click.stop="editingField !== 'cultures' && startEditing('cultures')" :class="{ 'editing': editingField === 'cultures' }">
            <span class="bio-label">Cultures:</span>
            <template v-if="editingField === 'cultures'">
              <div class="tag-selector" @click.stop>
                <div v-for="culture in selectedCultures" :key="culture.id" class="selected-tag">
                  <span>{{ culture.name }}</span>
                  <button @click.stop="removeCulture(culture.id)" class="remove-tag">×</button>
                </div>
                <select 
                  v-model="selectedCultureId" 
                  @change="addCulture" 
                  class="tag-dropdown"
                  @click.stop
                  @blur.prevent="null"
                  ref="culturesSelect"
                >
                  <option value="">Add...</option>
                  <option 
                    v-for="culture in availableCultures" 
                    :key="culture.id" 
                    :value="culture.id"
                  >
                    {{ culture.name }}
                  </option>
                </select>
              </div>
            </template>
            <template v-else>
              <span class="bio-value" @click.stop="startEditing('cultures')">
                {{ displayCultures || 'None' }}
              </span>
            </template>
          </div>
          
          <!-- XP (always an input) -->
          <div class="bio-detail xp-field">
            <span class="bio-label">XP:</span>
            <input
              type="number"
              v-model.number="editedCharacter.xp"
              class="form-input input-small"
              min="0"
              @change="saveField('xp')"
            />
          </div>
        </div>
      </div>

      <!-- Personality and Background Section (modified to be scrollable) -->
      <div class="personality-background-section">
        <span class="bio-label">Personality & Background</span>
        
        <!-- View Mode (scrollable and clickable to open modal) -->
        <div 
          class="background-content scrollable" 
          @click="openBackgroundModal"
        >
          <template v-if="character.personalityAndBackground">
            <div v-html="formattedBackground" class="background-scroll-content"></div>
          </template>
          <span v-else class="empty-background">What's your vibe? What's your story? Where are you going?</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAncestriesStore } from '@/stores/ancestriesStore';
import { useCulturesStore } from '@/stores/culturesStore';
import TextEditor from '@/components/TextEditor.vue';

export default {
  components: {
    TextEditor,
  },
  props: {
    character: {
      type: Object,
      required: true,
    },
    defaultArtUrl: {
      type: String,
      required: true,
    },
  },
  emits: ["open-full-size-art", "update-character"],
  data() {
    return {
      editingField: null,
      isBackgroundModalOpen: false,
      isBackgroundEditMode: false,
      editedCharacter: { ...this.character },
      selectedAncestryId: '',
      selectedCultureId: '',
      ancestryStore: useAncestriesStore(),
      cultureStore: useCulturesStore(),
      tempBackgroundContent: '',
    };
  },
  computed: {
    displayAncestries() {
      if (!this.character.ancestryIds || !this.character.ancestryIds.length) {
        return '';
      }
      
      return this.selectedAncestries.map(a => a.name).join(', ');
    },
    
    displayCultures() {
      if (!this.character.cultureIds || !this.character.cultureIds.length) {
        return '';
      }
      
      return this.selectedCultures.map(c => c.name).join(', ');
    },
    
    selectedAncestries() {
      const ancestryIds = this.character.ancestryIds || [];
      return this.ancestryStore.ancestries.filter(a => ancestryIds.includes(a.id));
    },
    
    selectedCultures() {
      const cultureIds = this.character.cultureIds || [];
      return this.cultureStore.cultures.filter(c => cultureIds.includes(c.id));
    },
    
    availableAncestries() {
      const selectedIds = this.editedCharacter.ancestryIds || [];
      return this.ancestryStore.ancestries.filter(a => !selectedIds.includes(a.id));
    },
    
    availableCultures() {
      const selectedIds = this.editedCharacter.cultureIds || [];
      return this.cultureStore.cultures.filter(c => !selectedIds.includes(c.id));
    },
    
    isTextTruncated() {
      // Now this is a computed property
      if (!this.character.personalityAndBackground) return false;
      
      const maxLength = 200;
      return this.character.personalityAndBackground.length > maxLength;
    },
    
    truncatedBackground() {
      if (!this.character.personalityAndBackground) return '';
      
      const maxLength = 200;
      const text = this.character.personalityAndBackground;
      
      if (text.length > maxLength) {
        // No side effect here anymore
        return this.formatText(text.substring(0, maxLength));
      } else {
        return this.formatText(text);
      }
    },
    
    formattedBackground() {
      if (!this.character.personalityAndBackground) return '';
      return this.formatText(this.character.personalityAndBackground);
    }
  },
  methods: {
    formatText(text) {
      // Simple formatting for line breaks and markdown-style formatting
      return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    },
    openFullSizeCharacterArtModal(imageUrl) {
      this.$emit("open-full-size-art", imageUrl);
    },
    
    // Start editing a specific field
    startEditing(field) {
      // Only allow one field to be edited at a time
      if (this.editingField) {
        this.saveField(this.editingField);
      }
      this.editingField = field;

      // Focus the input after a slight delay to ensure it's rendered
      this.$nextTick(() => {
        const inputRef = `${field}Input`;
        const selectRef = `${field}Select`;
        
        if (this.$refs[inputRef]) {
          this.$refs[inputRef].focus();
        } else if (this.$refs[selectRef]) {
          this.$refs[selectRef].focus();
        }
      });
    },
    
    // Save changes to a specific field
    saveField(field) {
      if (field === this.editingField) {
        this.editingField = null;
      }
      
      // Only update the character if something actually changed
      const updatedField = this.editedCharacter[field];
      if (updatedField !== this.character[field]) {
        const updatedCharacter = { 
          ...this.character, 
          [field]: updatedField 
        };
        this.$emit("update-character", updatedCharacter);
      }
    },
    
    openBackgroundModal() {
      this.isBackgroundModalOpen = true;
      this.isBackgroundEditMode = false;
      this.editedCharacter = { ...this.character };
    },
    
    closeBackgroundModal() {
      if (this.isBackgroundEditMode) {
        // Confirm before closing if in edit mode
        if (confirm('Discard changes?')) {
          this.isBackgroundModalOpen = false;
          this.isBackgroundEditMode = false;
        }
      } else {
        this.isBackgroundModalOpen = false;
      }
    },
    
    startBackgroundEdit() {
      this.isBackgroundEditMode = true;
      this.tempBackgroundContent = this.character.personalityAndBackground || '';
    },
    
    cancelBackgroundEdit() {
      this.editedCharacter.personalityAndBackground = this.tempBackgroundContent;
      this.isBackgroundEditMode = false;
    },
    
    saveBackgroundEdit() {
      const updatedCharacter = { 
        ...this.character, 
        personalityAndBackground: this.editedCharacter.personalityAndBackground 
      };
      this.$emit("update-character", updatedCharacter);
      this.isBackgroundEditMode = false;
    },
    
    // Ancestry methods
    addAncestry() {
      if (!this.selectedAncestryId) return;
      
      if (!this.editedCharacter.ancestryIds) {
        this.editedCharacter.ancestryIds = [];
      }
      
      // Prevent adding duplicates
      if (!this.editedCharacter.ancestryIds.includes(this.selectedAncestryId)) {
        this.editedCharacter.ancestryIds.push(this.selectedAncestryId);
      }
      this.selectedAncestryId = '';
      
      // Save the change immediately
      this.saveField('ancestryIds');
    },
    
    removeAncestry(id) {
      if (!this.editedCharacter.ancestryIds) return;
      
      this.editedCharacter.ancestryIds = this.editedCharacter.ancestryIds.filter(aId => aId !== id);
      this.saveField('ancestryIds');
    },
    
    // Culture methods
    addCulture() {
      if (!this.selectedCultureId) return;
      
      if (!this.editedCharacter.cultureIds) {
        this.editedCharacter.cultureIds = [];
      }
      
      // Prevent adding duplicates
      if (!this.editedCharacter.cultureIds.includes(this.selectedCultureId)) {
        this.editedCharacter.cultureIds.push(this.selectedCultureId);
      }
      this.selectedCultureId = '';
      
      // Save the change immediately
      this.saveField('cultureIds');
    },
    
    removeCulture(id) {
      if (!this.editedCharacter.cultureIds) return;
      
      this.editedCharacter.cultureIds = this.editedCharacter.cultureIds.filter(cId => cId !== id);
      this.saveField('cultureIds');
    },
    
    // Handle clicks outside editable areas
    handleOutsideClick(event) {
      // Don't process outside clicks when clicking inside tag components
      if (event.target.closest('.remove-tag') || 
          event.target.closest('.selected-tag') || 
          event.target.closest('.tag-dropdown')) {
        return;
      }
      
      if (this.editingField) {
        const clickedInsideEditArea = event.target.closest('.editing') || 
                                      event.target.closest('.tag-selector');
        if (!clickedInsideEditArea) {
          this.saveField(this.editingField);
        }
      }
    }
  },
  mounted() {
    // Fetch ancestries and cultures when component mounts
    this.ancestryStore.fetchAncestries();
    this.cultureStore.fetchCultures();
    
    // Add click handler to detect clicks outside edit fields
    document.addEventListener('click', this.handleOutsideClick);
  },
  beforeUnmount() {
    // Remove click listener when component is destroyed
    document.removeEventListener('click', this.handleOutsideClick);
  }
};
</script>

<style scoped>
.character-bio-section {
  display: flex;
  flex-direction: column;
  background-color: black;
  border-radius: 5px;
  padding: 20px;
  position: relative;
  margin-bottom: 10px;
}

/* Bio Section Content */
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
  width: 165px;
  height: 165px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* Bio Info */
.bio-info {
  flex: 1; 
  max-width: 400px;
}

.character-name-container {
  display: flex;
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
  font-size: 0.9rem;
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
  width: 100%; /* Set width to 100% of container */
  min-width: 200px;
  outline: none; 
  box-shadow: none;
  box-sizing: border-box; /* Include padding/border in width calculation */
}

.form-input.inline-edit:focus {
  border-color: #666;
  box-shadow: 0 0 0 2px rgba(100, 100, 100, 0.5); /* Custom focus style */
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
  line-height: 1; /* Ensure proper vertical alignment */
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

/* Personality & Background Section - moved to the right */
.personality-background-section {
  flex: 4;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.background-content {
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  min-height: 150px;
  height: 100%;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.background-content:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.background-content.scrollable {
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  height: 100px;
  max-height: 100px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  overflow-y: auto; /* Enable vertical scrolling */
}

.background-scroll-content {
  line-height: 1.5;
}

.background-content.truncated {
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  height: 100px;
  max-height: 100px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  overflow: hidden;
  position: relative;
}

.truncated-text {
  max-height: 80px; /* Leave room for the "..." indicator */
  overflow: hidden;
}

.read-more-indicator {
  position: absolute;
  bottom: 5px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0px 10px;
  color: white;
  font-weight: bold;
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

.background-textarea:focus {
  border-color: #666;
}

.background-content, .background-textarea {
  box-sizing: border-box;
  min-height: 150px;
  width: 100%;
  margin: 0;
}

.save-background-button:hover {
  background-color: #555;
}

/* Remove edit mode button since it's no longer needed */
.edit-mode-button {
  display: none;
}

/* Responsive Styles */
@media (max-width: 1024px) {
  .bio-section-content {
    flex-direction: column;
  }
  
  .bio-info, .personality-background-section {
    width: 100%;
    max-width: none;
  }
  
  .background-textarea {
    min-height: 150px;
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