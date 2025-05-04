<template>
    <div class="concept-section" v-if="hasContent || editable">
      <h2 class="section-header">
        Local Flavor
        <button v-if="editable" class="edit-section-button" @click="toggleEditing" title="Edit local flavor">✎</button>
      </h2>
      
      <!-- Edit mode for local flavor data -->
      <div v-if="isEditing" class="section-editor">
        <!-- existing edit form content -->
        <div class="flavor-edit-grid">
          <!-- Names -->
          <div class="flavor-edit-item">
            <label for="names">Names</label>
            <textarea
              id="names"
              v-model="localData.names"
              class="modal-input flavor-textarea"
              placeholder="Who might you meet?"
            ></textarea>
          </div>
          
          <!-- Occupations -->
          <div class="flavor-edit-item">
            <label for="occupations">Occupations</label>
            <textarea
              id="occupations"
              v-model="localData.occupations"
              class="modal-input flavor-textarea"
              placeholder="What do people do around here?"
            ></textarea>
          </div>
          
          <!-- Public Houses -->
          <div class="flavor-edit-item">
            <label for="publicHouses">Public Houses</label>
            <textarea
              id="publicHouses"
              v-model="localData.publicHouses"
              class="modal-input flavor-textarea"
              placeholder="Where can a traveler find hospitality?"
            ></textarea>
          </div>

          <!-- Points of Interest -->
          <div class="flavor-edit-item">
            <label for="pointsOfInterest">Points of Interest</label>
            <textarea
              id="pointsOfInterest"
              v-model="localData.pointsOfInterest"
              class="modal-input flavor-textarea"
              placeholder="What are the must-see spots?"
            ></textarea>
          </div>
          
          <!-- Vittles -->
          <div class="flavor-edit-item">
            <label for="vittles">Vittles</label>
            <textarea
              id="vittles"
              v-model="localData.vittles"
              class="modal-input flavor-textarea"
              placeholder="What's on the menu?"
            ></textarea>
          </div>
          
          <!-- Flora & Fauna -->
          <div class="flavor-edit-item">
            <label for="floraFauna">Flora & Fauna</label>
            <textarea
              id="floraFauna"
              v-model="localData.floraFauna"
              class="modal-input flavor-textarea"
              placeholder="What can be found in the wild?"
            ></textarea>
          </div>
        </div>
        
        <div class="editor-buttons">
          <button class="button small" @click="saveChanges">Save</button>
          <button class="button small" @click="cancelEdit">Cancel</button>
        </div>
      </div>
      
      <!-- Display mode for local flavor data -->
      <div v-else class="two-column-grid">
        <InfoCard 
          v-if="localData.names"
          title="Names"
          :content="localData.names" 
        />
        
        <InfoCard 
          v-if="localData.occupations"
          title="Occupations"
          :content="localData.occupations" 
        />
        
        <InfoCard 
          v-if="localData.publicHouses"
          title="Public Houses"
          :content="localData.publicHouses" 
        />
        
        <InfoCard 
          v-if="localData.vittles"
          title="Vittles"
          :content="localData.vittles" 
        />
        
        <InfoCard 
          v-if="localData.pointsOfInterest"
          title="Points of Interest"
          :content="localData.pointsOfInterest" 
        />
        
        <InfoCard 
          v-if="localData.floraFauna"
          title="Flora & Fauna"
          :content="localData.floraFauna" 
        />
      </div>
    </div>
  </template>
  
  <script>
  import InfoCard from '@/components/conceptDetail/InfoCard.vue';
  
  export default {
    name: 'LocalFlavorSection',
    components: {
      InfoCard
    },
    props: {
      data: {
        type: Object,
        required: true
      },
      editable: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        isEditing: false,
        localData: {
          names: '',
          occupations: '',
          publicHouses: '',
          vittles: '',
          pointsOfInterest: '',
          floraFauna: ''
        },
        backupData: null
      };
    },
    computed: {
      hasContent() {
        return Boolean(
          this.localData.names || 
          this.localData.occupations ||
          this.localData.publicHouses ||
          this.localData.vittles ||
          this.localData.pointsOfInterest ||
          this.localData.floraFauna
        );
      }
    },
    watch: {
      data: {
        immediate: true,
        handler(newValue) {
          this.localData = { ...newValue };
        }
      }
    },
    methods: {
      toggleEditing() {
        if (!this.editable) return;
        
        if (!this.isEditing) {
          // Starting to edit - backup current values
          this.backupData = { ...this.localData };
        } else {
          // Save changes if exiting edit mode
          this.saveChanges();
        }
        
        this.isEditing = !this.isEditing;
      },
      
      saveChanges() {
        this.isEditing = false;
        this.$emit('update', { ...this.localData });
      },
      
      cancelEdit() {
        // Restore from backup
        this.localData = { ...this.backupData };
        this.isEditing = false;
      }
    }
  }
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