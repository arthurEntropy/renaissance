<template>
    <div class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-header">Edit Ability</h2>
        <form @submit.prevent="saveAbility">
          <!-- ID (Displayed as Text) -->
          <div class="form-group">
            <label>ID:</label>
            <span>{{ ability.id }}</span>
          </div>
  
          <!-- Name -->
          <div class="form-group vertical">
            <label for="name">Name:</label>
            <input type="text" id="name" v-model="editedAbility.name" class="modal-input" />
          </div>
  
          <!-- Description -->
          <div class="form-group vertical description">
            <label for="description">Description:</label>
            <textarea id="description" v-model="editedAbility.description" class="modal-input"></textarea>
          </div>
  
          <!-- Trait -->
          <div class="form-group centered">
            <label for="source">Source:</label>
            <select id="source" v-model="editedAbility.source" class="modal-input">
              <optgroup label="Ancestries">
                <option v-for="ancestry in ancestries" :key="ancestry.id" :value="ancestry.id">
                  {{ ancestry.name }}
                </option>
              </optgroup>
              <optgroup label="Cultures">
                <option v-for="culture in cultures" :key="culture.id" :value="culture.id">
                  {{ culture.name }}
                </option>
              </optgroup>
              <optgroup label="Mestieri">
                <option v-for="mestiere in mestieri" :key="mestiere.id" :value="mestiere.id">
                  {{ mestiere.name }}
                </option>
              </optgroup>
            </select>
            <label for="isTrait">
              <input type="checkbox" id="isTrait" v-model="editedAbility.isTrait" />
              Trait
            </label>
            <label for="canBeActive">
              <input type="checkbox" id="canBeActive" v-model="editedAbility.canBeActive" />
              Can Be Active
            </label>
          </div>
  
          <!-- Buttons -->
          <div class="form-buttons">
            <button type="submit" class="button button-primary">Save</button>
            <button type="button" class="button" @click="cancelEdit">Cancel</button>
            <button type="button" class="button button-danger" @click="deleteAbility">Delete</button>
          </div>
        </form>
      </div>
    </div>
</template>
  
  <script>
  import AncestryService from "@/services/AncestryService";
  import CultureService from "@/services/CultureService";
  import MestieriService from "@/services/MestieriService";
  
  export default {
    props: {
      ability: {
        type: Object,
        required: true,
      },
    },
    emits: ["save", "cancel", "delete"],
    data() {
      return {
        editedAbility: { ...this.ability }, // Create a local copy of the ability
        ancestries: [],
        cultures: [],
        mestieri: [],
      };
    },
    methods: {
      async fetchSources() {
        try {
          const [ancestries, cultures, mestieri] = await Promise.all([
            AncestryService.getAllAncestries(),
            CultureService.getAllCultures(),
            MestieriService.getAllMestieri(),
          ]);
          this.ancestries = ancestries;
          this.cultures = cultures;
          this.mestieri = mestieri;
        } catch (error) {
          console.error("Error fetching sources:", error);
        }
      },
      saveAbility() {
        this.$emit("save", this.editedAbility);
      },
      cancelEdit() {
        this.$emit("cancel");
      },
      deleteAbility() {
        this.$emit("delete", this.editedAbility);
      },
    },
    async mounted() {
      await this.fetchSources();
    },
  };
  </script>
  
  <style scoped>
  .modal-content {
    text-align: left;
    width: 100%;
    max-width: 500px;
  }
  
  .modal-header {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .form-group {
    display: flex;
    align-items: center;
    justify-content: center;
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
    margin-right: 10px;
    font-size: 14px;
    color: darkgray;
  }
  
  .modal-input {
    flex: 1;
    padding: 8px;
    font-family: 'Lora', serif;
    color: white;
    background-color: black;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-right: 10px;
  }
  
  textarea.modal-input {
    resize: vertical;
    min-height: 300px;
  }
  
  .form-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  </style>