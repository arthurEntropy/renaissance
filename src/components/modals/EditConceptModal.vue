<template>
  <div class="modal-overlay">
      <div class="modal-content">
      <h2 class="modal-header">Edit Concept</h2>
      
      <!-- Two-column layout container -->
      <div class="two-column-layout">
        <!-- Left column - Main content -->
        <div class="left-column">
          <form>
            <!-- ID (Displayed as Text) -->
            <div class="form-group">
              <label>ID:</label>
              <span>{{ concept.id }}</span>
            </div>

            <!-- Name -->
            <div class="form-group vertical">
              <label for="name">Name:</label>
              <input type="text" id="name" v-model="editedConcept.name" class="modal-input" />
            </div>

            <!-- Description -->
            <div class="form-group vertical">
              <label for="description">Description:</label>
              <text-editor
                v-model="editedConcept.description"
                height="200px"
                placeholder="Enter concept description..."
              />
            </div>

            <!-- Names -->
            <div class="form-group vertical">
              <label for="names">Names (comma-separated):</label>
              <textarea
                id="names"
                v-model="editedConcept.names"
                class="modal-input"
                placeholder="Freda, Heithur, Sigrid, ..."
              ></textarea>
            </div>

            <!-- Hooks -->
            <div class="form-group vertical">
              <label>Hooks:</label>
              <div v-for="(hook, idx) in editedConcept.hooks" :key="hook.id || idx" class="hook-edit-card">
                <div class="hook-fields">
                  <input
                    type="text"
                    v-model="hook.name"
                    placeholder="Hook Name"
                    class="modal-input hook-input"
                  />
                  <textarea
                    v-model="hook.description"
                    placeholder="Description"
                    class="modal-input hook-input"
                    rows="2"
                  ></textarea>
                  <textarea
                    v-model="hook.gmNotes"
                    placeholder="GM Notes"
                    class="modal-input hook-input"
                    rows="2"
                  ></textarea>
                  <button type="button" class="button button-danger small" @click="removeHook(idx)">Delete</button>
                </div>
              </div>
              <button type="button" class="button button-primary small" @click="addHook">Add Hook</button>
            </div>

            <!-- Background Image URL -->
            <div class="form-group vertical">
              <label for="backgroundImage">Background Image URL:</label>
              <input
                type="text"
                id="backgroundImage"
                v-model="editedConcept.backgroundImage"
                class="modal-input"
                placeholder="https://example.com/image.png"
              />
            </div>

            <!-- Colors -->
            <div class="form-group">
              <label for="color1">Primary Color:</label>
              <input type="color" id="color1" v-model="editedConcept.color1" />
              <label for="color2">Secondary Color:</label>
              <input type="color" id="color2" v-model="editedConcept.color2" />
            </div>
          </form>
        </div>
        
        <!-- Right column - Art URLs -->
        <div class="right-column">
          <!-- Art URLs -->
          <div class="form-group vertical">
            <label>Featured Art URLs:</label>
            <div class="url-container">
              <div
                v-for="(url, idx) in editedConcept.artUrls"
                :key="'art-' + idx"
                class="url-item"
              >
                <img
                  v-if="url"
                  :src="url"
                  alt="Art thumbnail"
                  class="url-thumb"
                />
                <input
                  type="text"
                  v-model="editedConcept.artUrls[idx]"
                  class="modal-input url-input"
                  :placeholder="`Art URL #${idx + 1}`"
                />
                <div class="url-buttons">
                  <button type="button" class="button small" @click="moveArtUrl(idx, -1)" :disabled="idx === 0" title="Move Up">▲</button>
                  <button type="button" class="button small" @click="moveArtUrl(idx, 1)" :disabled="idx === editedConcept.artUrls.length - 1" title="Move Down">▼</button>
                  <button type="button" class="button button-danger small" @click="removeArtUrl(idx)">✕</button>
                </div>
              </div>
            </div>
            <button type="button" class="button button-primary small" @click="addArtUrl">Add Art URL</button>
          </div>

          <!-- Faces URLs -->
          <div class="form-group vertical">
            <label>Faces Art URLs:</label>
            <div class="url-container">
              <div
                v-for="(url, idx) in editedConcept.faces"
                :key="'face-' + idx"
                class="url-item"
              >
                <img
                  v-if="url"
                  :src="url"
                  alt="Face thumbnail"
                  class="url-thumb"
                />
                <input
                  type="text"
                  v-model="editedConcept.faces[idx]"
                  class="modal-input"
                  :placeholder="`Face URL #${idx + 1}`"
                />
                <div class="url-buttons">
                  <button type="button" class="button small" @click="moveFaceUrl(idx, -1)" :disabled="idx === 0" title="Move Up">▲</button>
                  <button type="button" class="button small" @click="moveFaceUrl(idx, 1)" :disabled="idx === editedConcept.faces.length - 1" title="Move Down">▼</button>
                  <button type="button" class="button button-danger small" @click="removeFaceUrl(idx)">✕</button>
                </div>
              </div>
            </div>
            <button type="button" class="button button-primary small" @click="addFaceUrl">Add Face URL</button>
          </div>
        </div>
      </div>
      
      <!-- Save/Cancel/Delete Buttons - Outside the columns -->
      <div class="form-buttons danger-zone">
        <button type="button" class="button button-primary" @click="saveChanges">Save Changes</button>
        <button type="button" class="button" @click="cancelEdit">Cancel</button>
        <button type="button" class="button button-danger" @click="deleteConcept">Delete Concept</button>
      </div>
    </div>
  </div>
</template>
  
<script>
import TextEditor from '@/components/TextEditor.vue'

export default {
  components: {
    TextEditor,
  },
  props: {
    concept: {
      type: Object,
      required: true,
    },
  },
  emits: ["update", "delete", "close"],
  data() {
    return {
      editedConcept: { ...this.concept }, // Create a local copy of the concept
    };
  },
  methods: {
    // Form actions
    saveChanges() {
      this.$emit("update", this.editedConcept);
      this.$emit("close");
    },
    
    cancelEdit() {
      this.$emit("close");
    },
    
    deleteConcept() {
      if (confirm(`Are you sure you want to delete the concept "${this.editedConcept.name}"?`)) {
        this.$emit("delete", this.editedConcept);
      }
    },
    
    // Art URL methods
    addArtUrl() {
      if (!this.editedConcept.artUrls) this.editedConcept.artUrls = [];
      this.editedConcept.artUrls.push('');
    },
    
    removeArtUrl(idx) {
      this.editedConcept.artUrls.splice(idx, 1);
    },
    
    moveArtUrl(idx, direction) {
      const urls = this.editedConcept.artUrls;
      const newIndex = idx + direction;
      if (newIndex < 0 || newIndex >= urls.length) return;
      [urls[idx], urls[newIndex]] = [urls[newIndex], urls[idx]];
    },
    
    // Face URL methods
    addFaceUrl() {
      if (!this.editedConcept.faces) this.editedConcept.faces = [];
      this.editedConcept.faces.push('');
    },
    
    removeFaceUrl(idx) {
      this.editedConcept.faces.splice(idx, 1);
    },
    
    moveFaceUrl(idx, direction) {
      const urls = this.editedConcept.faces;
      const newIndex = idx + direction;
      if (newIndex < 0 || newIndex >= urls.length) return;
      [urls[idx], urls[newIndex]] = [urls[newIndex], urls[idx]];
    },
    
    // Hook methods
    addHook() {
      this.editedConcept.hooks = this.editedConcept.hooks || [];
      this.editedConcept.hooks.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        name: "",
        description: "",
        gmNotes: "",
        isDeleted: false
      });
    },
    
    removeHook(idx) {
      this.editedConcept.hooks.splice(idx, 1);
    },
  }
};
</script>
  
<style scoped>
.modal-content {
  text-align: left;
  width: 100%;
  max-width: 900px; /* Increased from 500px to accommodate two columns */
  border-radius: 8px;
  padding: 20px;
  background: #1e1e1e;
  color: white;
}

.two-column-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.left-column {
  flex: 1;
  min-width: 300px;
}

.right-column {
  flex: 1;
  min-width: 300px;
  max-width: 400px;
  padding-left: 20px;
  border-left: 1px solid #444;
}

.url-container {
  display: flex;
  flex-direction: column;
  overflow-y: none;
  padding-right: 10px;
  margin-bottom: 10px;
}

.url-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  vertical-align: middle;
  justify-content: center;
  width: 100%;
  background: #181818;
  border-radius: 6px;
}

.url-thumb {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #222;
  border: 1px solid #444;
}

.url-input {
  width: 100%;
  margin-bottom: 8px;
  align-self: middle;
}

.url-buttons {
  display: flex;
  gap: 4px;
  align-self: middle;
}

.modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.form-group.vertical {
  flex-direction: column;
  align-items: flex-start;
}

.form-group.centered {
  justify-content: center;
}

label {
  margin-right: 5px;  
  font-size: 14px;
  color: darkgray;
}

.modal-input {
  width: 100%;
  padding: 4px 6px;
  font-size: 0.95em;
  font-family: 'Lora', serif;
  color: white;
  background-color: black;
  border: 1px solid #ccc;
  border-radius: 4px;
  height: 28px;
  box-sizing: border-box;
}

textarea.modal-input {
  resize: vertical;
  min-height: 80px;
  font-size: 0.95em;
}

/* URL items */
.url-item {
  display: flex; 
  align-items: center; 
  width: 100%; 
  margin-bottom: 4px;
}

.url-input {
  margin-right: 10px;
  flex: 1;
}

.url-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  margin: 5px 5px 5px 0;
  background: #222;
  border: 1px solid #444;
}

/* Hooks */
.hook-edit-card {
  background: #181818;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  width: 100%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}

.hook-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hook-input {
  margin-bottom: 0;
}

/* Color inputs */
input[type="color"] {
  width: 50px;
  height: 30px;
  border: none;
  cursor: pointer;
}

/* Buttons */
.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  background-color: #333;
  color: #fff;
}

.button:hover {
  opacity: 0.9;
}

.button.small {
  font-size: 0.85em;
  padding: 2px 8px;
  margin-top: 2px;
  margin-left: 4px;
}

.button.small:first-of-type {
  margin-left: 0;
}

.button-primary {
  background-color: #4caf50;
  color: white;
}

.button-danger {
  background-color: #f44336;
  color: white;
}

.form-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.danger-zone {
  margin-top: 30px;
  border-top: 1px solid #444;
  padding-top: 20px;
}
</style>