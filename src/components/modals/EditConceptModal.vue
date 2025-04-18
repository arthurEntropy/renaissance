<template>
    <div class="modal-overlay" @click.self="updateConceptAndCloseModal">
      <div class="modal-content">
        <h2 class="modal-header">Edit Concept</h2>
        <form>
          <!-- ID (Displayed as Text) -->
          <div class="form-group centered">
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
            <textarea id="description" v-model="editedConcept.description" class="modal-input"></textarea>
          </div>
  
          <!-- Art URLs -->
          <div class="form-group vertical">
            <label for="artUrls">Art URLs (comma-separated):</label>
            <textarea
              id="artUrls"
              v-model="artUrlsString"
              class="modal-input"
              placeholder="Enter URLs separated by commas"
            ></textarea>
          </div>
  
          <!-- Colors -->
          <div class="form-group centered">
            <label for="color1">Primary Color:</label>
            <input type="color" id="color1" v-model="editedConcept.color1" />
            <label for="color2">Secondary Color:</label>
            <input type="color" id="color2" v-model="editedConcept.color2" />
          </div>
  
          <!-- Delete Button -->
          <div class="form-buttons">
            <button type="button" class="button button-danger" @click="deleteConcept">Delete</button>
          </div>
        </form>
      </div>
    </div>
</template>
  
<script>
export default {
  props: {
    concept: {
      type: Object,
      required: true,
    },
  },
  emits: ["save", "delete", "cancel"],
  data() {
    return {
      editedConcept: { ...this.concept }, // Create a local copy of the concept
    };
  },
  computed: {
    artUrlsString: {
      get() {
        return this.editedConcept.artUrls.join(", ");
      },
      set(value) {
        this.editedConcept.artUrls = value.split(",").map((url) => url.trim());
      },
    },
  },
  methods: {
    updateConceptAndCloseModal() {
      this.$emit("update", this.editedConcept);
      this.$emit("close");
    },
    deleteConcept() {
      this.$emit("delete", this.editedConcept);
    }
  },
};
</script>
  
<style scoped>
.modal-content {
  text-align: left;
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  padding: 20px;
  background: #1e1e1e;
  color: white;
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
  padding: 8px;
  font-family: 'Lora', serif;
  color: white;
  background-color: black;
  border: 1px solid #ccc;
  border-radius: 4px;
}

textarea.modal-input {
  resize: vertical;
  min-height: 100px;
}

input[type="color"] {
  width: 50px;
  height: 30px;
  border: none;
  cursor: pointer;
}

.form-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>