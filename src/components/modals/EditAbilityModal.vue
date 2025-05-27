<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2 class="modal-header centered">Edit Ability</h2>
      <form @submit.prevent="saveAbility">

        <!-- Name -->
        <div class="form-group vertical">
          <label for="name" class="left-aligned">Name:</label>
          <input type="text" id="name" v-model="editedAbility.name" class="modal-input" />
        </div>

        <!-- Description -->
        <div class="form-group vertical description">
          <label for="description" class="left-aligned">Description:</label>
          <textarea id="description" v-model="editedAbility.description" class="modal-input"></textarea>
        </div>

        <!-- MP and XP -->
        <div class="form-group centered">
          <label for="mp">MP:</label>
          <input type="number" id="mp" v-model.number="editedAbility.mp" class="modal-input small-input" />
          <label for="xp">XP:</label>
          <input type="number" id="xp" v-model.number="editedAbility.xp" class="modal-input small-input" />
        </div>

        <div class="form-group centered">
          <!-- Source Dropdown -->
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
            <optgroup label="World Elements">
              <option v-for="worldElement in worldElements" :key="worldElement.id" :value="worldElement.id">
                {{ worldElement.name }}
              </option>
            </optgroup>
          </select>

          <!-- Trait and Can-Be-Active Checkboxes -->
          <label for="isTrait">
            <input type="checkbox" id="isTrait" v-model="editedAbility.isTrait" />
            Trait
          </label>
          <label for="canBeActive">
            <input type="checkbox" id="canBeActive" v-model="editedAbility.canBeActive" />
            Can Be Active
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="form-buttons">
          <button type="button" class="button button-primary" @click="saveAbility">
            Save Changes
          </button>
          <button type="button" class="button" @click="closeModal">
            Cancel
          </button>
          <button type="button" class="button button-danger" @click="deleteAbility">
            Delete
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import AncestryService from '@/services/AncestryService'
import CultureService from '@/services/CultureService'
import MestieriService from '@/services/MestiereService'
import WorldElementsService from '@/services/WorldElementService'

export default {
  props: {
    ability: {
      type: Object,
      required: true,
    },
  },
  emits: ['update', 'delete', 'close'],
  data() {
    return {
      editedAbility: null,
      originalAbility: null,
      ancestries: [],
      cultures: [],
      mestieri: [],
      worldElements: [],
    }
  },
  created() {
    this.originalAbility = JSON.parse(JSON.stringify(this.ability))
    this.editedAbility = JSON.parse(JSON.stringify(this.ability))
  },
  methods: {
    async fetchSources() {
      try {
        const [ancestries, cultures, mestieri, worldElements] =
          await Promise.all([
            AncestryService.getAllAncestries(),
            CultureService.getAllCultures(),
            MestieriService.getAllMestieri(),
            WorldElementsService.getAllWorldElements(),
          ])
        this.ancestries = ancestries
        this.cultures = cultures
        this.mestieri = mestieri
        this.worldElements = worldElements
      } catch (error) {
        console.error('Error fetching sources:', error)
      }
    },
    saveAbility() {
      this.$emit('update', this.editedAbility)
      this.$emit('close')
    },
    deleteAbility() {
      const name = this.editedAbility.name || 'this ability'
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        this.$emit('delete', this.editedAbility)
      }
    },
    closeModal() {
      this.$emit('close')
    },
  },
  async mounted() {
    await this.fetchSources()
  },
}
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

.left-aligned {
  text-align: left;
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
  min-height: 250px;
}

.modal-input.small-input {
  width: 80px;
  /* Adjust width for smaller inputs */
}

/* Form Buttons */
.form-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  gap: 10px;
}

.button {
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.button-primary {
  background-color: #4caf50;
  color: white;
  border: none;
}

.button-danger {
  background-color: #f44336;
  color: white;
  border: none;
}

.button:hover {
  opacity: 0.9;
}
</style>
